"use client";

import Link from "next/link";
import { useState } from "react";
import type { Address } from "viem";

import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";
import "@/i18n/namespaces/stream-sepolia";
import { deployIndependent, listIndependent } from "@/lib/stream/create";
import {
  independent721Config,
  independentEditionsConfig,
  LISTING_ACTIVE,
  randomSalt,
  symbolFromName,
} from "@/lib/stream/independent";
import type { IndependentContract } from "@/lib/stream/reads";
import { sameAddress } from "@/lib/stream/state";

import { sepoliaAddressUrl, shortAddress } from "./format";
import { CARD, LABEL } from "./OneOfOnePanel";
import { StepRunner, type Step } from "./StepRunner";
import { STREAM_BASE } from "./StreamNav";
import { useMyCollections, useSales } from "./useStreamData";
import { WorkTitle } from "./WorkTitle";
import { useStreamWallet, WalletGate } from "./WalletGate";
import { workHref } from "./StreamHome";

const INPUT =
  "tw-block tw-h-11 tw-w-full tw-rounded-lg tw-border tw-border-solid tw-border-white/[0.08] tw-bg-black/25 tw-px-4 tw-text-base tw-text-iron-100 placeholder:tw-text-iron-600 focus:tw-border-primary-400/70 focus:tw-outline-none focus:tw-ring-2 focus:tw-ring-primary-400/20";
const LINK = "tw-text-primary-300 tw-underline tw-underline-offset-4 hover:tw-text-primary-400";

interface PairContext {
  oneOfOne: Address | null;
  editions: Address | null;
}

function ContractRow({ contract }: { readonly contract: IndependentContract }) {
  const locale = useBrowserLocale();
  return (
    <li className="tw-flex tw-flex-wrap tw-items-baseline tw-justify-between tw-gap-2 tw-border-0 tw-border-t tw-border-solid tw-border-white/[0.07] tw-py-3 tw-text-sm">
      <span className="tw-text-iron-100">
        {contract.editions
          ? t(locale, "streamSepolia.collection.editionsContract", { name: contract.name })
          : t(locale, "streamSepolia.collection.oneContract", { name: contract.name })}{" "}
        <a href={sepoliaAddressUrl(contract.token)} target="_blank" rel="noreferrer" className={LINK}>
          {shortAddress(contract.token)}
        </a>
      </span>
      <span className={contract.status === LISTING_ACTIVE ? "tw-text-emerald-400" : "tw-text-amber-300"}>
        {contract.status === LISTING_ACTIVE
          ? t(locale, "streamSepolia.collection.listed")
          : t(locale, "streamSepolia.collection.notListed")}
      </span>
    </li>
  );
}

function PairSetup({
  existing,
}: {
  readonly existing: readonly IndependentContract[];
}) {
  const locale = useBrowserLocale();
  const oneOfOne = existing.find((contract) => !contract.editions) ?? null;
  const editions =
    existing.find((contract) => contract.editions && sameAddress(contract.partner, oneOfOne?.token)) ??
    null;
  const [name, setName] = useState("");
  // One run's state: filled as contracts deploy, so "Continue" resumes after a failure.
  const [context] = useState<PairContext>(() => ({ oneOfOne: null, editions: null }));
  const knownOneOfOne = oneOfOne?.token ?? null;
  const knownEditions = editions?.token ?? null;
  const needsName = !oneOfOne;
  const steps: Step<PairContext>[] = [];
  if (!oneOfOne) {
    steps.push({
      id: "deploy721",
      label: t(locale, "streamSepolia.collection.step.deploy"),
      help: t(locale, "streamSepolia.collection.step.deployHelp"),
      run: async (ctx, io) => {
        if (ctx.oneOfOne ?? knownOneOfOne) return false;
        ctx.oneOfOne = await deployIndependent({
          editions: false,
          salt: randomSalt(),
          config: independent721Config({
            name: name.trim(),
            symbol: symbolFromName(name.trim()),
            artist: io.account,
          }),
          io,
        });
        return true;
      },
    });
  }
  if (oneOfOne?.status !== LISTING_ACTIVE) {
    steps.push({
      id: "list721",
      label: t(locale, "streamSepolia.collection.step.list"),
      help: t(locale, "streamSepolia.collection.step.listHelp"),
      run: async (ctx, io) =>
        listIndependent({ token: (ctx.oneOfOne ?? knownOneOfOne)!, editions: false, partner: null, io }),
    });
  }
  if (!editions) {
    steps.push({
      id: "deployEditions",
      label: t(locale, "streamSepolia.collection.step.deployEditions"),
      help: t(locale, "streamSepolia.collection.step.deployEditionsHelp"),
      run: async (ctx, io) => {
        if (ctx.editions ?? knownEditions) return false;
        const base = name.trim().length > 0 ? name.trim() : (oneOfOne?.name ?? "");
        ctx.editions = await deployIndependent({
          editions: true,
          salt: randomSalt(),
          config: independentEditionsConfig({
            name: t(locale, "streamSepolia.collection.editionsName", { name: base }),
            symbol: `${symbolFromName(base).slice(0, 6)}ED`,
            master: (ctx.oneOfOne ?? knownOneOfOne)!,
            artist: io.account,
          }),
          io,
        });
        return true;
      },
    });
  }
  if (editions?.status !== LISTING_ACTIVE) {
    steps.push({
      id: "listEditions",
      label: t(locale, "streamSepolia.collection.step.listEditions"),
      run: async (ctx, io) =>
        listIndependent({
          token: (ctx.editions ?? knownEditions)!,
          editions: true,
          partner: ctx.oneOfOne ?? knownOneOfOne,
          io,
        }),
    });
  }
  if (steps.length === 0) return null;
  return (
    <section className={CARD} aria-labelledby="stream-pair-setup">
      <h2 id="stream-pair-setup" className="tw-m-0 tw-text-lg tw-font-semibold tw-text-iron-50">
        {oneOfOne
          ? t(locale, "streamSepolia.collection.finishTitle")
          : t(locale, "streamSepolia.collection.newTitle")}
      </h2>
      <p className="tw-m-0 tw-mt-1 tw-text-sm tw-text-iron-400">{t(locale, "streamSepolia.collection.newHelp")}</p>
      {needsName ? (
        <div className="tw-mt-4">
          <label htmlFor="stream-collection-name" className="tw-mb-1.5 tw-block tw-text-sm tw-font-semibold tw-text-iron-200">
            {t(locale, "streamSepolia.collection.name")}
          </label>
          <input
            id="stream-collection-name"
            className={INPUT}
            value={name}
            maxLength={48}
            onChange={(event) => setName(event.target.value)}
          />
        </div>
      ) : null}
      <div className="tw-mt-4">
        <StepRunner
          steps={steps}
          context={context}
          disabled={needsName && name.trim().length === 0}
          startLabel={t(locale, "streamSepolia.collection.start")}
        />
      </div>
    </section>
  );
}

function CollectionBody({ viewer }: { readonly viewer: Address }) {
  const locale = useBrowserLocale();
  const collections = useMyCollections(viewer);
  const sales = useSales();
  if (collections.isLoading) {
    return <p className="tw-text-sm tw-text-iron-400">{t(locale, "streamSepolia.loading")}</p>;
  }
  const contracts = collections.data ?? [];
  const mineTokens = contracts.filter((contract) => !contract.editions).map((contract) => contract.token);
  const works = (sales.data ?? []).filter((sale) => mineTokens.some((token) => sameAddress(token, sale.token)));
  const listed = contracts.some((contract) => !contract.editions && contract.status === LISTING_ACTIVE);
  return (
    <div className="tw-flex tw-flex-col tw-gap-6">
      {contracts.length > 0 ? (
        <section className={CARD} aria-labelledby="stream-my-contracts">
          <h2 id="stream-my-contracts" className={LABEL}>{t(locale, "streamSepolia.collection.yours")}</h2>
          <ul className="tw-m-0 tw-mt-2 tw-list-none tw-p-0">
            {contracts.map((contract) => (
              <ContractRow key={contract.token} contract={contract} />
            ))}
          </ul>
        </section>
      ) : null}
      <PairSetup existing={contracts} />
      {listed ? (
        <section className={CARD}>
          <p className="tw-m-0 tw-text-sm tw-text-iron-300">{t(locale, "streamSepolia.collection.ready")}</p>
          <Link href={`${STREAM_BASE}/create`} className={`${LINK} tw-mt-2 tw-inline-block tw-text-sm tw-font-semibold`}>
            {t(locale, "streamSepolia.collection.createLink")}
          </Link>
        </section>
      ) : null}
      {works.length > 0 ? (
        <section className={CARD} aria-labelledby="stream-my-works">
          <h2 id="stream-my-works" className={LABEL}>{t(locale, "streamSepolia.collection.works")}</h2>
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

export function CollectionPage() {
  const locale = useBrowserLocale();
  const wallet = useStreamWallet();
  return (
    <div className="tw-max-w-2xl">
      <h1 className="tw-m-0 tw-text-3xl tw-font-semibold tw-text-iron-50">{t(locale, "streamSepolia.collection.title")}</h1>
      <p className="tw-m-0 tw-mb-6 tw-mt-2 tw-text-sm tw-text-iron-400">{t(locale, "streamSepolia.collection.intro")}</p>
      <WalletGate reason={t(locale, "streamSepolia.collection.connect")}>
        {wallet.address ? <CollectionBody viewer={wallet.address} /> : null}
      </WalletGate>
    </div>
  );
}
