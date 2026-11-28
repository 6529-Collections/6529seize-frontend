"use client";

import Link from "next/link";

import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import type { SupportedLocale } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import type { MessageKey } from "@/i18n/messages/en-US.complete";
import "@/i18n/namespaces/stream-sepolia";
import { LISTING_ACTIVE } from "@/lib/stream/independent";
import type { SaleSummary } from "@/lib/stream/reads";
import { AUCTION_STATE, isZeroAddress } from "@/lib/stream/state";

import { artistContracts } from "./DeployContract";
import { formatDuration, formatEth } from "./format";
import { useStreamName } from "./StreamIdentity";
import { STREAM_BASE, workHref } from "./StreamNav";
import { useMyCollections, useWorkMeta } from "./useStreamData";
import { useStreamWallet } from "./WalletGate";
import { WorkArt } from "./WorkArt";

const PRIMARY =
  "tw-inline-flex tw-h-11 tw-items-center tw-justify-center tw-rounded-lg tw-bg-primary-500 tw-px-5 tw-text-sm tw-font-semibold tw-text-white tw-no-underline hover:tw-bg-primary-600 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-primary-400";
const SECONDARY =
  "tw-inline-flex tw-h-11 tw-items-center tw-justify-center tw-rounded-lg tw-bg-white/[0.08] tw-px-5 tw-text-sm tw-font-semibold tw-text-iron-100 tw-no-underline hover:tw-bg-white/[0.12] focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-primary-400";

const PROMISES: readonly { title: MessageKey; line: MessageKey }[] = [
  { title: "streamSepolia.promise.ownTitle", line: "streamSepolia.promise.ownLine" },
  { title: "streamSepolia.promise.fixedTitle", line: "streamSepolia.promise.fixedLine" },
  { title: "streamSepolia.promise.paidTitle", line: "streamSepolia.promise.paidLine" },
];

function featuredStatus(sale: SaleSummary, now: number, locale: SupportedLocale): string {
  const left = Number(sale.endTime) - now;
  if (sale.state === AUCTION_STATE.ACTIVE && left > 0) {
    return isZeroAddress(sale.bidder)
      ? t(locale, "streamSepolia.featured.noBid", { left: formatDuration(left, locale) })
      : t(locale, "streamSepolia.featured.bid", { amount: formatEth(sale.bid, locale), left: formatDuration(left, locale) });
  }
  return t(locale, "streamSepolia.featured.sold", { amount: formatEth(sale.bid, locale) });
}

/** The one work shown large: the live sale with the highest bid, else the latest sold work. */
function FeaturedWork({ sale, now }: { readonly sale: SaleSummary; readonly now: number }) {
  const locale = useBrowserLocale();
  const meta = useWorkMeta(sale.token, sale.tokenId);
  const title = meta.data?.name ?? t(locale, "streamSepolia.work.untitled", { id: sale.tokenId.toString() });
  const artist = useStreamName(meta.data?.artistWallet);
  const live = sale.state === AUCTION_STATE.ACTIVE && Number(sale.endTime) > now;
  return (
    <Link
      href={workHref(sale)}
      className="tw-group tw-block tw-rounded-xl tw-no-underline focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400"
    >
      <WorkArt token={sale.token} tokenId={sale.tokenId} firstStartTx={sale.firstStartTx} curated={sale.curated} title={title} />
      <div className="tw-mt-4 tw-flex tw-flex-wrap tw-items-end tw-justify-between tw-gap-x-6 tw-gap-y-2">
        <div className="tw-min-w-0">
          <p className="tw-m-0 tw-text-[11px] tw-font-semibold tw-uppercase tw-tracking-wider tw-text-primary-300">
            {live ? t(locale, "streamSepolia.featured.liveLabel") : t(locale, "streamSepolia.featured.soldLabel")}
          </p>
          <p className="tw-m-0 tw-mt-1 tw-truncate tw-text-2xl tw-font-semibold tw-text-iron-50 group-hover:tw-text-white">{title}</p>
          {artist ? <p className="tw-m-0 tw-mt-0.5 tw-text-sm tw-text-iron-300">{t(locale, "streamSepolia.card.by", { name: artist })}</p> : null}
        </div>
        <p className="tw-m-0 tw-text-base tw-font-semibold tw-tabular-nums tw-text-iron-100">{featuredStatus(sale, now, locale)}</p>
      </div>
    </Link>
  );
}

/** The top of the works page: what is special, the two doors, and one work shown large. */
export function StreamHero({ featured, now }: { readonly featured: SaleSummary | null; readonly now: number }) {
  const locale = useBrowserLocale();
  const wallet = useStreamWallet();
  const collections = useMyCollections(wallet.address);
  const { oneOfOne } = artistContracts(collections.data ?? []);
  const contractName = oneOfOne?.status === LISTING_ACTIVE ? oneOfOne.name : null;
  return (
    <section className="tw-grid tw-items-start tw-gap-10 tw-pb-6 lg:tw-grid-cols-[minmax(0,5fr)_minmax(0,6fr)]">
      <div>
        <h1 className="tw-m-0 tw-text-4xl tw-font-semibold tw-tracking-tight tw-text-iron-50 sm:tw-text-5xl">
          {t(locale, "streamSepolia.hero.title")}
        </h1>
        <p className="tw-m-0 tw-mt-3 tw-max-w-xl tw-text-base tw-text-iron-300">{t(locale, "streamSepolia.hero.line")}</p>
        <ul className="tw-m-0 tw-mt-8 tw-flex tw-list-none tw-flex-col tw-gap-5 tw-p-0">
          {PROMISES.map((promise) => (
            <li key={promise.title} className="tw-border-0 tw-border-l-2 tw-border-solid tw-border-primary-400 tw-pl-4">
              <p className="tw-m-0 tw-text-xl tw-font-semibold tw-text-iron-50 sm:tw-text-2xl">{t(locale, promise.title)}</p>
              <p className="tw-m-0 tw-mt-1 tw-text-sm tw-text-iron-400">{t(locale, promise.line)}</p>
            </li>
          ))}
        </ul>
        <div className="tw-mt-8 tw-flex tw-flex-wrap tw-gap-3">
          <Link href={`${STREAM_BASE}/create`} className={PRIMARY}>
            {t(locale, "streamSepolia.door.stream")}
          </Link>
          <Link href={`${STREAM_BASE}/create?door=independent`} className={SECONDARY}>
            {contractName
              ? t(locale, "streamSepolia.door.inContract", { name: contractName })
              : t(locale, "streamSepolia.door.deployShort")}
          </Link>
        </div>
        <p className="tw-m-0 tw-mt-4 tw-text-sm">
          <Link href={`${STREAM_BASE}/how-it-works`} className="tw-text-primary-300 tw-underline tw-underline-offset-4 hover:tw-text-primary-400">
            {t(locale, "streamSepolia.door.howItWorks")}
          </Link>
        </p>
      </div>
      {featured ? <FeaturedWork sale={featured} now={now} /> : null}
    </section>
  );
}
