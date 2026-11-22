"use client";

import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import type { Hex } from "viem";
import type { Config } from "wagmi";
import { QueryKey } from "@/components/react-query-wrapper/query-keys";
import Button from "@/components/utils/button/Button";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { formatDate } from "@/i18n/format";
import { t } from "@/i18n/messages";
import "@/i18n/namespaces/chain-identity";
import { chainGateway } from "@/lib/chain-identity/gateway";
import {
  identityCreate,
  normalizeHandle,
} from "@/lib/chain-identity/identityOps";
import { joinReadiness } from "@/lib/chain-identity/joins";
import { draftOperation } from "@/lib/chain-identity/operation";
import { walletSigner } from "@/lib/chain-identity/signers";
import ChainActionStatus from "./ChainActionStatus";
import {
  CHAIN_HINT_CLASS,
  CHAIN_INPUT_CLASS,
  CHAIN_LABEL_CLASS,
  ChainSection,
} from "./chainIdentityUi";
import { useChainAction } from "./useChainAction";

const DATE_TIME: Intl.DateTimeFormatOptions = {
  dateStyle: "medium",
  timeStyle: "short",
};

/** IDENTITY_CREATE for a wallet with no identity; its own account pays. */
export default function ChainIdentityCreate({
  wallet,
  config,
  rejoinWaitMs,
  onChanged,
}: {
  readonly wallet: Hex;
  readonly config: Config;
  /** The chain's wait before a wallet that left can create again; null: unknown. */
  readonly rejoinWaitMs: number | null;
  readonly onChanged: () => void;
}) {
  const locale = useBrowserLocale();
  // A wallet that just left an identity waits before it can create one.
  const membership = useQuery({
    queryKey: [QueryKey.CHAIN_IDENTITY, "membership", wallet.toLowerCase()],
    queryFn: ({ signal }) => chainGateway.getWalletMembership(wallet, signal),
    staleTime: 5_000,
  });
  const readiness = membership.data
    ? joinReadiness(membership.data, rejoinWaitMs, Date.now())
    : null;
  const waiting = readiness?.kind === "waiting" ? readiness : null;
  const [handle, setHandle] = useState("");
  const action = useChainAction(onChanged);
  const normalized = handle.trim() === "" ? "" : normalizeHandle(handle);

  const start = () => {
    if (normalized === null) {
      return;
    }
    void action.prepare(async () => {
      const operation = identityCreate(wallet, normalized, null);
      return {
        draft: await draftOperation(operation.request, operation.primaryType),
        signer: walletSigner(config, wallet),
        payer: "wallet",
      };
    });
  };

  return (
    <ChainSection
      id="chain-identity-create"
      heading={t(locale, "chainIdentity.create.heading")}
      body={t(locale, "chainIdentity.create.body")}
    >
      <label
        htmlFor="chain-identity-create-handle"
        className={CHAIN_LABEL_CLASS}
      >
        {t(locale, "chainIdentity.create.handle")}
      </label>
      <input
        id="chain-identity-create-handle"
        className={`${CHAIN_INPUT_CLASS} sm:tw-max-w-xs`}
        value={handle}
        autoComplete="off"
        spellCheck={false}
        maxLength={15}
        disabled={action.busy}
        aria-describedby="chain-identity-create-handle-hint"
        aria-invalid={normalized === null}
        onChange={(event) => setHandle(event.target.value)}
      />
      <p id="chain-identity-create-handle-hint" className={CHAIN_HINT_CLASS}>
        {normalized === null
          ? t(locale, "chainIdentity.handle.invalid")
          : t(locale, "chainIdentity.handle.hint")}
      </p>
      {waiting && (
        <p className="tw-mb-0 tw-mt-3 tw-text-sm tw-text-iron-200">
          {t(locale, "chainIdentity.create.waiting", {
            left: formatDate(locale, waiting.leftMs, DATE_TIME),
            until: formatDate(locale, waiting.untilMs, DATE_TIME),
          })}
        </p>
      )}
      <div className="tw-mt-4">
        <Button
          variant="primary"
          size="md"
          disabled={
            action.busy ||
            normalized === null ||
            waiting !== null ||
            action.state.kind === "confirm"
          }
          onClick={start}
        >
          {t(locale, "chainIdentity.create.action")}
        </Button>
      </div>
      <ChainActionStatus
        state={action.state}
        onConfirm={() => void action.confirm()}
        onCancel={action.cancel}
      />
    </ChainSection>
  );
}
