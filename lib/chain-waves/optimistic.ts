import type { ApiCompetitionCreditBudget } from "@/generated/models/ApiCompetitionCreditBudget";
import type { ApiDrop } from "@/generated/models/ApiDrop";

/**
 * The drop as the viewer's chain vote leaves it, for the caches until
 * 6529.io's index reads the vote from the chain: its total, its voter count
 * and the viewer's own vote move; everything else stays as it was.
 */
export function withViewerVote(drop: ApiDrop, amount: number): ApiDrop {
  const old = drop.context_profile_context?.rating ?? 0;
  const ratersDelta = (amount !== 0 ? 1 : 0) - (old !== 0 ? 1 : 0);
  return {
    ...drop,
    rating: drop.rating - old + amount,
    realtime_rating: drop.realtime_rating - old + amount,
    raters_count: Math.max(0, drop.raters_count + ratersDelta),
    context_profile_context: drop.context_profile_context
      ? { ...drop.context_profile_context, rating: amount }
      : drop.context_profile_context,
  };
}

/**
 * A decision's credit after the viewer's chain vote: the vote, and the
 * credit spent and left, move by the vote's change in size.
 */
export function budgetAfterVote(
  budget: ApiCompetitionCreditBudget,
  amount: number
): ApiCompetitionCreditBudget {
  const change = Math.abs(amount) - Math.abs(budget.current_vote ?? 0);
  return {
    ...budget,
    current_vote: amount,
    spent: budget.spent === null ? null : budget.spent + change,
    remaining: budget.remaining === null ? null : budget.remaining - change,
  };
}

/** How long 6529.io's index takes to read a block, about; then refetch. */
export const INDEX_REFRESH_DELAY_MS = 15_000;

/**
 * Refetches once 6529.io's index has likely read the block. Refetching at
 * once would bring back the vote as it was and undo what the page shows.
 */
export function scheduleIndexRefresh(
  refresh: () => unknown,
  delayMs: number = INDEX_REFRESH_DELAY_MS
): void {
  setTimeout(() => {
    // A refresh that fails, at once or later, is left to the next natural
    // refetch.
    new Promise((resolve) => {
      resolve(refresh());
    }).catch(() => undefined);
  }, delayMs);
}
