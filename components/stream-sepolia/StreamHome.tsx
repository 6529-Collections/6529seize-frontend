"use client";

import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";
import "@/i18n/namespaces/stream-sepolia";
import type { SaleSummary } from "@/lib/stream/reads";
import { AUCTION_STATE } from "@/lib/stream/state";

import { THE_MEMES_GRID_CLASS_NAME } from "@/components/the-memes/theMemesLayout";

import { ReadyToStart } from "./ReadyToStart";
import { StreamHero } from "./StreamHero";
import { useNow, useSales } from "./useStreamData";
import { WorkCard } from "./WorkCard";
import { StreamLoading } from "./StreamLoading";

const LABEL =
  "tw-m-0 tw-text-[11px] tw-font-semibold tw-uppercase tw-tracking-wider tw-text-iron-500";

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
    return <StreamLoading onRetry={() => void sales.refetch()} />;
  }
  // A failed refresh keeps showing the last good list.
  if (!sales.data) {
    return (
      <p role="alert" className="tw-text-sm tw-text-red">
        {t(locale, "streamSepolia.loadError")}
      </p>
    );
  }
  const curated = sales.data.filter((sale) => sale.curated);
  const independent = sales.data.filter((sale) => !sale.curated);
  // 6529 Stream always leads, then Independent Stream, on every instance.
  return (
    <div className="tw-flex tw-flex-col tw-gap-2">
      <StreamHero />
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
