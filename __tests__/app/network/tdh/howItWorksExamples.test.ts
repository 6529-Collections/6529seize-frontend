import {
  BOOST_EXAMPLES,
  EDITION_EXAMPLES,
  MAX_BOOST_CENTS,
  MINUTE_EXAMPLE,
  RATE_EXAMPLES,
  householdScenario,
} from "@/app/network/tdh/how-it-works/examples";
import { EXAMPLE_NETWORK } from "@/app/network/tdh/how-it-works/exampleNetwork";
import {
  REGISTRY_V14,
  boostOfHoldings,
} from "@/components/explained/engine/tdh";

import {
  BOOST_START,
  boostOf,
  extraSetsLimit,
  gradientLimit,
  payingSeasons,
} from "@/app/network/tdh/how-it-works/models/boost";
import {
  firstDay,
  hoursAndMinutes,
  type FirstDayWorld,
} from "@/app/network/tdh/how-it-works/models/firstDay";
import {
  caseI,
  firstCountingResult,
} from "@/app/network/tdh/how-it-works/models/eligibility";
import {
  identityValues,
  rateFromEditions,
} from "@/app/network/tdh/how-it-works/models/identity";
import { ENGINE } from "@/lib/explained/engine";
import { stackValues } from "@/app/network/tdh/how-it-works/models/stacks";
import {
  ROUND_TRIP,
  caseH,
  roundTripDays,
} from "@/app/network/tdh/how-it-works/models/netting";
import { ENGINE } from "@/lib/explained/engine";

// The worked examples of How TDH is calculated, checked against the numbers
// the P26 Python reference printed (plan, Appendix A).
describe("How TDH is calculated: worked examples", () => {
  it("prints the rate table of step 7", () => {
    expect(RATE_EXAMPLES.map((row) => [row.id, row.cents])).toEqual([
      ["firstgm", 100],
      ["nextgen", 394],
      ["meme310", 1_271],
      ["meme300", 1_314],
      ["gradient", 3_902],
    ]);
  });

  it("prints the edition floors of step 6", () => {
    expect(EDITION_EXAMPLES.map((row) => [row.edition, row.cents])).toEqual([
      [310, 1_271],
      // 149 minted under a claim limit of 200: the floor is the limit, and
      // 3,941 / 200 = 19.705 is a binary tie that rounds to 19.70.
      [200, 1_970],
      [310, 1_271],
      [300, 1_314],
      [303, 1_301],
      [309, 1_275],
    ]);
  });

  it("prints the boost table of step 9", () => {
    expect(
      Object.fromEntries(BOOST_EXAMPLES.map((row) => [row.id, row.betaCents]))
    ).toEqual({
      nothing: 100,
      oneGradient: 102,
      fiveGradients: 110,
      genesisNakamoto: 102,
      season2: 105,
      season2GenesisNakamoto: 107,
      currentSeasonOnly: 100,
      oneFullSet: 180,
      allButNewest: 180,
      twoFullSets: 185,
      threeFullSets: 188,
      oneFullSetFiveGradients: 190,
      highest: 204,
    });
  });

  it("reaches the highest boost from 8 full sets: 7 sets round to 2.03, 33 sets to 2.04", () => {
    const highest = (fullSets: number) =>
      boostOfHoldings(
        {
          fullSets,
          gradients: 5,
          completeSeasons: [],
          genesis: false,
          nakamoto: false,
        },
        EXAMPLE_NETWORK.eligibleMemes,
        REGISTRY_V14
      ).beta;
    expect([highest(7), highest(8), highest(33)]).toEqual([203, 204, 204]);
    expect(MAX_BOOST_CENTS).toBe(204);
  });

  it("computes the one-minute example: 100 days × 12.71 = 1,271, × 1.02 = 1,296", () => {
    expect(MINUTE_EXAMPLE).toMatchObject({
      rateCents: 1_271,
      base: 1_271,
      betaCents: 102,
      final: 1_296,
      // What moves it: one full set instead of the Gradient, 1.80.
      fullSetBetaCents: 180,
      fullSetFinal: 2_288,
    });
  });

  it("computes the household as one identity", () => {
    const result = householdScenario("identity");
    const [identity] = result.records;
    expect(identity?.betaCents).toBe(104);
    expect(
      identity?.rows.map((row) => [row.card, row.base, row.final])
    ).toEqual([
      ["firstgm", 320, 333],
      ["meme310", 1_144, 1_190],
      ["gradient1", 15_608, 16_232],
      ["gradient2", 1_171, 1_218],
      ["nextgen", 1_438, 1_496],
    ]);
    expect(identity?.base).toBe(19_681);
    expect(result.total).toBe(20_469);
    expect(identity?.dailyRateE4).toBe(1_005_576);
  });

  it("computes the household as two wallets, tomorrow and after selling Gradient 2", () => {
    const wallets = householdScenario("wallets");
    expect(
      wallets.records.map((record) => [
        record.label,
        record.betaCents,
        record.base,
        record.final,
      ])
    ).toEqual([
      ["A", 102, 15_928, 16_246],
      ["B", 102, 3_753, 3_828],
    ]);
    expect(wallets.records.map((record) => record.dailyRateE4)).toEqual([
      418_404, 567_834,
    ]);
    expect(wallets.total).toBe(20_074);

    const tomorrow = householdScenario("tomorrow");
    expect(tomorrow.total).toBe(20_583);
    expect(tomorrow.records[0]?.rows.map((row) => row.final)).toEqual([
      335, 1_217, 16_273, 1_258, 1_500,
    ]);

    const sell = householdScenario("sell");
    expect(sell.records[0]?.betaCents).toBe(102);
    expect(sell.total).toBe(18_880);
  });
});

/**
 * The How it works models (TDH-DESIGN.md §5.3 to §5.7) against the values
 * the design and the Lean manifest give, computed by the TDH v1.4 engine.
 */
const WORLD: FirstDayWorld = {
  example: Date.parse("2026-10-17T19:05:00Z") / 1000,
  dayS: 86_400,
};
const iso = (seconds: number | null) =>
  seconds === null ? null : new Date(seconds * 1000).toISOString();

describe("A card ages", () => {
  it("counts a copy that arrived Oct 17 19:05 from the result of Oct 19", () => {
    const result = firstDay(WORLD, "example", false);
    expect(iso(result.first)).toBe("2026-10-19T00:00:00.000Z");
    expect(hoursAndMinutes(result.heldAtFirst ?? 0)).toEqual({
      hours: 28,
      minutes: 55,
    });
    expect(hoursAndMinutes(result.heldBefore ?? 0)).toEqual({
      hours: 4,
      minutes: 55,
    });
  });

  it("answers the guess: 23:59 counts Oct 19, 00:01 counts Oct 20", () => {
    expect(iso(firstDay(WORLD, "beforeMidnight", false).first)).toBe(
      "2026-10-19T00:00:00.000Z"
    );
    expect(iso(firstDay(WORLD, "afterMidnight", false).first)).toBe(
      "2026-10-20T00:00:00.000Z"
    );
  });

  it("Break it: sold before a whole day, no result counts it", () => {
    const result = firstDay(WORLD, "example", true);
    expect(result.first).toBeNull();
    expect(iso(result.sold)).toBe("2026-10-18T12:05:00.000Z");
  });
});

describe("Inside one transaction", () => {
  it("keeps the days when the round trip is one transaction", () => {
    expect(roundTripDays(true)).toBe(ROUND_TRIP.heldDays);
    expect(roundTripDays(false)).toBe(0);
  });

  it("reproduces counterexample H", () => {
    expect(caseH(false)).toEqual({
      minted1: 10,
      H: 10,
      rate2: 200,
      bFinal: 800,
      total: 1710,
    });
    expect(caseH(true)).toEqual({
      minted1: 20,
      H: 20,
      rate2: 400,
      bFinal: 1600,
      total: 2510,
    });
  });
});

describe("The boost ladder", () => {
  const n = 562;
  it("starts at one Gradient, 1.02", () => {
    expect(boostOf(BOOST_START, n).beta).toBe(102);
  });

  it("agrees with the facts layer's seam", () => {
    expect(boostOf({ ...BOOST_START, sets: 1, gradients: 0 }, n).beta).toBe(
      ENGINE.boostCents({
        fullSets: 1,
        gradients: 0,
        completeSeasons: [],
        genesis: false,
        nakamoto: false,
        nMemes: n,
      })
    );
  });

  it("pays sixteen seasons today, and a sixth Gradient adds nothing", () => {
    expect(payingSeasons(n)).toBe(16);
    expect(gradientLimit()).toBe(5);
    const five = boostOf({ ...BOOST_START, gradients: 5 }, n).beta;
    expect(boostOf({ ...BOOST_START, gradients: 6 }, n).beta).toBe(five);
    expect(extraSetsLimit()).toBeCloseTo(0.144051, 6);
  });

  it("counts Genesis and Nakamoto only before the first season completes", () => {
    const singles = {
      ...BOOST_START,
      gradients: 0,
      genesis: true,
      nakamoto: true,
    };
    expect(boostOf(singles, n).beta).toBe(102);
    expect(boostOf({ ...singles, seasons: 1 }, n).beta).toBe(105);
  });
});

describe("An identity", () => {
  // Season 13's real editions (6529.io's API): five cards differ from 310.
  const SEASON_13_EDITIONS: Readonly<Record<number, number>> = {
    407: 335,
    413: 329,
    420: 328,
    433: 328,
    438: 305,
  };
  const editions = Array.from({ length: 32 }, (_, i) => {
    const id = 407 + i;
    return [
      id,
      13,
      SEASON_13_EDITIONS[id] ?? 310,
      SEASON_13_EDITIONS[id] ?? 310,
    ];
  });

  it("gives 42,419 linked and 35,282 and 5,105 apart, each card at its own rate", () => {
    const values = identityValues(
      rateFromEditions(editions, 3941, ENGINE.rateCents),
      562
    );
    // The Python reference gives 42,419 for the linked identity holding
    // every card 100 days (P26 §8.1 to §8.4).
    expect(values).toEqual({
      season: 13,
      days: 100,
      cards: 32,
      inA: 28,
      inB: 4,
      boostCents: 105,
      apartBoostCents: 100,
      linkedTdh: 42_419,
      aTdh: 35_282,
      bTdh: 5_105,
      typical: { rateCents: 1271, cards: 27, base: 1271, linkedFinal: 1335 },
    });
  });

  it("is not drawn when a card's edition is unknown", () => {
    expect(identityValues(() => null, 562)).toBeNull();
  });
});

describe("Which cards count", () => {
  it("counts a card from the first result a whole day after its first mint", () => {
    const day = REGISTRY_V14.day_s;
    // Meme #562: first minted 2026-10-16 09:06 UTC, counted from Oct 18.
    const mint = Date.parse("2026-10-16T09:06:00Z") / 1000;
    expect(firstCountingResult(mint, day)).toBe(
      Date.parse("2026-10-18T00:00:00Z") / 1000
    );
    // A first mint at exactly midnight still misses the next result: T is
    // the last block before the boundary.
    const midnight = Date.parse("2026-10-16T00:00:00Z") / 1000;
    expect(firstCountingResult(midnight, day)).toBe(
      Date.parse("2026-10-18T00:00:00Z") / 1000
    );
  });

  it("reproduces counterexample I as P26 §7.1 writes it", () => {
    expect(caseI(false)).toEqual({
      lateCounts: false,
      eligible: 1,
      H: 3,
      aBalance: 0,
      yFinal: 32,
    });
    expect(caseI(true)).toEqual({
      lateCounts: true,
      eligible: 2,
      H: 6,
      aBalance: 5,
      yFinal: 60,
    });
  });
});

describe("Sales and moves", () => {
  it("adds both copies' days while nothing happens", () => {
    expect(stackValues("hold")).toEqual({
      a: [10],
      b: [300],
      sold: null,
      raw: 310,
    });
  });

  it("sells the copy received last", () => {
    expect(stackValues("sell")).toEqual({
      a: [],
      b: [300],
      sold: 10,
      raw: 300,
    });
  });

  it("keeps a copy's age on a move inside the identity", () => {
    expect(stackValues("move")).toEqual({
      a: [10, 300],
      b: [],
      sold: null,
      raw: 310,
    });
  });

  it("Break it: the moved copy is last in, so it is sold first", () => {
    expect(stackValues("moveThenSell")).toEqual({
      a: [10],
      b: [],
      sold: 300,
      raw: 10,
    });
  });
});
