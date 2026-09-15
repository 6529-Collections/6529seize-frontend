import type { ApiCollectPlan } from "@/generated/models/ApiCollectPlan";
import type { ApiCollectPlanRequest } from "@/generated/models/ApiCollectPlanRequest";
import { createFetchDeadline } from "@/lib/fetch/fetchDeadline";
import {
  createCollectPlan,
  fetchCollectAssetOwnership,
} from "@/services/api/collect-api";
import { collectOwnershipCoversPurchase } from "./collect-owner-refresh";
import type { ConfirmedMarketPurchase } from "./market-activity-store";

export interface CollectGoalBuild {
  readonly scope: string;
  readonly generation: number;
  readonly startedAt: number;
  readonly request: ApiCollectPlanRequest;
}

const REFRESH_INTERVAL_MS = 30_000;
const REFRESH_WINDOW_MS = 10 * 60_000;

export function collectGoalRefreshPurchases(
  plan: ApiCollectPlan,
  build: CollectGoalBuild,
  purchases: readonly ConfirmedMarketPurchase[]
): readonly ConfirmedMarketPurchase[] {
  if (purchases.length === 0) return [];
  const assets = new Set(
    plan.analysis.requirements.flatMap((requirement) =>
      requirement.asset_keys.map((key) => key.toLowerCase())
    )
  );
  // Receipt timestamps are in whole seconds. Holdings blocks still supply the
  // positive proof; the time guard excludes old history arriving much later.
  const startedAt = Math.floor(build.startedAt / 1000) * 1000;
  return purchases.filter(
    (purchase) =>
      purchase.profileId === build.request.goal.profile_id &&
      purchase.confirmedAt > 0 &&
      purchase.confirmedAt >= startedAt &&
      assets.has(purchase.assetKey.toLowerCase()) &&
      !collectOwnershipCoversPurchase(
        purchase.profileId,
        plan.analysis,
        purchase
      )
  );
}

function waitForNextCheck(signal: AbortSignal): Promise<void> {
  return new Promise((resolve) => {
    const finish = () => {
      globalThis.clearTimeout(timer);
      signal.removeEventListener("abort", finish);
      resolve();
    };
    const timer = globalThis.setTimeout(finish, REFRESH_INTERVAL_MS);
    signal.addEventListener("abort", finish, { once: true });
    if (signal.aborted) finish();
  });
}

async function ownershipHasCaughtUp(
  purchases: readonly ConfirmedMarketPurchase[],
  signal: AbortSignal
): Promise<boolean> {
  const first = purchases[0];
  if (
    !first ||
    purchases.some((purchase) => purchase.blockNumber === undefined)
  )
    return false;
  const deadline = createFetchDeadline(
    signal,
    20_000,
    () => new Error("COLLECT_GOAL_OWNERSHIP_TIMEOUT")
  );
  try {
    const analysis = await deadline.run(() =>
      fetchCollectAssetOwnership(
        first.profileId,
        first.assetKey,
        deadline.signal
      )
    );
    return purchases.every((purchase) =>
      collectOwnershipCoversPurchase(first.profileId, analysis, purchase)
    );
  } catch {
    return false;
  } finally {
    deadline.dispose();
  }
}

async function rebuildGoal(
  build: CollectGoalBuild,
  purchases: readonly ConfirmedMarketPurchase[],
  signal: AbortSignal
): Promise<ApiCollectPlan | null> {
  const deadline = createFetchDeadline(
    signal,
    30_000,
    () => new Error("COLLECT_GOAL_REBUILD_TIMEOUT")
  );
  try {
    const next = await deadline.run(() =>
      createCollectPlan(build.request, deadline.signal)
    );
    if (signal.aborted) return null;
    return purchases.every((purchase) =>
      collectOwnershipCoversPurchase(
        purchase.profileId,
        next.analysis,
        purchase
      )
    )
      ? next
      : null;
  } catch (error) {
    if (signal.aborted) return null;
    throw error;
  } finally {
    deadline.dispose();
  }
}

/** Read indexed holdings until caught up, then build one analysis plan. Never trade. */
export async function refreshCollectGoalAfterPurchase({
  build,
  purchases,
  signal,
  onRebuilding,
}: {
  readonly build: CollectGoalBuild;
  readonly purchases: readonly ConfirmedMarketPurchase[];
  readonly signal: AbortSignal;
  readonly onRebuilding: () => void;
}): Promise<ApiCollectPlan | null> {
  if (purchases.length === 0) return null;
  const expiresAt =
    Math.max(...purchases.map((purchase) => purchase.confirmedAt)) +
    REFRESH_WINDOW_MS;
  const isAborted = () => signal.aborted;
  for (let attempt = 0; attempt < 20 && Date.now() < expiresAt; attempt += 1) {
    if (isAborted()) return null;
    const caughtUp = await ownershipHasCaughtUp(purchases, signal);
    if (isAborted()) return null;
    if (caughtUp) {
      onRebuilding();
      return rebuildGoal(build, purchases, signal);
    }
    await waitForNextCheck(signal);
  }
  return null;
}
