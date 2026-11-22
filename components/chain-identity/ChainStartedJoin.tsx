"use client";

import { useQuery } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/components/auth/authContext";
import { QueryKey } from "@/components/react-query-wrapper/query-keys";
import Button from "@/components/utils/button/Button";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { formatDate } from "@/i18n/format";
import { t } from "@/i18n/messages";
import "@/i18n/namespaces/chain-identity";
import { chainGateway, type ChainIdentity } from "@/lib/chain-identity/gateway";
import { ChainOperationError } from "@/lib/chain-identity/operation";
import {
  startedJoins,
  type StartedJoin,
} from "@/lib/chain-identity/pendingJoin";
import { chainRelay } from "@/lib/chain-identity/relay";
import { chainErrorMessage } from "./chainErrorMessage";
import { shortHex } from "./chainIdentityUi";

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
  const expired = join.expiresAtMs <= Date.now();

  const relay = useQuery({
    queryKey: [QueryKey.CHAIN_IDENTITY, "relay", join.txId],
    queryFn: ({ signal }) => chainRelay.get(join.txId, signal),
    enabled: !joined && !expired,
    refetchInterval: (query) =>
      query.state.data?.status === "PENDING" ? RELAY_POLL_MS : false,
    // A 4xx answer (signed out, unknown, ended) won't change by asking again.
    retry: (failures, error) => {
      const status = httpStatus(error);
      return failures < 1 && (status === null || status >= 500);
    },
  });
  const status = relay.data?.status;
  // The network held the join once; a later "unknown" means it dropped it.
  const seenInNetwork = useRef(false);
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
        (data === null &&
          (seenInNetwork.current || join.expiresAtMs <= Date.now()));
      return settled ? false : TX_POLL_MS;
    },
  });
  const txStatus = tx.data?.status;
  if (txStatus === "pending" || txStatus === "in_block") {
    seenInNetwork.current = true;
  }
  const dropped = tx.data === null && seenInNetwork.current;

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
  const allSigned = relay.data?.signers.every((entry) => entry.signed) ?? false;
  const readError = relay.isError ? httpStatus(relay.error) : null;

  // Expired unsent, unknown to the relay, withdrawn, or sent and then
  // unknown to the network after it expired.
  const ended =
    (expired && status !== "SUBMITTED") ||
    (relay.isError && readError === 404) ||
    status === "CANCELLED" ||
    (status === "SUBMITTED" && expired && tx.data === null);

  let text: string;
  let actions: RowActions;
  if (ended) {
    text = t(locale, "chainIdentity.wallets.startedGone");
    actions = "dismiss";
  } else if (relay.isError && (readError === 401 || readError === 403)) {
    text = t(locale, "chainIdentity.wallets.startedSignIn");
    actions = "signIn";
  } else if (relay.isError) {
    text = t(locale, "chainIdentity.wallets.startedUnknown");
    actions = "dismiss";
  } else if (status === "SUBMITTED" && dropped) {
    text = t(locale, "chainIdentity.wallets.startedDropped");
    actions = "dismiss";
  } else if (status === "SUBMITTED" && txStatus === "failed") {
    text = t(locale, "chainIdentity.wallets.startedRefused", {
      reason: tx.data?.result?.name
        ? (chainErrorMessage(
            locale,
            new ChainOperationError("failed", "", tx.data.result.name)
          ) ?? "")
        : t(locale, "chainIdentity.wallets.reasonUnknown"),
    });
    actions = "dismiss";
  } else if (status === "SUBMITTED") {
    text = t(locale, "chainIdentity.wallets.startedSent", { wallet });
    actions = "dismiss";
  } else if (status === "FAILED") {
    text = t(locale, "chainIdentity.wallets.startedFailed", {
      reason:
        chainErrorMessage(locale, new Error(relay.data?.last_error ?? "")) ??
        "",
    });
    actions = "dismiss";
  } else if (allSigned && relay.data?.last_error) {
    text = t(locale, "chainIdentity.wallets.startedUnreachable");
    actions = "retry";
  } else {
    text = t(locale, "chainIdentity.wallets.started", {
      wallet,
      date: formatDate(locale, join.expiresAtMs, DATE_TIME),
    });
    actions = "withdraw";
  }

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
