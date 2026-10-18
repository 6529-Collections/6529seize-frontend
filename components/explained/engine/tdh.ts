/**
 * The TDH v1.4 engine of 6529 Explained: a typed, registry-driven port of
 * P26 (6529chain at 3bfa7b0, D136's four-wallet consolidation and D137's
 * names included), and the one computation every model on the TDH pages
 * reads. It replaces `lib/tdh/tdhV1Arithmetic.ts`.
 *
 * Scope: one cycle from decoded inputs (P26 §3 to §9), the registry and its
 * hash (§10, `registryHash.ts`), cycle dates and the cutoff (§4). Ethereum
 * log decoding (§3.1 log selection, §3.2 and §6.1 ABI decoding) is the
 * validators' readers' work, not the explorables'.
 *
 * Every function is pure. Every rule value comes from the `Registry` passed
 * in. CI checks the engine against P26's conformance vectors and the D136
 * checks (`__tests__/components/explained/engine/`).
 */

import {
  boost,
  finalTdh,
  rateCents,
  seasonsFor,
  type BoostResult,
  type Season,
} from "./arithmetic";
import {
  clustersWithKept,
  comparePositions,
  readDelegationEvent,
  type CheckedEvent,
  type ClusterResult,
  type DelegationEvent,
} from "./consolidation";
import {
  canonicalOrder,
  readTransfer,
  replayHoldings,
  type CanonicalTransfer,
  type Stacks,
  type Transfer,
} from "./holdings";
import {
  ZERO,
  invalid,
  readUint,
  rulesOf,
  toSafeNumber,
  type Registry,
  type Rules,
  type Uint,
} from "./registry";

export {
  ABSOLUTES,
  DAY,
  DEAD,
  REGISTRY_FIELDS,
  REGISTRY_V14,
  TdhInputInvalid,
  TdhOutsideEngineRange,
  ZERO,
  diffRegistry,
  fork,
  validateRegistry,
  type Registry,
} from "./registry";
export {
  additionalSetsLimit,
  additionalSetsMicro,
  baseTdh,
  boost,
  boostCeiling,
  boostOfHoldings,
  boostableSeasons,
  dailyRateE4,
  effectiveEdition,
  finalTdh,
  finalTdhExactDecimal,
  halfUpRatio,
  highestBoost,
  isRateHalfCentTie,
  rateCents,
  seasonsFor,
  type BoostHoldings,
  type BoostResult,
  type CopyHolding,
  type Season,
} from "./arithmetic";
export {
  clusters,
  pairState,
  type ClusterResult,
  type DelegationEvent,
  type PairRow,
  type PairState,
} from "./consolidation";
export { netMovements, type Transfer } from "./holdings";
export {
  cycleBoundary,
  cycleDayOfDate,
  cycleDayOfUploadDate,
  dateOfCycleDay,
  selectCutoff,
  wholeDays,
} from "./time";

/** One cycle's inputs, decoded (P26 §2, §3.2, §5.2, §6.1). */
export interface CycleInput {
  /** `B`, the cutoff block (P26 §4.2). */
  readonly block: Uint;
  /** `T`, the cutoff block's timestamp. */
  readonly timestamp: Uint;
  readonly transfers?: readonly Transfer[];
  readonly delegationEvents?: readonly DelegationEvent[];
  /**
   * Manifold's `totalMax` at `B` by Meme id (decimal key, a `uint32` value);
   * an absent id has no claim (P26 §5.2).
   */
  readonly claimMax?: Readonly<Record<string, Uint>>;
}

/** A token's values in one record (P26 §7.2, §8.4). */
export interface TokenRecord {
  readonly balance: number;
  readonly raw: number;
  /** In cents. */
  readonly rate: number;
  readonly base: number;
  readonly final: number;
  /** Copies held at least one whole day, for the daily rate. */
  readonly aged: number;
}

/** A wallet or identity record (P26 §7.3, §8). */
export interface CycleRecord {
  /** By decimal token id. */
  readonly memes: Readonly<Record<string, TokenRecord>>;
  readonly gradients: Readonly<Record<string, TokenRecord>>;
  readonly nextgen: Readonly<Record<string, TokenRecord>>;
  readonly balance: number;
  readonly raw: number;
  readonly base: number;
  readonly final: number;
  /** `beta` in cents, the record's own. */
  readonly boostCents: number;
  readonly boost: BoostResult;
  /** The daily rate in 10^-4 TDH a day (P26 §8.6). */
  readonly rateE4: number;
}

export interface IdentityRecord extends CycleRecord {
  readonly wallets: readonly string[];
}

export interface CycleTotals {
  readonly final: number;
  readonly finalExcludingSinks: number;
  readonly base: number;
  readonly raw: number;
}

export interface CycleResult {
  readonly ruleVersion: string;
  /** The largest eligible edition (P26 §5.2). */
  readonly H: number;
  /** Each eligible Meme's effective edition, by decimal id. */
  readonly edition: Readonly<Record<string, number>>;
  /** Each eligible token's rate in cents, by `contract#id`. */
  readonly rates: Readonly<Record<string, number>>;
  /** The eligible Memes' ids, ascending. */
  readonly eligibleMemes: readonly string[];
  readonly seasons: readonly Season[];
  readonly clusters: ClusterResult;
  /** By wallet address. */
  readonly wallets: Readonly<Record<string, CycleRecord>>;
  /** By identity key: the cluster's addresses sorted and joined with `-`. */
  readonly identities: Readonly<Record<string, IdentityRecord>>;
  readonly totals: CycleTotals;
}

const RANGE_LIMIT = 2n ** 53n;
const AMOUNT_LIMIT = 2n ** 64n;
const CANONICAL_DECIMAL = /^(0|[1-9][0-9]*)$/;

function compareIds(a: bigint, b: bigint): number {
  if (a === b) {
    return 0;
  }
  return a < b ? -1 : 1;
}

/** Manifold floors (P26 §5.2): `min(totalMax, cap)` for a positive claim. */
function editionFloors(
  claimMax: Readonly<Record<string, Uint>>,
  rules: Rules
): Map<string, bigint> {
  const floors = new Map<string, bigint>();
  for (const [key, value] of Object.entries(claimMax)) {
    if (!CANONICAL_DECIMAL.test(key)) {
      throw invalid(
        `claim key ${JSON.stringify(key)} is not the canonical decimal of a Meme id`
      );
    }
    readUint(BigInt(key), 256, "a claim's Meme id");
    const totalMax = readUint(value, 32, `totalMax of Meme ${key}`);
    if (totalMax > 0n) {
      floors.set(key, totalMax < rules.floorCap ? totalMax : rules.floorCap);
    }
  }
  return floors;
}

/**
 * P26 §3.1 on decoded inputs in blocks `<= B`: the transfers of one log share
 * its txIndex, contract, from and to (vectors 85-87); no other transfer or
 * delegation event has its `(block, logIndex)`; and within a block a larger
 * logIndex never has a smaller txIndex (vector 53).
 */
function checkPositions(
  transfers: readonly CanonicalTransfer[],
  events: readonly CheckedEvent[],
  B: bigint
): void {
  const seen = new Map<string, { txIndex: bigint; log: string | null }>();
  for (const t of transfers) {
    const key = `${t.block}:${t.logIndex}`;
    const log = `${t.contract}|${t.from}|${t.to}`;
    const prior = seen.get(key);
    if (prior === undefined) {
      seen.set(key, { txIndex: t.txIndex, log });
    } else if (prior.txIndex !== t.txIndex || prior.log !== log) {
      throw invalid(
        `transfers at block ${t.block}, logIndex ${t.logIndex} are no one log's (P26 §3.1)`
      );
    }
  }
  for (const e of events) {
    const [block, txIndex, logIndex] = e.position;
    if (block > B) {
      continue;
    }
    const key = `${block}:${logIndex}`;
    if (seen.has(key)) {
      throw invalid(
        `a delegation event shares block ${block}, logIndex ${logIndex} with another log (P26 §3.1)`
      );
    }
    seen.set(key, { txIndex, log: null });
  }
  const order = [...seen.entries()]
    .map(([key, v]) => {
      const [block, logIndex] = key.split(":").map(BigInt) as [bigint, bigint];
      return [block, v.txIndex, logIndex] as const;
    })
    .sort((a, b) => comparePositions([a[0], a[2], 0n], [b[0], b[2], 0n]));
  order.forEach((p, i) => {
    const previous = order[i - 1];
    if (previous?.[0] === p[0] && p[1] < previous[1]) {
      throw invalid(
        `block ${p[0]}: a larger logIndex has a smaller txIndex (P26 §3.1, vector 53)`
      );
    }
  });
}

interface Eligibility {
  readonly memes: readonly bigint[];
  readonly gradients: ReadonlySet<string>;
  readonly nextgen: ReadonlySet<string>;
  readonly edition: Map<string, bigint>;
  readonly H: bigint;
  readonly rates: Map<string, number>;
}

/** Each token's first mint time and minted count, by `contract#id`. */
function mintsOf(transfers: readonly CanonicalTransfer[]): {
  readonly first: Map<string, bigint>;
  readonly minted: Map<string, bigint>;
} {
  const first = new Map<string, bigint>();
  const minted = new Map<string, bigint>();
  for (const t of transfers) {
    // A mint is from ZERO to another address (P26 §3.4; vector 56).
    if (t.from !== ZERO || t.to === ZERO) {
      continue;
    }
    const key = `${t.contract}#${t.token}`;
    if (!first.has(key)) {
      first.set(key, t.timestamp);
    }
    minted.set(key, (minted.get(key) ?? 0n) + t.amount);
  }
  return { first, minted };
}

interface EligibleTokens {
  readonly memes: bigint[];
  readonly gradients: Set<string>;
  readonly nextgen: Set<string>;
  /** Every Gradient minted, eligible or not: the Gradients' edition. */
  readonly gradientCount: bigint;
  /** NextGen tokens minted per collection. */
  readonly perCollection: Map<bigint, bigint>;
}

/** P26 §5.1: the tokens first minted at least the minimum age before `T`. */
function eligibleTokens(
  first: ReadonlyMap<string, bigint>,
  cutoff: bigint,
  rules: Rules
): EligibleTokens {
  const memes: bigint[] = [];
  const gradients = new Set<string>();
  const nextgen = new Set<string>();
  let gradientCount = 0n;
  const perCollection = new Map<bigint, bigint>();
  for (const [key, ts] of first) {
    const [contract, id] = key.split("#") as [string, string];
    if (contract === rules.memes && ts <= cutoff) {
      memes.push(BigInt(id));
    }
    if (contract === rules.gradients) {
      gradientCount += 1n;
      if (ts <= cutoff) {
        gradients.add(id);
      }
    }
    if (contract === rules.nextgen) {
      nextgen.add(id);
      const c = BigInt(id) / rules.nextgenDivisor;
      perCollection.set(c, (perCollection.get(c) ?? 0n) + 1n);
    }
  }
  memes.sort(compareIds);
  return { memes, gradients, nextgen, gradientCount, perCollection };
}

/** P26 §5.2: each eligible Meme's effective edition, and H, the largest. */
function memeEditions(
  memes: readonly bigint[],
  minted: ReadonlyMap<string, bigint>,
  floors: ReadonlyMap<string, bigint>,
  rules: Rules
): { readonly edition: Map<string, bigint>; readonly H: bigint } {
  const edition = new Map<string, bigint>();
  let H = 0n;
  for (const id of memes) {
    let m = minted.get(`${rules.memes}#${id}`) ?? 0n;
    if (id === rules.firstgmId) {
      m += rules.firstgmAdjustment;
    }
    // E = minted + adj from the threshold on, else max(minted + adj, floor).
    const floor = floors.get(id.toString()) ?? 0n;
    const E = m >= rules.floorThreshold || m >= floor ? m : floor;
    edition.set(id.toString(), E);
    H = E > H ? E : H;
  }
  return { edition, H };
}

/** P26 §5: eligibility, editions and rates, from the transfers before netting. */
function eligibilityAndRates(
  transfers: readonly CanonicalTransfer[],
  T: bigint,
  floors: ReadonlyMap<string, bigint>,
  rules: Rules
): Eligibility {
  const { first, minted } = mintsOf(transfers);
  const { memes, gradients, nextgen, gradientCount, perCollection } =
    eligibleTokens(first, T - rules.minAge, rules);
  const { edition, H } = memeEditions(memes, minted, floors, rules);
  for (const x of [H, gradientCount, ...perCollection.values()]) {
    if (x >= RANGE_LIMIT) {
      throw invalid(
        `a RATE input of ${x} is outside the tdh-v1.4 range (P26 §8.7)`
      );
    }
  }
  const h = Number(H);
  const rates = new Map<string, number>();
  for (const id of memes) {
    const E = edition.get(id.toString()) as bigint;
    if (E > 0n) {
      rates.set(`${rules.memes}#${id}`, rateCents(h, Number(E)) as number);
    }
  }
  for (const id of gradients) {
    rates.set(
      `${rules.gradients}#${id}`,
      rateCents(h, Number(gradientCount), rules.gradientMinimum) as number
    );
  }
  for (const id of nextgen) {
    const size = perCollection.get(BigInt(id) / rules.nextgenDivisor) as bigint;
    rates.set(`${rules.nextgen}#${id}`, rateCents(h, Number(size)) as number);
  }
  return { memes, gradients, nextgen, edition, H, rates };
}

type Collection = "memes" | "gradients" | "nextgen";

interface ExactToken {
  balance: bigint;
  raw: bigint;
  base: bigint;
  aged: bigint;
  final: bigint;
  readonly rate: number;
}

interface ExactRecord {
  readonly tokens: Record<Collection, Map<string, ExactToken>>;
  wallets: string[];
  beta: number;
  boost: BoostResult | null;
  balance: bigint;
  raw: bigint;
  base: bigint;
  final: bigint;
  rateE4: bigint;
}

function emptyRecord(): ExactRecord {
  return {
    tokens: { memes: new Map(), gradients: new Map(), nextgen: new Map() },
    wallets: [],
    beta: 100,
    boost: null,
    balance: 0n,
    raw: 0n,
    base: 0n,
    final: 0n,
    rateE4: 0n,
  };
}

const COLLECTIONS: readonly Collection[] = ["memes", "gradients", "nextgen"];

/** P26 §8.3-§8.7 for one record, exactly; throws outside the range. */
function finish(
  rec: ExactRecord,
  eligibleMemes: readonly bigint[],
  seasons: readonly Season[],
  r: Registry
): void {
  const balances: Record<string, bigint> = {};
  for (const [id, token] of rec.tokens.memes) {
    balances[id] = token.balance;
  }
  const b = boost(
    balances,
    rec.tokens.gradients.size,
    eligibleMemes,
    seasons,
    r
  );
  rec.boost = b;
  rec.beta = b.beta;
  let rateSum = 0n;
  for (const collection of COLLECTIONS) {
    for (const token of rec.tokens[collection].values()) {
      if (token.base * BigInt(b.beta) >= RANGE_LIMIT) {
        throw invalid(
          "base * beta is 2^53 or more, outside the tdh-v1.4 range (P26 §8.7)"
        );
      }
      if (token.balance >= AMOUNT_LIMIT || token.raw >= AMOUNT_LIMIT) {
        throw invalid(
          "a balance or raw of 2^64 or more is outside the tdh-v1.4 range (P26 §8.7)"
        );
      }
      token.final = BigInt(finalTdh(Number(token.base), b.beta));
      rec.balance += token.balance;
      rec.raw += token.raw;
      rec.base += token.base;
      rec.final += token.final;
      rateSum += BigInt(token.rate) * token.aged;
    }
  }
  if (rec.balance >= AMOUNT_LIMIT || rec.raw >= AMOUNT_LIMIT) {
    throw invalid(
      "a record's balance or raw of 2^64 or more is outside the tdh-v1.4 range (P26 §8.7)"
    );
  }
  rec.rateE4 = BigInt(b.beta) * rateSum;
}

function tokenScores(
  runs: readonly { timestamp: bigint; count: bigint }[],
  T: bigint,
  rate: number,
  rules: Rules
): ExactToken {
  let balance = 0n;
  let raw = 0n;
  let aged = 0n;
  for (const run of runs) {
    const days = (T - run.timestamp) / rules.dayS;
    balance += run.count;
    if (days > 0n) {
      raw += days * run.count;
      aged += run.count;
    }
  }
  const base = (BigInt(rate) * raw + 50n) / 100n;
  return { balance, raw, base, aged, final: 0n, rate };
}

function collectionOf(contract: string, rules: Rules): Collection {
  if (contract === rules.memes) {
    return "memes";
  }
  return contract === rules.gradients ? "gradients" : "nextgen";
}

function walletRecords(
  stacks: Stacks,
  eligibility: Eligibility,
  T: bigint,
  rules: Rules
): Map<string, ExactRecord> {
  const wallets = new Map<string, ExactRecord>();
  const eligibleIds: Readonly<Record<Collection, ReadonlySet<string>>> = {
    memes: new Set(eligibility.memes.map(String)),
    gradients: eligibility.gradients,
    nextgen: eligibility.nextgen,
  };
  for (const [key, perWallet] of stacks) {
    const [contract, id] = key.split("#") as [string, string];
    const collection = collectionOf(contract, rules);
    if (!eligibleIds[collection].has(id)) {
      continue;
    }
    const rate = eligibility.rates.get(key);
    for (const [wallet, runs] of perWallet) {
      if (runs.length === 0) {
        continue;
      }
      if (rate === undefined) {
        throw invalid(
          `${wallet} holds Meme ${id}, whose effective edition is 0 (P26 §5.2)`
        );
      }
      const rec = wallets.get(wallet) ?? emptyRecord();
      wallets.set(wallet, rec);
      rec.tokens[collection].set(id, tokenScores(runs, T, rate, rules));
    }
  }
  return wallets;
}

function identityRecords(
  wallets: ReadonlyMap<string, ExactRecord>,
  clusterOf: Readonly<Record<string, readonly string[]>>
): Map<string, ExactRecord> {
  const identities = new Map<string, ExactRecord>();
  for (const [wallet, rec] of wallets) {
    const key = [...(clusterOf[wallet] ?? [wallet])].sort().join("-");
    const identity = identities.get(key) ?? emptyRecord();
    identities.set(key, identity);
    identity.wallets.push(wallet);
    for (const collection of COLLECTIONS) {
      for (const [id, token] of rec.tokens[collection]) {
        const sum = identity.tokens[collection].get(id) ?? {
          balance: 0n,
          raw: 0n,
          base: 0n,
          aged: 0n,
          final: 0n,
          rate: token.rate,
        };
        sum.balance += token.balance;
        sum.raw += token.raw;
        // The identity's base sums the wallets' bases; never recomputed (§7.3).
        sum.base += token.base;
        sum.aged += token.aged;
        identity.tokens[collection].set(id, sum);
      }
    }
  }
  return identities;
}

function publicTokens(
  tokens: ReadonlyMap<string, ExactToken>,
  what: string
): Record<string, TokenRecord> {
  const out: Record<string, TokenRecord> = {};
  const ids = [...tokens.keys()].sort((a, b) =>
    compareIds(BigInt(a), BigInt(b))
  );
  for (const id of ids) {
    const t = tokens.get(id) as ExactToken;
    out[id] = {
      balance: toSafeNumber(t.balance, `${what} #${id} balance`),
      raw: toSafeNumber(t.raw, `${what} #${id} raw`),
      rate: t.rate,
      base: toSafeNumber(t.base, `${what} #${id} base`),
      final: toSafeNumber(t.final, `${what} #${id} final`),
      aged: toSafeNumber(t.aged, `${what} #${id} aged`),
    };
  }
  return out;
}

function publicRecord(rec: ExactRecord, what: string): CycleRecord {
  return {
    memes: publicTokens(rec.tokens.memes, `${what} Meme`),
    gradients: publicTokens(rec.tokens.gradients, `${what} Gradient`),
    nextgen: publicTokens(rec.tokens.nextgen, `${what} NextGen`),
    balance: toSafeNumber(rec.balance, `${what} balance`),
    raw: toSafeNumber(rec.raw, `${what} raw`),
    base: toSafeNumber(rec.base, `${what} base`),
    final: toSafeNumber(rec.final, `${what} final`),
    boostCents: rec.beta,
    boost: rec.boost as BoostResult,
    rateE4: toSafeNumber(rec.rateE4, `${what} daily rate`),
  };
}

/**
 * One cycle of TDH v1.4 from decoded inputs (P26 §3 to §9): every input read
 * at its type and checked, eligibility and rates from the transfers before
 * netting, the cluster map at `B` applied to all history, the netted replay,
 * then wallet and identity records with their boosts and finals, and the
 * totals. Throws `TdhInputInvalid` when the input has no result, and
 * `TdhOutsideEngineRange` for a valid result with a value of 2^53 or more.
 */
export function computeCycle(input: CycleInput, r: Registry): CycleResult {
  const rules = rulesOf(r);
  const B = readUint(input.block, 64, "the cutoff block B");
  const T = readUint(input.timestamp, 64, "the cutoff timestamp T");
  const all = (input.transfers ?? []).map((t) => readTransfer(t, rules));
  const events = (input.delegationEvents ?? []).map((e) =>
    readDelegationEvent(e, rules)
  );
  const floors = editionFloors(input.claimMax ?? {}, rules);
  // Transfers after B are not inputs (P26 §3.1), beyond their types.
  const transfers = canonicalOrder(all.filter((t) => t.block <= B));
  checkPositions(transfers, events, B);
  if (transfers.some((t) => t.timestamp > T)) {
    throw invalid(
      "a transfer in a block <= B is stamped after T (P26 §4.2, vector 54)"
    );
  }
  const eligibility = eligibilityAndRates(transfers, T, floors, rules);
  const cl = clustersWithKept(events, B, T, rules);
  const stacks = replayHoldings(transfers, cl.of, rules);
  const wallets = walletRecords(stacks, eligibility, T, rules);
  for (const [wallet, group] of Object.entries(cl.of)) {
    if (group.length > 1 && !wallets.has(wallet)) {
      wallets.set(wallet, emptyRecord());
    }
  }
  const seasons = seasonsFor(eligibility.memes.length, r);
  for (const rec of wallets.values()) {
    finish(rec, eligibility.memes, seasons, r);
  }
  const identities = identityRecords(wallets, cl.of);
  for (const rec of identities.values()) {
    finish(rec, eligibility.memes, seasons, r);
  }
  let final = 0n;
  let finalExcludingSinks = 0n;
  let base = 0n;
  let raw = 0n;
  for (const [key, rec] of identities) {
    final += rec.final;
    base += rec.base;
    raw += rec.raw;
    if (!rules.sinks.has(key)) {
      finalExcludingSinks += rec.final;
    }
  }
  if (final >= RANGE_LIMIT) {
    throw invalid(
      "total_final is 2^53 or more, outside the tdh-v1.4 range (P26 §8.7)"
    );
  }
  const publicWallets: Record<string, CycleRecord> = {};
  for (const [wallet, rec] of wallets) {
    publicWallets[wallet] = publicRecord(rec, `wallet ${wallet}`);
  }
  const publicIdentities: Record<string, IdentityRecord> = {};
  for (const [key, rec] of identities) {
    publicIdentities[key] = {
      ...publicRecord(rec, `identity ${key}`),
      wallets: [...rec.wallets].sort(),
    };
  }
  const edition: Record<string, number> = {};
  for (const [id, E] of eligibility.edition) {
    edition[id] = Number(E);
  }
  return {
    ruleVersion: rules.ruleVersion,
    H: Number(eligibility.H),
    edition,
    rates: Object.fromEntries(eligibility.rates),
    eligibleMemes: eligibility.memes.map(String),
    seasons,
    clusters: cl,
    wallets: publicWallets,
    identities: publicIdentities,
    totals: {
      final: Number(final),
      finalExcludingSinks: Number(finalExcludingSinks),
      base: toSafeNumber(base, "total base"),
      raw: toSafeNumber(raw, "total raw"),
    },
  };
}
