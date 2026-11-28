"use client";

import Link from "next/link";

import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import type { SupportedLocale } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import "@/i18n/namespaces/stream-sepolia";
import type { SaleSummary } from "@/lib/stream/reads";
import { AUCTION_STATE, isZeroAddress } from "@/lib/stream/state";

import { formatCount, formatDuration, formatEth } from "./format";
import { workHref } from "./StreamNav";
import { useStreamName } from "./StreamIdentity";
import { useWorkMeta } from "./useStreamData";
import { WorkArt } from "./WorkArt";

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

export function WorkCard({ sale, now }: { readonly sale: SaleSummary; readonly now: number }) {
  const locale = useBrowserLocale();
  const meta = useWorkMeta(sale.token, sale.tokenId);
  const title =
    meta.data?.name ?? t(locale, "streamSepolia.work.untitled", { id: sale.tokenId.toString() });
  const artist = useStreamName(meta.data?.artistWallet);
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
          {artist ? (
            <p className="tw-m-0 tw-mt-0.5 tw-truncate tw-text-sm tw-text-iron-300">{t(locale, "streamSepolia.card.by", { name: artist })}</p>
          ) : null}
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
