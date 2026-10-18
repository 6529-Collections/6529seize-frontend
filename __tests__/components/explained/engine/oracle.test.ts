/** @jest-environment node */
import {
  REGISTRY_V14,
  additionalSetsMicro,
  baseTdh,
  boostOfHoldings,
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
} from "@/components/explained/engine/tdh";
import * as oracle from "./oracle/tdhV1Arithmetic";

/**
 * The engine replaces `lib/tdh/tdhV1Arithmetic.ts`. On every input both
 * accept, it must give the old module's answer: random inputs from a seeded
 * generator, so a failure names a reproducible case. Where they differ by
 * design the domain says why.
 */
const R = REGISTRY_V14;
const RUNS = 2_000;

/** mulberry32: a small seeded generator, the same sequence on every run. */
function generator(seed: number) {
  let a = seed >>> 0;
  const next = () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4_294_967_296;
  };
  const int = (low: number, high: number) =>
    low + Math.floor(next() * (high - low + 1));
  const pick = <T>(xs: readonly T[]): T => xs[int(0, xs.length - 1)] as T;
  const bool = () => next() < 0.5;
  return { int, pick, bool };
}

function property<T>(
  seed: number,
  make: (g: ReturnType<typeof generator>) => T,
  check: (input: T) => void
): void {
  const g = generator(seed);
  for (let i = 0; i < RUNS; i++) {
    const input = make(g);
    try {
      check(input);
    } catch (error) {
      throw new Error(
        `case ${i} (seed ${seed}): ${JSON.stringify(input)}\n${String(error)}`
      );
    }
  }
}

/** Editions near the floor, the half-cent ties and the real ones. */
const EDITIONS = [
  0, 1, 8, 40, 56, 101, 200, 280, 299, 300, 301, 309, 310, 1_000, 1_400, 3_941,
];

describe("the engine agrees with the arithmetic it replaces", () => {
  it("RATE, with and without the Gradient minimum, and its half-cent ties", () => {
    property(
      1,
      (g) => ({
        n: g.bool() ? 3_941 : g.int(0, 10_000_000),
        d: g.bool() ? g.pick(EDITIONS) : g.int(0, 10_000_000),
        minimumOne: g.bool(),
      }),
      ({ n, d, minimumOne }) => {
        expect(
          rateCents(n, d, minimumOne ? R.gradient_rate_minimum : undefined)
        ).toBe(oracle.rateCents(n, d, minimumOne));
        expect(isRateHalfCentTie(n, d)).toBe(oracle.isRateHalfCentTie(n, d));
      }
    );
  });

  it("BASE, FINAL, the exact-decimal FINAL and HALFUP", () => {
    property(
      2,
      (g) => ({
        rate: g.int(0, 1_000_000),
        raw: g.int(0, 100_000_000),
        base: g.int(0, 1_000_000_000),
        beta: g.int(100, 300),
        n: g.int(0, 2_000_000_000),
        d: g.int(1, 1_000_000),
      }),
      ({ rate, raw, base, beta, n, d }) => {
        expect(baseTdh(rate, raw)).toBe(oracle.baseTdh(rate, raw));
        expect(finalTdh(base, beta)).toBe(oracle.finalTdh(base, beta));
        expect(finalTdhExactDecimal(base, beta)).toBe(
          oracle.finalTdhExactDecimal(base, beta)
        );
        expect(halfUpRatio(n, d)).toBe(oracle.halfUpRatio(n, d));
      }
    );
  });

  it("ADD for every set count", () => {
    for (let sets = 0; sets <= 3_000; sets++) {
      expect(additionalSetsMicro(sets, R)).toBe(
        oracle.additionalSetsMicro(sets)
      );
    }
  });

  it("the effective edition, FirstGM's adjustment included", () => {
    property(
      3,
      (g) => ({
        minted: g.bool() ? g.int(0, 400) : g.int(0, 10_000),
        claim: g.pick([0, 0, g.int(1, 400), g.int(1, 2 ** 32 - 1)]),
        adjustment: g.bool() ? 0 : R.firstgm_edition_adjustment,
      }),
      ({ minted, claim, adjustment }) => {
        const got = effectiveEdition(minted, claim, R, adjustment);
        expect({
          edition: got.edition,
          floorApplied: got.floorApplied,
        }).toEqual(oracle.effectiveEdition(minted, claim, adjustment));
      }
    );
  });

  it("the seasons listed and the ones that pay", () => {
    for (let nMemes = 0; nMemes <= 700; nMemes++) {
      const seasons = seasonsFor(nMemes, R);
      expect(seasons.map((s) => s.id)).toEqual(oracle.seasonsFor(nMemes));
      expect(boostableSeasons(seasons).map((s) => s.id)).toEqual(
        oracle.boostableSeasons(nMemes)
      );
    }
  });

  it("the boost and each of its parts", () => {
    property(
      4,
      (g) => {
        const nMemes = g.int(1, 600);
        const listed = oracle.seasonsFor(nMemes);
        const current = listed.at(-1) ?? 0;
        // A record without a full set misses at least one eligible Meme: the
        // old module took any description; the engine builds the balances
        // the description implies, so the domain leaves out the current
        // season when every other season is complete as well.
        const completeSeasons = listed.filter((s) => s !== current && g.bool());
        if (g.bool() && completeSeasons.length < listed.length - 1) {
          completeSeasons.push(current);
        }
        return {
          nMemes,
          fullSets: g.pick([0, 0, 0, 1, 2, 3, g.int(4, 40)]),
          gradients: g.int(0, 8),
          completeSeasons,
          genesis: g.bool(),
          nakamoto: g.bool(),
        };
      },
      (input) => {
        const old = oracle.boost(input);
        const got = boostOfHoldings(input, input.nMemes, R);
        expect({
          betaCents: got.beta,
          seasonsMicro: got.parts.seasons,
          additionalSetsMicro: got.parts.extraSets,
          genesisMicro: got.parts.genesis,
          nakamotoMicro: got.parts.nakamoto,
          gradientsMicro: got.parts.gradients,
          boostableSeasons: got.boostable,
        }).toEqual(old);
      }
    );
  });

  it("whole days, cycle days and dates", () => {
    property(
      5,
      (g) => {
        const year = g.int(1970, 2200);
        const month = g.int(0, 13);
        const day = g.int(0, 32);
        const pad = (x: number, width: number) =>
          String(x).padStart(width, "0");
        return {
          T: g.int(1_600_000_000, 1_900_000_000),
          age: g.int(0, 400 * 86_400),
          date: g.bool()
            ? `${pad(year, 4)}-${pad(month, 2)}-${pad(day, 2)}`
            : g.pick([
                "2026-10-11",
                "2026-1-11",
                "20261011",
                "",
                "2026-10-11T00",
              ]),
          cycleDay: g.int(0, 100_000),
        };
      },
      ({ T, age, date, cycleDay }) => {
        expect(wholeDays(T, T - age, R.day_s)).toBe(
          oracle.wholeDays(T, T - age)
        );
        expect(cycleDayOfDate(date)).toBe(oracle.cycleDayOfDate(date));
        expect(dateOfCycleDay(cycleDay)).toBe(oracle.dateOfCycleDay(cycleDay));
      }
    );
  });

  it("the daily rate", () => {
    property(
      6,
      (g) => ({
        beta: g.int(100, 225),
        copies: Array.from({ length: g.int(0, 12) }, () => ({
          rateCents: g.int(0, 400_000),
          days: g.int(0, 3) === 0 ? 0 : g.int(1, 2_000),
        })),
      }),
      ({ beta, copies }) => {
        expect(dailyRateE4(beta, copies)).toBe(
          oracle.dailyRateE4(beta, copies)
        );
      }
    );
  });

  it("differs only where P26 does: no cycle day before 1970", () => {
    expect(oracle.cycleDayOfDate("1969-12-31")).toBe(-1);
    expect(cycleDayOfDate("1969-12-31")).toBeNull();
  });
});
