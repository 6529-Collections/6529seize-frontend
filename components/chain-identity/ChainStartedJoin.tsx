"use client";

import { useQuery } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
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
  type ChainIdentity,
  type ChainTxStatus,
} from "@/lib/chain-identity/gateway";
import { ChainOperationError } from "@/lib/chain-identity/operation";
import {
  startedJoins,
  type StartedJoin,
} from "@/lib/chain-identity/pendingJoin";
import { chainRelay, type RelayOperation } from "@/lib/chain-identity/relay";
import { chainErrorMessage } from "./chainErrorMessage";
import { shortHex } from "./chainIdentityUi";
import { useChainClock } from "./useChainClock";

const DATE_TIME: Intl.DateTimeFormatOptions = {
  dateStyle: "medium",
  timeStyle: "short",
};

const RELAY_POLL_MS = 15_000;
const TX_POLL_MS = 5_000;

const httpStatus = (error: unknown): number | null => {
  const status = (error as { status?: unknown } | null)?.status;
  return typeof status === "number" ? status : null;
};

type RowActions = "withdraw" | "retry" | "signIn" | "dismiss";

interface RowInput {
  readonly wallet: string;
  readonly expired: boolean;
  readonly expiresAtMs: number;
  /** The relay read's HTTP status when it failed (-1: none given). */
  readonly relayError: number | null;
  readonly status: RelayOperation["status"] | undefined;
  readonly allSigned: boolean;
  readonly lastError: string | null;
  /** The chain's answer once sent; null when it doesn't know the join. */
  readonly tx: ChainTxStatus | null | undefined;
}

/** Why a sent join the chain ran didn't go through. */
const refusedReason = (locale: SupportedLocale, tx: ChainTxStatus) =>
  tx.result?.name
    ? (chainErrorMessage(
        locale,
        new ChainOperationError("failed", "", tx.result.name)
      ) ?? "")
    : t(locale, "chainIdentity.wallets.reasonUnknown");

/** What a started join's row says and offers, from the relay and the chain. */
function rowState(
  locale: SupportedLocale,
  input: RowInput
): { readonly text: string; readonly actions: RowActions } {
  const { status, relayError, tx } = input;
  const sent = status === "SUBMITTED";
  // Expired unsent, unknown to the relay, withdrawn, or sent and then
  // unknown to the network after it expired.
  const ended =
    (input.expired && !sent) ||
    relayError === 404 ||
    status === "CANCELLED" ||
    (sent && input.expired && tx === null);
  if (ended) {
    return {
      text: t(locale, "chainIdentity.wallets.startedGone"),
      actions: "dismiss",
    };
  }
  if (relayError === 401 || relayError === 403) {
    return {
      text: t(locale, "chainIdentity.wallets.startedSignIn"),
      actions: "signIn",
    };
  }
  if (relayError !== null) {
    return {
      text: t(locale, "chainIdentity.wallets.startedUnknown"),
      actions: "dismiss",
    };
  }
  if (sent && tx?.status === "failed") {
    return {
      text: t(locale, "chainIdentity.wallets.startedRefused", {
        reason: refusedReason(locale, tx),
      }),
      actions: "dismiss",
    };
  }
  if (sent) {
    return {
      text: t(locale, "chainIdentity.wallets.startedSent", {
        wallet: input.wallet,
      }),
      actions: "dismiss",
    };
  }
  if (status === "FAILED") {
    return {
      text: t(locale, "chainIdentity.wallets.startedFailed", {
        reason:
          chainErrorMessage(locale, new Error(input.lastError ?? "")) ?? "",
      }),
      actions: "dismiss",
    };
  }
  if (input.allSigned && input.lastError) {
    return {
      text: t(locale, "chainIdentity.wallets.startedUnreachable"),
      actions: "retry",
    };
  }
  return {
    text: t(locale, "chainIdentity.wallets.started", {
      wallet: input.wallet,
      date: formatDate(locale, input.expiresAtMs, DATE_TIME),
    }),
    actions: "withdraw",
  };
}

/**
 * One join this browser started, as 6529.io's relay holds it: waiting for
 * the new wallet, sent, refused, or ended. Once both wallets have signed it
 * follows the transaction on the 6529 Network until it is final, then
 * refreshes the identity once. It can always be taken off this list.
 */
export default function ChainStartedJoin({
  join,
  identity,
  onChanged,
}: {
  readonly join: StartedJoin;
  readonly identity: ChainIdentity;
  readonly onChanged: () => void;
}) {
  const locale = useBrowserLocale();
  const { requestAuth } = useAuth();
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const refreshed = useRef(false);
  const joined = identity.wallets.some(
    (item) => item.toLowerCase() === join.joiningWallet.toLowerCase()
  );
  const nowMs = useChainClock();
  const expired = join.expiresAtMs <= nowMs;

  const relay = useQuery({
    queryKey: [QueryKey.CHAIN_IDENTITY, "relay", join.txId],
    queryFn: ({ signal }) => chainRelay.get(join.txId, signal),
    enabled: !joined && !expired,
    refetchInterval: (query) =>
      query.state.data?.status === "PENDING" ? RELAY_POLL_MS : false,
    // A 4xx answer (signed out, unknown, ended) won't change by asking again.
    retry: (failures, error) => {
      const status = httpStatus(error);
      return failures < 1 && (status === null || status === 0 || status >= 500);
    },
  });
  const status = relay.data?.status;
  const tx = useQuery({
    queryKey: [QueryKey.CHAIN_IDENTITY, "tx", join.txId],
    queryFn: ({ signal }) => chainGateway.getTx(join.txId, signal),
    enabled: status === "SUBMITTED" && !joined,
    refetchInterval: (query) => {
      const data = query.state.data;
      // Final, refused, or gone from the network after the join expired.
      const settled =
        data?.status === "final" ||
        data?.status === "failed" ||
        (data === null && join.expiresAtMs <= Date.now());
      return settled ? false : TX_POLL_MS;
    },
  });
  const txStatus = tx.data?.status;

  useEffect(() => {
    if (txStatus === "final" && !refreshed.current) {
      refreshed.current = true;
      onChanged();
    }
  }, [txStatus, onChanged]);

  useEffect(() => {
    if (joined) {
      startedJoins.remove(join.txId);
    }
  }, [joined, join.txId]);

  if (joined) {
    return null;
  }

  const wallet = shortHex(join.joiningWallet);
  const dismiss = () => startedJoins.remove(join.txId);
  const run = async (step: () => Promise<unknown>) => {
    setBusy(true);
    setActionError(null);
    try {
      await step();
    } catch (error) {
      setActionError(chainErrorMessage(locale, error));
    } finally {
      setBusy(false);
    }
  };
  const { text, actions } = rowState(locale, {
    wallet,
    expired,
    expiresAtMs: join.expiresAtMs,
    relayError: relay.isError ? (httpStatus(relay.error) ?? -1) : null,
    status,
    allSigned: relay.data?.signers.every((entry) => entry.signed) ?? false,
    lastError: relay.data?.last_error ?? null,
    tx: tx.data,
  });

  return (
    <li className="tw-rounded-lg tw-border tw-border-solid tw-border-primary-400/30 tw-bg-primary-400/5 tw-p-3">
      <p aria-live="polite" className="tw-m-0 tw-text-sm tw-text-iron-200">
        {text}
      </p>
      <div className="tw-mt-3 tw-flex tw-flex-wrap tw-gap-2">
        {actions === "retry" && (
          <Button
            variant="primary"
            size="sm"
            disabled={busy}
            onClick={() =>
              void run(async () => {
                await chainRelay.retry(join.txId);
                await relay.refetch();
              })
            }
          >
            {t(locale, "chainIdentity.wallets.sendAgain")}
          </Button>
        )}
        {actions === "signIn" && (
          <Button
            variant="primary"
            size="sm"
            disabled={busy}
            onClick={() =>
              void run(async () => {
                await requestAuth();
                await relay.refetch();
              })
            }
          >
            {t(locale, "chainIdentity.requests.signInAction")}
          </Button>
        )}
        {(actions === "withdraw" || actions === "retry") && (
          <Button
            variant="secondary"
            size="sm"
            disabled={busy}
            onClick={() =>
              void run(async () => {
                await chainRelay.cancel(join.txId);
                dismiss();
              })
            }
          >
            {t(locale, "chainIdentity.wallets.withdraw")}
          </Button>
        )}
        {(actions === "dismiss" ||
          actions === "signIn" ||
          actionError !== null) && (
          <Button variant="secondary" size="sm" onClick={dismiss}>
            {t(locale, "chainIdentity.wallets.dismiss")}
          </Button>
        )}
      </div>
      {(actions === "withdraw" || actions === "retry") && (
        <p className="tw-mb-0 tw-mt-2 tw-text-xs tw-text-iron-400">
          {t(locale, "chainIdentity.wallets.withdrawNote", {
            wallet,
            date: formatDate(locale, join.expiresAtMs, DATE_TIME),
          })}
        </p>
      )}
      {actionError && (
        <p role="alert" className="tw-mb-0 tw-mt-2 tw-text-sm tw-text-error">
          {actionError}
        </p>
      )}
    </li>
  );
}
