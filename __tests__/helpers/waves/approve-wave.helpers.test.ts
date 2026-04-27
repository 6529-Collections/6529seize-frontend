import {
  getApprovalDropStatus,
  isOfficiallyApprovedDrop,
} from "@/helpers/waves/approve-wave.helpers";

describe("approve-wave.helpers", () => {
  const winningContext = {
    place: 1,
    awards: [],
    decision_time: 123,
  };

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

  describe("getApprovalDropStatus", () => {
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
          },
          winningThreshold: 10,
        })
      ).toMatchObject({
        kind: "approved",
        current: 7,
        threshold: 10,
        remaining: null,
      });
    });
  });
});
