"use client";

import { darkInputClassName } from "@/components/utils/input/dark-input-styles";
import { useState } from "react";
import type { Address } from "viem";

import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";
import "@/i18n/namespaces/stream-sepolia";
import { artistIdFor } from "@/lib/stream/accounts";
import type { IndependentContract } from "@/lib/stream/activity";
import { deployIndependent, listIndependent, type HeldListing } from "@/lib/stream/create";
import {
  independent721Config,
  independentEditionsConfig,
  LISTING_ACTIVE,
  randomSalt,
  symbolFromName,
} from "@/lib/stream/independent";
import { sameAddress } from "@/lib/stream/state";

import { FIELD_LABEL } from "./createShared";
import { CARD } from "./OneOfOnePanel";
import { StepRunner, type Step } from "./StepRunner";

/** The artist's 1/1 contract and the editions contract that partners it, if any. */
export function artistContracts(contracts: readonly IndependentContract[]) {
  const oneOfOne = contracts.find((contract) => !contract.editions) ?? null;
  const editions = oneOfOne
    ? (contracts.find((contract) => contract.editions && sameAddress(contract.partner, oneOfOne.token)) ?? null)
    : null;
  return { oneOfOne, editions };
}

interface DeployContext {
  token: Address | null;
  /** Listing signatures kept after a failed send. */
  held?: HeldListing;
}

/**
 * "Deploy your contract": the artist's own Independent Stream 1/1 contract
 * (ERC-721), then listing it in Independent Stream. Shown without a wallet;
 * the wallet is asked for when the steps start.
 */
export function DeployContract({
  existing,
  onDone,
}: {
  /** The artist's 1/1 contract if it is deployed but not listed yet. */
  readonly existing: IndependentContract | null;
  readonly onDone?: (() => void) | undefined;
}) {
  const locale = useBrowserLocale();
  const [name, setName] = useState("");
  const [context] = useState<DeployContext>(() => ({ token: null }));
  const known = existing?.token ?? null;
  const steps: Step<DeployContext>[] = [];
  if (!existing) {
    steps.push({
      id: "deploy721",
      label: t(locale, "streamSepolia.contract.step.deploy"),
      help: t(locale, "streamSepolia.contract.step.deployHelp"),
      run: async (ctx, io) => {
        if (ctx.token ?? known) return false;
        ctx.token = await deployIndependent({
          editions: false,
          salt: randomSalt(),
          config: independent721Config({
            name: name.trim(),
            symbol: symbolFromName(name.trim()),
            artist: io.account,
            artistId: await artistIdFor(io.account),
          }),
          io,
        });
        return true;
      },
    });
  }
  if (existing?.status !== LISTING_ACTIVE) {
    steps.push({
      id: "list721",
      label: t(locale, "streamSepolia.contract.step.list"),
      help: t(locale, "streamSepolia.contract.step.listHelp"),
      run: (ctx, io) => listIndependent({ token: (ctx.token ?? known)!, editions: false, partner: null, io, keep: ctx }),
    });
  }
  if (steps.length === 0) return null;
  return (
    <section className={CARD} aria-labelledby="stream-deploy-contract">
      <h2 id="stream-deploy-contract" className="tw-m-0 tw-text-lg tw-font-semibold tw-text-iron-50">
        {existing ? t(locale, "streamSepolia.contract.finishTitle") : t(locale, "streamSepolia.contract.deployTitle")}
      </h2>
      <p className="tw-m-0 tw-mt-1 tw-text-sm tw-text-iron-400">{t(locale, "streamSepolia.contract.deployHelp")}</p>
      {existing ? null : (
        <div className="tw-mt-4 tw-max-w-md">
          <label htmlFor="stream-contract-name" className={FIELD_LABEL}>
            {t(locale, "streamSepolia.contract.name")}
          </label>
          <input
            id="stream-contract-name"
            className={darkInputClassName}
            value={name}
            maxLength={48}
            onChange={(event) => setName(event.target.value)}
          />
        </div>
      )}
      <div className="tw-mt-4">
        <StepRunner
          steps={steps}
          context={context}
          disabled={!existing && name.trim().length === 0}
          startLabel={t(locale, "streamSepolia.contract.deployStart")}
          onFinished={onDone}
        />
      </div>
    </section>
  );
}

/** "Deploy your editions contract": the ERC-1155 contract that sells editions of the works in the 1/1 contract. */
export function DeployEditionsContract({
  oneOfOne,
  existing,
}: {
  readonly oneOfOne: IndependentContract;
  readonly existing: IndependentContract | null;
}) {
  const locale = useBrowserLocale();
  const [context] = useState<DeployContext>(() => ({ token: null }));
  const known = existing?.token ?? null;
  const steps: Step<DeployContext>[] = [];
  if (!existing) {
    steps.push({
      id: "deployEditions",
      label: t(locale, "streamSepolia.contract.step.deployEditions"),
      help: t(locale, "streamSepolia.contract.step.deployEditionsHelp"),
      run: async (ctx, io) => {
        if (ctx.token ?? known) return false;
        ctx.token = await deployIndependent({
          editions: true,
          salt: randomSalt(),
          config: independentEditionsConfig({
            name: t(locale, "streamSepolia.contract.editionsName", { name: oneOfOne.name }),
            symbol: `${symbolFromName(oneOfOne.name).slice(0, 6)}ED`,
            master: oneOfOne.token,
            artist: io.account,
            artistId: await artistIdFor(io.account),
          }),
          io,
        });
        return true;
      },
    });
  }
  if (existing?.status !== LISTING_ACTIVE) {
    steps.push({
      id: "listEditions",
      label: t(locale, "streamSepolia.contract.step.listEditions"),
      run: (ctx, io) =>
        listIndependent({ token: (ctx.token ?? known)!, editions: true, partner: oneOfOne.token, io, keep: ctx }),
    });
  }
  if (steps.length === 0) return null;
  return (
    <section className={CARD} aria-labelledby="stream-deploy-editions">
      <h2 id="stream-deploy-editions" className="tw-m-0 tw-text-base tw-font-semibold tw-text-iron-50">
        {t(locale, "streamSepolia.contract.editionsTitle")}
      </h2>
      <p className="tw-m-0 tw-mt-1 tw-text-sm tw-text-iron-400">
        {t(locale, "streamSepolia.contract.editionsHelp", { name: oneOfOne.name })}
      </p>
      <div className="tw-mt-4">
        <StepRunner steps={steps} context={context} startLabel={t(locale, "streamSepolia.contract.editionsStart")} />
      </div>
    </section>
  );
}
