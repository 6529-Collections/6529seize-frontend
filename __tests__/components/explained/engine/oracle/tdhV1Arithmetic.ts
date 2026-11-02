/**
 * A frozen copy of `lib/tdh/tdhV1Arithmetic.ts` as it stood when
 * `components/explained/engine/` replaced it (7f2f68700e), kept only as the
 * oracle of `oracle.test.ts`: the engine must give its answers wherever the
 * two overlap. No page imports it. Do not edit.
 *
 * TDH-v1 arithmetic (specification P26, rule version `tdh-v1.0`, §4.3, §5.2,
 * §8). Used by the explanatory pages to compute their worked examples and the
 * explorables in the browser. The computation of record is the validators'
 * Rust core; this module only illustrates the same rule.
 *
 * Rates are integers in cents (394 means 3.94), boosts are integers in cents
 * (104 means 1.04) and boost parts are in micro-units (10^-6 of a
 * multiplier). P26 §1 allows `B64` to be evaluated with hardware binary64
 * division and multiplication, which is what JavaScript numbers are.
 */

export const DAY_SECONDS = 86_400;
const EDITION_FLOOR_CAP = 310;
export const EDITION_FLOOR_THRESHOLD = 300;
const SEASON_BONUS_U = 50_000;
const LAST_BOOSTED_SEASON = 20;
const GENESIS_BONUS_U = 10_000;
const NAKAMOTO_BONUS_U = 10_000;
const GRADIENT_BONUS_U = 20_000;
export const GRADIENT_MAX_COUNT = 5;

/** The first Meme id of each season, from the `tdh-v1.0` registry (§10). */
const SEASON_STARTS = [
  1, 48, 87, 119, 152, 181, 213, 246, 279, 311, 343, 375, 407, 439, 477, 516,
  556,
] as const;

/** The network as it stood on the 2026-10-11 cycle (P26 §5.2, replay). */
export const EXAMPLE_NETWORK = {
  largestEdition: 3_941,
  eligibleMemes: 559,
  gradients: 101,
  nextgenCollectionSize: 1_000,
} as const;

/**
 * Unix time of the snapshot block of cycle 20,742, block 26,201,364
 * (2026-10-15 23:59:59 UTC).
 */
export const EXAMPLE_SNAPSHOT_TIME = 1_792_108_799;

const ADD_FIRST_U = 50_000n;
const ADD_RATIO_NUMERATOR = 6_529n;
const ADD_RATIO_DENOMINATOR = 10_000n;
// ADD(sets) is constant at its limit from 33 sets on (P26 §8.3).
const ADD_SATURATION_SETS = 33;

/**
 * `HALFUP(x) = floor(x + 1/2)` for a finite binary64 value `x >= 0`, computed
 * exactly: `x - floor(x)` is exact in binary64, so no addition can round.
 */
function halfUpOfDouble(value: number): number {
  const whole = Math.floor(value);
  return value - whole >= 0.5 ? whole + 1 : whole;
}

/** `HALFUP(numerator / denominator)` for non-negative integers. */
export function halfUpRatio(numerator: number, denominator: number): number {
  return Math.floor((2 * numerator + denominator) / (2 * denominator));
}

/**
 * `RATE(n, d) = HALFUP( B64( B64(n / d) * 100 ) )` in cents (P26 §8.1). With
 * `minimumOne`, `B64(n / d)` is replaced by 1 when it is below 1, as for the
 * Gradient rate. Returns null when `d` is 0: a card with no copies has no rate.
 */
export function rateCents(
  numerator: number,
  denominator: number,
  minimumOne = false
): number | null {
  if (denominator <= 0) {
    return null;
  }
  const quotient = numerator / denominator;
  const scaled = (minimumOne && quotient < 1 ? 1 : quotient) * 100;
  return halfUpOfDouble(scaled);
}

/** True when `100n / d` is an exact half cent, the case binary64 decides. */
export function isRateHalfCentTie(numerator: number, denominator: number) {
  return denominator > 0 && (200 * numerator) % denominator === 0
    ? ((200 * numerator) / denominator) % 2 === 1
    : false;
}

/** `BASE(r, raw) = (r * raw + 50) div 100` (P26 §8.2). */
export function baseTdh(rate: number, rawDays: number): number {
  return Math.floor((rate * rawDays + 50) / 100);
}

/**
 * `FINAL(base, beta) = HALFUP( B64( base * B64(beta / 100) ) )` (P26 §8.4).
 */
export function finalTdh(base: number, betaCents: number): number {
  return halfUpOfDouble(base * (betaCents / 100));
}

/** Exact decimal half-up, the DEV-14 alternative: `(base * beta + 50) div 100`. */
export function finalTdhExactDecimal(base: number, betaCents: number): number {
  return Math.floor((base * betaCents + 50) / 100);
}

/**
 * The extra-set bonus in micro-units (P26 §8.3):
 * `ADD(sets) = HALFUP(10^6 * 0.05 * (1 - q^(sets-1)) / (1 - q))`, q = 0.6529,
 * evaluated as an exact rational.
 */
export function additionalSetsMicro(sets: number): number {
  if (sets <= 1) {
    return 0;
  }
  const exponent = BigInt(Math.min(sets, ADD_SATURATION_SETS) - 1);
  const denominatorPower = ADD_RATIO_DENOMINATOR ** exponent;
  const numeratorPower = ADD_RATIO_NUMERATOR ** exponent;
  // 10^6 * (1/20) * (1 - q^k) / (1 - q) with q = 6529/10000 and 1 - q = 3471/10000.
  const numerator =
    ADD_FIRST_U * ADD_RATIO_DENOMINATOR * (denominatorPower - numeratorPower);
  const denominator =
    (ADD_RATIO_DENOMINATOR - ADD_RATIO_NUMERATOR) * denominatorPower;
  return Number((2n * numerator + denominator) / (2n * denominator));
}

/** Seasons listed for a cycle: those whose first id is at most `nMemes`. */
export function seasonsFor(nMemes: number): number[] {
  return SEASON_STARTS.filter((start) => start <= nMemes).map(
    (_, index) => index + 1
  );
}

/** Seasons that pay a bonus: listed, not current, and within the schedule. */
export function boostableSeasons(nMemes: number): number[] {
  const listed = seasonsFor(nMemes);
  const current = listed.at(-1);
  return listed.filter(
    (season) => season !== current && season <= LAST_BOOSTED_SEASON
  );
}

interface BoostInput {
  /** Complete sets of every eligible Meme: the minimum balance across them. */
  readonly fullSets: number;
  /** Gradients held. */
  readonly gradients: number;
  /** Seasons held completely, by season number; used only without a full set. */
  readonly completeSeasons: readonly number[];
  /** Memes 1, 2 and 3 all held. */
  readonly genesis: boolean;
  /** Meme 4 held. */
  readonly nakamoto: boolean;
  /** Eligible Memes on the cycle (`n_memes`). */
  readonly nMemes: number;
}

export interface BoostBreakdown {
  readonly betaCents: number;
  readonly seasonsMicro: number;
  readonly additionalSetsMicro: number;
  readonly genesisMicro: number;
  readonly nakamotoMicro: number;
  readonly gradientsMicro: number;
  readonly boostableSeasons: readonly number[];
}

interface MemeBonus {
  readonly seasonsMicro: number;
  readonly extraMicro: number;
  readonly genesisMicro: number;
  readonly nakamotoMicro: number;
}

/**
 * `meme_u` of P26 §8.3: a full set pays every boostable season plus ADD; else
 * each complete boostable season pays, and an incomplete Season 1 pays the
 * Genesis and Nakamoto partials.
 */
function memeBonus(input: BoostInput, boostable: readonly number[]): MemeBonus {
  if (input.fullSets >= 1) {
    return {
      seasonsMicro: SEASON_BONUS_U * boostable.length,
      extraMicro: additionalSetsMicro(input.fullSets),
      genesisMicro: 0,
      nakamotoMicro: 0,
    };
  }
  const complete = new Set(input.completeSeasons);
  const paid = boostable.filter((season) => complete.has(season));
  const partialSeasonOne = boostable.includes(1) && !complete.has(1);
  return {
    seasonsMicro: SEASON_BONUS_U * paid.length,
    extraMicro: 0,
    genesisMicro: partialSeasonOne && input.genesis ? GENESIS_BONUS_U : 0,
    nakamotoMicro: partialSeasonOne && input.nakamoto ? NAKAMOTO_BONUS_U : 0,
  };
}

/** The boost of P26 §8.3, in cents, with its parts in micro-units. */
export function boost(input: BoostInput): BoostBreakdown {
  const boostable = boostableSeasons(input.nMemes);
  const gradientsMicro =
    GRADIENT_BONUS_U *
    Math.min(Math.max(input.gradients, 0), GRADIENT_MAX_COUNT);
  const { seasonsMicro, extraMicro, genesisMicro, nakamotoMicro } = memeBonus(
    input,
    boostable
  );

  const totalMicro =
    1_000_000 +
    seasonsMicro +
    extraMicro +
    genesisMicro +
    nakamotoMicro +
    gradientsMicro;
  return {
    betaCents: halfUpRatio(totalMicro, 10_000),
    seasonsMicro,
    additionalSetsMicro: extraMicro,
    genesisMicro,
    nakamotoMicro,
    gradientsMicro,
    boostableSeasons: boostable,
  };
}

/**
 * A Meme's effective edition (P26 §5.2): the minted count, or the floor from
 * its claim's mint limit when fewer than 300 copies are minted.
 */
export function effectiveEdition(
  minted: number,
  claimLimit: number,
  adjustment = 0
): { readonly edition: number; readonly floorApplied: boolean } {
  const adjusted = minted + adjustment;
  const floor =
    adjusted < EDITION_FLOOR_THRESHOLD && claimLimit > 0
      ? Math.min(claimLimit, EDITION_FLOOR_CAP)
      : 0;
  const edition = Math.max(adjusted, floor);
  return { edition, floorApplied: floor > adjusted };
}

/** `days(a) = (T - a) div DAY` (P26 §4.3). */
export function wholeDays(snapshotTime: number, acquiredAt: number): number {
  return Math.floor((snapshotTime - acquiredAt) / DAY_SECONDS);
}

/** Days since 1970-01-01 of a "YYYY-MM-DD" UTC date, or null when invalid. */
export function cycleDayOfDate(date: string): number | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
  if (match === null) {
    return null;
  }
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const time = Date.UTC(year, month - 1, day);
  const check = new Date(time);
  if (
    check.getUTCFullYear() !== year ||
    check.getUTCMonth() !== month - 1 ||
    check.getUTCDate() !== day
  ) {
    return null;
  }
  return time / (DAY_SECONDS * 1000);
}

/** The "YYYY-MM-DD" UTC date of a cycle day. */
export function dateOfCycleDay(cycleDay: number): string {
  return new Date(cycleDay * DAY_SECONDS * 1000).toISOString().slice(0, 10);
}

/** One copy's contribution to a record: its rate and its whole days. */
export interface CopyHolding {
  readonly rateCents: number;
  readonly days: number;
}

/**
 * Daily rate of a record in 10^-4 TDH a day (P26 §8.6):
 * `beta * sum(r over copies with days(a) > 0)`.
 */
export function dailyRateE4(
  betaCents: number,
  copies: readonly CopyHolding[]
): number {
  return (
    betaCents *
    copies.reduce((sum, copy) => sum + (copy.days > 0 ? copy.rateCents : 0), 0)
  );
}
