import type { DecisionPoint } from "@/helpers/waves/time.types";

type DecisionPointOverrides = Partial<DecisionPoint>;

const createDecisionPoint = (
  overrides: DecisionPointOverrides = {}
): DecisionPoint => ({
  id: overrides.id ?? "timestamp-0",
  name: overrides.name ?? "Decision",
  timestamp: overrides.timestamp ?? Date.now(),
  seriesIndex: overrides.seriesIndex ?? 0,
});

describe("time.types", () => {
  describe("DecisionPoint interface", () => {
    it("accepts valid decision points", () => {
      const decisionPoint = createDecisionPoint({
        id: "1711929600000-12",
        name: "First Decision",
        timestamp: 1711929600000,
        seriesIndex: 12,
      });

      expect(typeof decisionPoint.id).toBe("string");
      expect(decisionPoint.seriesIndex).toBe(12);
      expect(decisionPoint.name).toBe("First Decision");
      expect(decisionPoint.timestamp).toBe(1711929600000);
    });

    it("supports multiple entries with unique identifiers", () => {
      const decisionPoints: DecisionPoint[] = Array.from({ length: 3 }, (_, index) =>
        createDecisionPoint({
          id: `171000000000${index}-${index}`,
          seriesIndex: index,
          name: `Decision ${index}`,
          timestamp: 1710000000000 + index * 1000,
        })
      );

      expect(decisionPoints).toHaveLength(3);
      expect(decisionPoints.map((dp) => dp.id)).toEqual([
        "1710000000000-0",
        "1710000000001-1",
        "1710000000002-2",
      ]);
      expect(decisionPoints.map((dp) => dp.seriesIndex)).toEqual([0, 1, 2]);
    });

    it("round-trips through JSON serialization", () => {
      const original = createDecisionPoint({
        id: "1711111111111-5",
        seriesIndex: 5,
        timestamp: 1711111111111,
      });

      const json = JSON.stringify(original);
      const parsed: DecisionPoint = JSON.parse(json);

      expect(parsed.id).toBe(original.id);
      expect(parsed.seriesIndex).toBe(original.seriesIndex);
      expect(parsed.timestamp).toBe(original.timestamp);
    });
  });
});
