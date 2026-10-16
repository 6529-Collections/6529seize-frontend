import {
  EXAMPLE_NETWORK,
  EXAMPLE_SNAPSHOT_TIME,
  additionalSetsMicro,
  baseTdh,
  boost,
  boostableSeasons,
  cycleDayOfDate,
  dailyRateE4,
  dateOfCycleDay,
  effectiveEdition,
  finalTdh,
  finalTdhExactDecimal,
  halfUpRatio,
  isRateHalfCentTie,
  rateCents,
  seasonsFor,
  wholeDays,
} from "@/lib/tdh/tdhV1Arithmetic";

// Every expected value below was printed by the P26 Python reference
// (rule version tdh-v1.0), as listed in the plan's Appendix A.
const H = EXAMPLE_NETWORK.largestEdition;
const ELIGIBLE = EXAMPLE_NETWORK.eligibleMemes;

const boostOf = (input: Partial<Parameters<typeof boost>[0]>) =>
  boost({
    fullSets: 0,
    gradients: 0,
    completeSeasons: [],
    genesis: false,
    nakamoto: false,
    nMemes: ELIGIBLE,
    ...input,
  }).betaCents;

describe("TDH-v1 arithmetic (P26 §8)", () => {
  it.each([
    [3_941, 100],
    [1_000, 394],
    [310, 1_271],
    [309, 1_275],
    [303, 1_301],
    [300, 1_314],
    [200, 1_970],
  ])("RATE(3941, %i) is %i cents", (edition, cents) => {
    expect(rateCents(H, edition)).toBe(cents);
  });

  it("lets binary64 decide the half-cent tie at edition 200, where half-up would give 1,971", () => {
    expect(isRateHalfCentTie(H, 200)).toBe(true);
    expect(Math.floor((100 * H) / 200 + 0.5)).toBe(1_971);
    expect(rateCents(H, 200)).toBe(1_970);
    expect(
      [8, 40, 56, 200, 280, 1_400].every((e) => isRateHalfCentTie(H, e))
    ).toBe(true);
    expect(isRateHalfCentTie(H, 310)).toBe(false);
  });

  it("applies the Gradient minimum of 1.00 and has no rate for an empty edition", () => {
    expect(rateCents(H, 101, true)).toBe(3_902);
    expect(rateCents(0, 101, true)).toBe(100);
    expect(rateCents(50, 101, true)).toBe(100);
    expect(rateCents(0, 1_000)).toBe(0);
    expect(rateCents(H, 0)).toBeNull();
  });

  it.each([
    [149, 332, 310, true],
    [299, 333, 310, true],
    [300, 333, 300, false],
    [303, 333, 303, false],
    [309, 329, 309, false],
    [149, 0, 149, false],
    [200, 300, 300, true],
  ])(
    "edition for %i minted with claim limit %i is %i",
    (minted, claim, edition, floored) => {
      expect(effectiveEdition(minted, claim)).toEqual({
        edition,
        floorApplied: floored,
      });
    }
  );

  it("adjusts FirstGM's edition by -2,588 to 3,941", () => {
    expect(effectiveEdition(6_529, 0, -2_588).edition).toBe(3_941);
  });

  it("computes ADD in micro-units exactly", () => {
    expect(
      [0, 1, 2, 3, 4, 5, 10, 32, 33, 40, 2_000].map(additionalSetsMicro)
    ).toEqual([
      0, 0, 50_000, 82_645, 103_959, 117_875, 140_945, 144_050, 144_051,
      144_051, 144_051,
    ]);
  });

  it("matches BASE, including per-wallet rounding", () => {
    expect(baseTdh(1_271, 100)).toBe(1_271);
    expect(baseTdh(1_271, 1)).toBe(13);
    expect(baseTdh(1_271, 2)).toBe(25);
  });

  it("matches FINAL with binary64 ties and the exact-decimal alternative", () => {
    expect(finalTdh(1_271, 102)).toBe(1_296);
    expect(finalTdh(25, 114)).toBe(28);
    expect(finalTdhExactDecimal(25, 114)).toBe(29);
    expect(finalTdh(50, 113)).toBe(56);
    expect(finalTdhExactDecimal(50, 113)).toBe(57);
  });

  it("rounds integer ratios half up", () => {
    expect(halfUpRatio(1_015_000, 10_000)).toBe(102);
    expect(halfUpRatio(1_014_999, 10_000)).toBe(101);
  });
});

describe("TDH-v1 boost on the 2026-10-11 cycle (P26 §8.3)", () => {
  it("lists 17 seasons and pays seasons 1 to 16", () => {
    expect(seasonsFor(ELIGIBLE)).toHaveLength(17);
    expect(boostableSeasons(ELIGIBLE)).toEqual(
      Array.from({ length: 16 }, (_, i) => i + 1)
    );
  });

  it.each([
    ["nothing", {}, 100],
    ["one Gradient", { gradients: 1 }, 102],
    ["five Gradients", { gradients: 5 }, 110],
    ["seven Gradients, capped at five", { gradients: 7 }, 110],
    ["Genesis and Nakamoto", { genesis: true, nakamoto: true }, 102],
    ["Season 2", { completeSeasons: [2] }, 105],
    [
      "Season 2, Genesis and Nakamoto",
      { completeSeasons: [2], genesis: true, nakamoto: true },
      107,
    ],
    ["the current season only", { completeSeasons: [17] }, 100],
    ["one full set", { fullSets: 1 }, 180],
    ["two full sets", { fullSets: 2 }, 185],
    ["three full sets", { fullSets: 3 }, 188],
    ["one full set and five Gradients", { fullSets: 1, gradients: 5 }, 190],
    ["33 full sets and five Gradients", { fullSets: 33, gradients: 5 }, 204],
  ])("%s gives %s", (_label, input, expected) => {
    expect(boostOf(input)).toBe(expected);
  });

  it("treats every Meme except the newest like a full set on that cycle", () => {
    expect(
      boostOf({ completeSeasons: Array.from({ length: 16 }, (_, i) => i + 1) })
    ).toBe(180);
  });

  it("reaches the 2.24 ceiling once 20 seasons pay", () => {
    // 1.00 + 20 × 0.05 + ADD(33) + 5 × 0.02 = 2.244051, which rounds to 2.24.
    expect(
      halfUpRatio(
        1_000_000 + 20 * 50_000 + additionalSetsMicro(33) + 5 * 20_000,
        10_000
      )
    ).toBe(224);
  });

  it("ignores Genesis and Nakamoto when Season 1 is complete", () => {
    expect(
      boostOf({ completeSeasons: [1], genesis: true, nakamoto: true })
    ).toBe(105);
  });
});

describe("whole days and cycle days (P26 §4)", () => {
  it.each([
    [100 * 86_400 + 23 * 3_600, 100],
    [23 * 3_600, 0],
    [86_400, 1],
  ])(
    "an acquisition %i seconds before the snapshot has %i whole days",
    (seconds, days) => {
      expect(
        wholeDays(EXAMPLE_SNAPSHOT_TIME, EXAMPLE_SNAPSHOT_TIME - seconds)
      ).toBe(days);
    }
  );

  it("numbers cycles by days since 1970", () => {
    expect(cycleDayOfDate("2026-10-15")).toBe(20_741);
    expect(cycleDayOfDate("2026-10-11")).toBe(20_737);
    expect(cycleDayOfDate("2026-10-15")! * 86_400).toBe(1_792_022_400);
    expect(cycleDayOfDate("2026-02-30")).toBeNull();
    expect(cycleDayOfDate("15-10-2026")).toBeNull();
    expect(dateOfCycleDay(20_740)).toBe("2026-10-14");
  });

  it("computes a daily rate from copies with at least one whole day", () => {
    expect(
      dailyRateE4(104, [
        { rateCents: 100, days: 200 },
        { rateCents: 100, days: 120 },
        { rateCents: 1_271, days: 0 },
        { rateCents: 1_271, days: 90 },
      ])
    ).toBe(104 * (100 + 100 + 1_271));
  });
});
