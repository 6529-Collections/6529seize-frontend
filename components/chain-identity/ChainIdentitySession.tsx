"use client";

import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import type { Hex } from "viem";
import type { Config } from "wagmi";
import { QueryKey } from "@/components/react-query-wrapper/query-keys";
import Button from "@/components/utils/button/Button";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { useChainWavesActive } from "@/hooks/useWavesMovePhase";
import { OP_VOTE_SET } from "@/lib/chain-identity/identityOps";
import { chainGateway } from "@/lib/chain-identity/gateway";
import { formatDate } from "@/i18n/format";
import { t } from "@/i18n/messages";
import "@/i18n/namespaces/chain-identity";
import { draftOperation } from "@/lib/chain-identity/operation";
import {
  forgetSessionKey,
  keepSessionKey,
  planSession,
  SESSION_LIFETIME_DAYS,
  sessionGrantOperation,
  sessionKeyCanSign,
  sessionRevokeOperation,
  type SessionPlan,
} from "@/lib/chain-identity/session";
import {
  canHoldSessionKey,
  type StoredSessionKey,
} from "@/lib/chain-identity/sessionKey";
import { walletSigner } from "@/lib/chain-identity/signers";
import { formatFake6529 } from "./chainAmount";
import ChainActionStatus from "./ChainActionStatus";
import { ChainSection } from "./chainIdentityUi";
import { useChainAction } from "./useChainAction";

/**
 * "Enable chain actions on this browser": one wallet signature grants a key
 * kept in this browser PROFILE_REPLACE and RATING_SET for 30 days, and once
 * waves have moved, VOTE_SET and POLL_BALLOT_SET too.
 */
export default function ChainIdentitySession({
  wallet,
  config,
  principalId,
  sessionKey,
  onChanged,
}: {
  readonly wallet: Hex;
  readonly config: Config;
  readonly principalId: Hex;
  readonly sessionKey: StoredSessionKey | null;
  readonly onChanged: () => void;
}) {
  const locale = useBrowserLocale();
  const supported = useQuery({
    queryKey: [QueryKey.CHAIN_IDENTITY, "key-support"],
    queryFn: canHoldSessionKey,
    staleTime: Infinity,
  });
  const [plan, setPlan] = useState<SessionPlan | null>(null);
  const chainWavesActive = useChainWavesActive();
  // A key that can't sign votes is offered them only once the chain runs
  // VOTE_SET: a new grant before that would leave votes out again.
  const keyLacksVotes =
    sessionKey !== null && !sessionKeyCanSign(sessionKey, OP_VOTE_SET);
  const chainRunsVotes = useQuery({
    queryKey: [QueryKey.CHAIN_IDENTITY, "runs-vote-set"],
    queryFn: async () =>
      (await chainGateway.getOps()).ops?.some(
        (op) => op.opType === OP_VOTE_SET
      ) ?? false,
    enabled: chainWavesActive && keyLacksVotes,
    staleTime: 60_000,
  });
  const action = useChainAction(() => {
    setPlan(null);
    onChanged();
  });

  const enable = () => {
    void action.prepare(async () => {
      const next = await planSession(principalId, wallet, Date.now());
      setPlan(next);
      const operation = sessionGrantOperation(principalId, wallet, next);
      return {
        draft: await draftOperation(operation.request, operation.primaryType),
        signer: walletSigner(config, wallet),
        payer: "identity",
        afterFinal: (draft) => keepSessionKey(principalId, next, draft.txId),
      };
    });
  };

  const disable = (record: StoredSessionKey) => {
    void action.prepare(async () => {
      const operation = await sessionRevokeOperation(
        principalId,
        wallet,
        record
      );
      if (operation === null) {
        // The grant already ended on the chain: only this browser's copy is left.
        await forgetSessionKey(principalId);
        onChanged();
        return null;
      }
      return {
        draft: await draftOperation(operation.request, operation.primaryType),
        signer: walletSigner(config, wallet),
        payer: "identity",
        afterFinal: () => forgetSessionKey(principalId),
      };
    });
  };

  if (supported.data === false) {
    return (
      <ChainSection
        id="chain-identity-session"
        heading={t(locale, "chainIdentity.session.heading")}
        body={t(locale, "chainIdentity.session.unsupported")}
      />
    );
  }

  if (sessionKey) {
    // A key enrolled before votes reached the 6529 Network can't sign them;
    // a new grant for a new key adds them.
    const needsVotes =
      chainWavesActive && keyLacksVotes && chainRunsVotes.data === true;
    return (
      <ChainSection
        id="chain-identity-session"
        heading={t(locale, "chainIdentity.session.heading")}
        body={t(locale, "chainIdentity.session.onBody", {
          date: formatDate(locale, sessionKey.expiresAtMs, {
            dateStyle: "medium",
          }),
        })}
      >
        {needsVotes && (
          <>
            <p className="tw-mb-3 tw-mt-0 tw-text-sm tw-text-iron-300">
              {t(locale, "wavesMove.session.votesMissing")}
            </p>
            <Button
              variant="primary"
              size="md"
              className="tw-mb-3 tw-mr-3"
              disabled={action.busy || action.state.kind === "confirm"}
              onClick={enable}
            >
              {t(locale, "wavesMove.session.addVotes")}
            </Button>
          </>
        )}
        <Button
          variant="secondary"
          size="md"
          disabled={action.busy || action.state.kind === "confirm"}
          onClick={() => disable(sessionKey)}
        >
          {t(locale, "chainIdentity.session.disable")}
        </Button>
        <ChainActionStatus
          state={action.state}
          onConfirm={() => void action.confirm()}
          onCancel={action.cancel}
        />
      </ChainSection>
    );
  }

  return (
    <ChainSection
      id="chain-identity-session"
      heading={t(locale, "chainIdentity.session.heading")}
      body={t(locale, "chainIdentity.session.offBody", {
        days: SESSION_LIFETIME_DAYS,
      })}
    >
      {plan && (
        <p className="tw-mb-3 tw-mt-0 tw-text-sm tw-text-iron-300">
          {t(locale, "chainIdentity.session.budget", {
            amount: formatFake6529(locale, plan.feeBudget, true),
          })}
        </p>
      )}
      <Button
        variant="primary"
        size="md"
        disabled={
          action.busy ||
          action.state.kind === "confirm" ||
          supported.data !== true
        }
        onClick={enable}
      >
        {t(locale, "chainIdentity.session.enable")}
      </Button>
      <ChainActionStatus
        state={action.state}
        onConfirm={() => void action.confirm()}
        onCancel={action.cancel}
      />
    </ChainSection>
  );
}
