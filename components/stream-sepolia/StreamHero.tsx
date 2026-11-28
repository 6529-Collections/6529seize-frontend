"use client";

import Link from "next/link";

import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";
import "@/i18n/namespaces/stream-sepolia";
import { LISTING_ACTIVE } from "@/lib/stream/independent";

import { artistContracts } from "./DeployContract";
import { newestWorks } from "./RecentWorks";
import { STREAM_BASE, workHref } from "./StreamNav";
import { useMyCollections, useSales, useWorkMeta } from "./useStreamData";
import { useStreamWallet } from "./WalletGate";
import { WorkArt } from "./WorkArt";
import type { SaleSummary } from "@/lib/stream/reads";

const PRIMARY =
  "tw-inline-flex tw-h-10 tw-items-center tw-justify-center tw-rounded-lg tw-bg-primary-500 tw-px-4 tw-text-sm tw-font-semibold tw-text-white tw-no-underline hover:tw-bg-primary-600 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-primary-400";
const SECONDARY =
  "tw-inline-flex tw-h-10 tw-items-center tw-justify-center tw-rounded-lg tw-bg-white/[0.08] tw-px-4 tw-text-sm tw-font-semibold tw-text-iron-100 tw-no-underline hover:tw-bg-white/[0.12] focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-primary-400";

function MosaicTile({ sale }: { readonly sale: SaleSummary }) {
  const locale = useBrowserLocale();
  const meta = useWorkMeta(sale.token, sale.tokenId);
  const title = meta.data?.name ?? t(locale, "streamSepolia.work.untitled", { id: sale.tokenId.toString() });
  return (
    <li>
      <Link href={workHref(sale)} aria-label={title} className="tw-block tw-rounded-lg focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400">
        <WorkArt token={sale.token} tokenId={sale.tokenId} firstStartTx={sale.firstStartTx} curated={sale.curated} title={title} />
      </Link>
    </li>
  );
}

/** The top of the works page: what this is, the two things to do, and the newest art. */
export function StreamHero() {
  const locale = useBrowserLocale();
  const wallet = useStreamWallet();
  const collections = useMyCollections(wallet.address);
  const sales = useSales();
  const { oneOfOne } = artistContracts(collections.data ?? []);
  const contractName = oneOfOne?.status === LISTING_ACTIVE ? oneOfOne.name : null;
  const mosaic = newestWorks(sales.data ?? [], 4);
  return (
    <section className="tw-grid tw-items-center tw-gap-8 tw-pb-4 lg:tw-grid-cols-[minmax(0,1fr)_minmax(0,26rem)]">
      <div>
        <h1 className="tw-m-0 tw-text-3xl tw-font-semibold tw-tracking-tight tw-text-iron-50 sm:tw-text-4xl">
          {t(locale, "streamSepolia.hero.title")}
        </h1>
        <p className="tw-m-0 tw-mt-3 tw-max-w-xl tw-text-base tw-text-iron-300">{t(locale, "streamSepolia.hero.line")}</p>
        <div className="tw-mt-5 tw-flex tw-flex-wrap tw-gap-3">
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
      {mosaic.length > 0 ? (
        <ul className="tw-m-0 tw-grid tw-list-none tw-grid-cols-2 tw-gap-3 tw-p-0">
          {mosaic.map((sale) => (
            <MosaicTile key={sale.saleId.toString()} sale={sale} />
          ))}
        </ul>
      ) : null}
    </section>
  );
}
