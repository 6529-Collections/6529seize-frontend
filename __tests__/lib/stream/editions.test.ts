import {
  bidStanding,
  clearingCandidates,
  nearestStep,
  raiseTargetStep,
  unitsByStepFrom,
} from "@/lib/stream/editions";

// The first steps of the launch ladder (0.0001 ETH at step 0, 48 steps per tenfold).
const PRICES = [100n, 105n, 110n, 115n, 121n, 127n, 133n, 140n, 147n, 154n].map(
  (mantissa) => mantissa * 1_000_000_000_000n
);

describe("clearingCandidates", () => {
  it("has no result with no bids", () => {
    const result = clearingCandidates({ prices: PRICES, unitsByStep: [], cap: 0, marginShare: 10_000 });
    expect(result.pick).toBe(-1);
    expect(result.candidates).toHaveLength(0);
  });

  it("picks the count that raises the most", () => {
    // 1 at step 9, 1 at step 5: 1 x 154 = 154 vs 2 x 127 = 254.
    const units = [0, 0, 0, 0, 0, 1, 0, 0, 0, 1];
    const result = clearingCandidates({ prices: PRICES, unitsByStep: units, cap: 0, marginShare: 10_000 });
    expect(result.candidates.map((c) => c.count)).toEqual([1, 2]);
    expect(result.candidates[result.pick]).toMatchObject({ step: 5, count: 2 });
  });

  it("prefers a larger count within the margin of the best revenue", () => {
    // 10 at step 9 (1540) vs 11 at step 0 (1100): 1100 < 90% of 1540, so 10 wins.
    let units = [1, 0, 0, 0, 0, 0, 0, 0, 0, 10];
    let result = clearingCandidates({ prices: PRICES, unitsByStep: units, cap: 0, marginShare: 10_000 });
    expect(result.candidates[result.pick]?.count).toBe(10);
    // 10 at step 1 (1050) vs 11 at step 0 (1100): 11 is the best and wins.
    units = [1, 10];
    result = clearingCandidates({ prices: PRICES, unitsByStep: units, cap: 0, marginShare: 10_000 });
    expect(result.candidates[result.pick]?.count).toBe(11);
  });

  it("stops at the cap", () => {
    const units = [5, 0, 3, 0, 4];
    const result = clearingCandidates({ prices: PRICES, unitsByStep: units, cap: 6, marginShare: 10_000 });
    // Step 4: 4 copies; step 2: min(7, 6) = 6; step 0 is not scanned (6 units above reach the cap).
    expect(result.candidates.map((c) => [c.step, c.count])).toEqual([
      [4, 4],
      [2, 6],
    ]);
  });
});

describe("unitsByStepFrom", () => {
  it("places stepTotals from the low step", () => {
    expect(unitsByStepFrom(3, [2n, 0n, 1n])).toEqual([0, 0, 0, 2, 0, 1]);
  });
});

describe("bidStanding", () => {
  it("is in above the price line, out below it, partly in on a rationed line", () => {
    expect(bidStanding({ step: 5, clearingStep: 3, rationed: false })).toBe("in");
    expect(bidStanding({ step: 2, clearingStep: 3, rationed: false })).toBe("out");
    expect(bidStanding({ step: 3, clearingStep: 3, rationed: false })).toBe("in");
    expect(bidStanding({ step: 3, clearingStep: 3, rationed: true })).toBe("part");
    expect(bidStanding({ step: 3, clearingStep: null, rationed: false })).toBe("out");
  });
});

describe("nearestStep", () => {
  it("finds the nearest ladder price, the lower on a tie", () => {
    expect(nearestStep(PRICES, 120_000_000_000_000n)).toBe(4);
    expect(nearestStep(PRICES, 102_500_000_000_000n)).toBe(0);
    expect(nearestStep(PRICES, 1n)).toBe(0);
  });
});

describe("raiseTargetStep", () => {
  it("moves the bid instead of counting it twice", () => {
    // Bids: 1 at step 9 (others), 1 at step 0 (mine). Clearing picks step 0 with 2 units
    // only if 2 x 100 >= 0.9 x best; best is 154 (1 at step 9) vs 200 (2 at step 0) -> 2 at step 0.
    // Mine is already in; a raise target from step 0 for my 1 unit should be step 1 at most.
    const target = raiseTargetStep({
      prices: PRICES,
      unitsByStep: [1, 0, 0, 0, 0, 0, 0, 0, 0, 1],
      cap: 0,
      marginShare: 10_000,
      fromStep: 0,
      quantity: 1,
    });
    expect(target).toBe(1);
  });

  it("finds the step that gets an out bid in", () => {
    // Others: 10 at step 9 (1540). Mine: 1 at step 0. Out today (11 x 100 = 1100 < 0.9 x 1540).
    const target = raiseTargetStep({
      prices: PRICES,
      unitsByStep: [1, 0, 0, 0, 0, 0, 0, 0, 0, 10],
      cap: 0,
      marginShare: 10_000,
      fromStep: 0,
      quantity: 1,
    });
    // At step 9 it joins the 10 there: 11 x 154 wins.
    expect(target).not.toBeNull();
    expect(target!).toBeGreaterThan(0);
  });

  it("returns null when a cap leaves no room", () => {
    expect(
      raiseTargetStep({
        prices: PRICES,
        unitsByStep: [1, 0, 0, 0, 0, 0, 0, 0, 0, 3],
        cap: 3,
        marginShare: 10_000,
        fromStep: 0,
        quantity: 1,
      })
    ).toBeNull();
  });
});
