"use client";
import { v4 as uuidv4 } from "uuid";
import { ApiDropForgeJobStatusEnum as JobStatus } from "@/generated/models/ApiDropForgeJob";
import { useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/components/auth/Auth";
import CircleLoader from "@/components/distribution-plan-tool/common/CircleLoader";
import {
  forgeProcessKey,
  useDropForgeProcess,
} from "@/hooks/useDropForgeProcess";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";
import { forgeProcessInputsMatch } from "@/services/api/drop-forge-process-inputs";
import { startForgeProcess } from "@/services/api/drop-forge-api";
import { getToastErrorDetails } from "@/helpers/toast.helpers";
export default function ProcessAndFinalize({
  contract,
  claim,
  plan,
  phaseIds,
  onCompleted,
}: Readonly<{
  contract: string;
  claim: number;
  plan: string;
  phaseIds: string[];
  onCompleted?: () => void;
}>) {
  const locale = useBrowserLocale();
  const { requestAuth } = useAuth();
  const queryClient = useQueryClient();
  const operation = useDropForgeProcess(contract, claim, plan);
  const request = useRef<{ key: string; id: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const job = operation.data;
  const awaitingAuth = job?.status === JobStatus.AwaitingAuth;
  const pending = submitting || job?.status === JobStatus.Pending;
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
    if (pending || completed || requiresReset || phaseIds.length !== 3) return;
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
      queryClient.setQueryData(forgeProcessKey(contract, claim, plan), saved);
    } catch (e) {
      setError(getToastErrorDetails(e) ?? t(locale, "dropForge.processError"));
      await operation.refetch();
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
  const failure = error ?? job?.error ?? getToastErrorDetails(operation.error);
  return (
    <div className="tw-flex tw-flex-col tw-items-end tw-gap-2">
      <button
        type="button"
        onClick={() => {
          void run();
        }}
        disabled={
          pending ||
          completed ||
          requiresReset ||
          phaseIds.length !== 3 ||
          operation.isLoading
        }
        aria-busy={pending}
        className="tw-flex tw-min-h-11 tw-items-center tw-gap-2 tw-rounded-lg tw-border-0 tw-bg-primary-500 tw-px-4 tw-py-2 tw-font-medium tw-text-white disabled:tw-opacity-50"
      >
        {pending && <CircleLoader />}
        {t(locale, label)}
      </button>
      <div
        role="status"
        aria-live="polite"
        className="tw-text-sm tw-text-iron-300"
      >
        {pending && `${Math.min((job?.step ?? 0) + 1, 5)} / 5`}
        {phaseIds.length !== 3 && t(locale, "dropForge.inputsMissing")}
        {requiresReset && t(locale, "dropForge.inputsChanged")}
        {awaitingAuth && t(locale, "dropForge.authRequired")}
      </div>
      {failure && (
        <p role="alert" className="tw-max-w-lg tw-text-sm tw-text-error">
          {failure}
        </p>
      )}
    </div>
  );
}
