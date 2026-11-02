/**
 * The TDH v1.4 rule registry (P26 §10) and the values the engine reads.
 *
 * P26 §10: "An implementation reads every field of the registry record from
 * the registry of the rule version and hard-codes none of them." So does this
 * engine: every rule value comes from the `Registry` passed in, and a "what
 * if" is a forked registry (`fork`). Field names are P26 §10's record names,
 * in its units: boosts in micro-units, `additional_set_ratio` in 10^-4 and
 * `gradient_rate_minimum` in cents.
 *
 * Integers keep the width P26 gives them. A `uint32` field is a `number`; a
 * wider field (`uint64`, `uint256`, `int64`) may also be a `bigint`, because
 * a binary64 number holds integers exactly only below 2^53. The engine never
 * computes with an inexact integer: it reads every value at its type and
 * refuses one outside it.
 */

/** An unsigned integer: a `number` below 2^53, or any `bigint`. */
export type Uint = number | bigint;

export const ZERO = "0x0000000000000000000000000000000000000000";
export const DEAD = "0x000000000000000000000000000000000000dead";
/** The delegation contract's all-collections address (P26 §6.1). */
export const ALL_COLLECTIONS = "0x8888888888888888888888888888888888888888";

/**
 * The cycle length, 86,400 seconds (P26 §1, §4.1). The rule version fixes it
 * (`cycle_boundary`); whole days of age use the registry's `day_s` instead.
 */
export const DAY = 86_400;

/** The parameter registry of a rule version: P26 §10's record and its name. */
export interface Registry {
  readonly rule_version: string;
  readonly memes: string;
  readonly gradients: string;
  readonly nextgen: string;
  readonly nextgen_collection_divisor: Uint;
  readonly sinks: readonly string[];
  readonly eligibility_min_age_s: number;
  readonly day_s: number;
  readonly firstgm_id: Uint;
  readonly firstgm_edition_adjustment: Uint;
  readonly firstgm_burn_tx: string;
  readonly edition_floor_cap: Uint;
  readonly edition_floor_threshold: Uint;
  readonly manifold_lazy_claim: string;
  readonly gradient_rate_minimum: number;
  readonly delegation: string;
  readonly consolidation_use_case: Uint;
  readonly consolidation_collections: readonly string[];
  readonly consolidation_max_wallets: number;
  readonly consolidation_ungated_max_wallets: number;
  readonly consolidation_gate_activation_s: Uint;
  readonly season_bonus: number;
  readonly last_boosted_season: number;
  readonly additional_set_first: number;
  readonly additional_set_ratio: number;
  readonly genesis_ids: readonly Uint[];
  readonly genesis_bonus: number;
  readonly nakamoto_ids: readonly Uint[];
  readonly nakamoto_bonus: number;
  readonly gradient_bonus: number;
  readonly gradient_max_count: number;
  readonly season_starts: readonly Uint[];
}

type RegistryField = Exclude<keyof Registry, "rule_version">;

type FieldType =
  | "address"
  | "address[]"
  | "bytes32"
  | "int64"
  | "uint32"
  | "uint64"
  | "uint256"
  | "uint256[]";

/**
 * P26 §10's registry record: every field in record order, with its type.
 * The registry hash encodes them in this order (`registryHash`).
 */
export const REGISTRY_FIELDS: readonly (readonly [RegistryField, FieldType])[] =
  [
    ["memes", "address"],
    ["gradients", "address"],
    ["nextgen", "address"],
    ["nextgen_collection_divisor", "uint64"],
    ["sinks", "address[]"],
    ["eligibility_min_age_s", "uint32"],
    ["day_s", "uint32"],
    ["firstgm_id", "uint256"],
    ["firstgm_edition_adjustment", "int64"],
    ["firstgm_burn_tx", "bytes32"],
    ["edition_floor_cap", "uint64"],
    ["edition_floor_threshold", "uint64"],
    ["manifold_lazy_claim", "address"],
    ["gradient_rate_minimum", "uint32"],
    ["delegation", "address"],
    ["consolidation_use_case", "uint256"],
    ["consolidation_collections", "address[]"],
    ["consolidation_max_wallets", "uint32"],
    ["consolidation_ungated_max_wallets", "uint32"],
    ["consolidation_gate_activation_s", "uint64"],
    ["season_bonus", "uint32"],
    ["last_boosted_season", "uint32"],
    ["additional_set_first", "uint32"],
    ["additional_set_ratio", "uint32"],
    ["genesis_ids", "uint256[]"],
    ["genesis_bonus", "uint32"],
    ["nakamoto_ids", "uint256[]"],
    ["nakamoto_bonus", "uint32"],
    ["gradient_bonus", "uint32"],
    ["gradient_max_count", "uint32"],
    ["season_starts", "uint256[]"],
  ];

/**
 * TDH v1.4 (D137): P26 §10's values at 6529chain a731bca (unchanged since
 * 3bfa7b0), D136's four-wallet consolidation included. Its registry hash is
 * 0x3cfa0e6eae7b8769516597e117ecd55580ecb6b75194139f053d3e0ec09d9f36
 * (vector 28; `registryHash` computes it).
 */
export const REGISTRY_V14 = {
  rule_version: "tdh-v1.4",
  memes: "0x33fd426905f149f8376e227d0c9d3340aad17af1",
  gradients: "0x0c58ef43ff3032005e472cb5709f8908acb00205",
  nextgen: "0x45882f9bc325e14fbb298a1df930c43a874b83ae",
  nextgen_collection_divisor: 10_000_000_000,
  sinks: [ZERO, DEAD],
  eligibility_min_age_s: 86_400,
  day_s: 86_400,
  firstgm_id: 8,
  firstgm_edition_adjustment: -2_588,
  firstgm_burn_tx:
    "0xa6c27335d3c4f87064a938e987e36525885cc3d136ebb726f4c5d374c0d2d854",
  edition_floor_cap: 310,
  edition_floor_threshold: 300,
  manifold_lazy_claim: "0x26bbea7803dcac346d5f5f135b57cf2c752a02be",
  gradient_rate_minimum: 100,
  delegation: "0x2202cb9c00487e7e8ef21e6d8e914b32e709f43d",
  consolidation_use_case: 999,
  consolidation_collections: [
    "0x33fd426905f149f8376e227d0c9d3340aad17af1",
    ALL_COLLECTIONS,
  ],
  consolidation_max_wallets: 4,
  consolidation_ungated_max_wallets: 3,
  // 2026-10-15 00:00:00 UTC, compared with block timestamps (D136).
  consolidation_gate_activation_s: 1_792_022_400,
  season_bonus: 50_000,
  last_boosted_season: 20,
  additional_set_first: 50_000,
  additional_set_ratio: 6_529,
  genesis_ids: [1, 2, 3],
  genesis_bonus: 10_000,
  nakamoto_ids: [4],
  nakamoto_bonus: 10_000,
  gradient_bonus: 20_000,
  gradient_max_count: 5,
  season_starts: [
    1, 48, 87, 119, 152, 181, 213, 246, 279, 311, 343, 375, 407, 439, 477, 516,
    556,
  ],
} as const satisfies Registry;

/**
 * Fields no fork may change: the Nakamoto Threshold of 300 is one of The
 * Memes' two absolutes (D89). `diffRegistry` marks a change to one as locked.
 */
export const ABSOLUTES: Readonly<Partial<Record<RegistryField, string>>> = {
  edition_floor_threshold:
    "D89: the Nakamoto Threshold, one of The Memes' two absolutes",
};

/** The input has no result (P26 §13: a node reports INPUT_INVALID). */
export class TdhInputInvalid extends Error {
  override readonly name = "TdhInputInvalid";
}

/**
 * A valid input with a value the engine does not hold in a binary64 number:
 * an integer of 2^53 or more given as a `number`, or a result of 2^53 or
 * more. The engine refuses it rather than return an inexact value.
 */
export class TdhOutsideEngineRange extends Error {
  override readonly name = "TdhOutsideEngineRange";
}

export function invalid(rule: string): TdhInputInvalid {
  return new TdhInputInvalid(rule);
}

const FIELD_NAMES: ReadonlySet<string> = new Set([
  "rule_version",
  ...REGISTRY_FIELDS.map(([name]) => name),
]);

function lowerStrings(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map((x: unknown) =>
      typeof x === "string" ? x.toLowerCase() : x
    );
  }
  return typeof value === "string" ? value.toLowerCase() : value;
}

/**
 * A registry with some fields changed, for a "what if". Addresses and hashes
 * are lowercased; a name that is no field of the record throws, because a
 * typo would otherwise fork nothing.
 */
export function fork(
  registry: Registry,
  overrides: Readonly<Partial<Record<keyof Registry, unknown>>>
): Registry {
  const out: Record<string, unknown> = { ...registry };
  for (const [name, value] of Object.entries(overrides)) {
    if (!FIELD_NAMES.has(name)) {
      throw new TypeError(`${name} is no field of the TDH registry (P26 §10)`);
    }
    out[name] = name === "rule_version" ? value : lowerStrings(value);
  }
  return out as unknown as Registry;
}

interface RegistryChange {
  readonly field: keyof Registry;
  readonly from: unknown;
  readonly to: unknown;
  /** True for a field `ABSOLUTES` holds fixed. */
  readonly locked: boolean;
}

function sameValue(a: unknown, b: unknown): boolean {
  const norm = (x: unknown): string =>
    JSON.stringify(x, (_key, v: unknown) =>
      typeof v === "bigint" ? v.toString() : v
    );
  return norm(a) === norm(b);
}

/** The fields a fork changed, for the "your rule version" diff. */
export function diffRegistry(a: Registry, b: Registry): RegistryChange[] {
  const names: (keyof Registry)[] = [
    "rule_version",
    ...REGISTRY_FIELDS.map(([name]) => name),
  ];
  return names
    .filter((name) => !sameValue(a[name], b[name]))
    .map((name) => ({
      field: name,
      from: a[name],
      to: b[name],
      locked: name !== "rule_version" && ABSOLUTES[name] !== undefined,
    }));
}

const TWO_POW_53 = 2n ** 53n;

/**
 * An integer value read at its type: `bits` wide, signed when `signed`.
 * A number must be a safe integer; an integer of 2^53 or more must come as a
 * bigint. Anything else (a string, a fraction, a boolean, `-0` as the vector
 * reader marks it) is outside the type: the input has no result.
 */
function readInt(
  value: unknown,
  bits: number,
  what: string,
  signed = false
): bigint {
  let n: bigint;
  if (typeof value === "bigint") {
    n = value;
  } else if (typeof value === "number" && Number.isSafeInteger(value)) {
    n = BigInt(value);
  } else if (typeof value === "number" && Number.isInteger(value)) {
    throw new TdhOutsideEngineRange(
      `${what} = ${value} is an integer of 2^53 or more given as a binary64 number; give it as a bigint`
    );
  } else {
    throw invalid(`${what} is not an integer (P26 §3.2, §10)`);
  }
  const width = BigInt(bits);
  const low = signed ? -(1n << (width - 1n)) : 0n;
  const high = signed ? 1n << (width - 1n) : 1n << width;
  if (n < low || n >= high) {
    throw invalid(
      `${what} = ${n} is not a${signed ? "n int" : " uint"}${bits} (P26 §3.2, §10; P28 §2.3)`
    );
  }
  return n;
}

export function readUint(value: unknown, bits: number, what: string): bigint {
  return readInt(value, bits, what, false);
}

/** A bigint below 2^53 as a number, or the engine's refusal. */
export function toSafeNumber(value: bigint, what: string): number {
  if (value >= TWO_POW_53 || value <= -TWO_POW_53) {
    throw new TdhOutsideEngineRange(
      `${what} = ${value} is 2^53 or more; the engine returns binary64 numbers`
    );
  }
  return Number(value);
}

const HEX = /^0x[0-9a-fA-F]*$/;

/** `0x` and the hex of `size` bytes, lowercased. */
export function readHex(value: unknown, size: number, what: string): string {
  if (
    typeof value !== "string" ||
    !HEX.test(value) ||
    value.length !== 2 + 2 * size
  ) {
    throw invalid(`${what} is not ${size} bytes of hex (P26 §3.2)`);
  }
  return value.toLowerCase();
}

export function readAddress(value: unknown, what: string): string {
  return readHex(value, 20, what);
}

function readField(type: FieldType, value: unknown, what: string): unknown {
  switch (type) {
    case "address":
      return readAddress(value, what);
    case "bytes32":
      return readHex(value, 32, what);
    case "int64":
      return readInt(value, 64, what, true);
    case "uint32":
      return readUint(value, 32, what);
    case "uint64":
      return readUint(value, 64, what);
    case "uint256":
      return readUint(value, 256, what);
    case "address[]":
    case "uint256[]": {
      if (!Array.isArray(value)) {
        throw invalid(`${what} is not a list (P26 §10)`);
      }
      const item = type === "address[]" ? "address" : "uint256";
      return value.map((x: unknown) => readField(item, x, `${what} entry`));
    }
  }
}

/**
 * The registry record with every field read at its type (P26 §10): integers
 * as bigints, addresses and hashes lowercased. A value outside its type makes
 * the registry malformed: it has no hash, and a cycle under it has no result
 * (vectors 68, 70 and 75).
 */
export function registryRecord(
  r: Registry
): ReadonlyMap<RegistryField, unknown> {
  const out = new Map<RegistryField, unknown>();
  for (const [name, type] of REGISTRY_FIELDS) {
    out.set(name, readField(type, r[name], `registry ${name}`));
  }
  return out;
}

/** Engine-internal form of a valid registry. */
export interface Rules {
  readonly ruleVersion: string;
  readonly memes: string;
  readonly gradients: string;
  readonly nextgen: string;
  readonly nextgenDivisor: bigint;
  readonly sinks: ReadonlySet<string>;
  readonly minAge: bigint;
  readonly dayS: bigint;
  readonly firstgmId: bigint;
  readonly firstgmAdjustment: bigint;
  readonly firstgmBurnTx: string;
  readonly floorCap: bigint;
  readonly floorThreshold: bigint;
  readonly gradientMinimum: number;
  /** The delegation contract, whose logs give consolidation events (§6.1). */
  readonly delegation: string;
  readonly useCase: bigint;
  readonly collections: ReadonlySet<string>;
  readonly maxWallets: number;
  readonly ungatedMaxWallets: number;
  readonly gateActivation: bigint;
  readonly seasonBonus: number;
  readonly lastBoostedSeason: number;
  readonly addFirst: bigint;
  readonly addRatio: bigint;
  readonly genesisIds: readonly bigint[];
  readonly genesisBonus: number;
  readonly nakamotoIds: readonly bigint[];
  readonly nakamotoBonus: number;
  readonly gradientBonus: number;
  readonly gradientMaxCount: number;
  readonly seasonStarts: readonly bigint[];
}

/** Strictly ascending: integers by value, addresses as lowercase hex (§1). */
function ascending(xs: readonly (bigint | string)[]): boolean {
  for (let i = 1; i < xs.length; i++) {
    const a = xs[i - 1];
    const b = xs[i];
    const less =
      typeof a === "bigint" && typeof b === "bigint"
        ? a < b
        : String(a) < String(b);
    if (!less) {
      return false;
    }
  }
  return true;
}

const rulesCache = new WeakMap<Registry, Rules>();

/**
 * Validates a registry (P26 §10: every field at its type, then the
 * constraints) and returns the engine's form of it. A registry that breaks a
 * constraint is invalid, and a cycle under it has no result (vectors 60, 66
 * and 101). Results are cached per registry object, which must not change.
 */
export function rulesOf(r: Registry): Rules {
  const cached = rulesCache.get(r);
  if (cached) {
    return cached;
  }
  if (typeof r.rule_version !== "string") {
    throw invalid("rule_version is not a string");
  }
  const f = registryRecord(r);
  // registryRecord read each field at its type (REGISTRY_FIELDS).
  const big = (name: RegistryField): bigint => f.get(name) as bigint;
  const text = (name: RegistryField): string => f.get(name) as string;
  const bigs = (name: RegistryField): bigint[] => f.get(name) as bigint[];
  const texts = (name: RegistryField): string[] => f.get(name) as string[];
  const small = (name: RegistryField): number => Number(big(name));
  const starts = bigs("season_starts");
  if (starts[0] !== 1n || !ascending(starts)) {
    throw invalid(
      "season_starts must start at 1 and strictly increase (P26 §5.4, §10)"
    );
  }
  for (const name of [
    "sinks",
    "consolidation_collections",
    "genesis_ids",
    "nakamoto_ids",
  ] as const) {
    if (!ascending(f.get(name) as (bigint | string)[])) {
      throw invalid(
        `registry list ${name} is not strictly ascending (P26 §10)`
      );
    }
  }
  const sinks = texts("sinks");
  if (!sinks.includes(ZERO)) {
    throw invalid("sinks must contain ZERO (P26 §3.4, §10)");
  }
  if (big("day_s") <= 0n || big("nextgen_collection_divisor") <= 0n) {
    throw invalid(
      "day_s and nextgen_collection_divisor must be positive (P26 §10)"
    );
  }
  if (big("additional_set_ratio") >= 10_000n) {
    throw invalid("additional_set_ratio must be below 10^4 (P26 §8.3, §10)");
  }
  if (
    big("consolidation_max_wallets") < 2n ||
    big("consolidation_ungated_max_wallets") < 2n
  ) {
    throw invalid(
      "consolidation_max_wallets and consolidation_ungated_max_wallets must be at least 2 (P26 §10)"
    );
  }
  const rules: Rules = {
    ruleVersion: r.rule_version,
    memes: text("memes"),
    gradients: text("gradients"),
    nextgen: text("nextgen"),
    nextgenDivisor: big("nextgen_collection_divisor"),
    sinks: new Set(sinks),
    minAge: big("eligibility_min_age_s"),
    dayS: big("day_s"),
    firstgmId: big("firstgm_id"),
    firstgmAdjustment: big("firstgm_edition_adjustment"),
    firstgmBurnTx: text("firstgm_burn_tx"),
    floorCap: big("edition_floor_cap"),
    floorThreshold: big("edition_floor_threshold"),
    gradientMinimum: small("gradient_rate_minimum"),
    delegation: text("delegation"),
    useCase: big("consolidation_use_case"),
    collections: new Set(texts("consolidation_collections")),
    maxWallets: small("consolidation_max_wallets"),
    ungatedMaxWallets: small("consolidation_ungated_max_wallets"),
    gateActivation: big("consolidation_gate_activation_s"),
    seasonBonus: small("season_bonus"),
    lastBoostedSeason: small("last_boosted_season"),
    addFirst: big("additional_set_first"),
    addRatio: big("additional_set_ratio"),
    genesisIds: bigs("genesis_ids"),
    genesisBonus: small("genesis_bonus"),
    nakamotoIds: bigs("nakamoto_ids"),
    nakamotoBonus: small("nakamoto_bonus"),
    gradientBonus: small("gradient_bonus"),
    gradientMaxCount: small("gradient_max_count"),
    seasonStarts: starts,
  };
  rulesCache.set(r, rules);
  return rules;
}

/** Throws `TdhInputInvalid` unless the registry is valid (P26 §10). */
export function validateRegistry(r: Registry): void {
  rulesOf(r);
}
