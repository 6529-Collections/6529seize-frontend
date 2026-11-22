"use client";

import type { Hex } from "viem";
import type { Config } from "wagmi";
import Button from "@/components/utils/button/Button";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";
import "@/i18n/namespaces/chain-identity";
import { identityJoin } from "@/lib/chain-identity/identityOps";
import {
  submitAndAwait,
  verifyDraft,
} from "@/lib/chain-identity/operation";
import { pendingJoins, type PendingJoin } from "@/lib/chain-identity/pendingJoin";
import { walletSigner } from "@/lib/chain-identity/signers";
import ChainActionStatus from "./ChainActionStatus";
import { shortHex } from "./chainIdentityUi";
import { useChainAction } from "./useChainAction";

const ROLE_SIGNER = 0;
const ROLE_JOINER = 4;

function PendingJoinCard({
  join,
  config,
  connected,
  onChanged,
}: {
  readonly join: PendingJoin;
  readonly config: Config;
  readonly connected: Hex | undefined;
  readonly onChanged: () => void;
}) {
  const locale = useBrowserLocale();
  const action = useChainAction(onChanged);
  const isJoiningWallet =
    connected?.toLowerCase() === join.joiningWallet.toLowerCase();

  const sign = () => {
    void action.prepare(() => {
      // The held draft is checked again before the second wallet signs it.
      const operation = identityJoin(
        join.principalId,
        join.identityWallet,
        join.joiningWallet
      );
      verifyDraft(join.draft, operation.request, operation.primaryType);
      return Promise.resolve({
        draft: join.draft,
        signer: walletSigner(config, join.joiningWallet),
        payer: "identity",
        submit: async (draft, joinerSignature) => {
          await submitAndAwait(draft, [
            { role: ROLE_SIGNER, keyType: 1, sig: join.identitySignature },
            { role: ROLE_JOINER, keyType: 1, sig: joinerSignature },
          ]);
        },
        afterFinal: () => pendingJoins.remove(join.joiningWallet),
      });
    });
  };

  return (
    <li className="tw-rounded-lg tw-border tw-border-solid tw-border-primary-400/30 tw-bg-primary-400/5 tw-p-3">
      <p className="tw-m-0 tw-text-sm tw-text-iron-200">
        {t(locale, "chainIdentity.wallets.pending", {
          wallet: shortHex(join.joiningWallet),
        })}
      </p>
      <div className="tw-mt-3 tw-flex tw-flex-wrap tw-gap-2">
        <Button
          variant="primary"
          size="sm"
          disabled={!isJoiningWallet || action.busy || action.state.kind === "confirm"}
          onClick={sign}
        >
          {t(locale, "chainIdentity.wallets.pendingSign")}
        </Button>
        <Button
          variant="secondary"
          size="sm"
          disabled={action.busy}
          onClick={() => {
            pendingJoins.remove(join.joiningWallet);
            onChanged();
          }}
        >
          {t(locale, "chainIdentity.wallets.pendingCancel")}
        </Button>
      </div>
      <ChainActionStatus
        state={action.state}
        onConfirm={() => void action.confirm()}
        onCancel={action.cancel}
      />
    </li>
  );
}

/**
 * Joins this browser holds: the identity's wallet has signed, the new
 * wallet signs here once the wallet app is switched to it.
 */
export default function ChainPendingJoins({
  joins,
  config,
  connected,
  onChanged,
}: {
  readonly joins: readonly PendingJoin[];
  readonly config: Config;
  readonly connected: Hex | undefined;
  readonly onChanged: () => void;
}) {
  if (joins.length === 0) {
    return null;
  }
  return (
    <ul className="tw-m-0 tw-list-none tw-space-y-3 tw-p-0">
      {joins.map((join) => (
        <PendingJoinCard
          key={join.joiningWallet}
          join={join}
          config={config}
          connected={connected}
          onChanged={onChanged}
        />
      ))}
    </ul>
  );
}
