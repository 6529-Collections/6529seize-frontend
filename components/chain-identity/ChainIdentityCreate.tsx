"use client";

import { useState } from "react";
import type { Hex } from "viem";
import type { Config } from "wagmi";
import Button from "@/components/utils/button/Button";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";
import "@/i18n/namespaces/chain-identity";
import { identityCreate, normalizeHandle } from "@/lib/chain-identity/identityOps";
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

/** IDENTITY_CREATE for a wallet with no identity; its own account pays. */
export default function ChainIdentityCreate({
  wallet,
  config,
  onChanged,
}: {
  readonly wallet: Hex;
  readonly config: Config;
  readonly onChanged: () => void;
}) {
  const locale = useBrowserLocale();
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
      <label htmlFor="chain-identity-create-handle" className={CHAIN_LABEL_CLASS}>
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
      <div className="tw-mt-4">
        <Button
          variant="primary"
          size="md"
          disabled={action.busy || normalized === null || action.state.kind === "confirm"}
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
