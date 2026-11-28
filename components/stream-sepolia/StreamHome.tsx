"use client";

import Link from "next/link";

import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import type { SupportedLocale } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import "@/i18n/namespaces/stream-sepolia";
import type { SaleSummary } from "@/lib/stream/reads";
import { AUCTION_STATE, isZeroAddress } from "@/lib/stream/state";

import { THE_MEMES_GRID_CLASS_NAME } from "@/components/the-memes/theMemesLayout";

import { formatCount, formatDuration, formatEth } from "./format";
import { ReadyToStart } from "./ReadyToStart";
import { STREAM_BASE } from "./StreamNav";
import { useNow, useSales, useWorkMeta } from "./useStreamData";
import { WorkArt } from "./WorkArt";

const LABEL =
  "tw-m-0 tw-text-[11px] tw-font-semibold tw-uppercase tw-tracking-wider tw-text-iron-500";

export function workHref(sale: Pick<SaleSummary, "token" | "tokenId">): string {
  return `${STREAM_BASE}/work/${sale.token}/${sale.tokenId.toString()}`;
}

function statusLine(sale: SaleSummary, now: number, locale: SupportedLocale): string {
  const left = Number(sale.endTime) - now;
  const hasBid = !isZeroAddress(sale.bidder);
  if (sale.state === AUCTION_STATE.ACTIVE && left > 0) {
    return hasBid
      ? t(locale, "streamSepolia.card.liveBid", {
          amount: formatEth(sale.bid, locale),
          left: formatDuration(left, locale),
        })
      : t(locale, "streamSepolia.card.liveNoBid", { left: formatDuration(left, locale) });
  }
  if (sale.state === AUCTION_STATE.ACTIVE || sale.state === AUCTION_STATE.ENDED) {
    return t(locale, "streamSepolia.card.ended");
  }
  if (sale.state === AUCTION_STATE.SETTLED) {
    return hasBid
      ? t(locale, "streamSepolia.card.sold", { amount: formatEth(sale.bid, locale) })
      : t(locale, "streamSepolia.card.unsold");
  }
  if (sale.state === AUCTION_STATE.PAUSED) return t(locale, "streamSepolia.card.paused");
  if (sale.state === AUCTION_STATE.CANCELLED) return t(locale, "streamSepolia.card.cancelled");
  return "";
}

function WorkCard({ sale, now }: { readonly sale: SaleSummary; readonly now: number }) {
  const locale = useBrowserLocale();
  const meta = useWorkMeta(sale.token, sale.tokenId);
  const title =
    meta.data?.name ?? t(locale, "streamSepolia.work.untitled", { id: sale.tokenId.toString() });
  return (
    <li>
      <Link
        href={workHref(sale)}
        className="tw-group tw-flex tw-flex-col tw-gap-3 tw-rounded-xl tw-no-underline focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400"
      >
        <WorkArt
          token={sale.token}
          tokenId={sale.tokenId}
          firstStartTx={sale.firstStartTx}
          curated={sale.curated}
          title={title}
        />
        <div>
          <p className="tw-m-0 tw-truncate tw-text-base tw-font-semibold tw-text-iron-50 group-hover:tw-text-white">
            {title}
          </p>
          <p className="tw-m-0 tw-mt-1 tw-text-sm tw-tabular-nums tw-text-iron-400">
            {statusLine(sale, now, locale)}
          </p>
          {sale.edition ? (
            <p className="tw-m-0 tw-mt-0.5 tw-text-sm tw-tabular-nums tw-text-iron-500">
              {sale.edition.count === 1n
                ? t(locale, "streamSepolia.card.editionsOne", { price: formatEth(sale.edition.price, locale) })
                : t(locale, "streamSepolia.card.editions", {
                    count: formatCount(sale.edition.count, locale),
                    price: formatEth(sale.edition.price, locale),
                  })}
            </p>
          ) : null}
        </div>
      </Link>
    </li>
  );
}

function Shelf({
  title,
  sales,
  now,
  empty,
}: {
  readonly title: string;
  readonly sales: readonly SaleSummary[];
  readonly now: number;
  readonly empty: string;
}) {
  return (
    <section className="tw-mt-6">
      <h3 className={LABEL}>{title}</h3>
      {sales.length === 0 ? (
        <p className="tw-m-0 tw-mt-3 tw-text-sm tw-text-iron-500">{empty}</p>
      ) : (
        <ul className={`tw-m-0 tw-mt-3 tw-list-none tw-p-0 ${THE_MEMES_GRID_CLASS_NAME}`}>
          {sales.map((sale) => (
            <WorkCard key={sale.saleId.toString()} sale={sale} now={now} />
          ))}
        </ul>
      )}
    </section>
  );
}

function ProductSection({
  title,
  sales,
  now,
  extra,
}: {
  readonly title: string;
  readonly sales: readonly SaleSummary[];
  readonly now: number;
  /** Shown after the live shelf (e.g. works ready to start). */
  readonly extra?: React.ReactNode;
}) {
  const locale = useBrowserLocale();
  const live = sales
    .filter((sale) => sale.state === AUCTION_STATE.ACTIVE && Number(sale.endTime) > now)
    .sort((a, b) => Number(a.endTime - b.endTime));
  const waiting = sales.filter(
    (sale) =>
      sale.state === AUCTION_STATE.ENDED ||
      sale.state === AUCTION_STATE.PAUSED ||
      (sale.state === AUCTION_STATE.ACTIVE && Number(sale.endTime) <= now)
  );
  const finished = sales
    .filter(
      (sale) => sale.state === AUCTION_STATE.SETTLED || sale.state === AUCTION_STATE.CANCELLED
    )
    .sort((a, b) => Number(b.endTime - a.endTime))
    .slice(0, 12);
  return (
    <section className="tw-mb-14">
      <h2 className="tw-m-0 tw-text-2xl tw-font-semibold tw-text-iron-50">{title}</h2>
      <Shelf
        title={t(locale, "streamSepolia.home.live")}
        sales={live}
        now={now}
        empty={t(locale, "streamSepolia.home.liveEmpty")}
      />
      {extra}
      {waiting.length > 0 ? (
        <Shelf
          title={t(locale, "streamSepolia.home.waiting")}
          sales={waiting}
          now={now}
          empty=""
        />
      ) : null}
      <Shelf
        title={t(locale, "streamSepolia.home.finished")}
        sales={finished}
        now={now}
        empty={t(locale, "streamSepolia.home.finishedEmpty")}
      />
    </section>
  );
}

export function StreamHome() {
  const locale = useBrowserLocale();
  const now = useNow();
  const sales = useSales();
  if (sales.isLoading) {
    return <p className="tw-text-sm tw-text-iron-400">{t(locale, "streamSepolia.loading")}</p>;
  }
  if (sales.isError || !sales.data) {
    return (
      <p role="alert" className="tw-text-sm tw-text-red">
        {t(locale, "streamSepolia.loadError")}
      </p>
    );
  }
  const curated = sales.data.filter((sale) => sale.curated);
  const independent = sales.data.filter((sale) => !sale.curated);
  return (
    <div>
      <ProductSection title={t(locale, "streamSepolia.product.stream")} sales={curated} now={now} />
      <ProductSection
        title={t(locale, "streamSepolia.product.independent")}
        sales={independent}
        now={now}
        extra={<ReadyToStart />}
      />
    </div>
  );
}
