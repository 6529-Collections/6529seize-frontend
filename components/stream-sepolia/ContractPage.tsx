"use client";

import Link from "next/link";
import type { Address } from "viem";

import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";
import "@/i18n/namespaces/stream-sepolia";
import type { IndependentContract } from "@/lib/stream/activity";
import { LISTING_ACTIVE } from "@/lib/stream/independent";
import { sameAddress } from "@/lib/stream/state";

import { LINK } from "./createShared";
import { artistContracts, DeployContract, DeployEditionsContract } from "./DeployContract";
import { sepoliaAddressUrl, shortAddress } from "./format";
import { CARD, LABEL } from "./OneOfOnePanel";
import { STREAM_BASE, workHref } from "./StreamNav";
import { StreamLoading } from "./StreamLoading";
import { useMyCollections, useSales } from "./useStreamData";
import { useStreamWallet, WalletGate } from "./WalletGate";
import { WorkTitle } from "./WorkTitle";

function ContractRow({ contract }: { readonly contract: IndependentContract }) {
  const locale = useBrowserLocale();
  return (
    <li className="tw-flex tw-flex-wrap tw-items-baseline tw-justify-between tw-gap-2 tw-border-0 tw-border-t tw-border-solid tw-border-white/[0.07] tw-py-3 tw-text-sm">
      <span className="tw-text-iron-100">
        {contract.editions
          ? t(locale, "streamSepolia.contract.editionsRow", { name: contract.name })
          : t(locale, "streamSepolia.contract.oneRow", { name: contract.name })}{" "}
        <a href={sepoliaAddressUrl(contract.token)} target="_blank" rel="noreferrer" className={LINK}>
          {shortAddress(contract.token)}
        </a>
      </span>
      <span className={contract.status === LISTING_ACTIVE ? "tw-text-emerald-400" : "tw-text-amber-300"}>
        {contract.status === LISTING_ACTIVE
          ? t(locale, "streamSepolia.contract.listed")
          : t(locale, "streamSepolia.contract.notListed")}
      </span>
    </li>
  );
}

function ContractBody({ viewer }: { readonly viewer: Address }) {
  const locale = useBrowserLocale();
  const collections = useMyCollections(viewer);
  const sales = useSales();
  if (collections.isLoading) return <StreamLoading onRetry={() => void collections.refetch()} />;
  const contracts = collections.data ?? [];
  const { oneOfOne, editions } = artistContracts(contracts);
  const listed = oneOfOne?.status === LISTING_ACTIVE ? oneOfOne : null;
  const works = (sales.data ?? []).filter((sale) => listed && sameAddress(sale.token, listed.token));
  return (
    <div className="tw-grid tw-items-start tw-gap-6 lg:tw-grid-cols-2">
      <div className="tw-flex tw-flex-col tw-gap-6">
        {contracts.length > 0 ? (
          <section className={CARD} aria-labelledby="stream-my-contracts">
            <h2 id="stream-my-contracts" className={LABEL}>
              {t(locale, "streamSepolia.contract.yours")}
            </h2>
            <ul className="tw-m-0 tw-mt-2 tw-list-none tw-p-0">
              {contracts.map((contract) => (
                <ContractRow key={contract.token} contract={contract} />
              ))}
            </ul>
          </section>
        ) : null}
        {listed ? (
          <section className={CARD}>
            <p className="tw-m-0 tw-text-sm tw-text-iron-300">{t(locale, "streamSepolia.contract.ready")}</p>
            <Link href={`${STREAM_BASE}/create?door=independent`} className={`${LINK} tw-mt-2 tw-inline-block tw-text-sm tw-font-semibold`}>
              {t(locale, "streamSepolia.door.inContract", { name: listed.name })}
            </Link>
          </section>
        ) : (
          <DeployContract existing={oneOfOne} onDone={() => void collections.refetch()} />
        )}
        {listed && editions?.status !== LISTING_ACTIVE ? (
          <DeployEditionsContract oneOfOne={listed} existing={editions} />
        ) : null}
      </div>
      {works.length > 0 ? (
        <section className={CARD} aria-labelledby="stream-my-works">
          <h2 id="stream-my-works" className={LABEL}>
            {t(locale, "streamSepolia.contract.works")}
          </h2>
          <ul className="tw-m-0 tw-mt-2 tw-list-none tw-p-0">
            {works.map((sale) => (
              <li key={sale.saleId.toString()} className="tw-border-0 tw-border-t tw-border-solid tw-border-white/[0.07] tw-py-2.5 tw-text-sm">
                <Link href={workHref(sale)} className={LINK}>
                  <WorkTitle token={sale.token} tokenId={sale.tokenId} />
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}

/** "Your Independent Stream contract": deploy it, list it, add the editions contract, then create in it. */
export function ContractPage() {
  const locale = useBrowserLocale();
  const wallet = useStreamWallet();
  return (
    <div className="tw-flex tw-flex-col tw-gap-6">
      <div>
        <h1 className="tw-m-0 tw-text-3xl tw-font-semibold tw-text-iron-50">{t(locale, "streamSepolia.contract.title")}</h1>
        <p className="tw-m-0 tw-mt-2 tw-max-w-3xl tw-text-sm tw-text-iron-400">{t(locale, "streamSepolia.contract.intro")}</p>
      </div>
      {wallet.address ? (
        <ContractBody viewer={wallet.address} />
      ) : (
        <div className="tw-grid tw-items-start tw-gap-6 lg:tw-grid-cols-2">
          <DeployContract existing={null} />
          <section className={CARD}>
            <WalletGate reason={t(locale, "streamSepolia.contract.connect")}>{null}</WalletGate>
          </section>
        </div>
      )}
    </div>
  );
}
