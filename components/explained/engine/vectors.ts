/**
 * Runs P26's conformance vectors (6529chain `design/tdh-reference/vectors`,
 * format in that folder's README) against the engine: the CI proof that the
 * pages compute TDH v1.4, and the reader a "run this vector" lens can use.
 *
 * The reader keeps every integer in full (a `bigint` from 2^53 on), keeps
 * `-0` and non-integers apart from integers so they fail their types, and
 * refuses a member named twice. A vector's scope is derived from its content:
 * every vector is run except those that need Ethereum log decoding (`logs`,
 * or non-empty `raw_logs`), which the validators' readers do.
 */

import {
  additionalSetsMicro,
  baseTdh,
  finalTdh,
  rateCents,
} from "./arithmetic";
import {
  ALL_COLLECTIONS,
  REGISTRY_FIELDS,
  REGISTRY_V14,
  TdhInputInvalid,
  TdhOutsideEngineRange,
  fork,
  type Registry,
  type Uint,
} from "./registry";
import { registryHash } from "./registryHash";
import {
  computeCycle,
  type CycleRecord,
  type CycleResult,
  type TokenRecord,
} from "./tdh";
import { headerTimestamps, selectCutoff, wholeDays } from "./time";
import {
  VectorFormatError,
  canonicalJson,
  isObject,
  parseJsonExact,
  type JsonObject,
  type JsonValue,
} from "./json";

const VECTOR_KEYS = new Set([
  "description",
  "derivation",
  "params",
  "cycle",
  "transfers",
  "consolidation_events",
  "raw_logs",
  "timestamps",
  "claim_max",
  "expected",
  "expected_invalid",
  "logs",
  "expected_transfers",
  "expected_events",
  "malformed_logs",
  "arithmetic",
  "cutoff",
  "cutoff_invalid",
  "days",
  "registry_hashes",
  "legacy_expected",
  "effective_time_variant",
]);
const OBJECTS = ["params", "cycle", "timestamps", "claim_max", "cutoff"];
const ARRAYS = [
  "transfers",
  "consolidation_events",
  "raw_logs",
  "cutoff_invalid",
];
const ENTRY_FIELDS: Readonly<Record<string, readonly string[]>> = {
  transfers: [
    "block",
    "tx_index",
    "log_index",
    "batch_pos",
    "timestamp",
    "tx",
    "contract",
    "token",
    "from",
    "to",
    "amount",
  ],
  consolidation_events: [
    "block",
    "tx_index",
    "log_index",
    "kind",
    "from",
    "to",
    "collection",
  ],
  cutoff_invalid: ["date", "headers", "finalized"],
};
const CYCLE_KEYS = [
  "transfers",
  "consolidation_events",
  "raw_logs",
  "claim_max",
  "expected",
  "expected_invalid",
];
const REGISTRY_NAMES = new Set(REGISTRY_FIELDS.map(([name]) => name as string));

function list(v: JsonObject, key: string): readonly JsonValue[] {
  const x = v[key];
  return Array.isArray(x) ? x : [];
}

/** Only the format's keys, and each object or array member of its type. */
function checkTopLevel(v: JsonObject): void {
  for (const key of Object.keys(v)) {
    if (!VECTOR_KEYS.has(key)) {
      throw new VectorFormatError(`unknown vector key ${key}`);
    }
  }
  for (const key of OBJECTS) {
    if (key in v && !isObject(v[key])) {
      throw new VectorFormatError(`${key} is not a JSON object`);
    }
  }
  for (const key of ARRAYS) {
    if (key in v && !Array.isArray(v[key])) {
      throw new VectorFormatError(`${key} is not a JSON array`);
    }
  }
}

function checkEntry(
  key: string,
  entry: JsonValue,
  fields: readonly string[]
): void {
  if (!isObject(entry)) {
    throw new VectorFormatError(`an entry of ${key} is not a JSON object`);
  }
  const missing = fields.find((f) => !(f in entry));
  if (missing !== undefined) {
    throw new VectorFormatError(`an entry of ${key} has no ${missing}`);
  }
  if (key === "cutoff_invalid" && !isObject(entry["headers"])) {
    throw new VectorFormatError("a cutoff's headers is not a JSON object");
  }
}

/** Every list entry has the fields the format names; returns the entries. */
function checkEntries(v: JsonObject): Record<string, readonly JsonValue[]> {
  const entries: Record<string, readonly JsonValue[]> = {
    transfers: list(v, "transfers"),
    consolidation_events: list(v, "consolidation_events"),
    cutoff_invalid: [
      ...list(v, "cutoff_invalid"),
      ...("cutoff" in v ? [v["cutoff"]] : []),
    ],
  };
  for (const [key, fields] of Object.entries(ENTRY_FIELDS)) {
    for (const entry of entries[key] ?? []) {
      checkEntry(key, entry, fields);
    }
  }
  return entries;
}

/** Event kinds and transfer contracts are names the format knows. */
function checkNames(entries: Record<string, readonly JsonValue[]>): void {
  for (const e of entries["consolidation_events"] ?? []) {
    const kind = (e as JsonObject)["kind"];
    if (kind !== "REGISTER" && kind !== "REVOKE") {
      throw new VectorFormatError(
        `unknown consolidation event kind ${show(kind)}`
      );
    }
  }
  for (const t of entries["transfers"] ?? []) {
    const contract = (t as JsonObject)["contract"];
    if (
      contract !== "memes" &&
      contract !== "gradients" &&
      contract !== "nextgen"
    ) {
      throw new VectorFormatError(
        `a transfer's contract ${show(contract)} is not memes, gradients or nextgen`
      );
    }
  }
}

/** Cycle inputs need a cycle, raw logs their timestamps, params known names. */
function checkCycleShape(v: JsonObject): void {
  if (!("cycle" in v) && CYCLE_KEYS.some((k) => k in v)) {
    throw new VectorFormatError(
      "a vector with cycle inputs or expected values needs cycle"
    );
  }
  const cycle = v["cycle"];
  if (isObject(cycle) && !("block" in cycle && "timestamp" in cycle)) {
    throw new VectorFormatError("cycle needs block and timestamp");
  }
  if (list(v, "raw_logs").length > 0 && !("timestamps" in v)) {
    throw new VectorFormatError("raw_logs without timestamps");
  }
  for (const name of Object.keys(isObject(v["params"]) ? v["params"] : {})) {
    if (!REGISTRY_NAMES.has(name)) {
      throw new VectorFormatError(`unknown registry parameter ${name}`);
    }
  }
}

/** The vector format's shape, checked before any value is read as input. */
function checkFormat(v: JsonValue): asserts v is JsonObject {
  if (!isObject(v)) {
    throw new VectorFormatError("a vector is a JSON object");
  }
  checkTopLevel(v);
  checkNames(checkEntries(v));
  checkCycleShape(v);
}

export type VectorScope =
  | "cycle"
  | "clusters"
  | "arithmetic"
  | "registry"
  | "cutoff"
  | "decoding";

export interface VectorRun {
  readonly id: string;
  readonly scope: VectorScope;
  readonly status: "pass" | "fail" | "out-of-scope";
  /** Comparisons made; an input with no result counts one. */
  readonly checks: number;
  readonly failures: readonly string[];
  /** Why out of scope, or the rule that refused an input with no result. */
  readonly note?: string;
}

class Checker {
  checks = 0;
  readonly failures: string[] = [];
  eq(what: string, got: unknown, expected: JsonValue | undefined): void {
    this.checks++;
    const a = valueText(got);
    const b = valueText(expected ?? null);
    if (a !== b) {
      this.failures.push(`${what}: expected ${b}, got ${a}`);
    }
  }
  fail(what: string): void {
    this.checks++;
    this.failures.push(what);
  }
}

/** A reader value as text: a string as itself, anything else as JSON. */
function show(x: JsonValue | undefined): string {
  return typeof x === "string" ? x : canonicalJson(x ?? null);
}

function valueText(x: unknown): string {
  if (x === undefined || x === null) {
    return "null";
  }
  if (typeof x === "bigint" || typeof x === "number") {
    return x.toString();
  }
  if (typeof x === "string") {
    return JSON.stringify(x.toLowerCase());
  }
  return canonicalJson(x as JsonValue);
}

function registryOf(params: JsonValue | undefined): Registry {
  return isObject(params)
    ? fork(REGISTRY_V14, params as Readonly<Record<string, unknown>>)
    : REGISTRY_V14;
}

const ALIASES = (r: Registry): Readonly<Record<string, string>> => ({
  memes: r.memes,
  gradients: r.gradients,
  nextgen: r.nextgen,
  all: ALL_COLLECTIONS,
});

function alias(name: JsonValue | undefined, r: Registry): string {
  const s = show(name);
  return ALIASES(r)[s] ?? s;
}

/** Casts a reader value for the engine, which checks its type at run time. */
function raw(x: JsonValue | undefined): Uint {
  return x as unknown as Uint;
}

function cycleInput(
  v: JsonObject,
  r: Registry
): Parameters<typeof computeCycle>[0] {
  const cycle = v["cycle"] as JsonObject;
  if (isObject(v["timestamps"])) {
    // Header timestamps have their types wherever they are (vectors 78, 79).
    headerTimestamps(v["timestamps"]);
  }
  return {
    block: raw(cycle["block"]),
    timestamp: raw(cycle["timestamp"]),
    transfers: list(v, "transfers").map((x) => {
      const t = x as JsonObject;
      return {
        block: raw(t["block"]),
        txIndex: raw(t["tx_index"]),
        logIndex: raw(t["log_index"]),
        batchPos: raw(t["batch_pos"]),
        timestamp: raw(t["timestamp"]),
        tx: t["tx"] as string,
        contract: alias(t["contract"], r),
        token: raw(t["token"]),
        from: t["from"] as string,
        to: t["to"] as string,
        amount: raw(t["amount"]),
      };
    }),
    delegationEvents: list(v, "consolidation_events").map((x) => {
      const e = x as JsonObject;
      return {
        block: raw(e["block"]),
        txIndex: raw(e["tx_index"]),
        logIndex: raw(e["log_index"]),
        kind: e["kind"] as "REGISTER" | "REVOKE",
        from: e["from"] as string,
        to: e["to"] as string,
        collection: alias(e["collection"], r),
        ...("use_case" in e ? { useCase: raw(e["use_case"]) } : {}),
        ...("timestamp" in e ? { timestamp: raw(e["timestamp"]) } : {}),
      };
    }),
    claimMax: (isObject(v["claim_max"]) ? v["claim_max"] : {}) as Readonly<
      Record<string, Uint>
    >,
  };
}

const RECORD_FIELDS: Readonly<Record<string, keyof CycleRecord>> = {
  balance: "balance",
  raw: "raw",
  base: "base",
  boost_c: "boostCents",
  final: "final",
  rate_e4: "rateE4",
};
const TOKEN_FIELDS = new Set<keyof TokenRecord>([
  "balance",
  "raw",
  "base",
  "final",
]);
const TOTAL_FIELDS: Readonly<Record<string, keyof CycleResult["totals"]>> = {
  final: "final",
  final_excluding_sinks: "finalExcludingSinks",
  base: "base",
  raw: "raw",
};

type TokenCollection = "memes" | "gradients" | "nextgen";
const TOKEN_COLLECTIONS = new Set<string>(["memes", "gradients", "nextgen"]);

/** A record's expected tokens, `collection#id` to fields. */
function checkTokens(
  chk: Checker,
  prefix: string,
  rec: CycleRecord,
  expected: JsonValue | undefined
): void {
  for (const [tokenKey, fields] of Object.entries(
    isObject(expected) ? expected : {}
  )) {
    const [collection, id] = tokenKey.split("#") as [string, string];
    const token = TOKEN_COLLECTIONS.has(collection)
      ? rec[collection as TokenCollection][id]
      : undefined;
    for (const [f, x] of Object.entries(isObject(fields) ? fields : {})) {
      if (TOKEN_FIELDS.has(f as keyof TokenRecord)) {
        chk.eq(
          `${prefix} ${tokenKey}.${f}`,
          token?.[f as keyof TokenRecord],
          x
        );
      } else {
        chk.fail(`${prefix} ${tokenKey}: unchecked field ${f}`);
      }
    }
  }
}

function checkRecords(
  chk: Checker,
  label: string,
  records: Readonly<Record<string, CycleRecord>>,
  expected: JsonValue | undefined
): void {
  for (const [key, want] of Object.entries(
    isObject(expected) ? expected : {}
  )) {
    const rec = records[key.toLowerCase()];
    if (rec === undefined) {
      chk.fail(`${label} ${key}: no record`);
      continue;
    }
    for (const [field, value] of Object.entries(isObject(want) ? want : {})) {
      if (field === "tokens") {
        checkTokens(chk, `${label} ${key}`, rec, value);
        continue;
      }
      const name = RECORD_FIELDS[field];
      if (name === undefined) {
        chk.fail(`${label} ${key}: unchecked field ${field}`);
      } else {
        chk.eq(`${label} ${key}.${field}`, rec[name], value);
      }
    }
  }
}

function checkClusters(chk: Checker, res: CycleResult, want: JsonObject): void {
  if ("clusters" in want) {
    const got = new Set(Object.values(res.clusters.of).map((c) => c.join("-")));
    const exp = new Set(
      (Array.isArray(want["clusters"]) ? want["clusters"] : []).map((c) =>
        (Array.isArray(c) ? c : [])
          .map((w) => show(w).toLowerCase())
          .sort()
          .join("-")
      )
    );
    chk.eq("clusters", [...got].sort().join(" "), [...exp].sort().join(" "));
  }
  for (const w of list(want, "unclustered")) {
    chk.eq(
      `${show(w)} unclustered`,
      String(show(w).toLowerCase() in res.clusters.of),
      "false"
    );
  }
}

const EXPECTED_KEYS = new Set([
  "H",
  "edition",
  "rates",
  "identities",
  "wallets",
  "absent",
  "totals",
  "clusters",
  "unclustered",
]);

function checkCycle(chk: Checker, v: JsonObject, r: Registry): void {
  const res = computeCycle(cycleInput(v, r), r);
  const want = v["expected"] as JsonObject;
  for (const key of Object.keys(want)) {
    if (!EXPECTED_KEYS.has(key)) {
      chk.fail(`unchecked expected block ${key}`);
    }
  }
  if ("H" in want) {
    chk.eq("H", res.H, want["H"]);
  }
  for (const [id, value] of Object.entries(
    isObject(want["edition"]) ? want["edition"] : {}
  )) {
    chk.eq(`edition #${id}`, res.edition[id], value);
  }
  for (const [key, value] of Object.entries(
    isObject(want["rates"]) ? want["rates"] : {}
  )) {
    const [collection, id] = key.split("#") as [string, string];
    chk.eq(`rate ${key}`, res.rates[`${alias(collection, r)}#${id}`], value);
  }
  checkRecords(chk, "identity", res.identities, want["identities"]);
  checkRecords(chk, "wallet", res.wallets, want["wallets"]);
  for (const w of list(want, "absent")) {
    const key = show(w).toLowerCase();
    chk.eq(
      `${key} absent`,
      String(key in res.identities || key in res.wallets),
      "false"
    );
  }
  for (const [field, value] of Object.entries(
    isObject(want["totals"]) ? want["totals"] : {}
  )) {
    const name = TOTAL_FIELDS[field];
    if (name === undefined) {
      chk.fail(`unchecked total ${field}`);
    } else {
      chk.eq(`total ${field}`, res.totals[name], value);
    }
  }
  checkClusters(chk, res, want);
}

function checkArithmetic(chk: Checker, v: JsonObject, r: Registry): void {
  const a = v["arithmetic"] as JsonObject;
  for (const key of Object.keys(a)) {
    if (
      !["rate_cents", "base_tdh", "final_tdh", "additional_sets_u"].includes(
        key
      )
    ) {
      chk.fail(`unchecked arithmetic ${key}`);
    }
  }
  const n = (x: JsonValue | undefined): number => Number(x);
  for (const c of list(a, "rate_cents").map((x) => x as JsonObject)) {
    const minimum = c["minimum_one"] === true ? 100 : c["minimum_c"];
    chk.eq(
      `RATE(${show(c["n"])}, ${show(c["d"])})`,
      rateCents(
        n(c["n"]),
        n(c["d"]),
        minimum === undefined ? undefined : n(minimum)
      ),
      c["expected"]
    );
  }
  for (const c of list(a, "base_tdh").map((x) => x as JsonObject)) {
    chk.eq(
      `BASE(${show(c["rate_c"])}, ${show(c["raw"])})`,
      baseTdh(n(c["rate_c"]), n(c["raw"])),
      c["expected"]
    );
  }
  for (const c of list(a, "final_tdh").map((x) => x as JsonObject)) {
    chk.eq(
      `FINAL(${show(c["base"])}, ${show(c["beta_c"])})`,
      finalTdh(n(c["base"]), n(c["beta_c"])),
      c["expected"]
    );
  }
  for (const c of list(a, "additional_sets_u").map((x) => x as JsonObject)) {
    chk.eq(
      `ADD(${show(c["sets"])})`,
      additionalSetsMicro(raw(c["sets"]), r),
      c["expected"]
    );
  }
}

function checkRegistryHashes(chk: Checker, v: JsonObject): void {
  list(v, "registry_hashes").forEach((x, i) => {
    const c = x as JsonObject;
    chk.eq(
      `registry hash ${i}`,
      registryHash(registryOf(c["params"])),
      c["hash"]
    );
  });
}

function checkCutoff(chk: Checker, v: JsonObject, r: Registry): void {
  const c = v["cutoff"] as JsonObject;
  const cutoff = selectCutoff(
    c["date"] as string,
    c["headers"] as JsonObject,
    raw(c["finalized"])
  );
  const want = isObject(c["expected"]) ? c["expected"] : {};
  chk.eq("cutoff block", cutoff.block, want["block"]);
  chk.eq("cutoff timestamp", cutoff.timestamp, want["timestamp"]);
  for (const d of list(v, "days").map((x) => x as JsonObject)) {
    chk.eq(
      `days(T=${show(d["T"])}, a=${show(d["acquired"])})`,
      wholeDays(Number(d["T"]), Number(d["acquired"]), r.day_s),
      d["expected"]
    );
  }
  list(v, "cutoff_invalid").forEach((x, i) => {
    const bad = x as JsonObject;
    try {
      selectCutoff(
        bad["date"] as string,
        bad["headers"] as JsonObject,
        raw(bad["finalized"])
      );
      chk.fail(`cutoff case ${i} gave a cutoff (${show(bad["reason"])})`);
    } catch (error) {
      if (error instanceof TdhInputInvalid) {
        chk.checks++;
      } else {
        throw error;
      }
    }
  });
}

function scopeOf(v: JsonObject): VectorScope {
  if ("arithmetic" in v) {
    return "arithmetic";
  }
  if ("logs" in v || list(v, "raw_logs").length > 0) {
    return "decoding";
  }
  if ("cutoff" in v) {
    return "cutoff";
  }
  if ("registry_hashes" in v) {
    return "registry";
  }
  const expected = v["expected"];
  return isObject(expected) && "clusters" in expected && !("transfers" in v)
    ? "clusters"
    : "cycle";
}

/** A cycle that must have no result: the rule that refused it is the note. */
function checkNoResult(
  chk: Checker,
  v: JsonObject,
  r: Registry
): string | undefined {
  try {
    computeCycle(cycleInput(v, r), r);
    chk.fail(`gave a result; expected none: ${show(v["expected_invalid"])}`);
    return undefined;
  } catch (error) {
    if (!(error instanceof TdhInputInvalid)) {
      throw error;
    }
    chk.checks++;
    return error.message;
  }
}

/** Runs an in-scope vector's checks; returns the note, if any. */
function runChecks(
  chk: Checker,
  v: JsonObject,
  scope: VectorScope,
  r: Registry
): string | undefined {
  if (scope === "arithmetic") {
    checkArithmetic(chk, v, r);
  } else if (scope === "registry") {
    checkRegistryHashes(chk, v);
  } else if (scope === "cutoff") {
    checkCutoff(chk, v, r);
  } else if ("expected_invalid" in v) {
    return checkNoResult(chk, v, r);
  } else {
    checkCycle(chk, v, r);
  }
  return undefined;
}

/** How a run that threw failed, for its failure line. */
function failureKind(error: unknown): string {
  if (error instanceof TdhOutsideEngineRange) {
    return "outside the engine's range";
  }
  if (error instanceof VectorFormatError || error instanceof TypeError) {
    return "not a vector";
  }
  return error instanceof TdhInputInvalid ? "no result" : "error";
}

/** Runs one vector, given its file name without `.json` and its text. */
export function runVector(id: string, text: string): VectorRun {
  const chk = new Checker();
  let scope: VectorScope = "cycle";
  let note: string | undefined;
  try {
    const v = parseJsonExact(text);
    checkFormat(v);
    scope = scopeOf(v);
    if (scope === "decoding") {
      return {
        id,
        scope,
        status: "out-of-scope",
        checks: 0,
        failures: [],
        note: "Ethereum log decoding (P26 §3.1, §3.2, §6.1): the validators' readers",
      };
    }
    note = runChecks(chk, v, scope, registryOf(v["params"]));
  } catch (error) {
    chk.fail(
      `${failureKind(error)}: ${error instanceof Error ? error.message : String(error)}`
    );
  }
  return {
    id,
    scope,
    status: chk.failures.length === 0 ? "pass" : "fail",
    checks: chk.checks,
    failures: chk.failures,
    ...(note === undefined ? {} : { note }),
  };
}
