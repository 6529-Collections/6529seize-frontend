import {
  formatApprovalCountdownTime,
  getApprovalDropStatus,
  getApprovedDropsCount,
  hasApprovalDecisionCounts,
  isOfficiallyApprovedDrop,
} from "@/helpers/waves/approve-wave.helpers";

describe("approve-wave.helpers", () => {
  const winningContext = {
    place: 1,
    awards: [],
    decision_time: 123,
  };
  const wave = {
    wave: {
      no_of_decisions_done: null,
      no_of_decisions_left: null,
    },
  } as any;

  describe("hasApprovalDecisionCounts", () => {
    it("returns true when decisions done is a valid count", () => {
      expect(
        hasApprovalDecisionCounts({
          ...wave,
          wave: { ...wave.wave, no_of_decisions_done: 0 },
        })
      ).toBe(true);
    });

    it("returns true when decisions left is a valid count", () => {
      expect(
        hasApprovalDecisionCounts({
          ...wave,
          wave: { ...wave.wave, no_of_decisions_left: 3 },
        })
      ).toBe(true);
    });

    it("returns false when both decision counters are missing", () => {
      expect(hasApprovalDecisionCounts(wave)).toBe(false);
    });
  });

  describe("isOfficiallyApprovedDrop", () => {
    it("returns false for rank-only drops", () => {
      expect(isOfficiallyApprovedDrop({ rank: 1 })).toBe(false);
    });

    it("returns true when winning context exists", () => {
      expect(
        isOfficiallyApprovedDrop({
          rank: null,
          winning_context: winningContext,
        })
      ).toBe(true);
    });
  });

  describe("getApprovedDropsCount", () => {
    it("uses decisions done when present", () => {
      expect(
        getApprovedDropsCount({
          wave: {
            wave: {
              max_winners: 10,
              no_of_decisions_done: 4,
              no_of_decisions_left: 3,
            },
          } as any,
        })
      ).toBe(4);
    });

    it("derives approved count from max winners and decisions left", () => {
      expect(
        getApprovedDropsCount({
          wave: {
            wave: {
              max_winners: 10,
              no_of_decisions_done: null,
              no_of_decisions_left: 3,
            },
          } as any,
        })
      ).toBe(7);
    });

    it("derives max winners when no decisions are left", () => {
      expect(
        getApprovedDropsCount({
          wave: {
            wave: {
              max_winners: 10,
              no_of_decisions_done: null,
              no_of_decisions_left: 0,
            },
          } as any,
        })
      ).toBe(10);
    });

    it("does not derive a negative approved count", () => {
      expect(
        getApprovedDropsCount({
          wave: {
            wave: {
              max_winners: 3,
              no_of_decisions_done: null,
              no_of_decisions_left: 10,
            },
          } as any,
        })
      ).toBe(0);
    });

    it("counts complete decisions with duplicate ids and missing drop data", () => {
      expect(
        getApprovedDropsCount({
          areDecisionPointsComplete: true,
          decisionPoints: [
            {
              decision_time: 1000,
              winners: [
                { place: 1, awards: [], drop: { id: "drop-1" } },
                { place: 2, awards: [], drop: { id: "drop-1" } },
                { place: 3, awards: [] },
              ],
            },
            {
              decision_time: 2000,
              winners: [
                { place: 1, awards: [], drop: { id: "drop-2" } },
                { place: 2, awards: [], drop: { id: "" } },
                { place: 3, awards: [], drop: {} },
              ],
            },
          ] as any,
          wave,
        })
      ).toBe(5);
    });
  });

  describe("getApprovalDropStatus", () => {
    it("shows pending countdown while the min threshold time is still running", () => {
      expect(
        getApprovalDropStatus({
          drop: {
            rating: 8,
            rank: null,
            over_threshold_since_ms: 1_000,
          },
          nowMs: 121_000,
          winningThreshold: 8,
          winningThresholdMinDurationMs: 600_000,
        })
      ).toMatchObject({
        kind: "approving",
        current: 8,
        threshold: 8,
        remaining: 0,
        countdownMs: 480_000,
      });
    });

    it("shows reached threshold when voting is closed and hold time is still running", () => {
      expect(
        getApprovalDropStatus({
          drop: {
            rating: 8,
            rank: null,
            over_threshold_since_ms: 1_000,
          },
          isClosed: true,
          nowMs: 121_000,
          winningThreshold: 8,
          winningThresholdMinDurationMs: 600_000,
        })
      ).toMatchObject({
        kind: "reached_threshold",
        current: 8,
        threshold: 8,
        remaining: 0,
        countdownMs: null,
      });
    });

    it("falls back to reached threshold when countdown timing is missing", () => {
      expect(
        getApprovalDropStatus({
          drop: { rating: 8, rank: null },
          nowMs: 121_000,
          winningThreshold: 8,
          winningThresholdMinDurationMs: 600_000,
        })
      ).toMatchObject({
        kind: "reached_threshold",
        current: 8,
        threshold: 8,
        remaining: 0,
      });
    });

    it("falls back to reached threshold when the hold time has elapsed", () => {
      expect(
        getApprovalDropStatus({
          drop: {
            rating: 8,
            rank: null,
            over_threshold_since_ms: 1_000,
          },
          nowMs: 601_000,
          winningThreshold: 8,
          winningThresholdMinDurationMs: 600_000,
        })
      ).toMatchObject({
        kind: "reached_threshold",
        current: 8,
        threshold: 8,
        remaining: 0,
      });
    });

    it("does not mark rank-only drops as approved", () => {
      expect(
        getApprovalDropStatus({
          drop: { rating: 7, rank: 1 },
          winningThreshold: 10,
        })
      ).toMatchObject({
        kind: "needs",
        current: 7,
        threshold: 10,
        remaining: 3,
      });
    });

    it("marks drops with winning context as approved", () => {
      expect(
        getApprovalDropStatus({
          drop: {
            rating: 7,
            rank: 1,
            winning_context: winningContext,
            over_threshold_since_ms: 1_000,
          },
          nowMs: 121_000,
          winningThreshold: 10,
          winningThresholdMinDurationMs: 600_000,
        })
      ).toMatchObject({
        kind: "approved",
        current: 7,
        threshold: 10,
        remaining: null,
      });
    });

    it("shows reached threshold before closed when threshold is met", () => {
      expect(
        getApprovalDropStatus({
          drop: { rating: 8, rank: null },
          isClosed: true,
          winningThreshold: 8,
        })
      ).toMatchObject({
        kind: "reached_threshold",
        current: 8,
        threshold: 8,
        remaining: 0,
      });
    });

    it("shows closed when voting ended before threshold was met", () => {
      expect(
        getApprovalDropStatus({
          drop: { rating: 7, rank: null },
          isClosed: true,
          winningThreshold: 8,
        })
      ).toMatchObject({
        kind: "closed",
        current: 7,
        threshold: 8,
        remaining: null,
      });
    });

    it("shows needs while open before threshold is met", () => {
      expect(
        getApprovalDropStatus({
          drop: { rating: 5, rank: null },
          winningThreshold: 8,
        })
      ).toMatchObject({
        kind: "needs",
        current: 5,
        threshold: 8,
        remaining: 3,
      });
    });
  });

  describe("formatApprovalCountdownTime", () => {
    it("formats the approval countdown label time", () => {
      expect(formatApprovalCountdownTime(59_999)).toBe("<1m");
      expect(formatApprovalCountdownTime(60_000)).toBe("1m");
      expect(formatApprovalCountdownTime(60_001)).toBe("2m");
      expect(formatApprovalCountdownTime(3_660_000)).toBe("1h 1m");
    });
  });
});
