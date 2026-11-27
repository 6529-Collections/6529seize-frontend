import golden from "@/__tests__/fixtures/levels-golden.json";
import {
  getNextLevelThreshold,
  LAST_LEVEL_LISTED,
  LISTED_LEVEL_THRESHOLDS,
} from "@/components/levels/levelThresholds";

// Golden cases shared with the API: every border to level 300 and one score
// below each, plus large scores. Scores are decimal strings.
const cases = golden.cases.map(
  ([score, level]) => [String(score), Number(level)] as const
);

const thresholdOf = (level: number): number | null =>
  level === 0 ? 0 : (getNextLevelThreshold(level - 1)?.threshold ?? null);

describe("level thresholds", () => {
  it("keeps the table for levels 0 to 100", () => {
    expect(
      LISTED_LEVEL_THRESHOLDS.slice(0, 101).map((entry) => entry.threshold)
    ).toEqual(golden.table);
  });

  it("places every golden score at the API's level", () => {
    for (const [score, level] of cases) {
      const value = Number(score);
      expect(thresholdOf(level)).toBeLessThanOrEqual(value);
      const next = getNextLevelThreshold(level);
      if (level < 602) {
        expect(value).toBeLessThan(next?.threshold ?? Number.NaN);
      } else {
        expect(next).toBeNull();
      }
    }
  });

  it("matches the golden borders while they are exact", () => {
    for (const [level, border] of Object.entries(golden.borders)) {
      const expected = BigInt(border);
      if (expected <= BigInt(Number.MAX_SAFE_INTEGER)) {
        expect(thresholdOf(Number(level))).toBe(Number(expected));
      } else {
        expect(thresholdOf(Number(level))).toBeNull();
      }
    }
  });

  it("adds 4% of the previous threshold, rounded down, above level 100", () => {
    let expected = 25_000_000n;
    for (let level = 101; level <= 602; level += 1) {
      expected += expected / 25n;
      expect(thresholdOf(level)).toBe(Number(expected));
    }
  });

  it("lists levels 0 through 200 for the levels page", () => {
    expect(LAST_LEVEL_LISTED).toBe(200);
    expect(LISTED_LEVEL_THRESHOLDS).toHaveLength(201);
    expect(
      LISTED_LEVEL_THRESHOLDS.every((entry, index) => entry.level === index)
    ).toBe(true);
    expect(LISTED_LEVEL_THRESHOLDS[101]).toEqual({
      level: 101,
      threshold: 26_000_000,
    });
    expect(LISTED_LEVEL_THRESHOLDS[200]).toEqual({
      level: 200,
      threshold: 1_262_623_144,
    });
  });

  it("has no next level for a level that is not a whole number of 0 or more", () => {
    expect(getNextLevelThreshold(-1)).toBeNull();
    expect(getNextLevelThreshold(1.5)).toBeNull();
    expect(getNextLevelThreshold(Number.NaN)).toBeNull();
  });
});
