"use client";

import type { ApiCollectPlan } from "@/generated/models/ApiCollectPlan";
import { ApiCollectPlanStateEnum } from "@/generated/models/ApiCollectPlan";
import { useEffect, useEffectEvent, useState } from "react";
import {
  collectGoalRefreshPurchases,
  refreshCollectGoalAfterPurchase,
  type CollectGoalBuild,
} from "./collect-goal-refresh";
import type { ConfirmedMarketPurchase } from "./market-activity-store";

type RefreshPhase = "waiting" | "rebuilding" | "pending" | "error";

export function useCollectGoalRefresh({
  build,
  plan,
  purchases,
  onPlan,
  onStart,
}: {
  readonly build: CollectGoalBuild | null;
  readonly plan: ApiCollectPlan | null;
  readonly purchases: readonly ConfirmedMarketPurchase[];
  readonly onPlan: (plan: ApiCollectPlan) => void;
  readonly onStart: () => void;
}): RefreshPhase | null {
  const targets =
    build && plan?.state === ApiCollectPlanStateEnum.Ready
      ? collectGoalRefreshPurchases(plan, build, purchases)
      : [];
  const refreshKey =
    targets.length > 0 && build
      ? JSON.stringify([
          build.scope,
          build.generation,
          targets.map((purchase) => [
            purchase.operationId,
            purchase.assetKey,
            purchase.protocolAddress,
            purchase.orderHash,
            purchase.blockNumber,
            purchase.confirmedAt,
          ]),
        ])
      : null;
  const [outcome, setOutcome] = useState<{
    key: string;
    phase: RefreshPhase;
  } | null>(null);
  const refresh = useEffectEvent(async (key: string, signal: AbortSignal) => {
    if (!build) return;
    setOutcome({ key, phase: "waiting" });
    onStart();
    try {
      const next = await refreshCollectGoalAfterPurchase({
        build,
        purchases: targets,
        signal,
        onRebuilding: () => setOutcome({ key, phase: "rebuilding" }),
      });
      if (signal.aborted) return;
      if (next) onPlan(next);
      else setOutcome({ key, phase: "pending" });
    } catch {
      if (!signal.aborted) setOutcome({ key, phase: "error" });
    }
  });
  useEffect(() => {
    if (!refreshKey) return;
    const controller = new AbortController();
    const timer = globalThis.setTimeout(() => {
      void refresh(refreshKey, controller.signal);
    }, 0);
    return () => {
      globalThis.clearTimeout(timer);
      controller.abort();
    };
  }, [refreshKey]);
  if (!refreshKey) return null;
  return outcome?.key === refreshKey ? outcome.phase : "waiting";
}
