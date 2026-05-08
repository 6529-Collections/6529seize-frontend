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

const makeDecisionWithRuntimeWinners = (
  decisionTime: number,
  winners: unknown
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

    it("skips decision points without a winners array", () => {
      const validDecision = makeDecision(4, [makeWinner(4, 1)]);
      const decisionPoints = [
        makeDecisionWithRuntimeWinners(1, null),
        { decision_time: 2 } as ApiWaveDecision,
        makeDecisionWithRuntimeWinners(3, { winner: makeWinner(3, 1) }),
        validDecision,
      ];

      const winners = getApprovedWaveDecisionWinners(decisionPoints);

      expect(winners.map((winner) => winner.drop.id)).toEqual([
        "decision-4-place-1",
      ]);
    });

    it("filters malformed winners inside valid arrays", () => {
      const validWinner = makeWinner(1, 1);
      const decisionPoints = [
        makeDecisionWithRuntimeWinners(1, [
          null,
          undefined,
          false,
          {},
          { place: Number.NaN, awards: [], drop: { id: "nan-place" } },
          {
            place: Number.POSITIVE_INFINITY,
            awards: [],
            drop: { id: "inf-place" },
          },
          { place: 2, drop: { id: "missing-awards" } },
          { place: 2, awards: {}, drop: { id: "bad-awards" } },
          { place: 3, awards: [], drop: null },
          { place: 4, awards: [], drop: {} },
          { place: 5, awards: [], drop: { id: "" } },
          validWinner,
        ]),
      ];

      const winners = getApprovedWaveDecisionWinners(decisionPoints);

      expect(winners).toEqual([validWinner]);
    });
  });
});
