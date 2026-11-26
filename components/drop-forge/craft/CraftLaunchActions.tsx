"use client";
import {
  ApiDropForgeActionKindEnum as ActionKind,
  ApiDropForgeActionStateEnum as ActionState,
} from "@/generated/models/ApiDropForgeAction";
import { ApiDropForgeLaunchStateEnum as LaunchState } from "@/generated/models/ApiDropForgeLaunch";
import { forgeLaunchKey } from "@/hooks/drop-forge-query-keys";
import { useId, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/components/auth/Auth";
import DropForgeLaunchIcon from "@/components/common/icons/DropForgeLaunchIcon";
import { BTN_PRIMARY } from "@/components/drop-forge/craft/craft-claim-helpers";
import { useDropForgeMintingConfig } from "@/components/drop-forge/drop-forge-config";
import {
  dropForgePanelClassName,
  dropForgePanelTitleClassName,
} from "@/components/drop-forge/drop-forge-section-styles";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";
import "@/i18n/namespaces/drop-forge";
import CircleLoader, {
  CircleLoaderSize,
} from "@/components/distribution-plan-tool/common/CircleLoader";
import { requestForgeLaunch } from "@/services/api/drop-forge-api";
import { DropForgeAutoLaunchPill } from "@/components/drop-forge/DropForgeAutoLaunchPill";
import { useDropForgeLaunch } from "@/hooks/useDropForgeLaunch";
import { useDropForgeSettings } from "@/hooks/useDropForgeSettings";
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
  const headingId = useId();
  const client = useQueryClient();
  const query = useDropForgeLaunch(claimId, { watch: true });
  const settings = useDropForgeSettings();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const launch = query.data;
  const initialization = launch?.actions.find(
    (action) => action.kind === ActionKind.Initialize
  );
  const initialized = initialization?.state === ActionState.Confirmed;
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
    initialization?.state === ActionState.Reserved ||
    initialization?.state === ActionState.Signed ||
    (initialization?.state === ActionState.Pending &&
      (launch?.state === LaunchState.Armed ||
        launch?.state === LaunchState.Running));
  const blocked =
    (launch?.state === LaunchState.Blocked && !staleMetadata) ||
    launch?.state === LaunchState.Cancelled;
  const pending =
    submitting || initializing || !!updating || launch?.manual_pending === true;
  const published = !!metadata && !dirty;
  const showAction = initialized
    ? !!updating || (published && metadata !== launch?.metadata_location)
    : initializing || !launch || launch.state === LaunchState.Draft;
  const automaticLaunchOff =
    !initialized && settings.data?.automation_enabled === false;
  const disabled =
    !!pending ||
    !published ||
    blocked ||
    query.isLoading ||
    query.isError ||
    (!initialized && settings.data?.automation_enabled !== true);
  async function run() {
    if (disabled || !showAction) return;
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
  const failure =
    error ??
    launch?.error ??
    (!initialized ? initialization?.attempt_error : null) ??
    getToastErrorDetails(query.error) ??
    (!initialized ? getToastErrorDetails(settings.error) : null);
  return (
    <section
      aria-labelledby={headingId}
      className={`${dropForgePanelClassName} tw-flex tw-min-h-10 tw-flex-wrap tw-items-center tw-gap-3`}
    >
      <div className="tw-min-w-0 tw-flex-1 tw-basis-48 tw-space-y-1">
        <div className="tw-flex tw-flex-wrap tw-items-center tw-gap-2">
          <h2
            id={headingId}
            className={`${dropForgePanelTitleClassName} tw-m-0 tw-text-iron-50`}
          >
            {t(locale, "dropForge.launch")}
          </h2>
          {launch && <DropForgeAutoLaunchPill />}
        </div>
        <div
          role="status"
          aria-live="polite"
          className="tw-text-sm tw-text-iron-300"
        >
          {showAction && !initialized && !disabled && !failure && (
            <div>{t(locale, "dropForge.launchDescription")}</div>
          )}
          {initialized && <div>{t(locale, "dropForge.claimInitialized")}</div>}
          {automaticLaunchOff && (
            <div>{t(locale, "dropForge.automaticLaunchOff")}</div>
          )}
          {!published && <div>{t(locale, "dropForge.publishFirst")}</div>}
        </div>
        {failure && (
          <p
            role="alert"
            className="tw-m-0 tw-break-words tw-text-sm tw-text-error"
          >
            {failure}
          </p>
        )}
      </div>
      {showAction && (
        <button
          type="button"
          onClick={() => {
            void run();
          }}
          disabled={disabled}
          aria-busy={!!pending}
          className={`${BTN_PRIMARY} tw-ml-auto tw-inline-flex tw-min-h-11 tw-w-fit tw-max-w-full tw-items-center tw-justify-center tw-gap-2`}
        >
          {pending ? (
            <CircleLoader size={CircleLoaderSize.SMALL} />
          ) : (
            <span aria-hidden="true" className="tw-flex tw-shrink-0">
              <DropForgeLaunchIcon className="tw-h-4 tw-w-4" />
            </span>
          )}
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
      )}
    </section>
  );
}
