import {
  AllowlistOperationCode,
  DistributionPlanTokenPoolDownloadStatus,
  type AllowlistOperation,
  type AllowlistPhaseWithComponentAndItems,
  type DistributionPlanTokenPoolDownload,
} from "@/components/allowlist-tool/allowlist-tool.types";
import { getEmmaStepSlug } from "./emma-route";

export enum DistributionPlanToolStep {
  CREATE_PLAN = "CREATE_PLAN",
  CREATE_SNAPSHOTS = "CREATE_SNAPSHOTS",
  CREATE_CUSTOM_SNAPSHOT = "CREATE_CUSTOM_SNAPSHOT",
  CREATE_PHASES = "CREATE_PHASES",
  BUILD_PHASES = "BUILD_PHASES",
  MAP_DELEGATIONS = "MAP_DELEGATIONS",
  REVIEW = "REVIEW",
}

const steps = Object.values(DistributionPlanToolStep);
const stepSlug = (step: DistributionPlanToolStep) =>
  step.toLowerCase().replaceAll("_", "-");

export function writeEmmaPlanStep(
  planId: string,
  step: DistributionPlanToolStep
) {
  const url = new URL(window.location.href);
  const planPath = `/emma/plans/${planId}`;
  if (url.pathname !== planPath && url.pathname !== `${planPath}/`) return;
  const slug = stepSlug(step);
  if (url.searchParams.get("step") !== slug) {
    url.searchParams.set("step", slug);
    window.history.replaceState(null, "", url);
  }
}

export function getRequestedEmmaPlanStep(search: string) {
  const slug = getEmmaStepSlug(new URLSearchParams(search).get("step"));
  return steps.find((step) => stepSlug(step) === slug);
}

function lastAvailableStep(
  operations: readonly AllowlistOperation[],
  phases: readonly AllowlistPhaseWithComponentAndItems[],
  downloads: readonly DistributionPlanTokenPoolDownload[] | null
): DistributionPlanToolStep {
  const {
    CREATE_SNAPSHOTS,
    CREATE_PHASES,
    BUILD_PHASES,
    MAP_DELEGATIONS,
    REVIEW,
  } = DistributionPlanToolStep;
  const snapshots = operations.filter(
    ({ code }) => code === AllowlistOperationCode.CREATE_TOKEN_POOL
  );
  const snapshotIncomplete = snapshots.some((snapshot) => {
    // The create-snapshot operation stores the token pool ID in params.id.
    const download = downloads?.find(
      ({ tokenPoolId }) => tokenPoolId === snapshot.params["id"]
    );
    return (
      download?.status !== DistributionPlanTokenPoolDownloadStatus.COMPLETED
    );
  });
  if (snapshotIncomplete || (!snapshots.length && !phases.length))
    return CREATE_SNAPSHOTS;
  if (
    !phases.length &&
    !operations.some(({ code }) => code === AllowlistOperationCode.ADD_PHASE)
  ) {
    return CREATE_PHASES;
  }
  const pending = operations.filter(({ hasRan }) => !hasRan);
  if (
    pending.some(
      ({ code }) =>
        code !== AllowlistOperationCode.MAP_RESULTS_TO_DELEGATED_WALLETS
    )
  ) {
    return BUILD_PHASES;
  }
  if (pending.length) return MAP_DELEGATIONS;
  return phases.length ? REVIEW : BUILD_PHASES;
}

export function restoreEmmaPlanStep(
  requested: DistributionPlanToolStep | undefined,
  operations: readonly AllowlistOperation[] | null,
  phases: readonly AllowlistPhaseWithComponentAndItems[] | null,
  downloads: readonly DistributionPlanTokenPoolDownload[] | null
): DistributionPlanToolStep {
  const first = DistributionPlanToolStep.CREATE_SNAPSHOTS;
  if (requested === undefined || !operations || !phases) return first;
  const available = lastAvailableStep(operations, phases, downloads);
  return (
    steps[
      Math.max(
        steps.indexOf(first),
        Math.min(steps.indexOf(requested), steps.indexOf(available))
      )
    ] ?? first
  );
}
