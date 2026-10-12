"use client";
import {
  ApiDropForgeActionKindEnum as ActionKind,
  ApiDropForgeActionStateEnum as ActionState,
} from "@/generated/models/ApiDropForgeAction";
import { useEffect, useEffectEvent, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/components/auth/Auth";
import { useDropForgeMintingConfig } from "@/components/drop-forge/drop-forge-config";
import { forgeLaunchKey } from "@/hooks/drop-forge-query-keys";
import {
  getForgeLaunch,
  finishForgeManual,
} from "@/services/api/drop-forge-api";
import { commonApiPost } from "@/services/api/common-api";
import {
  ApiDropForgeControlRequestOperationEnum,
  type ApiDropForgeControlRequest,
} from "@/generated/models/ApiDropForgeControlRequest";
import type { ApiDropForgeLaunch } from "@/generated/models/ApiDropForgeLaunch";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";
import { getToastErrorDetails } from "@/helpers/toast.helpers";
const explorers: Partial<Record<number, string>> = {
  1: "https://etherscan.io",
  11155111: "https://sepolia.etherscan.io",
};
function actionLabel(state: ActionState) {
  if (state === ActionState.Confirmed) return "dropForge.actionDone" as const;
  if (state === ActionState.Failed) return "dropForge.actionFailed" as const;
  return state === ActionState.Signed
    ? ("dropForge.actionSubmitted" as const)
    : ("dropForge.actionPending" as const);
}
export default function DropForgeAutomationStatus({
  claimId,
  onConfirmedWork,
}: Readonly<{ claimId: number; onConfirmedWork: () => void }>) {
  const { contract } = useDropForgeMintingConfig();
  const { requestAuth } = useAuth();
  const locale = useBrowserLocale();
  const query = useQuery({
    queryKey: forgeLaunchKey(contract, claimId),
    queryFn: () => getForgeLaunch(contract, claimId),
    refetchInterval: 5000,
  });
  const [hash, setHash] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const launch = query.data;
  const confirmed =
    launch?.actions
      .filter((action) => action.state === ActionState.Confirmed)
      .map((action) => `${action.id}:${action.hash ?? "observed"}`)
      .join(",") ?? "";
  const confirmedWork = useEffectEvent(onConfirmedWork);
  useEffect(() => {
    if (confirmed) confirmedWork();
  }, [confirmed]);
  if (!launch) return null;
  const explorer = explorers[launch.chain_id];
  async function control(resume: boolean) {
    if (!launch) return;
    setBusy(true);
    setError(null);
    try {
      if (!(await requestAuth()).success) return;
      await commonApiPost<ApiDropForgeControlRequest, ApiDropForgeLaunch>({
        endpoint: `drop-forge/launches/${contract}/${claimId}/control`,
        body: {
          revision: launch.revision,
          operation: resume
            ? ApiDropForgeControlRequestOperationEnum.Resume
            : ApiDropForgeControlRequestOperationEnum.Pause,
        },
      });
      await query.refetch();
    } catch (e) {
      setError(getToastErrorDetails(e) ?? t(locale, "dropForge.controlError"));
    } finally {
      setBusy(false);
    }
  }
  async function recover(cancel: boolean) {
    setBusy(true);
    setError(null);
    try {
      if (!(await requestAuth()).success) return;
      await finishForgeManual(
        contract,
        claimId,
        null,
        cancel ? undefined : hash
      );
      await query.refetch();
    } catch (e) {
      setError(getToastErrorDetails(e) ?? t(locale, "dropForge.recoveryError"));
    } finally {
      setBusy(false);
    }
  }
  return (
    <section
      aria-label={t(locale, "dropForge.automation")}
      className="tw-mx-auto tw-my-4 tw-max-w-6xl tw-rounded-xl tw-bg-iron-900 tw-p-4 tw-ring-1 tw-ring-iron-800"
    >
      <h2 className="tw-text-lg tw-font-medium tw-text-iron-100">
        {t(locale, "dropForge.automation")}
      </h2>
      {(launch.error ?? error) && (
        <p role="alert" className="tw-text-sm tw-text-error">
          {error ?? launch.error}
        </p>
      )}
      <ol className="tw-list-none tw-space-y-2 tw-p-0">
        {launch.actions.map((action) => (
          <li
            key={action.id}
            className="tw-flex tw-flex-wrap tw-items-center tw-gap-2 tw-text-sm tw-text-iron-200"
          >
            <span>
              {action.label ??
                (action.kind === ActionKind.Initialize
                  ? t(locale, "dropForge.initialized")
                  : launch.phases[action.phase]?.name)}
            </span>
            <span>{t(locale, actionLabel(action.state))}</span>
            {action.hash && explorer && (
              <a
                target="_blank"
                rel="noopener noreferrer"
                className="tw-text-primary-300"
                href={`${explorer}/tx/${action.hash}`}
              >
                {t(locale, "dropForge.transaction")}
              </a>
            )}
          </li>
        ))}
      </ol>
      {launch.manual_pending && (
        <div className="tw-flex tw-flex-wrap tw-items-center tw-gap-2">
          <label>
            {t(locale, "dropForge.manualHash")}
            <input
              value={hash}
              onChange={(event) => setHash(event.target.value)}
              className="tw-ml-2 tw-rounded-lg tw-bg-iron-800 tw-p-2"
            />
          </label>
          <button
            type="button"
            disabled={busy || !/^0x[\da-fA-F]{64}$/.test(hash)}
            onClick={() => {
              void recover(false);
            }}
          >
            {t(locale, "dropForge.recordTransaction")}
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => {
              void recover(true);
            }}
          >
            {t(locale, "dropForge.cancelManual")}
          </button>
        </div>
      )}
      {!launch.manual_pending &&
        ["ARMED", "RUNNING", "PAUSED", "BLOCKED"].includes(launch.state) && (
          <button
            type="button"
            disabled={busy}
            onClick={() => {
              void control(["PAUSED", "BLOCKED"].includes(launch.state));
            }}
          >
            {t(
              locale,
              ["PAUSED", "BLOCKED"].includes(launch.state)
                ? "dropForge.resume"
                : "dropForge.pause"
            )}
          </button>
        )}
    </section>
  );
}
