"use client";
import { v4 as uuidv4 } from "uuid";
import { ApiDropForgeJobStatusEnum as JobStatus } from "@/generated/models/ApiDropForgeJob";
import { useEffect, useId, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/components/auth/Auth";
import CircleLoader, {
  CircleLoaderSize,
} from "@/components/distribution-plan-tool/common/CircleLoader";
import Button from "@/components/utils/button/Button";
import {
  forgeProcessKey,
  useDropForgeProcess,
} from "@/hooks/useDropForgeProcess";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { formatInteger, formatList } from "@/i18n/format";
import type { SupportedLocale } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import {
  forgeProcessInputsMatch,
  isForgeProcessTargetValid,
  type ForgePhaseInputs,
} from "@/services/api/drop-forge-process-inputs";
import { startForgeProcess } from "@/services/api/drop-forge-api";
import { getToastErrorDetails } from "@/helpers/toast.helpers";
import { CheckCircleIcon } from "@heroicons/react/24/outline";

type PhaseIssues = Pick<ForgePhaseInputs, "missing" | "duplicates">;

const processStepCount = 5;

function PreparationStatus({
  id,
  reason,
  showProgress,
  completed,
  step,
}: Readonly<{
  id: string;
  reason: string;
  showProgress: boolean;
  completed: boolean;
  step: number;
}>) {
  const locale = useBrowserLocale();

  if (!showProgress) {
    return (
      <output
        id={id}
        aria-atomic="true"
        className={
          reason
            ? "tw-max-w-sm tw-text-sm tw-text-iron-300 @[36rem]:tw-text-right"
            : "tw-sr-only"
        }
      >
        {reason}
      </output>
    );
  }

  return (
    <output
      id={id}
      aria-atomic="true"
      className={`tw-flex tw-min-h-10 tw-items-center tw-gap-2 tw-text-sm ${completed ? "tw-text-emerald-400" : "tw-text-iron-200"}`}
    >
      {completed ? (
        <CheckCircleIcon className="tw-size-5 tw-shrink-0" aria-hidden="true" />
      ) : (
        <CircleLoader size={CircleLoaderSize.SMALL} />
      )}
      <span>
        <span className="tw-font-medium">
          {t(
            locale,
            completed ? "dropForge.completed" : "dropForge.processing"
          )}
        </span>{" "}
        <span aria-hidden="true">·</span>{" "}
        <span className="tw-text-iron-300">
          {completed
            ? t(locale, "dropForge.listsReady")
            : t(locale, "dropForge.processingStep", {
                step: formatInteger(locale, step),
                total: formatInteger(locale, processStepCount),
              })}
        </span>
      </span>
    </output>
  );
}

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
  const showProgress = pending || completed;
  const step = Math.min((job?.step ?? 0) + 1, processStepCount);
  let statusMessage = "";
  if (!hasRequiredInputs) {
    statusMessage = getProcessInputMessage(locale, claim, plan, phaseIssues);
  } else if (requiresReset) {
    statusMessage = t(locale, "dropForge.inputsChanged");
  } else if (awaitingAuth) {
    statusMessage = t(locale, "dropForge.authRequired");
  }
  const failure = error ?? job?.error ?? getToastErrorDetails(operation.error);
  return (
    <div className="tw-flex tw-min-w-0 tw-flex-col tw-gap-2 @[36rem]:tw-items-end">
      {!showProgress && (
        <Button
          variant="action"
          onClick={() => {
            void run();
          }}
          disabled={
            disabled ||
            requiresReset ||
            !hasRequiredInputs ||
            operation.isLoading
          }
          aria-describedby={statusMessage ? statusId : undefined}
        >
          {t(
            locale,
            awaitingAuth ? "dropForge.resumeAuth" : "dropForge.process"
          )}
        </Button>
      )}
      <PreparationStatus
        id={statusId}
        reason={statusMessage}
        showProgress={showProgress}
        completed={completed}
        step={step}
      />
      {failure && (
        <p
          role="alert"
          className="tw-max-w-sm tw-text-sm tw-text-error @[36rem]:tw-text-right"
        >
          {failure}
        </p>
      )}
    </div>
  );
}
