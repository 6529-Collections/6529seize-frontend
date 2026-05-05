import type { ApiWaveDecision } from "@/generated/models/ApiWaveDecision";
import type { ApiWaveDecisionWinner } from "@/generated/models/ApiWaveDecisionWinner";
import { getApprovedWaveDecisionWinners } from "@/helpers/waves/wave-decision.helpers";

const makeWinner = (decision: number, place: number): ApiWaveDecisionWinner =>
  ({
    place,
    awards: [],
    drop: { id: `decision-${decision}-place-${place}` },
  }) as ApiWaveDecisionWinner;

const makeDecision = (
  decisionTime: number,
  winners: ApiWaveDecisionWinner[]
): ApiWaveDecision =>
  ({
    decision_time: decisionTime,
    winners,
  }) as ApiWaveDecision;

describe("wave-decision.helpers", () => {
  describe("getApprovedWaveDecisionWinners", () => {
    it("shows newer decisions first while keeping winner place order", () => {
      const firstDecision = makeDecision(1, [
        makeWinner(1, 1),
        makeWinner(1, 2),
      ]);
      const secondDecision = makeDecision(2, [makeWinner(2, 1)]);
      const decisionPoints = [firstDecision, secondDecision];

      const winners = getApprovedWaveDecisionWinners(decisionPoints);

      expect(winners.map((winner) => winner.drop.id)).toEqual([
        "decision-2-place-1",
        "decision-1-place-1",
        "decision-1-place-2",
      ]);
      expect(decisionPoints).toEqual([firstDecision, secondDecision]);
    });
  });
});
