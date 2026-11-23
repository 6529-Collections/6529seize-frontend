"use client";

import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { useDebounce } from "react-use";
import type { Hex } from "viem";
import type { Config } from "wagmi";
import { QueryKey } from "@/components/react-query-wrapper/query-keys";
import Button from "@/components/utils/button/Button";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t, type MessageKey } from "@/i18n/messages";
import "@/i18n/namespaces/chain-identity";
import { chainGateway } from "@/lib/chain-identity/gateway";
import { handleClaim, normalizeHandle } from "@/lib/chain-identity/identityOps";
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

const STATUS_COPY: Record<string, MessageKey> = {
  free: "chainIdentity.handle.available",
  claimed: "chainIdentity.handle.claimed",
  reserved: "chainIdentity.handle.reserved",
  invalid: "chainIdentity.handle.invalid",
};

/** HANDLE_CLAIM: take a free handle; the identity pays. */
export default function ChainIdentityHandle({
  wallet,
  config,
  principalId,
  currentHandle,
  onChanged,
}: {
  readonly wallet: Hex;
  readonly config: Config;
  readonly principalId: Hex;
  readonly currentHandle: string | null;
  readonly onChanged: () => void;
}) {
  const locale = useBrowserLocale();
  const [input, setInput] = useState("");
  const [debounced, setDebounced] = useState("");
  useDebounce(() => setDebounced(input), 400, [input]);
  const action = useChainAction(() => {
    setInput("");
    onChanged();
  });
  const handle = normalizeHandle(debounced);
  const availability = useQuery({
    queryKey: [QueryKey.CHAIN_IDENTITY, "handle", handle],
    queryFn: ({ signal }) => chainGateway.getHandle(handle as string, signal),
    enabled: handle !== null && handle !== currentHandle,
    staleTime: 5_000,
  });
  const typed = input.trim() !== "";
  const invalid = typed && normalizeHandle(input) === null;
  const available =
    handle !== null &&
    handle === normalizeHandle(input) &&
    availability.data?.available === true;
  const answered =
    availability.data !== undefined && handle === normalizeHandle(input)
      ? STATUS_COPY[
          availability.data.available ? "free" : availability.data.status
        ]
      : undefined;
  const statusKey = invalid ? STATUS_COPY["invalid"] : answered;

  const start = () => {
    if (handle === null || !available) {
      return;
    }
    void action.prepare(async () => {
      const operation = handleClaim(
        principalId,
        wallet,
        handle,
        currentHandle ?? ""
      );
      return {
        draft: await draftOperation(operation.request, operation.primaryType),
        signer: walletSigner(config, wallet),
        payer: "identity",
      };
    });
  };

  return (
    <ChainSection
      id="chain-identity-handle"
      heading={t(locale, "chainIdentity.handle.heading")}
      body={t(locale, "chainIdentity.handle.body")}
    >
      <label
        htmlFor="chain-identity-handle-input"
        className={CHAIN_LABEL_CLASS}
      >
        {t(locale, "chainIdentity.handle.label")}
      </label>
      <div className="tw-flex tw-flex-col tw-gap-2 sm:tw-flex-row sm:tw-items-center">
        <input
          id="chain-identity-handle-input"
          className={`${CHAIN_INPUT_CLASS} sm:tw-max-w-xs`}
          value={input}
          autoComplete="off"
          spellCheck={false}
          maxLength={15}
          disabled={action.busy}
          aria-invalid={invalid}
          aria-describedby="chain-identity-handle-hint"
          onChange={(event) => setInput(event.target.value)}
        />
        <Button
          variant="primary"
          size="md"
          disabled={
            !available || action.busy || action.state.kind === "confirm"
          }
          onClick={start}
        >
          {t(locale, "chainIdentity.handle.action")}
        </Button>
      </div>
      <p
        id="chain-identity-handle-hint"
        aria-live="polite"
        className={CHAIN_HINT_CLASS}
      >
        {t(locale, statusKey ?? "chainIdentity.handle.hint")}
      </p>
      <ChainActionStatus
        state={action.state}
        onConfirm={() => void action.confirm()}
        onCancel={action.cancel}
      />
    </ChainSection>
  );
}
