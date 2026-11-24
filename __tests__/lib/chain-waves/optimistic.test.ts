import type { ApiCompetitionCreditBudget } from "@/generated/models/ApiCompetitionCreditBudget";
import type { ApiDrop } from "@/generated/models/ApiDrop";
import {
  budgetAfterVote,
  scheduleIndexRefresh,
  withViewerVote,
} from "@/lib/chain-waves/optimistic";

describe("what the page shows until 6529.io's index reads the block", () => {
  it("moves a drop's total, voters and the viewer's vote", () => {
    const drop = {
      rating: 100,
      realtime_rating: 100,
      raters_count: 3,
      context_profile_context: { rating: 10, max_rating: 50 },
    } as unknown as ApiDrop;
    expect(withViewerVote(drop, 25)).toMatchObject({
      rating: 115,
      realtime_rating: 115,
      raters_count: 3,
      context_profile_context: { rating: 25, max_rating: 50 },
    });
    expect(withViewerVote(drop, 0).raters_count).toBe(2);
    expect(
      withViewerVote(
        { ...drop, context_profile_context: { rating: 0 } } as ApiDrop,
        5
      ).raters_count
    ).toBe(4);
  });

  it("moves a decision's credit by the vote's change in size", () => {
    const budget = {
      current_vote: -10,
      spent: 30,
      remaining: 70,
    } as ApiCompetitionCreditBudget;
    expect(budgetAfterVote(budget, 25)).toMatchObject({
      current_vote: 25,
      spent: 45,
      remaining: 55,
    });
    expect(
      budgetAfterVote({ ...budget, spent: null, remaining: null }, 5)
    ).toMatchObject({ current_vote: 5, spent: null, remaining: null });
  });

  it("refetches later, not at once", () => {
    jest.useFakeTimers();
    try {
      const refresh = jest.fn().mockResolvedValue(undefined);
      scheduleIndexRefresh(refresh, 1000);
      expect(refresh).not.toHaveBeenCalled();
      jest.advanceTimersByTime(1000);
      expect(refresh).toHaveBeenCalledTimes(1);
    } finally {
      jest.useRealTimers();
    }
  });
});
