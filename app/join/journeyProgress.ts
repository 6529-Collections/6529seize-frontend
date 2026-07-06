import { getStatsPath } from "@/components/user/stats/userPageStats.helpers";
import type { ApiIdentity } from "@/generated/models/ApiIdentity";
import type { ApiOwnerBalanceMemes } from "@/generated/models/ApiOwnerBalanceMemes";
import type { NFTSubscription } from "@/generated/models/NFTSubscription";

import { TIMELINE_ORDER, type TimelineStepId } from "./page.content";
import type { StepStatus, TimelineProgress } from "./page.types";

export const JOIN_PROGRESS_STALE_TIME_MS = 60_000;
export const JOIN_SUBSCRIPTION_CARD_COUNT = 12;

type TimelineCompletion = Readonly<Record<TimelineStepId, boolean>>;

export const getJoinStatsPath = (
  profile: ApiIdentity | null
): string | null => {
  if (!profile) {
    return null;
  }
  try {
    return getStatsPath(profile, null);
  } catch {
    return null;
  }
};

export const getJoinSubscriptionProfileKey = (
  profile: ApiIdentity | null
): string | null => {
  const consolidationKey = profile?.consolidation_key;
  const trimmedConsolidationKey = consolidationKey?.trim();
  if (
    trimmedConsolidationKey !== undefined &&
    trimmedConsolidationKey.length > 0
  ) {
    return trimmedConsolidationKey;
  }

  const wallets = profile?.wallets
    ?.map((wallet) => wallet.wallet.trim())
    .filter((wallet): wallet is string => Boolean(wallet));
  if (wallets === undefined || wallets.length === 0) {
    return null;
  }
  return wallets.join("-");
};

export const hasMemeCardBalance = (
  balanceMemes: readonly ApiOwnerBalanceMemes[] | undefined
): boolean =>
  Boolean(
    balanceMemes?.some(
      (season) => season.balance > 0 || season.unique > 0 || season.sets > 0
    )
  );

export const hasActiveMemeSubscription = (
  subscriptions: readonly NFTSubscription[] | undefined
): boolean =>
  Boolean(
    subscriptions?.some(
      (subscription) =>
        subscription.subscribed || subscription.subscribed_count > 0
    )
  );

export const buildTimelineProgress = ({
  completed,
  visible,
}: {
  readonly completed: TimelineCompletion;
  readonly visible: boolean;
}): TimelineProgress => {
  const nextStepId =
    TIMELINE_ORDER.find((stepId) => !completed[stepId]) ?? null;
  const statuses = Object.fromEntries(
    TIMELINE_ORDER.map((stepId) => [
      stepId,
      getStepStatus(stepId, completed, nextStepId),
    ])
  ) as Record<TimelineStepId, StepStatus>;
  const completedCount = TIMELINE_ORDER.filter(
    (stepId) => completed[stepId]
  ).length;
  const total = TIMELINE_ORDER.length;

  return {
    completed: completedCount,
    percent: Math.round((completedCount / total) * 100),
    statuses,
    total,
    visible,
  };
};

const getStepStatus = (
  stepId: TimelineStepId,
  completed: TimelineCompletion,
  nextStepId: TimelineStepId | null
): StepStatus => {
  if (completed[stepId]) {
    return "complete";
  }
  return stepId === nextStepId ? "current" : "pending";
};
