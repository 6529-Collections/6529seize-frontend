"use client";

import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import type { Hex } from "viem";
import type { Config } from "wagmi";
import { useAuth } from "@/components/auth/authContext";
import { QueryKey } from "@/components/react-query-wrapper/query-keys";
import Button from "@/components/utils/button/Button";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { formatDate } from "@/i18n/format";
import type { SupportedLocale } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import "@/i18n/namespaces/chain-identity";
import {
  chainGateway,
  type ChainDraft,
  type ChainWalletMembership,
} from "@/lib/chain-identity/gateway";
import {
  heldJoinDraft,
  joinRequester,
  joinReadiness,
  ROLE_JOINER,
  type JoinReadiness,
} from "@/lib/chain-identity/joins";
import {
  awaitFinal,
  ChainOperationError,
} from "@/lib/chain-identity/operation";
import { chainRelay, type RelayOperation } from "@/lib/chain-identity/relay";
import { walletSigner } from "@/lib/chain-identity/signers";
import { getAuthJwt, getWalletAddress } from "@/services/auth/auth.utils";
import ChainActionStatus from "./ChainActionStatus";
import { chainErrorMessage, chainRefusalName } from "./chainErrorMessage";
import { ChainSection, shortHex } from "./chainIdentityUi";
import { useChainAction } from "./useChainAction";

const DATE_TIME: Intl.DateTimeFormatOptions = {
  dateStyle: "medium",
  timeStyle: "short",
};

const REQUESTS_POLL_MS = 30_000;

const signedInAs = (wallet: Hex): boolean =>
  getWalletAddress()?.toLowerCase() === wallet.toLowerCase() &&
  getAuthJwt() !== null;

/** Sends this wallet's signature through the relay and waits for the chain. */
async function signThroughRelay(
  locale: SupportedLocale,
  txId: Hex,
  signature: Hex,
  identity: string,
  onEnded: () => void
): Promise<void> {
  const op = await chainRelay.sign(txId, {
    role: ROLE_JOINER,
    key_type: 1,
    sig: signature,
  });
  if (op.status === "FAILED") {
    onEnded();
    // The relay words the chain's refusal itself: only its code and detail
    // are read from it, never shown as they are.
    const refusal = new Error(op.last_error ?? "");
    const name = chainRefusalName(refusal);
    throw new ChainOperationError(
      "rejected",
      name === null
        ? t(locale, "chainIdentity.requests.refused")
        : refusal.message,
      name
    );
  }
  if (op.status !== "SUBMITTED") {
    throw new ChainOperationError(
      "stated",
      t(locale, "chainIdentity.requests.unreachable")
    );
  }
  try {
    await awaitFinal(txId);
  } catch (error) {
    // The chain ran the join and it failed: say it from this wallet's side.
    if (error instanceof ChainOperationError && error.reason === "failed") {
      throw new ChainOperationError(
        "stated",
        t(locale, "chainIdentity.requests.failedInBlock", {
          identity,
          reason: joinerReason(locale, error.resultName, identity),
        })
      );
    }
    throw error;
  }
}

/** Why a join failed, as the joining wallet would put it. */
function joinerReason(
  locale: SupportedLocale,
  name: string | null,
  identity: string
): string {
  switch (name) {
    case "ADDRESS_BOUND":
    case "CLUSTER_BOUND":
      return t(locale, "chainIdentity.requests.bound");
    case "REJOIN_WAIT":
      return t(locale, "chainIdentity.requests.mustWait");
    case "IDENTITY_FULL":
      return t(locale, "chainIdentity.requests.full", { identity });
    default:
      return t(locale, "chainIdentity.error.generic");
  }
}

function JoinRequestCard({
  op,
  wallet,
  config,
  walletState,
  rejoinWaitMs,
  onChanged,
}: {
  readonly op: RelayOperation;
  readonly wallet: Hex;
  readonly config: Config;
  /** Null while it is read; undefined when it couldn't be (the chain decides). */
  readonly walletState: ChainWalletMembership | null | undefined;
  readonly rejoinWaitMs: number | null;
  readonly onChanged: () => void;
}) {
  const locale = useBrowserLocale();
  const action = useChainAction(onChanged);
  const [declining, setDeclining] = useState(false);
  const [declineError, setDeclineError] = useState<string | null>(null);
  // The relay refused it for good: this request can't be signed again.
  const [ended, setEnded] = useState(false);
  const requester = joinRequester(op);
  const identity = useQuery({
    queryKey: [QueryKey.CHAIN_IDENTITY, "identity", op.principal],
    queryFn: ({ signal }) =>
      chainGateway.getIdentity(op.principal as Hex, signal),
    enabled: op.principal !== null,
    staleTime: 30_000,
  });
  let checkedDraft: ChainDraft | null = null;
  try {
    checkedDraft = heldJoinDraft(op, wallet);
  } catch {
    checkedDraft = null;
  }
  const checked = checkedDraft !== null;
  // The wallet may rejoin the identity it left at once; any other waits.
  let readiness: JoinReadiness | null | undefined =
    walletState === undefined ? undefined : null;
  if (walletState) {
    readiness = joinReadiness(
      walletState,
      rejoinWaitMs,
      Date.now(),
      op.principal
    );
  }
  // The signed header's expiry, not the relay's copy of it.
  const expiresAtMs = checkedDraft
    ? Number(checkedDraft.envelope.header["expiresAt"])
    : op.expires_at;

  const shortId = op.principal ? shortHex(op.principal) : "";
  let name = shortId;
  if (identity.data?.handle) {
    name = identity.data.handle;
  } else if (identity.isSuccess) {
    name = t(locale, "chainIdentity.requests.noHandle", { id: shortId });
  }

  const sign = () => {
    void action.prepare(() =>
      Promise.resolve({
        // Checked again here: what the wallet signs is exactly this join.
        draft: heldJoinDraft(op, wallet),
        signer: walletSigner(config, wallet),
        payer: "identity",
        submit: (draft, signature) =>
          signThroughRelay(locale, draft.txId, signature, name, () =>
            setEnded(true)
          ),
      })
    );
  };

  const decline = async () => {
    setDeclining(true);
    setDeclineError(null);
    try {
      await chainRelay.cancel(op.tx_id);
      onChanged();
    } catch (error) {
      setDeclineError(chainErrorMessage(locale, error));
    } finally {
      setDeclining(false);
    }
  };

  let blocked: string | null = null;
  if (!checked) {
    blocked = t(locale, "chainIdentity.requests.notJoin");
  } else if (readiness?.kind === "bound") {
    blocked = t(locale, "chainIdentity.requests.bound");
  } else if (readiness?.kind === "waiting") {
    blocked = t(locale, "chainIdentity.requests.waiting", {
      left: formatDate(locale, readiness.leftMs, DATE_TIME),
      until: formatDate(locale, readiness.untilMs, DATE_TIME),
    });
  }

  return (
    <li className="tw-rounded-lg tw-border tw-border-solid tw-border-primary-400/30 tw-bg-primary-400/5 tw-p-3">
      <p className="tw-m-0 tw-text-sm tw-text-iron-200">
        {t(locale, "chainIdentity.requests.from", {
          identity: name,
          wallet: requester ? shortHex(requester) : "",
          date: formatDate(locale, expiresAtMs, DATE_TIME),
        })}
      </p>
      {blocked && (
        <p className="tw-mb-0 tw-mt-2 tw-text-sm tw-text-iron-300">{blocked}</p>
      )}
      <div className="tw-mt-3 tw-flex tw-flex-wrap tw-gap-2">
        {blocked === null && readiness !== null && !ended && (
          <Button
            variant="primary"
            size="sm"
            disabled={action.busy || action.state.kind === "confirm"}
            onClick={sign}
          >
            {t(locale, "chainIdentity.requests.review")}
          </Button>
        )}
        <Button
          variant="secondary"
          size="sm"
          disabled={action.busy || declining}
          onClick={() => void decline()}
        >
          {t(locale, "chainIdentity.requests.decline")}
        </Button>
      </div>
      <ChainActionStatus
        state={action.state}
        note={t(locale, "chainIdentity.requests.joinNote", { identity: name })}
        feeShortfallText={t(locale, "chainIdentity.requests.feeShortfall", {
          identity: name,
        })}
        feeText={(amount) =>
          t(locale, "chainIdentity.requests.feeFromIdentity", { amount })
        }
        onConfirm={() => void action.confirm()}
        onCancel={action.cancel}
      />
      {ended && (
        <p className="tw-mb-0 tw-mt-2 tw-text-sm tw-text-iron-300">
          {t(locale, "chainIdentity.requests.ended")}
        </p>
      )}
      {declineError && (
        <p role="alert" className="tw-mb-0 tw-mt-2 tw-text-sm tw-text-error">
          {declineError}
        </p>
      )}
    </li>
  );
}

/**
 * Requests to add the connected wallet to an identity: another wallet signed
 * IDENTITY_JOIN first, and 6529.io's relay holds it for this wallet. The
 * relay shows them only to this wallet's 6529.io session.
 */
export default function ChainJoinRequests({
  wallet,
  config,
  rejoinWaitMs,
  onChanged,
}: {
  readonly wallet: Hex;
  readonly config: Config;
  readonly rejoinWaitMs: number | null;
  readonly onChanged: () => void;
}) {
  const locale = useBrowserLocale();
  const { requestAuth } = useAuth();
  const [, setSignInTick] = useState(0);
  const signedIn = signedInAs(wallet);
  const requests = useQuery({
    queryKey: [QueryKey.CHAIN_IDENTITY, "join-requests", wallet.toLowerCase()],
    queryFn: ({ signal }) => chainRelay.waiting(signal),
    enabled: signedIn,
    refetchInterval: REQUESTS_POLL_MS,
  });
  const mine = (requests.data ?? []).filter((op) =>
    op.signers.some(
      (entry) =>
        entry.role === ROLE_JOINER &&
        !entry.signed &&
        entry.signer.toLowerCase() === wallet.toLowerCase()
    )
  );
  const membership = useQuery({
    queryKey: [QueryKey.CHAIN_IDENTITY, "membership", wallet.toLowerCase()],
    queryFn: ({ signal }) => chainGateway.getWalletMembership(wallet, signal),
    enabled: mine.length > 0,
    staleTime: 5_000,
  });
  // Null while it is read; undefined when it couldn't be (the chain decides).
  let walletState: ChainWalletMembership | null | undefined = null;
  if (membership.data) {
    walletState = membership.data;
  } else if (membership.isError) {
    walletState = undefined;
  }

  const changed = () => {
    void requests.refetch();
    onChanged();
  };

  if (!signedIn) {
    return (
      <div className="tw-flex tw-flex-col tw-gap-2 tw-rounded-lg tw-border tw-border-solid tw-border-white/[0.07] tw-px-4 tw-py-3 sm:tw-flex-row sm:tw-items-center sm:tw-justify-between">
        <p className="tw-m-0 tw-text-sm tw-text-iron-300">
          {t(locale, "chainIdentity.requests.signIn")}
        </p>
        <Button
          variant="secondary"
          size="sm"
          onClick={() =>
            void requestAuth().then(() => setSignInTick((tick) => tick + 1))
          }
        >
          {t(locale, "chainIdentity.requests.signInAction")}
        </Button>
      </div>
    );
  }

  if (requests.isError) {
    return (
      <div
        role="alert"
        className="tw-flex tw-flex-col tw-gap-2 tw-rounded-lg tw-border tw-border-solid tw-border-white/[0.07] tw-px-4 tw-py-3 sm:tw-flex-row sm:tw-items-center sm:tw-justify-between"
      >
        <p className="tw-m-0 tw-text-sm tw-text-iron-300">
          {t(locale, "chainIdentity.requests.loadError")}
        </p>
        <Button
          variant="secondary"
          size="sm"
          loading={requests.isFetching}
          onClick={() => void requests.refetch()}
        >
          {t(locale, "chainIdentity.retry")}
        </Button>
      </div>
    );
  }

  if (mine.length === 0) {
    return null;
  }

  return (
    <ChainSection
      id="chain-identity-requests"
      heading={t(locale, "chainIdentity.requests.heading")}
      body={t(locale, "chainIdentity.requests.body")}
    >
      <ul className="tw-m-0 tw-list-none tw-space-y-3 tw-p-0">
        {mine.map((op) => (
          <JoinRequestCard
            key={op.tx_id}
            op={op}
            wallet={wallet}
            config={config}
            walletState={walletState}
            rejoinWaitMs={rejoinWaitMs}
            onChanged={changed}
          />
        ))}
      </ul>
    </ChainSection>
  );
}
