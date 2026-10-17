"use client";
import {
  ApiDropForgeActionKindEnum as ActionKind,
  ApiDropForgeActionStateEnum as ActionState,
} from "@/generated/models/ApiDropForgeAction";
import { ApiDropForgeLaunchStateEnum as LaunchState } from "@/generated/models/ApiDropForgeLaunch";
import { forgeLaunchKey } from "@/hooks/drop-forge-query-keys";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/components/auth/Auth";
import { useDropForgeMintingConfig } from "@/components/drop-forge/drop-forge-config";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";
import CircleLoader from "@/components/distribution-plan-tool/common/CircleLoader";
import {
  getForgeLaunch,
  requestForgeLaunch,
} from "@/services/api/drop-forge-api";
import { getToastErrorDetails } from "@/helpers/toast.helpers";
function launchLabel(
  initialized: boolean,
  updating: boolean,
  initializing: boolean,
  manual: boolean
) {
  if (manual) return "dropForge.manualPending" as const;
  if (updating) return "dropForge.updating" as const;
  if (initializing) return "dropForge.initializing" as const;
  return initialized
    ? ("dropForge.update" as const)
    : ("dropForge.launch" as const);
}
function launchStatus(
  unpublished: boolean,
  synced: boolean,
  initialized: boolean
) {
  if (unpublished) return "dropForge.publishFirst" as const;
  if (synced) return "dropForge.syncCurrent" as const;
  return initialized ? ("dropForge.launched" as const) : null;
}
export default function CraftLaunchActions({
  claimId,
  metadata,
  dirty,
}: Readonly<{
  claimId: number;
  metadata: string | undefined | null;
  dirty: boolean;
}>) {
  const { contract } = useDropForgeMintingConfig();
  const { requestAuth } = useAuth();
  const locale = useBrowserLocale();
  const client = useQueryClient();
  const query = useQuery({
    queryKey: forgeLaunchKey(contract, claimId),
    queryFn: () => getForgeLaunch(contract, claimId),
    refetchInterval: 5000,
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const launch = query.data;
  const initialized =
    launch?.actions.find((it) => it.kind === ActionKind.Initialize)?.state ===
    ActionState.Confirmed;
  const staleMetadata =
    launch?.state === LaunchState.Blocked &&
    [
      "A newer Craft publication exists; request its metadata update",
      "Craft publication changed before metadata signing",
    ].includes(launch.error ?? "");
  const updating = launch?.actions.some(
    (it) =>
      it.kind === ActionKind.Metadata &&
      !(staleMetadata && it.state === ActionState.Pending) &&
      ["PENDING", "RESERVED", "SIGNED"].includes(it.state)
  );
  const initializing =
    !!launch && !initialized && ["ARMED", "RUNNING"].includes(launch.state);
  const blocked =
    (launch?.state === LaunchState.Blocked && !staleMetadata) ||
    launch?.state === LaunchState.Cancelled;
  const pending =
    submitting || initializing || !!updating || launch?.manual_pending === true;
  const synced = initialized && metadata === launch.metadata_location;
  async function run() {
    if (pending || dirty || !metadata || blocked || synced) return;
    setSubmitting(true);
    setError(null);
    try {
      if (!(await requestAuth()).success) return;
      const saved = await requestForgeLaunch(contract, claimId, !!initialized);
      client.setQueryData(forgeLaunchKey(contract, claimId), saved);
    } catch (e) {
      setError(getToastErrorDetails(e) ?? t(locale, "dropForge.launchError"));
      await query.refetch();
    } finally {
      setSubmitting(false);
    }
  }
  const status = launchStatus(dirty || !metadata, synced, initialized);
  const failure = error ?? launch?.error ?? getToastErrorDetails(query.error);
  return (
    <div className="tw-flex tw-flex-col tw-gap-3 tw-rounded-xl tw-bg-iron-900 tw-p-4 tw-ring-1 tw-ring-iron-800">
      <button
        type="button"
        onClick={() => {
          void run();
        }}
        disabled={
          !!pending ||
          dirty ||
          !metadata ||
          synced ||
          blocked ||
          query.isLoading ||
          !!query.error
        }
        aria-busy={!!pending}
        className="tw-flex tw-min-h-11 tw-items-center tw-justify-center tw-gap-2 tw-rounded-lg tw-border-0 tw-bg-primary-500 tw-px-4 tw-py-2 tw-font-medium tw-text-white disabled:tw-opacity-50"
      >
        {pending && <CircleLoader />}
        {t(
          locale,
          launchLabel(
            initialized,
            !!updating,
            initializing || (submitting && !initialized),
            launch?.manual_pending === true
          )
        )}
      </button>
      <div
        role="status"
        aria-live="polite"
        className="tw-text-sm tw-text-iron-300"
      >
        {status && t(locale, status)}
      </div>
      {failure && (
        <p role="alert" className="tw-text-sm tw-text-error">
          {failure}
        </p>
      )}
    </div>
  );
}
