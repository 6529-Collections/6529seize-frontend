/**
 * P26 §5.2 to §8.6: editions, rates, seasons, boosts and finals, as exact
 * functions of the registry.
 *
 * `B64` (P26 §1) is evaluated with hardware binary64 division and
 * multiplication, which P26 allows and which JavaScript numbers are; every
 * other value is an exact integer. Rates and boosts are integers in cents
 * (394 means 3.94), boost parts in micro-units (10^-6 of a multiplier).
 */

import {
  TdhOutsideEngineRange,
  invalid,
  readUint,
  rulesOf,
  type Registry,
  type Uint,
} from "./registry";

const MAX_SAFE = BigInt(Number.MAX_SAFE_INTEGER);

function safeInteger(value: number, what: string): void {
  if (!Number.isSafeInteger(value)) {
    throw new TdhOutsideEngineRange(
      `${what} = ${value} is not an integer below 2^53`
    );
  }
}

/** `HALFUP(x) = floor(x + 1/2)` for a binary64 `x >= 0`, exactly. */
function halfUpDouble(x: number): number {
  const whole = Math.floor(x);
  // x - floor(x) is exact in binary64, so no addition can round.
  return x - whole >= 0.5 ? whole + 1 : whole;
}

/** `HALFUP(numerator / denominator)` for non-negative integers. */
export function halfUpRatio(numerator: number, denominator: number): number {
  safeInteger(numerator, "numerator");
  safeInteger(denominator, "denominator");
  const n = BigInt(numerator);
  const d = BigInt(denominator);
  return Number((2n * n + d) / (2n * d));
}

/**
 * `RATE(n, d) = HALFUP( B64( B64(n / d) * 100 ) )` in cents (P26 §8.1).
 * With `minimumCents` (the registry's `gradient_rate_minimum`), `B64(n / d)`
 * is replaced by `B64(minimumCents / 100)` when below it. Returns null when
 * `d` is 0: a card with no copies has no rate.
 */
export function rateCents(
  numerator: number,
  denominator: number,
  minimumCents?: number
): number | null {
  safeInteger(numerator, "RATE's numerator");
  safeInteger(denominator, "RATE's denominator");
  if (denominator <= 0) {
    return null;
  }
  let quotient = numerator / denominator;
  if (minimumCents !== undefined && quotient < minimumCents / 100) {
    quotient = minimumCents / 100;
  }
  return halfUpDouble(quotient * 100);
}

/**
 * True when `100n / d` is an exact half cent: the one case where binary64
 * decides the rate. With H = 3,941 that is E in {8, 40, 56, 200, 280, 1,400},
 * and `RATE(3941, 200)` is 1,970 where half-up would give 1,971 (P26 §8.1).
 */
export function isRateHalfCentTie(
  numerator: number,
  denominator: number
): boolean {
  if (denominator <= 0) {
    return false;
  }
  const twice = 200n * BigInt(numerator);
  const d = BigInt(denominator);
  return twice % d === 0n && (twice / d) % 2n === 1n;
}

/** `BASE(r, raw) = (r * raw + 50) div 100` (P26 §8.2). */
export function baseTdh(rate: number, raw: number): number {
  safeInteger(rate, "rate");
  safeInteger(raw, "raw");
  return Number((BigInt(rate) * BigInt(raw) + 50n) / 100n);
}

/**
 * `FINAL(base, beta) = HALFUP( B64( base * B64(beta / 100) ) )` (P26 §8.4).
 * It equals `(base * beta + 50) div 100` except when `base * beta` is 50
 * modulo 100; then the binary64 product decides (vector 12b).
 */
export function finalTdh(base: number, beta: number): number {
  safeInteger(base, "base");
  safeInteger(beta, "beta");
  if (BigInt(base) * BigInt(beta) >= 2n ** 53n) {
    throw invalid(
      "base * beta is 2^53 or more, outside the tdh-v1.4 range (P26 §8.7)"
    );
  }
  return halfUpDouble(base * (beta / 100));
}

/**
 * The exact-decimal alternative, `(base * beta + 50) div 100`. Not the rule:
 * P26 §11 records it as DEV-14, for comparison with `finalTdh`.
 */
export function finalTdhExactDecimal(base: number, beta: number): number {
  return Number((BigInt(base) * BigInt(beta) + 50n) / 100n);
}

function ceilDiv(a: bigint, b: bigint): bigint {
  return a >= 0n ? (a + b - 1n) / b : -(-a / b);
}

interface AddSeries {
  readonly limit: bigint;
  readonly value: (sets: bigint) => { value: bigint; reachedAt: bigint };
}

/**
 * ADD's series (P26 §8.3), with `n = sets - 1`, as an exact rational:
 * `HALFUP(first * (1 - q^n) / (1 - q))`. It grows towards
 * `L = first / (1 - q)`; once it reaches `ceil(L - 1/2)`, the limit of the
 * rounded values, it stays there.
 */
function addSeries(r: Registry): AddSeries {
  const rules = rulesOf(r);
  const first = rules.addFirst;
  const qn = rules.addRatio;
  const qd = 10_000n;
  const ld = qd - qn;
  const limit = ceilDiv(2n * first * qd - ld, 2n * ld);
  return {
    limit,
    value(sets) {
      const n = sets - 1n;
      let pn = 1n;
      let pd = 1n;
      let value = 0n;
      let k = 0n;
      while (k < n && (k === 0n || value < limit)) {
        k += 1n;
        pn *= qn;
        pd *= qd;
        const num = first * qd * (pd - pn);
        const den = ld * pd;
        value = (2n * num + den) / (2n * den);
      }
      return { value, reachedAt: k + 1n };
    },
  };
}

/**
 * `ADD(sets)` in micro-units (P26 §8.3): 0 for one set or none; 50,000 for
 * two, 82,645 for three and 144,051 from 33 on in `tdh-v1.4`. The point from
 * which it is constant is derived from the registry, never hard-coded.
 */
export function additionalSetsMicro(sets: Uint, r: Registry): number {
  const n = readUint(sets, 256, "sets");
  if (n <= 1n) {
    return 0;
  }
  return Number(addSeries(r).value(n).value);
}

/** ADD's limit in micro-units and the number of sets that first reaches it. */
export function additionalSetsLimit(r: Registry): {
  readonly micro: number;
  readonly fromSets: number;
} {
  const series = addSeries(r);
  // With unbounded sets the series runs until it reaches its limit, and
  // `reachedAt` is the first set count whose value is the limit.
  const step = series.value(2n ** 256n);
  return {
    micro: Number(series.limit),
    fromSets: Number(step.reachedAt),
  };
}

interface EffectiveEdition {
  /** `E`, the edition the rate divides by. */
  readonly edition: number;
  /** True when the floor raised the edition above the minted count. */
  readonly floorApplied: boolean;
  /** The floor: min(totalMax, cap) below the threshold with a claim, else 0. */
  readonly floor: number;
  /** Minted plus the adjustment (FirstGM: -2,588). */
  readonly adjusted: number;
}

/**
 * A Meme's effective edition (P26 §5.2): `E = max(minted + adj, floor)`,
 * where the floor is `min(totalMax, edition_floor_cap)` when `minted + adj`
 * is below `edition_floor_threshold` and the claim has a positive
 * `totalMax`, else 0.
 */
export function effectiveEdition(
  minted: number,
  totalMax: number,
  r: Registry,
  adjustment = 0
): EffectiveEdition {
  const rules = rulesOf(r);
  safeInteger(minted, "minted");
  safeInteger(totalMax, "totalMax");
  safeInteger(adjustment, "adjustment");
  const adjusted = BigInt(minted) + BigInt(adjustment);
  const claim = BigInt(totalMax);
  let floor = 0n;
  if (adjusted < rules.floorThreshold && claim > 0n) {
    floor = claim < rules.floorCap ? claim : rules.floorCap;
  }
  const edition = adjusted > floor ? adjusted : floor;
  return {
    edition: Number(edition),
    floorApplied: floor > adjusted,
    floor: Number(floor),
    adjusted: Number(adjusted),
  };
}

export interface Season {
  readonly id: number;
  readonly start: number;
  /**
   * The season's last Meme id, or null for the registry's last season. Only
   * a boostable season's end is ever read, and it is always known.
   */
  readonly end: number | null;
  /** In micro-units: `season_bonus` up to `last_boosted_season`, else 0. */
  readonly bonus: number;
}

/**
 * The seasons listed for a cycle (P26 §5.4): the registry seasons whose
 * first Meme id is at most `nMemes`, the number of eligible Memes.
 */
export function seasonsFor(nMemes: number, r: Registry): Season[] {
  const rules = rulesOf(r);
  safeInteger(nMemes, "n_memes");
  const n = BigInt(nMemes);
  const starts = rules.seasonStarts;
  const out: Season[] = [];
  for (let i = 0; i < starts.length; i++) {
    const start = starts[i] as bigint;
    if (start > n) {
      break;
    }
    const next = starts[i + 1];
    const end =
      next === undefined || next - 1n > MAX_SAFE ? null : Number(next - 1n);
    const id = i + 1;
    out.push({
      id,
      start: Number(start),
      end,
      bonus: id <= rules.lastBoostedSeason ? rules.seasonBonus : 0,
    });
  }
  return out;
}

/** Seasons that pay: listed, not the current (highest) one, bonus above 0. */
export function boostableSeasons(seasons: readonly Season[]): Season[] {
  const current = seasons.at(-1)?.id ?? 0;
  return seasons.filter((s) => s.id < current && s.bonus > 0);
}

export interface BoostParts {
  readonly seasons: number;
  readonly extraSets: number;
  readonly genesis: number;
  readonly nakamoto: number;
  readonly gradients: number;
}

export interface BoostResult {
  /** `beta` in cents: 104 means 1.04. */
  readonly beta: number;
  /** 10^6 plus every part, in micro-units. */
  readonly micro: number;
  /** Complete sets of every eligible Meme: the minimum balance, or 0. */
  readonly sets: Uint;
  /** Which branch of P26 §8.3 paid the Meme bonus. */
  readonly branch: "fullSet" | "seasons";
  /** Each part in micro-units. */
  readonly parts: BoostParts;
  /** The seasons whose bonus counts. */
  readonly paidSeasons: readonly number[];
  /** The boostable seasons of the cycle. */
  readonly boostable: readonly number[];
}

function idKey(id: Uint): string {
  return BigInt(id).toString();
}

type Holds = (key: string) => boolean;

/** The Meme part of a boost (P26 §8.3's `meme_u`) and the seasons it paid. */
interface MemeBonus {
  readonly seasons: number;
  readonly extraSets: number;
  readonly genesis: number;
  readonly nakamoto: number;
  readonly paid: readonly number[];
}

/** Complete sets of every eligible Meme: the minimum balance, or 0. */
function fullSetsOf(
  eligible: readonly string[],
  balanceOf: (key: string) => bigint,
  holds: Holds
): bigint {
  if (eligible.length === 0 || !eligible.every(holds)) {
    return 0n;
  }
  return eligible.reduce(
    (low, key) => (balanceOf(key) < low ? balanceOf(key) : low),
    balanceOf(eligible[0] as string)
  );
}

/** A full set pays every boostable season, plus ADD for the extra sets. */
function fullSetBonus(
  boostable: readonly Season[],
  sets: bigint,
  r: Registry
): MemeBonus {
  return {
    seasons: boostable.reduce((sum, s) => sum + s.bonus, 0),
    extraSets: additionalSetsMicro(sets, r),
    genesis: 0,
    nakamoto: 0,
    paid: boostable.map((s) => s.id),
  };
}

/** True when the record holds every Meme of a season whose end is known. */
function holdsSeason(s: Season, holds: Holds): boolean {
  if (s.end === null) {
    return false;
  }
  for (let id = s.start; id <= s.end; id++) {
    if (!holds(String(id))) {
      return false;
    }
  }
  return true;
}

/**
 * Without a full set, each complete boostable season pays; an incomplete
 * Season 1 pays the Genesis and Nakamoto partials instead.
 */
function seasonsBonus(
  boostable: readonly Season[],
  holds: Holds,
  r: Registry
): MemeBonus {
  const rules = rulesOf(r);
  const holdsAll = (ids: readonly bigint[]): boolean =>
    ids.every((id) => holds(idKey(id)));
  const paid: number[] = [];
  let seasons = 0;
  let genesis = 0;
  let nakamoto = 0;
  for (const s of boostable) {
    const complete = holdsSeason(s, holds);
    if (s.id === 1 && !complete) {
      genesis += holdsAll(rules.genesisIds) ? rules.genesisBonus : 0;
      nakamoto += holdsAll(rules.nakamotoIds) ? rules.nakamotoBonus : 0;
    } else if (complete) {
      seasons += s.bonus;
      paid.push(s.id);
    }
  }
  return { seasons, extraSets: 0, genesis, nakamoto, paid };
}

/**
 * The boost of one record (P26 §8.3). `memesBal` maps eligible Meme ids
 * (decimal) to the record's balance; `gradients` is the number of distinct
 * eligible Gradients it holds; `eligibleMemes` lists the cycle's eligible
 * Memes; `seasons` is `seasonsFor(eligibleMemes.length, r)`. A record holds
 * a Meme when it is eligible and the balance is positive, whatever the
 * copies' ages.
 */
export function boost(
  memesBal: Readonly<Record<string, Uint>>,
  gradients: number,
  eligibleMemes: readonly Uint[],
  seasons: readonly Season[],
  r: Registry
): BoostResult {
  const rules = rulesOf(r);
  safeInteger(gradients, "gradients");
  const eligible = eligibleMemes.map(idKey);
  const eligibleSet = new Set(eligible);
  const balanceOf = (key: string): bigint => {
    const value = memesBal[key];
    return value === undefined ? 0n : BigInt(value);
  };
  const holds = (key: string): boolean =>
    eligibleSet.has(key) && balanceOf(key) > 0n;
  const sets = fullSetsOf(eligible, balanceOf, holds);
  const boostable = boostableSeasons(seasons);
  const bonus =
    sets >= 1n
      ? fullSetBonus(boostable, sets, r)
      : seasonsBonus(boostable, holds, r);
  const gradientsMicro =
    rules.gradientBonus * Math.min(gradients, rules.gradientMaxCount);
  const micro =
    1_000_000 +
    bonus.seasons +
    bonus.extraSets +
    bonus.genesis +
    bonus.nakamoto +
    gradientsMicro;
  return {
    beta: halfUpRatio(micro, 10_000),
    micro,
    sets: sets <= MAX_SAFE ? Number(sets) : sets,
    branch: sets >= 1n ? "fullSet" : "seasons",
    parts: {
      seasons: bonus.seasons,
      extraSets: bonus.extraSets,
      genesis: bonus.genesis,
      nakamoto: bonus.nakamoto,
      gradients: gradientsMicro,
    },
    paidSeasons: bonus.paid,
    boostable: boostable.map((s) => s.id),
  };
}

/** What a record holds, in the terms P26 §8.3 reads (the boost ladder). */
export interface BoostHoldings {
  /** Complete sets of every eligible Meme. */
  readonly fullSets: number;
  /** Seasons held completely; read only without a full set. */
  readonly completeSeasons: readonly number[];
  /** Every Meme of `genesis_ids` held. */
  readonly genesis: boolean;
  /** Every Meme of `nakamoto_ids` held. */
  readonly nakamoto: boolean;
  /** Distinct eligible Gradients held. */
  readonly gradients: number;
}

/**
 * The boost of a record described by what it holds, on a cycle with Memes 1
 * to `nMemes` eligible. It builds the balances those holdings imply and runs
 * `boost` on them, so the ladder model computes with the rule itself. A
 * description that holds every eligible Meme is a full set, whatever
 * `fullSets` says.
 */
export function boostOfHoldings(
  holdings: BoostHoldings,
  nMemes: number,
  r: Registry
): BoostResult {
  const rules = rulesOf(r);
  const seasons = seasonsFor(nMemes, r);
  const balances: Record<string, number> = {};
  const hold = (id: number, count: number): void => {
    if (id >= 1 && id <= nMemes) {
      balances[String(id)] = Math.max(balances[String(id)] ?? 0, count);
    }
  };
  for (let id = 1; id <= nMemes; id++) {
    if (holdings.fullSets >= 1) {
      hold(id, holdings.fullSets);
    }
  }
  const complete = new Set(holdings.completeSeasons);
  for (const s of seasons) {
    if (complete.has(s.id)) {
      for (let id = s.start; id <= (s.end ?? nMemes); id++) {
        hold(id, 1);
      }
    }
  }
  const holdIds = (ids: readonly bigint[]): void => {
    for (const id of ids) {
      if (id <= MAX_SAFE) {
        hold(Number(id), 1);
      }
    }
  };
  if (holdings.genesis) {
    holdIds(rules.genesisIds);
  }
  if (holdings.nakamoto) {
    holdIds(rules.nakamotoIds);
  }
  const eligible = Array.from({ length: nMemes }, (_, i) => i + 1);
  return boost(balances, holdings.gradients, eligible, seasons, r);
}

/**
 * The highest boost the registry allows once `last_boosted_season` seasons
 * pay: 1 + 20 × 0.05 + ADD's limit + 5 × 0.02 = 2.244051, 2.24 in
 * `tdh-v1.4` (P26 §8.3, §10).
 */
export function boostCeiling(r: Registry): number {
  const rules = rulesOf(r);
  return halfUpRatio(
    1_000_000 +
      rules.lastBoostedSeason * rules.seasonBonus +
      additionalSetsLimit(r).micro +
      rules.gradientMaxCount * rules.gradientBonus,
    10_000
  );
}

/**
 * The highest boost on a cycle with `nMemes` eligible Memes: full sets
 * enough for ADD's limit and the most Gradients that count. With 559 to 562
 * eligible Memes, 17 seasons are listed and 16 pay, so it is 2.04.
 */
export function highestBoost(nMemes: number, r: Registry): BoostResult {
  const rules = rulesOf(r);
  return boostOfHoldings(
    {
      fullSets: additionalSetsLimit(r).fromSets,
      completeSeasons: [],
      genesis: false,
      nakamoto: false,
      gradients: rules.gradientMaxCount,
    },
    nMemes,
    r
  );
}

/** One copy's contribution to a record's daily rate. */
export interface CopyHolding {
  readonly rateCents: number;
  readonly days: number;
}

/**
 * A record's daily rate in 10^-4 TDH a day (P26 §8.6): `beta` times the sum
 * of the rates of its copies held at least one whole day.
 */
export function dailyRateE4(
  beta: number,
  copies: readonly CopyHolding[]
): number {
  return (
    beta *
    copies.reduce((sum, copy) => sum + (copy.days > 0 ? copy.rateCents : 0), 0)
  );
}
