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
import {
  chainErrorMessage,
  chainFailureText,
  chainRefusalName,
  feeRefusalCause,
} from "./chainErrorMessage";
import { ChainSection, shortHex } from "./chainIdentityUi";
import { useChainAction } from "./useChainAction";
import { useChainClock } from "./useChainClock";

const DATE_TIME: Intl.DateTimeFormatOptions = {
  dateStyle: "medium",
  timeStyle: "short",
};

const REQUESTS_POLL_MS = 30_000;

const signedInAs = (wallet: Hex): boolean =>
  getWalletAddress()?.toLowerCase() === wallet.toLowerCase() &&
  getAuthJwt() !== null;

/** The identity's name at the start of a sentence, and inside one. */
interface IdentityNames {
  readonly start: string;
  readonly mid: string;
}

/**
 * What the relay did with a complete join: refused it for good (`onEnded`),
 * couldn't reach the chain (`onUnsent`; the signatures are kept), or sent
 * it, and then the wait until the chain has run it.
 */
async function settleRelayed(
  locale: SupportedLocale,
  op: RelayOperation,
  names: IdentityNames,
  onEnded: () => void,
  onUnsent: () => void
): Promise<void> {
  if (op.status === "FAILED") {
    onEnded();
    // The relay words the chain's refusal itself: only its code is read
    // from it, and the reason is put from this wallet's side.
    const refusal = new Error(op.last_error ?? "");
    throw new ChainOperationError(
      "stated",
      t(locale, "chainIdentity.requests.refusedBecause", {
        reason: joinerReason(
          locale,
          chainRefusalName(refusal),
          names,
          feeRefusalCause(refusal)
        ),
      })
    );
  }
  if (op.status !== "SUBMITTED") {
    onUnsent();
    throw new ChainOperationError(
      "stated",
      t(locale, "chainIdentity.requests.unreachable")
    );
  }
  try {
    await awaitFinal(op.tx_id);
  } catch (error) {
    // The chain ran the join and it failed: say it from this wallet's side.
    if (error instanceof ChainOperationError && error.reason === "failed") {
      onEnded();
      throw new ChainOperationError(
        "stated",
        t(locale, "chainIdentity.requests.failedInBlock", {
          identity: names.mid,
          reason: joinerReason(locale, error.resultName, names),
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
  names: IdentityNames,
  feeCause: ReturnType<typeof feeRefusalCause> = null
): string {
  const identity = names.start;
  switch (name) {
    case "ADDRESS_BOUND":
    case "CLUSTER_BOUND":
      return t(locale, "chainIdentity.requests.bound");
    case "REJOIN_WAIT":
      return t(locale, "chainIdentity.requests.mustWait");
    case "IDENTITY_FULL":
      return t(locale, "chainIdentity.requests.full", { identity });
    case "FEE_UNCOVERED":
      return feeCause === "limit"
        ? t(locale, "chainIdentity.requests.feeRose")
        : t(locale, "chainIdentity.requests.feeShortfall", { identity });
    case "INSUFFICIENT_BALANCE":
      return t(locale, "chainIdentity.requests.feeShortfall", { identity });
    case "NONCE":
    case "NONCE_WINDOW":
    case "REPLACEMENT_UNDERPRICED":
      return t(locale, "chainIdentity.requests.otherChangeFirst", {
        identity,
      });
    case "EXPIRED":
    case "EXPIRED_AT_EXECUTION":
    case "MEMPOOL_TTL":
      return t(locale, "chainIdentity.requests.expired");
    case "KEY_NOT_BOUND":
      return t(locale, "chainIdentity.requests.askerLeft", {
        identity: names.mid,
      });
    case "IDENTITY_HELD":
    case "PRINCIPAL_INACTIVE":
    case "PRINCIPAL_RECONCILING":
      return t(locale, "chainIdentity.requests.identityBusy", { identity });
    case null:
      return t(locale, "chainIdentity.requests.refused");
    default:
      return t(locale, "chainIdentity.requests.refusedCode", { name });
  }
}

/** The held join checked for this wallet, or null when it can't be. */
function checkedJoin(op: RelayOperation, wallet: Hex): ChainDraft | null {
  try {
    return heldJoinDraft(op, wallet);
  } catch {
    return null;
  }
}

/**
 * Whether this wallet can join the request's identity: null while its state
 * is read, undefined when it couldn't be (the chain decides). It may rejoin
 * the identity it left at once; any other waits.
 */
function readinessFor(
  walletState: ChainWalletMembership | null | undefined,
  rejoinWaitMs: number | null,
  nowMs: number,
  principal: Hex | null
): JoinReadiness | null | undefined {
  if (walletState === undefined) {
    return undefined;
  }
  return walletState === null
    ? null
    : joinReadiness(walletState, rejoinWaitMs, nowMs, principal);
}

/** The identity's handle, or its short id as it reads in a sentence. */
function identityNames(
  locale: SupportedLocale,
  principal: Hex | null,
  handle: string | null | undefined
): IdentityNames {
  if (handle) {
    return { start: handle, mid: handle };
  }
  const id = principal ? shortHex(principal) : "";
  return {
    start: t(locale, "chainIdentity.requests.noHandleStart", { id }),
    mid: t(locale, "chainIdentity.requests.noHandle", { id }),
  };
}

/** Why the request can't be signed here, or null when it can. */
function blockedReason(
  locale: SupportedLocale,
  input: {
    readonly checked: boolean;
    readonly expired: boolean;
    readonly stranger: boolean;
    readonly readiness: JoinReadiness | null | undefined;
    readonly names: IdentityNames;
  }
): string | null {
  const { readiness } = input;
  if (!input.checked) {
    return t(locale, "chainIdentity.requests.notJoin");
  }
  if (input.expired) {
    return t(locale, "chainIdentity.requests.expired");
  }
  if (input.stranger) {
    return t(locale, "chainIdentity.requests.notFromIdentity", {
      identity: input.names.mid,
    });
  }
  if (readiness?.kind === "bound") {
    return t(locale, "chainIdentity.requests.bound");
  }
  if (readiness?.kind === "waiting") {
    return t(locale, "chainIdentity.requests.waiting", {
      left: formatDate(locale, readiness.leftMs, DATE_TIME),
      until: formatDate(locale, readiness.untilMs, DATE_TIME),
    });
  }
  return null;
}

function JoinRequestCard({
  op,
  wallet,
  config,
  walletState,
  rejoinWaitMs,
  onChanged,
  onActive,
  onGone,
}: {
  readonly op: RelayOperation;
  readonly wallet: Hex;
  readonly config: Config;
  /** Null while it is read; undefined when it couldn't be (the chain decides). */
  readonly walletState: ChainWalletMembership | null | undefined;
  readonly rejoinWaitMs: number | null;
  readonly onChanged: () => void;
  /** Keeps the card on the page while its join is under way. */
  readonly onActive: (op: RelayOperation) => void;
  /** Takes a declined request off the page. */
  readonly onGone: (txId: Hex) => void;
}) {
  const locale = useBrowserLocale();
  const action = useChainAction(onChanged);
  // Both signatures are with 6529.io, which couldn't reach the chain yet.
  const [unsent, setUnsent] = useState(false);
  const [resending, setResending] = useState(false);
  const [resendText, setResendText] = useState<string | null>(null);
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
  const nowMs = useChainClock();
  const checkedDraft = checkedJoin(op, wallet);
  const readiness = readinessFor(
    walletState,
    rejoinWaitMs,
    nowMs,
    op.principal
  );
  // The signed header's expiry, not the relay's copy of it.
  const expiresAtMs = checkedDraft
    ? Number(checkedDraft.envelope.header["expiresAt"])
    : op.expires_at;
  const names = identityNames(locale, op.principal, identity.data?.handle);

  const sign = () => {
    onActive(op);
    void action.prepare(() =>
      Promise.resolve({
        // Checked again here: what the wallet signs is exactly this join.
        draft: heldJoinDraft(op, wallet),
        signer: walletSigner(config, wallet),
        payer: "identity",
        submit: async (draft, signature) => {
          const relayed = await chainRelay.sign(draft.txId, {
            role: ROLE_JOINER,
            key_type: 1,
            sig: signature,
          });
          await settleRelayed(
            locale,
            relayed,
            names,
            () => setEnded(true),
            () => setUnsent(true)
          );
        },
      })
    );
  };

  // The relay takes a retry from any of the join's signers.
  const resend = async () => {
    setResending(true);
    setResendText(null);
    try {
      const relayed = await chainRelay.retry(op.tx_id);
      await settleRelayed(
        locale,
        relayed,
        names,
        () => setEnded(true),
        () => setUnsent(true)
      );
      setUnsent(false);
      // The first try's error no longer stands.
      action.cancel();
      setResendText(t(locale, "chainIdentity.action.done"));
      onChanged();
    } catch (error) {
      setResendText(chainFailureText(locale, error));
    } finally {
      setResending(false);
    }
  };

  const decline = async () => {
    setDeclining(true);
    setDeclineError(null);
    try {
      await chainRelay.cancel(op.tx_id);
      onGone(op.tx_id);
      onChanged();
    } catch (error) {
      setDeclineError(chainErrorMessage(locale, error));
    } finally {
      setDeclining(false);
    }
  };

  // The relay names the identity; the chain would refuse a requester that
  // isn't one of its wallets, so the card doesn't claim the identity asked.
  const requesterInIdentity =
    requester !== null &&
    (identity.data?.wallets ?? []).some(
      (item) => item.toLowerCase() === requester.toLowerCase()
    );
  const blocked = blockedReason(locale, {
    checked: checkedDraft !== null,
    expired: expiresAtMs <= nowMs,
    stranger: identity.isSuccess && !requesterInIdentity,
    readiness,
    names,
  });

  return (
    <li className="tw-rounded-lg tw-border tw-border-solid tw-border-primary-400/30 tw-bg-primary-400/5 tw-p-3">
      <p className="tw-m-0 tw-text-sm tw-text-iron-200">
        {t(
          locale,
          identity.isSuccess && !requesterInIdentity
            ? "chainIdentity.requests.fromStranger"
            : "chainIdentity.requests.from",
          {
            identity:
              identity.isSuccess && !requesterInIdentity
                ? names.mid
                : names.start,
            wallet: requester ? shortHex(requester) : "",
            date: formatDate(locale, expiresAtMs, DATE_TIME),
          }
        )}
      </p>
      {blocked && (
        <p className="tw-mb-0 tw-mt-2 tw-text-sm tw-text-iron-300">{blocked}</p>
      )}
      <div className="tw-mt-3 tw-flex tw-flex-wrap tw-gap-2">
        {blocked === null &&
          readiness !== null &&
          identity.isSuccess &&
          !ended &&
          !unsent && (
            <Button
              variant="primary"
              size="sm"
              disabled={action.busy || action.state.kind === "confirm"}
              onClick={sign}
            >
              {t(locale, "chainIdentity.requests.review")}
            </Button>
          )}
        {unsent && !ended && (
          <Button
            variant="primary"
            size="sm"
            disabled={resending}
            onClick={() => void resend()}
          >
            {t(locale, "chainIdentity.wallets.sendAgain")}
          </Button>
        )}
        {!unsent && !ended && action.state.kind !== "done" && (
          <Button
            variant="secondary"
            size="sm"
            disabled={action.busy || declining}
            onClick={() => void decline()}
          >
            {t(locale, "chainIdentity.requests.decline")}
          </Button>
        )}
      </div>
      <ChainActionStatus
        state={action.state}
        note={t(locale, "chainIdentity.requests.joinNote", {
          identity: names.mid,
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
      {resendText && (
        <p
          role="status"
          className="tw-mb-0 tw-mt-2 tw-text-sm tw-text-iron-300"
        >
          {resendText}
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
  // Requests this wallet started to sign stay on the page: once signed, the
  // relay stops listing them, before the chain has answered.
  const [kept, setKept] = useState<readonly RelayOperation[]>([]);
  const keep = (op: RelayOperation) =>
    setKept((current) =>
      current.some((item) => item.tx_id === op.tx_id)
        ? current
        : [...current, op]
    );
  const signedIn = signedInAs(wallet);
  const requests = useQuery({
    queryKey: [QueryKey.CHAIN_IDENTITY, "join-requests", wallet.toLowerCase()],
    queryFn: ({ signal }) => chainRelay.waiting(signal),
    enabled: signedIn,
    refetchInterval: REQUESTS_POLL_MS,
  });
  const listed = (requests.data ?? []).filter((op) =>
    op.signers.some(
      (entry) =>
        entry.role === ROLE_JOINER &&
        !entry.signed &&
        entry.signer.toLowerCase() === wallet.toLowerCase()
    )
  );
  const mine = [
    ...listed,
    ...kept.filter((op) => !listed.some((item) => item.tx_id === op.tx_id)),
  ];
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

  const listStatus = (requests.error as { status?: unknown } | null)?.status;
  if (requests.isError && (listStatus === 401 || listStatus === 403)) {
    return (
      <div className="tw-flex tw-flex-col tw-gap-2 tw-rounded-lg tw-border tw-border-solid tw-border-white/[0.07] tw-px-4 tw-py-3 sm:tw-flex-row sm:tw-items-center sm:tw-justify-between">
        <p className="tw-m-0 tw-text-sm tw-text-iron-300">
          {t(locale, "chainIdentity.requests.signIn")}
        </p>
        <Button
          variant="secondary"
          size="sm"
          onClick={() =>
            void requestAuth().then(() => {
              void requests.refetch();
            })
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
            onActive={keep}
            onGone={(txId) =>
              setKept((current) =>
                current.filter((item) => item.tx_id !== txId)
              )
            }
            onChanged={changed}
          />
        ))}
      </ul>
    </ChainSection>
  );
}
