/** @jest-environment node */
import {
  EXAMPLE_NETWORK,
  EXAMPLE_SNAPSHOT_TIME,
} from "@/app/network/tdh/how-it-works/exampleNetwork";
import {
  registryHash,
  tdhRuleId,
} from "@/components/explained/engine/registryHash";
import {
  ABSOLUTES,
  DAY,
  DEAD,
  REGISTRY_FIELDS,
  REGISTRY_V14,
  TdhInputInvalid,
  TdhOutsideEngineRange,
  ZERO,
  additionalSetsLimit,
  additionalSetsMicro,
  baseTdh,
  boost,
  boostCeiling,
  boostOfHoldings,
  boostableSeasons,
  computeCycle,
  cycleBoundary,
  cycleDayOfDate,
  cycleDayOfUploadDate,
  dailyRateE4,
  dateOfCycleDay,
  diffRegistry,
  effectiveEdition,
  finalTdh,
  finalTdhExactDecimal,
  fork,
  halfUpRatio,
  highestBoost,
  isRateHalfCentTie,
  netMovements,
  rateCents,
  seasonsFor,
  selectCutoff,
  validateRegistry,
  wholeDays,
  pairState,
  type BoostHoldings,
  type CycleInput,
  type DelegationEvent,
  type PairRow,
  type PairState,
  type Transfer,
} from "@/components/explained/engine/tdh";

// Every expected value in the first three blocks was printed by the P26
// Python reference, as listed in the TDH pages' plan, Appendix A. They held
// for tdh-v1.0 and hold for TDH v1.4, whose arithmetic is the same.
const R = REGISTRY_V14;
const H = EXAMPLE_NETWORK.largestEdition;
const ELIGIBLE = EXAMPLE_NETWORK.eligibleMemes;

const boostOf = (holdings: Partial<BoostHoldings>) =>
  boostOfHoldings(
    {
      fullSets: 0,
      gradients: 0,
      completeSeasons: [],
      genesis: false,
      nakamoto: false,
      ...holdings,
    },
    ELIGIBLE,
    R
  ).beta;

describe("TDH v1.4 arithmetic (P26 §8)", () => {
  it.each([
    [3_941, 100],
    [1_000, 394],
    [310, 1_271],
    [309, 1_275],
    [303, 1_301],
    [301, 1_309],
    [300, 1_314],
    [200, 1_970],
    [101, 3_902],
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
    expect(isRateHalfCentTie(H, 0)).toBe(false);
  });

  it("applies the Gradient minimum of 1.00 and has no rate for an empty edition", () => {
    const min = R.gradient_rate_minimum;
    expect(rateCents(H, 101, min)).toBe(3_902);
    expect(rateCents(0, 101, min)).toBe(100);
    expect(rateCents(50, 101, min)).toBe(100);
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
      expect(effectiveEdition(minted, claim, R)).toMatchObject({
        edition,
        floorApplied: floored,
      });
    }
  );

  it("adjusts FirstGM's edition by -2,588 to 3,941", () => {
    expect(effectiveEdition(6_529, 0, R, R.firstgm_edition_adjustment)).toEqual(
      { edition: 3_941, floorApplied: false, floor: 0, adjusted: 3_941 }
    );
  });

  it("computes ADD in micro-units exactly, constant from 33 sets on", () => {
    expect(
      [0, 1, 2, 3, 4, 5, 10, 32, 33, 40, 2_000].map((sets) =>
        additionalSetsMicro(sets, R)
      )
    ).toEqual([
      0, 0, 50_000, 82_645, 103_959, 117_875, 140_945, 144_050, 144_051,
      144_051, 144_051,
    ]);
    expect(additionalSetsMicro(2n ** 64n, R)).toBe(144_051);
    expect(additionalSetsLimit(R)).toEqual({ micro: 144_051, fromSets: 33 });
  });

  it("matches BASE, including per-wallet rounding", () => {
    expect(baseTdh(1_271, 100)).toBe(1_271);
    expect(baseTdh(1_271, 1)).toBe(13);
    expect(baseTdh(1_271, 2)).toBe(25);
    expect(baseTdh(1_271, 2 * 30)).toBe(763);
  });

  it("matches FINAL with binary64 ties and the exact-decimal alternative", () => {
    expect(finalTdh(1_271, 102)).toBe(1_296);
    expect(finalTdh(25, 114)).toBe(28);
    expect(finalTdhExactDecimal(25, 114)).toBe(29);
    expect(finalTdh(50, 113)).toBe(56);
    expect(finalTdhExactDecimal(50, 113)).toBe(57);
  });

  it("refuses a FINAL outside the tdh-v1.4 range and inexact integers", () => {
    expect(() => finalTdh(2 ** 52, 200)).toThrow(TdhInputInvalid);
    expect(() => baseTdh(2 ** 53, 1)).toThrow(TdhOutsideEngineRange);
    expect(() => rateCents(1.5, 2)).toThrow(TdhOutsideEngineRange);
  });

  it("rounds integer ratios half up", () => {
    expect(halfUpRatio(1_015_000, 10_000)).toBe(102);
    expect(halfUpRatio(1_014_999, 10_000)).toBe(101);
  });
});

describe("TDH v1.4 boost on the 2026-10-11 cycle (P26 §8.3)", () => {
  it("lists 17 seasons and pays seasons 1 to 16", () => {
    const seasons = seasonsFor(ELIGIBLE, R);
    expect(seasons).toHaveLength(17);
    expect(seasons[0]).toEqual({ id: 1, start: 1, end: 47, bonus: 50_000 });
    expect(seasons.at(-1)).toEqual({
      id: 17,
      start: 556,
      end: null,
      bonus: 50_000,
    });
    expect(boostableSeasons(seasons).map((s) => s.id)).toEqual(
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
  ])("%s gives %s", (_label, holdings, expected) => {
    expect(boostOf(holdings)).toBe(expected);
  });

  it("treats every Meme except the newest like a full set on that cycle", () => {
    expect(
      boostOf({ completeSeasons: Array.from({ length: 16 }, (_, i) => i + 1) })
    ).toBe(180);
  });

  it("counts a record that holds every eligible Meme as a full set", () => {
    const all = boostOfHoldings(
      {
        fullSets: 0,
        gradients: 0,
        completeSeasons: Array.from({ length: 17 }, (_, i) => i + 1),
        genesis: false,
        nakamoto: false,
      },
      ELIGIBLE,
      R
    );
    expect(all).toMatchObject({ beta: 180, sets: 1, branch: "fullSet" });
  });

  it("reaches the 2.24 ceiling once 20 seasons pay, and 2.04 is today's highest", () => {
    // 1.00 + 20 × 0.05 + ADD(33) + 5 × 0.02 = 2.244051, which rounds to 2.24.
    expect(
      halfUpRatio(
        1_000_000 + 20 * 50_000 + additionalSetsMicro(33, R) + 5 * 20_000,
        10_000
      )
    ).toBe(224);
    expect(boostCeiling(R)).toBe(224);
    expect(highestBoost(ELIGIBLE, R).beta).toBe(204);
    expect(highestBoost(562, R).beta).toBe(204);
  });

  it("ignores Genesis and Nakamoto when Season 1 is complete", () => {
    expect(
      boostOf({ completeSeasons: [1], genesis: true, nakamoto: true })
    ).toBe(105);
  });

  it("gives each part of the boost in micro-units", () => {
    expect(
      boostOfHoldings(
        {
          fullSets: 0,
          gradients: 6,
          completeSeasons: [2],
          genesis: true,
          nakamoto: true,
        },
        ELIGIBLE,
        R
      )
    ).toMatchObject({
      beta: 117,
      micro: 1_170_000,
      branch: "seasons",
      parts: {
        seasons: 50_000,
        extraSets: 0,
        genesis: 10_000,
        nakamoto: 10_000,
        gradients: 100_000,
      },
      paidSeasons: [2],
    });
  });

  it("never holds a Meme that is not eligible", () => {
    const seasons = seasonsFor(3, R);
    expect(
      boost({ "1": 1, "2": 1, "3": 1, "9": 4 }, 0, [1, 2, 3], seasons, R)
    ).toMatchObject({
      sets: 1,
      beta: 100,
    });
    expect(boost({ "1": 1, "2": 1 }, 0, [1, 2, 3], seasons, R).sets).toBe(0);
    expect(boost({}, 0, [], [], R).beta).toBe(100);
  });
});

describe("whole days, cycle days and the cutoff (P26 §4)", () => {
  it.each([
    [100 * 86_400 + 23 * 3_600, 100],
    [23 * 3_600, 0],
    [86_400, 1],
  ])(
    "an acquisition %i seconds before the snapshot has %i whole days",
    (seconds, days) => {
      expect(
        wholeDays(
          EXAMPLE_SNAPSHOT_TIME,
          EXAMPLE_SNAPSHOT_TIME - seconds,
          R.day_s
        )
      ).toBe(days);
    }
  );

  it("numbers cycles by days since 1970", () => {
    expect(cycleDayOfDate("2026-10-15")).toBe(20_741);
    expect(cycleDayOfDate("2026-10-11")).toBe(20_737);
    expect(cycleBoundary(cycleDayOfDate("2026-10-15") ?? 0)).toBe(
      1_792_022_400
    );
    expect(cycleDayOfDate("2026-02-30")).toBeNull();
    expect(cycleDayOfDate("15-10-2026")).toBeNull();
    expect(cycleDayOfDate("1969-12-31")).toBeNull();
    expect(dateOfCycleDay(20_740)).toBe("2026-10-14");
    expect(DAY).toBe(86_400);
  });

  it("reads upload dates as eight digits naming a calendar date", () => {
    expect(cycleDayOfUploadDate("20261011")).toBe(20_737);
    expect(cycleDayOfUploadDate("19700101")).toBe(0);
    for (const bad of [
      "20261032",
      "20230229",
      "20261100",
      "2026101",
      "202610111",
      "2026-10-11",
      "19691231",
    ]) {
      expect(() => cycleDayOfUploadDate(bad)).toThrow(TdhInputInvalid);
    }
  });

  it("selects the cutoff: ts(b) < M <= ts(b + 1), b + 1 finalized", () => {
    const headers = {
      "100": 1_791_676_787,
      "101": 1_791_676_799,
      "102": 1_791_676_811,
    };
    expect(selectCutoff("20261011", headers, 102)).toEqual({
      block: 101n,
      timestamp: 1_791_676_799n,
    });
    expect(() => selectCutoff("20261011", headers, 101)).toThrow(
      /not finalized/
    );
    expect(() =>
      selectCutoff("20261011", { ...headers, "99": 1_791_676_799 }, 102)
    ).toThrow(/do not increase/);
    expect(() => selectCutoff("20261011", { "100": 1 }, 102)).toThrow(
      /straddles/
    );
    expect(() =>
      selectCutoff(
        "20261011",
        { "0101": 1_791_676_799, "102": 1_791_676_811 },
        102
      )
    ).toThrow(/canonical decimal/);
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

describe("the TDH v1.4 registry (P26 §10)", () => {
  it("hashes to P26's registry hash and rule ID (vector 28)", () => {
    expect(registryHash(R)).toBe(
      "0x3cfa0e6eae7b8769516597e117ecd55580ecb6b75194139f053d3e0ec09d9f36"
    );
    expect(tdhRuleId(R)).toBe(
      "0x772d61ed465c80ed3a801927d81183895e4d1f37b069bb9ceaef959a7418ab3f"
    );
  });

  it("names D136's four-wallet values and every record field", () => {
    expect(R).toMatchObject({
      rule_version: "tdh-v1.4",
      consolidation_max_wallets: 4,
      consolidation_ungated_max_wallets: 3,
      consolidation_gate_activation_s: 1_792_022_400,
    });
    expect(REGISTRY_FIELDS).toHaveLength(31);
    for (const [name] of REGISTRY_FIELDS) {
      expect(R).toHaveProperty(name);
    }
    expect(R.sinks).toEqual([ZERO, DEAD]);
  });

  it("forks a registry for a what-if, and marks the absolute it may not move", () => {
    const what = fork(R, {
      edition_floor_threshold: 250,
      memes: "0xAB".padEnd(42, "C"),
    });
    expect(what.memes).toBe("0xab".padEnd(42, "c"));
    expect(diffRegistry(R, what)).toEqual([
      { field: "memes", from: R.memes, to: what.memes, locked: false },
      {
        field: "edition_floor_threshold",
        from: 300,
        to: 250,
        locked: true,
      },
    ]);
    expect(ABSOLUTES.edition_floor_threshold).toMatch(/D89/);
    expect(() => fork(R, { not_a_field: 1 } as never)).toThrow(TypeError);
    expect(registryHash(fork(R, { gradient_bonus: 20_000 }))).toBe(
      registryHash(R)
    );
  });

  it.each([
    ["season_starts", [2, 48], /start at 1/],
    ["season_starts", [1, 48, 48], /start at 1/],
    ["sinks", [DEAD, ZERO], /ascending/],
    ["sinks", [DEAD], /ZERO/],
    ["day_s", 0, /positive/],
    ["additional_set_ratio", 10_000, /below 10\^4/],
    ["consolidation_max_wallets", 1, /at least 2/],
    ["consolidation_ungated_max_wallets", 1, /at least 2/],
    ["day_s", 2 ** 32, /uint32/],
    ["firstgm_edition_adjustment", 2n ** 63n, /int64/],
    ["memes", "0x12", /20 bytes/],
    ["genesis_ids", 1, /not a list/],
  ] as const)("refuses %s = %s", (field, value, message) => {
    expect(() => validateRegistry(fork(R, { [field]: value }))).toThrow(
      message
    );
  });
});

const A = "0x00000000000000000000000000000000000000a1";
const B = "0x00000000000000000000000000000000000000b2";
const T = 1_791_676_799;

function transfer(
  over: Partial<Transfer> & Pick<Transfer, "block" | "from" | "to">
): Transfer {
  return {
    txIndex: 0,
    logIndex: 0,
    batchPos: 0,
    timestamp: T - 10 * 86_400,
    tx: `0x${over.block.toString(16).padStart(64, "0")}`,
    contract: R.memes,
    token: 1,
    amount: 1,
    ...over,
  };
}

describe("one cycle from decoded inputs (P26 §5 to §9)", () => {
  it("credits a held copy its whole days at its rate, and nothing else", () => {
    const input: CycleInput = {
      block: 2_000,
      timestamp: T,
      transfers: [
        transfer({
          block: 1_000,
          from: ZERO,
          to: A,
          amount: 3,
          timestamp: T - 100 * 86_400,
        }),
        transfer({
          block: 1_001,
          from: A,
          to: B,
          timestamp: T - 30 * 86_400,
        }),
      ],
    };
    const res = computeCycle(input, fork(R, { season_starts: [1] }));
    expect(res.H).toBe(3);
    expect(res.rates[`${R.memes}#1`]).toBe(100);
    expect(res.wallets[A]).toMatchObject({
      balance: 2,
      raw: 200,
      base: 200,
      boostCents: 105,
      final: 210,
    });
    expect(res.identities[B]).toMatchObject({
      balance: 1,
      raw: 30,
      final: 30,
      wallets: [B],
    });
    expect(res.totals).toEqual({
      final: 240,
      finalExcludingSinks: 240,
      base: 230,
      raw: 230,
    });
  });

  it("keeps big counts exact, and refuses a result it cannot hold in a number", () => {
    // Meme 1 is minted once, to B; DEAD then credits A, an hour before T.
    const big = (amount: bigint) =>
      computeCycle(
        {
          block: 2_000,
          timestamp: T,
          transfers: [
            transfer({ block: 900, from: ZERO, to: B }),
            transfer({
              block: 1_000,
              from: DEAD,
              to: A,
              amount,
              timestamp: T - 3_600,
            }),
          ],
        },
        R
      );
    expect(big(5n).wallets[A]).toMatchObject({ balance: 5, raw: 0, final: 0 });
    // Below 2^64 a balance is valid P26, but 2^60 is no binary64 integer result.
    expect(() => big(2n ** 60n)).toThrow(TdhOutsideEngineRange);
    expect(() => big(2n ** 64n)).toThrow(TdhInputInvalid);
    expect(() => computeCycle({ block: 2 ** 60, timestamp: T }, R)).toThrow(
      TdhOutsideEngineRange
    );
  });

  it("nets one transaction's movements of a token before the replay (D131)", () => {
    expect(
      netMovements([
        { from: A, to: "0xee", amount: 3 },
        { from: "0xee", to: A, amount: 2 },
        { from: "0xee", to: B, amount: 1 },
      ])
    ).toEqual({
      net: new Map([
        [A, -1n],
        ["0xee", 0n],
        [B, 1n],
      ]),
      pairs: [{ from: A, to: B, amount: 1n }],
    });
    expect(() =>
      netMovements([
        { from: DEAD, to: A, amount: 2n ** 64n - 1n },
        { from: DEAD, to: A, amount: 2n ** 64n - 1n },
      ])
    ).toThrow(/2\^64/);
  });
});

describe("the models' checked values (TDH-DESIGN §5)", () => {
  it("the machine: #2 at 100 days with no boost is 394; #4 with a Gradient is 1,335", () => {
    expect(finalTdh(baseTdh(rateCents(H, 1_000) ?? 0, 100), 100)).toBe(394);
    expect(finalTdh(baseTdh(rateCents(H, 301) ?? 0, 100), 102)).toBe(1_335);
  });

  it("an identity: linked, one band of 1.05 makes 42,720; apart, 35,588 and 5,084", () => {
    const rate = rateCents(H, 310) ?? 0;
    const base = baseTdh(rate, 100);
    expect(32 * finalTdh(base, 105)).toBe(42_720);
    expect([28 * base, 4 * base]).toEqual([35_588, 5_084]);
  });

  it("the engine facts: rates 3.94, 12.71, 13.09, 1.00, 39.02; boosts 1.02, 1.80, 2.04, 2.24", () => {
    expect([1_000, 310, 301, 3_941].map((e) => rateCents(H, e))).toEqual([
      394, 1_271, 1_309, 100,
    ]);
    expect(rateCents(H, 101, R.gradient_rate_minimum)).toBe(3_902);
    expect([boostOf({ gradients: 1 }), boostOf({ fullSets: 1 })]).toEqual([
      102, 180,
    ]);
    expect([highestBoost(ELIGIBLE, R).beta, boostCeiling(R)]).toEqual([
      204, 224,
    ]);
  });
});

describe("pair state (P26 §6.2)", () => {
  const event = (
    kind: DelegationEvent["kind"],
    from: string,
    to: string,
    block: number,
    timestamp?: number
  ): DelegationEvent => ({
    block,
    txIndex: 0,
    logIndex: 0,
    kind,
    from,
    to,
    collection: R.memes,
    ...(timestamp === undefined ? {} : { timestamp }),
  });
  const linked = [
    event("REGISTER", "A", "B", 10, 100),
    event("REGISTER", "B", "A", 11, 110),
  ];
  const row = (state: PairState): PairRow | undefined => state.get("A-B");

  it("confirms a pair when the second wallet registers, with both times", () => {
    expect(row(pairState(linked))).toEqual({
      w1: "A",
      w2: "B",
      position: [11n, 0n, 0n],
      confirmed: true,
      t1: 100n,
      t2: 110n,
    });
  });

  it("moves only the time when the first registrant registers again (vector 92)", () => {
    expect(
      row(pairState([...linked, event("REGISTER", "A", "B", 12, 120)]))
    ).toMatchObject({ position: [11n, 0n, 0n], t1: 120n, t2: 110n });
    expect(
      row(pairState([...linked, event("REGISTER", "B", "A", 13, 130)]))
    ).toMatchObject({ position: [13n, 0n, 0n], t1: 100n, t2: 130n });
  });

  it("keeps the first registrant's time on a re-registration without one; the second's moves the row and clears its own (vector 104)", () => {
    expect(
      row(pairState([...linked, event("REGISTER", "A", "B", 12)]))
    ).toEqual({
      w1: "A",
      w2: "B",
      position: [11n, 0n, 0n],
      confirmed: true,
      t1: 100n,
      t2: 110n,
    });
    expect(
      row(pairState([...linked, event("REGISTER", "B", "A", 13)]))
    ).toEqual({
      w1: "A",
      w2: "B",
      position: [13n, 0n, 0n],
      confirmed: true,
      t1: 100n,
      t2: null,
    });
    // A later timed registration gives the direction its time again.
    expect(
      row(
        pairState([
          ...linked,
          event("REGISTER", "A", "B", 12),
          event("REGISTER", "A", "B", 14, 140),
        ])
      )
    ).toMatchObject({ position: [11n, 0n, 0n], t1: 140n });
  });

  it("refuses a time of null: an event has a uint64 time or none", () => {
    const untyped = {
      ...event("REGISTER", "A", "B", 12),
      timestamp: null,
    } as unknown as DelegationEvent;
    expect(() => pairState([...linked, untyped])).toThrow(TdhInputInvalid);
  });

  it("turns the row round on a revocation, keeping the remaining direction's time (vector 93)", () => {
    expect(row(pairState([...linked, event("REVOKE", "A", "B", 12)]))).toEqual({
      w1: "B",
      w2: "A",
      position: [12n, 0n, 0n],
      confirmed: false,
      t1: 110n,
      t2: null,
    });
    expect(
      row(
        pairState([
          event("REGISTER", "A", "B", 10),
          event("REVOKE", "A", "B", 11),
        ])
      )
    ).toBeUndefined();
  });

  it("refuses two events at one position, and counts a missing time as before activation", () => {
    expect(() =>
      pairState([...linked, event("REGISTER", "C", "D", 11)])
    ).toThrow(TdhInputInvalid);
    expect(
      row(
        pairState([
          event("REGISTER", "A", "B", 1),
          event("REGISTER", "B", "A", 2),
        ])
      )
    ).toMatchObject({
      t1: null,
      t2: null,
    });
  });
});
