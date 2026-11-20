import DropForgeStatusPill from "@/components/drop-forge/DropForgeStatusPill";
import {
  getSubscriptionPhaseName,
  type LaunchPhaseKey,
} from "@/components/drop-forge/launch/drop-forge-launch-claim-page-client.helpers";
import {
  ApiDropForgeActionKindEnum as Kind,
  ApiDropForgeActionStateEnum as State,
  type ApiDropForgeAction,
} from "@/generated/models/ApiDropForgeAction";
import {
  ApiDropForgeLaunchStateEnum as LaunchState,
  type ApiDropForgeLaunch,
} from "@/generated/models/ApiDropForgeLaunch";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";

type Status = {
  key:
    | "waitingInit"
    | "waitingPhase"
    | "manualConfirming"
    | "blocked"
    | "completedManually"
    | "initialized"
    | "phaseVerified"
    | "automationOff";
  phase?: string | undefined;
  detail?: string | undefined;
};

const normalize = (value?: string) => value?.toLowerCase().replace(/\s/g, "");

function getRowStatus(
  actions: ApiDropForgeAction[],
  waiting: Status | undefined
): Status | undefined {
  if (!actions.length) return undefined;
  if (
    actions.every(
      (action) => action.state === State.Confirmed && action.observed === true
    )
  )
    return { key: "completedManually" };
  if (
    actions.every((action) =>
      [State.Confirmed, State.Skipped].includes(action.state)
    )
  )
    return undefined;
  if (waiting) return waiting;
  if (
    actions.some(
      (action) => action.disabled_reason === "launch automation disabled"
    )
  )
    return { key: "automationOff" };
  const blocked = actions.find(
    (action) =>
      ![State.Confirmed, State.Skipped].includes(action.state) &&
      (action.wallet_blocked === true ||
        typeof action.attempt_error === "string")
  );
  return blocked
    ? { key: "blocked", detail: blocked.attempt_error ?? undefined }
    : undefined;
}

export function getLaunchInlineStatuses(
  launch: ApiDropForgeLaunch | null | undefined,
  phaseKey: "" | LaunchPhaseKey
) {
  if (
    !launch ||
    launch.state === LaunchState.Draft ||
    !phaseKey ||
    phaseKey === "research" ||
    phaseKey === "payartist"
  )
    return undefined;
  const phase = getSubscriptionPhaseName(phaseKey);
  const phaseIndex = launch.phases.findIndex(({ name }) =>
    phaseKey === "publicphase"
      ? ["public", "publicphase"].includes(normalize(name) ?? "")
      : normalize(name) === phaseKey
  );
  const config = launch.actions.find(
    (action) =>
      action.phase === phaseIndex &&
      [Kind.Initialize, Kind.Update].includes(action.kind)
  );
  const initial = phaseKey === "phase0";
  const waiting: Status | undefined =
    config && config.state !== State.Confirmed
      ? { key: initial ? "waitingInit" : "waitingPhase", phase }
      : undefined;
  let setup: Status | undefined;
  if (config?.state === State.Confirmed)
    setup = { key: initial ? "initialized" : "phaseVerified" };
  else if (config && launch.manual_pending) setup = { key: "manualConfirming" };
  else if (config) setup = getRowStatus([config], undefined);
  const airdrops = launch.actions.filter(
    (action) => action.kind === Kind.Airdrop
  );
  const byLabel = (label: string) =>
    airdrops.filter((action) => normalize(action.label) === normalize(label));
  return {
    setup,
    artist: initial
      ? getRowStatus(byLabel("Airdrop - Artist"), waiting)
      : undefined,
    team: initial
      ? getRowStatus(byLabel("Airdrop - Team"), waiting)
      : undefined,
    subscription: (key: LaunchPhaseKey) => {
      if (key === "publicphase") {
        const publicConfig = launch.actions.find(
          (action) =>
            action.kind === Kind.Update &&
            ["public", "publicphase"].includes(
              normalize(launch.phases[action.phase]?.name) ?? ""
            )
        );
        // Gapless Public batches follow Phase 2 setup, ahead of the Public update.
        const actions = byLabel("Public Subscription Airdrops");
        const prerequisite =
          actions[0]?.phase === publicConfig?.phase
            ? publicConfig
            : launch.actions.find(
                (action) =>
                  action.kind === Kind.Update &&
                  action.phase === actions[0]?.phase
              );
        const publicWaiting: Status | undefined =
          prerequisite && prerequisite.state !== State.Confirmed
            ? {
                key: "waitingPhase",
                phase: launch.phases[prerequisite.phase]?.name,
              }
            : undefined;
        return getRowStatus(actions, publicWaiting);
      }
      return getRowStatus(
        byLabel(`${getSubscriptionPhaseName(key)} Subscription Airdrops`),
        waiting
      );
    },
  };
}

export function DropForgeInlineStatus({
  status,
}: Readonly<{ status: Status | undefined }>) {
  const locale = useBrowserLocale();
  if (!status) return null;
  const positive = [
    "completedManually",
    "initialized",
    "phaseVerified",
  ].includes(status.key);
  return (
    <span className="tw-inline-flex tw-flex-wrap tw-items-center tw-gap-2">
      <DropForgeStatusPill
        label={t(locale, `dropForge.inline.${status.key}`, {
          phase: status.phase ?? "",
        })}
        className={
          positive
            ? "tw-bg-emerald-950 tw-text-emerald-200 tw-ring-emerald-600/40"
            : "tw-bg-blue-950 tw-text-blue-200 tw-ring-blue-500/40"
        }
      />
      {status.detail && (
        <span className="tw-text-sm tw-text-iron-300">{status.detail}</span>
      )}
    </span>
  );
}
