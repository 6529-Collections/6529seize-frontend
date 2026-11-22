"use client";

import { useState } from "react";
import { isAddress, type Hex } from "viem";
import type { Config } from "wagmi";
import Button from "@/components/utils/button/Button";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";
import "@/i18n/namespaces/chain-identity";
import type { ChainIdentity } from "@/lib/chain-identity/gateway";
import { identityJoin, identityRemove } from "@/lib/chain-identity/identityOps";
import { draftOperation } from "@/lib/chain-identity/operation";
import { pendingJoins } from "@/lib/chain-identity/pendingJoin";
import { walletSigner } from "@/lib/chain-identity/signers";
import ChainActionStatus from "./ChainActionStatus";
import {
  CHAIN_HINT_CLASS,
  CHAIN_INPUT_CLASS,
  CHAIN_LABEL_CLASS,
  ChainSection,
  shortHex,
} from "./chainIdentityUi";
import { useChainAction } from "./useChainAction";

/** A join's draft stays valid this long for the second wallet to sign. */
const JOIN_VALID_MS = 60 * 60 * 1000;

/**
 * The identity's wallets: IDENTITY_REMOVE for any of them but the last, and
 * IDENTITY_JOIN, whose first signature waits in this browser for the new
 * wallet's (ChainPendingJoins).
 */
export default function ChainIdentityWallets({
  wallet,
  config,
  identity,
  onChanged,
  onJoinHeld,
}: {
  readonly wallet: Hex;
  readonly config: Config;
  readonly identity: ChainIdentity;
  readonly onChanged: () => void;
  readonly onJoinHeld: () => void;
}) {
  const locale = useBrowserLocale();
  const [joining, setJoining] = useState("");
  const remove = useChainAction(onChanged);
  const join = useChainAction(() => {
    setJoining("");
    onJoinHeld();
  });
  const joiningOk =
    isAddress(joining.trim()) &&
    !identity.wallets.some(
      (item) => item.toLowerCase() === joining.trim().toLowerCase()
    );
  const canRemove = identity.wallets.length > 1;

  const startRemove = (target: Hex) => {
    void remove.prepare(async () => {
      const operation = identityRemove(identity.principalId, wallet, target);
      return {
        draft: await draftOperation(operation.request, operation.primaryType),
        signer: walletSigner(config, wallet),
        payer: "identity",
      };
    });
  };

  const startJoin = () => {
    const target = joining.trim() as Hex;
    if (!joiningOk) {
      return;
    }
    void join.prepare(async () => {
      const operation = identityJoin(identity.principalId, wallet, target);
      const request = { ...operation.request, validForMs: JOIN_VALID_MS };
      const draft = await draftOperation(request, operation.primaryType);
      return {
        draft,
        signer: walletSigner(config, wallet),
        payer: "identity",
        submit: (signed, signature) => {
          pendingJoins.save({
            principalId: identity.principalId,
            identityWallet: wallet,
            joiningWallet: target,
            draft: signed,
            identitySignature: signature,
            expiresAtMs: Date.now() + JOIN_VALID_MS,
          });
          return Promise.resolve();
        },
      };
    });
  };

  return (
    <ChainSection
      id="chain-identity-wallets"
      heading={t(locale, "chainIdentity.wallets.heading")}
      body={t(locale, "chainIdentity.wallets.body")}
    >
      <ul className="tw-m-0 tw-list-none tw-space-y-2 tw-p-0">
        {identity.wallets.map((item) => (
          <li
            key={item}
            className="tw-flex tw-items-center tw-justify-between tw-gap-3 tw-rounded-lg tw-border tw-border-solid tw-border-white/[0.06] tw-px-3 tw-py-2"
          >
            <span className="tw-min-w-0 tw-break-all tw-font-mono tw-text-sm tw-text-iron-200">
              {item}
            </span>
            {canRemove && (
              <Button
                variant="secondary"
                size="sm"
                disabled={remove.busy || remove.state.kind === "confirm"}
                aria-label={t(locale, "chainIdentity.wallets.removeLabel", {
                  wallet: shortHex(item),
                })}
                onClick={() => startRemove(item)}
              >
                {t(locale, "chainIdentity.wallets.remove")}
              </Button>
            )}
          </li>
        ))}
      </ul>
      <ChainActionStatus
        state={remove.state}
        onConfirm={() => void remove.confirm()}
        onCancel={remove.cancel}
      />

      <div className="tw-mt-5 tw-border-0 tw-border-t tw-border-solid tw-border-white/[0.07] tw-pt-4">
        <h3 className="tw-m-0 tw-text-base tw-font-semibold tw-text-iron-100">
          {t(locale, "chainIdentity.wallets.addHeading")}
        </h3>
        <p className="tw-mb-3 tw-mt-1.5 tw-max-w-3xl tw-text-sm tw-leading-6 tw-text-iron-300">
          {t(locale, "chainIdentity.wallets.addBody")}
        </p>
        <label htmlFor="chain-identity-join-wallet" className={CHAIN_LABEL_CLASS}>
          {t(locale, "chainIdentity.wallets.addLabel")}
        </label>
        <div className="tw-flex tw-flex-col tw-gap-2 sm:tw-flex-row sm:tw-items-center">
          <input
            id="chain-identity-join-wallet"
            className={`${CHAIN_INPUT_CLASS} tw-font-mono sm:tw-max-w-md`}
            value={joining}
            autoComplete="off"
            spellCheck={false}
            placeholder={t(locale, "chainIdentity.addressPlaceholder")}
            disabled={join.busy}
            aria-invalid={joining !== "" && !joiningOk}
            aria-describedby="chain-identity-join-hint"
            onChange={(event) => setJoining(event.target.value)}
          />
          <Button
            variant="primary"
            size="md"
            disabled={!joiningOk || join.busy || join.state.kind === "confirm"}
            onClick={startJoin}
          >
            {t(locale, "chainIdentity.wallets.addAction")}
          </Button>
        </div>
        {joining !== "" && !joiningOk && (
          <p id="chain-identity-join-hint" className={CHAIN_HINT_CLASS}>
            {t(locale, "chainIdentity.wallets.addInvalid")}
          </p>
        )}
        <ChainActionStatus
          state={join.state}
          onConfirm={() => void join.confirm()}
          onCancel={join.cancel}
        />
      </div>
    </ChainSection>
  );
}
