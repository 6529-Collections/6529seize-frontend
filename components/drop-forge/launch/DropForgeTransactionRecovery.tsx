"use client";
import { v4 as uuidv4 } from "uuid";
import { ApiDropForgeActionKindEnum as Kind } from "@/generated/models/ApiDropForgeAction";
import { ApiDropForgeRecoveryOutcomeEnum as Outcome } from "@/generated/models/ApiDropForgeRecovery";
import { useEffect, useRef, useState } from "react";
import type { ApiDropForgeLaunch } from "@/generated/models/ApiDropForgeLaunch";
import type { ApiDropForgeAction } from "@/generated/models/ApiDropForgeAction";
import {
  ApiDropForgeRecoveryRequestOperationEnum as Operation,
  type ApiDropForgeRecoveryRequest,
} from "@/generated/models/ApiDropForgeRecoveryRequest";
import { requestForgeRecovery } from "@/services/api/drop-forge-api";
import { useAuth } from "@/components/auth/Auth";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";
import { getToastErrorDetails } from "@/helpers/toast.helpers";
const explorers: Partial<Record<number, string>> = {
  1: "https://etherscan.io",
  11155111: "https://sepolia.etherscan.io",
};
export default function DropForgeTransactionRecovery({
  launch,
  action,
  onChange,
}: Readonly<{
  launch: ApiDropForgeLaunch;
  action: ApiDropForgeAction;
  onChange: () => Promise<unknown>;
}>) {
  const { requestAuth } = useAuth();
  const locale = useBrowserLocale();
  const [operation, setOperation] = useState<Operation | null>(null);
  const [busy, setBusy] = useState(false);
  const [winnerHash, setWinnerHash] = useState("");
  const [error, setError] = useState<string | null>(null);
  const pendingRequest = useRef<ApiDropForgeRecoveryRequest | null>(null);
  const [now, setNow] = useState(() => Math.floor(Date.now() / 1000));
  useEffect(() => {
    const timer = window.setInterval(
      () => setNow(Math.floor(Date.now() / 1000)),
      1000
    );
    return () => window.clearInterval(timer);
  }, []);
  const recovery = action.recovery;
  if (!recovery || !action.hash) return null;
  const explorer = explorers[launch.chain_id];
  const canRetry = ["CANCELLED", "REVERTED"].includes(recovery.outcome ?? "");
  const unresolved =
    recovery.outcome === undefined &&
    ["SIGNED", "FAILED"].includes(action.state);
  function choose(value: Operation) {
    setOperation(value);
    setError(null);
    if (pendingRequest.current?.operation !== value)
      pendingRequest.current = null;
  }
  async function submit() {
    if (operation === null || !action.hash) return;
    setBusy(true);
    setError(null);
    try {
      if (!(await requestAuth()).success) return;
      pendingRequest.current ??= {
        revision: launch.revision,
        request_id: uuidv4(),
        action_id: action.id,
        expected_hash: action.hash,
        operation,
        ...(operation === Operation.RecordWinner
          ? { transaction_hash: winnerHash }
          : {}),
      };
      await requestForgeRecovery(
        launch.contract,
        launch.claim_id,
        pendingRequest.current
      );
      pendingRequest.current = null;
      setOperation(null);
      await onChange();
    } catch (e) {
      setError(
        getToastErrorDetails(e) ??
          t(locale, "dropForge.transactionRecoveryError")
      );
      await onChange();
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="tw-my-2 tw-w-full tw-rounded-lg tw-border tw-border-iron-700 tw-p-3">
      <h3 className="tw-text-sm tw-font-medium">
        {t(locale, "dropForge.transactionRecovery")}
      </h3>
      <p className="tw-break-all tw-text-sm">
        {t(locale, "dropForge.signer")}: {launch.signer} ·{" "}
        {t(locale, "dropForge.nonce")}: {recovery.nonce}
      </p>
      <p className="tw-text-sm">
        {t(locale, "dropForge.executionDeadline")}:{" "}
        {new Date(action.deadline * 1000).toISOString()}
      </p>
      <ul className="tw-list-none tw-p-0">
        {recovery.attempts.map((attempt) => (
          <li key={attempt.id} className="tw-break-all tw-text-sm">
            {attempt.operation} —{" "}
            <AttemptHash
              hash={attempt.hash}
              explorer={explorer}
              queued={t(locale, "dropForge.recoveryQueued")}
            />
          </li>
        ))}
      </ul>
      {recovery.outcome !== undefined ? (
        <output className="tw-block tw-text-sm">
          {t(
            locale,
            recovery.outcome === Outcome.Executed
              ? "dropForge.recoveryExecuted"
              : "dropForge.recoveryOutstanding"
          )}
          {recovery.supply !== undefined &&
            ` ${t(locale, "dropForge.totalMinted")}: ${recovery.supply}.`}
        </output>
      ) : (
        recovery.attempts.length > 1 && (
          <output className="tw-block tw-text-sm">
            {t(locale, "dropForge.recoveryWaiting")}
          </output>
        )
      )}
      {recovery.allocations.length > 0 && (
        <details>
          <summary>{t(locale, "dropForge.recoveryAllocations")}</summary>
          <ul>
            {recovery.allocations.map((row) => (
              <li key={row.address} className="tw-break-all tw-text-sm">
                {row.address}: {row.amount}
              </li>
            ))}
          </ul>
        </details>
      )}
      {unresolved && (
        <label className="tw-block tw-text-sm">
          {t(locale, "dropForge.winnerHash")}
          <input
            value={winnerHash}
            onChange={(event) => {
              setWinnerHash(event.target.value);
              pendingRequest.current = null;
            }}
            className="tw-my-2 tw-block tw-w-full tw-rounded tw-bg-iron-800 tw-p-2"
          />
          <button
            type="button"
            disabled={busy || !/^0x[\da-fA-F]{64}$/.test(winnerHash)}
            onClick={() => choose(Operation.RecordWinner)}
          >
            {t(locale, "dropForge.recordWinner")}
          </button>
        </label>
      )}
      <div className="tw-flex tw-flex-wrap tw-gap-3">
        {unresolved &&
          !recovery.cancel_requested &&
          now < action.deadline - 120 && (
            <button
              type="button"
              disabled={busy}
              onClick={() => choose(Operation.SpeedUp)}
            >
              {t(locale, "dropForge.speedUp")}
            </button>
          )}
        {unresolved && (
          <button
            type="button"
            disabled={busy}
            onClick={() => choose(Operation.Cancel)}
          >
            {t(locale, "dropForge.cancelTransaction")}
          </button>
        )}
        {canRetry && now < action.deadline - 120 && (
          <button
            type="button"
            disabled={busy}
            onClick={() => choose(Operation.Retry)}
          >
            {t(locale, "dropForge.retryOutstanding")}
          </button>
        )}
        {canRetry &&
          action.kind === Kind.Airdrop &&
          now >= (launch.phases.at(-1)?.end ?? Number.MAX_SAFE_INTEGER) && (
            <button
              type="button"
              disabled={busy}
              onClick={() => choose(Operation.DeliverRemaining)}
            >
              {t(locale, "dropForge.deliverRemaining")}
            </button>
          )}
      </div>
      {operation !== null && (
        <div className="tw-mt-3 tw-space-y-2">
          <p className="tw-text-sm">{t(locale, explanation(operation))}</p>
          <button
            type="button"
            disabled={busy}
            onClick={() => {
              void submit();
            }}
          >
            {t(
              locale,
              busy
                ? "dropForge.recoverySubmitting"
                : "dropForge.confirmRecovery"
            )}
          </button>
          <button
            type="button"
            disabled={busy}
            className="tw-ml-3"
            onClick={() => {
              setOperation(null);
              pendingRequest.current = null;
            }}
          >
            {t(locale, "dropForge.dismissRecovery")}
          </button>
        </div>
      )}
      {error && (
        <p role="alert" className="tw-text-error">
          {error}
        </p>
      )}
    </div>
  );
}

function explanation(operation: Operation) {
  if (operation === Operation.RecordWinner)
    return "dropForge.recordWinnerExplanation" as const;
  if (operation === Operation.Cancel)
    return "dropForge.cancelTransactionExplanation" as const;
  if (operation === Operation.SpeedUp)
    return "dropForge.speedUpExplanation" as const;
  return "dropForge.retryOutstandingExplanation" as const;
}
function AttemptHash({
  hash,
  explorer,
  queued,
}: Readonly<{
  hash: string | null | undefined;
  explorer: string | undefined;
  queued: string;
}>) {
  if (!hash) return <>{queued}</>;
  if (!explorer) return <>{hash}</>;
  return (
    <a
      href={`${explorer}/tx/${hash}`}
      target="_blank"
      rel="noopener noreferrer"
      className="tw-text-primary-300"
    >
      {hash}
    </a>
  );
}
