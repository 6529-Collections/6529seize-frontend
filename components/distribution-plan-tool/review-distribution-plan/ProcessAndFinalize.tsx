"use client";
import { v4 as uuidv4 } from "uuid";
import { ApiDropForgeJobStatusEnum as JobStatus } from "@/generated/models/ApiDropForgeJob";
import { useEffect, useId, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/components/auth/Auth";
import Button from "@/components/utils/button/Button";
import {
  forgeProcessKey,
  useDropForgeProcess,
} from "@/hooks/useDropForgeProcess";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { formatList } from "@/i18n/format";
import type { SupportedLocale } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import {
  forgeProcessInputsMatch,
  isForgeProcessTargetValid,
  type ForgePhaseInputs,
} from "@/services/api/drop-forge-process-inputs";
import { startForgeProcess } from "@/services/api/drop-forge-api";
import { getToastErrorDetails } from "@/helpers/toast.helpers";
type PhaseIssues = Pick<ForgePhaseInputs, "missing" | "duplicates">;

function getProcessInputMessage(
  locale: SupportedLocale,
  claim: number,
  plan: string,
  phaseIssues?: PhaseIssues
): string {
  if (!plan.trim()) return t(locale, "dropForge.planMissing");
  if (!isForgeProcessTargetValid(claim, plan))
    return t(locale, "dropForge.tokenMissing");

  const { missing = [], duplicates = [] } = phaseIssues ?? {};
  const messages = [];
  if (missing.length) {
    messages.push(
      t(locale, "dropForge.phasesMissing", {
        phases: formatList(locale, missing),
      })
    );
  }
  if (duplicates.length) {
    messages.push(
      t(locale, "dropForge.phasesDuplicated", {
        phases: formatList(locale, duplicates),
      })
    );
  }
  return messages.join(" ") || t(locale, "dropForge.inputsMissing");
}

export default function ProcessAndFinalize({
  contract,
  claim,
  plan,
  phaseIds,
  phaseIssues,
  onCompleted,
  onStarted,
  disabled = false,
}: Readonly<{
  contract: string;
  claim: number;
  plan: string;
  phaseIds: string[];
  phaseIssues?: PhaseIssues;
  onCompleted?: () => void;
  onStarted?: () => Promise<void>;
  disabled?: boolean;
}>) {
  const locale = useBrowserLocale();
  const statusId = useId();
  const { requestAuth } = useAuth();
  const queryClient = useQueryClient();
  const operation = useDropForgeProcess(contract, claim, plan);
  const request = useRef<{ key: string; id: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const job = operation.data;
  const awaitingAuth = job?.status === JobStatus.AwaitingAuth;
  const pending = submitting || job?.status === JobStatus.Pending;
  const hasRequiredInputs =
    isForgeProcessTargetValid(claim, plan) && phaseIds.length === 3;
  const inputsMatch = !job || forgeProcessInputsMatch(job, phaseIds);
  const requiresReset = !inputsMatch && job.status !== JobStatus.Failed;
  const completed = job?.status === JobStatus.Completed && inputsMatch;
  const completion = useRef<string | null>(null);
  useEffect(() => {
    if (completed && completion.current !== job.id) {
      completion.current = job.id;
      onCompleted?.();
    }
  }, [completed, job, onCompleted]);
  async function run() {
    if (disabled || pending || completed || requiresReset || !hasRequiredInputs)
      return;
    setSubmitting(true);
    setError(null);
    try {
      if (
        !(
          await requestAuth(awaitingAuth ? { serverRejected: true } : undefined)
        ).success
      )
        return;
      const key = JSON.stringify([contract, claim, plan, phaseIds]);
      if (awaitingAuth && inputsMatch) request.current = { key, id: job.id };
      else if (request.current?.key !== key || job?.status === JobStatus.Failed)
        request.current = { key, id: uuidv4() };
      const saved = await startForgeProcess(
        contract,
        claim,
        plan,
        phaseIds,
        request.current.id
      );
      request.current = null;
      queryClient.setQueryData(forgeProcessKey(contract, claim, plan), saved);
      void onStarted?.();
    } catch (e) {
      setError(getToastErrorDetails(e) ?? t(locale, "dropForge.processError"));
      await operation.refetch();
      void onStarted?.();
    } finally {
      setSubmitting(false);
    }
  }
  let label:
    | "dropForge.process"
    | "dropForge.completed"
    | "dropForge.resumeAuth"
    | "dropForge.processing" = "dropForge.process";
  if (pending) label = "dropForge.processing";
  if (completed) label = "dropForge.completed";
  if (awaitingAuth && !pending) label = "dropForge.resumeAuth";
  const checkpoint = `${Math.min((job?.step ?? 0) + 1, 5)} / 5`;
  let statusMessage = "";
  if (pending) {
    statusMessage = checkpoint;
  } else if (!hasRequiredInputs) {
    statusMessage = getProcessInputMessage(locale, claim, plan, phaseIssues);
  } else if (requiresReset) {
    statusMessage = t(locale, "dropForge.inputsChanged");
  } else if (awaitingAuth) {
    statusMessage = t(locale, "dropForge.authRequired");
  }
  const failure = error ?? job?.error ?? getToastErrorDetails(operation.error);
  return (
    <div className="tw-flex tw-min-w-0 tw-flex-col tw-gap-2">
      <Button
        variant="action"
        size="lg"
        fullWidth
        loading={pending}
        type="button"
        onClick={() => {
          void run();
        }}
        disabled={
          disabled ||
          pending ||
          completed ||
          requiresReset ||
          !hasRequiredInputs ||
          operation.isLoading
        }
        aria-describedby={statusMessage ? statusId : undefined}
        className="!tw-whitespace-normal"
      >
        {t(locale, label)}
      </Button>
      {statusMessage && (
        <div
          id={statusId}
          role="status"
          aria-live="polite"
          className="tw-text-sm tw-text-iron-300"
        >
          {statusMessage}
        </div>
      )}
      {failure && (
        <p role="alert" className="tw-max-w-lg tw-text-sm tw-text-error">
          {failure}
        </p>
      )}
    </div>
  );
}
