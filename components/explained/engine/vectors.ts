/**
 * Runs P26's conformance vectors (6529chain `design/tdh-reference/vectors`,
 * format in that folder's README) against the engine: the CI proof that the
 * pages compute TDH v1.4, and the reader a "run this vector" lens can use.
 *
 * The reader takes the file's bytes as UTF-8 without a byte order mark, keeps
 * every integer in full (a `bigint` from 2^53 on), keeps `-0` and
 * non-integers apart from integers so they fail their types, and refuses a
 * member named twice and a lone surrogate (E14). The format check refuses a
 * member the format does not name in the cycle, a transfer or a consolidation
 * event (E13). A file refused so is no vector: it fails whatever it expects,
 * as `noVector` says. Every vector is in scope: arithmetic, registry hashes,
 * cutoffs, log decoding, and cycles from decoded inputs, raw logs or both.
 */

import {
  additionalSetsMicro,
  baseTdh,
  finalTdh,
  rateCents,
} from "./arithmetic";
import {
  ALL_COLLECTIONS,
  REGISTRY_V14,
  TdhInputInvalid,
  TdhOutsideEngineRange,
  fork,
  rulesOf,
  type Registry,
  type Uint,
} from "./registry";
import {
  comparePositions,
  isKept,
  type CheckedEvent,
} from "./consolidation";
import { registryHash } from "./registryHash";
import { decodeDelegationLog, decodeTransferLog, readLog } from "./logs";
import {
  computeCycle,
  type CycleRecord,
  type CycleResult,
  type TokenRecord,
} from "./tdh";
import { canonicalOrder } from "./holdings";
import { headerTimestamps, selectCutoff, wholeDays } from "./time";
import {
  VectorFormatError,
  canonicalJson,
  decodeVectorText,
  isObject,
  parseJsonExact,
  type JsonObject,
  type JsonValue,
} from "./json";
import { checkFormat, list, show } from "./vectorFormat";

export type VectorScope =
  | "cycle"
  | "clusters"
  | "raw-logs"
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
  /**
   * Why the file is no vector (P26 §3.2, §13): refused while it was read or
   * its format checked, before any value was read as an input. Such a file
   * fails, whatever it expects; one made to be no vector passes only so.
   */
  readonly noVector?: string;
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
  const rawLogs = list(v, "raw_logs");
  return {
    block: raw(cycle["block"]),
    timestamp: raw(cycle["timestamp"]),
    ...(rawLogs.length > 0
      ? {
          logs: {
            entries: rawLogs,
            headerTimestamps: v["timestamps"] as JsonObject,
          },
        }
      : {}),
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

/** A decoded transfer as the vector format lists one, field by field. */
function transferRow(t: ReturnType<typeof decodeTransferLog>[number]): string {
  return canonicalJson([
    t.block,
    t.txIndex,
    t.logIndex,
    t.batchPos,
    t.timestamp,
    t.tx,
    t.contract,
    t.token,
    t.from,
    t.to,
    t.amount,
  ]);
}

/** A list of the vector's own rows, read the same way. */
function rowsText(rows: readonly JsonValue[]): string {
  const lower = (x: JsonValue): JsonValue =>
    typeof x === "string" ? x.toLowerCase() : x;
  return `[${rows
    .map((row) => canonicalJson(Array.isArray(row) ? row.map(lower) : row))
    .join(",")}]`;
}

function blockOf(log: JsonValue | undefined): bigint {
  return readLog(log).position.block;
}

/**
 * Log decoding (P26 §3.2, §6.1): each log's transfers, in canonical order,
 * and its kept consolidation events equal the expected ones; each malformed
 * log makes its input invalid.
 */
function checkDecoding(chk: Checker, v: JsonObject, r: Registry): void {
  const stamps = headerTimestamps(
    isObject(v["timestamps"]) ? v["timestamps"] : {}
  );
  const stampOf = (log: JsonValue | undefined): bigint => {
    const stamp = stamps.get(blockOf(log));
    if (stamp === undefined) {
      throw new TypeError("a log's block has no header timestamp");
    }
    return stamp;
  };
  const rules = rulesOf(r);
  const transfers = list(v, "logs").flatMap((log) =>
    decodeTransferLog(readLog(log), stampOf(log), rules)
  );
  chk.eq(
    "decoded transfers",
    `[${canonicalOrder(transfers).map(transferRow).join(",")}]`,
    rowsText(list(v, "expected_transfers"))
  );
  const events = list(v, "logs")
    .map((log) => decodeDelegationLog(readLog(log), null, rules))
    .filter((e): e is CheckedEvent => e !== null && isKept(e, rules))
    .sort((a, b) => comparePositions(a.position, b.position))
    .map((e) => [...e.position, e.kind, e.from, e.to]);
  const expectedEvents = list(v, "expected_events").map((x) => {
    const e = x as JsonObject;
    return [
      e["block"] ?? null,
      e["tx_index"] ?? null,
      e["log_index"] ?? null,
      e["kind"] ?? null,
      e["from"] ?? null,
      e["to"] ?? null,
    ];
  });
  chk.eq(
    "decoded delegation events",
    `[${events.map((e) => canonicalJson(e)).join(",")}]`,
    rowsText(expectedEvents)
  );
  list(v, "malformed_logs").forEach((log, i) => {
    try {
      const typed = readLog(log);
      decodeTransferLog(typed, stampOf(log), rules);
      decodeDelegationLog(typed, null, rules);
      chk.fail(`malformed log ${i} was decoded`);
    } catch (error) {
      if (!(error instanceof TdhInputInvalid)) {
        throw error;
      }
      chk.checks++;
    }
  });
}

function scopeOf(v: JsonObject): VectorScope {
  if ("arithmetic" in v) {
    return "arithmetic";
  }
  if ("logs" in v) {
    return "decoding";
  }
  if (list(v, "raw_logs").length > 0) {
    return "raw-logs";
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
  } else if (scope === "decoding") {
    checkDecoding(chk, v, r);
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

/**
 * A vector file read and its format checked (P26 §3.2): its bytes as UTF-8,
 * or a text already decoded. Throws `VectorFormatError` for a file that is
 * no vector, before any value is read as an input.
 */
export function readVector(file: string | Uint8Array): JsonObject {
  const v = parseJsonExact(
    typeof file === "string" ? file : decodeVectorText(file)
  );
  checkFormat(v);
  return v;
}

function messageOf(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

/**
 * Runs one vector, given its file name without `.json` and its bytes (or its
 * text). A file that is no vector fails, with `noVector` saying why.
 */
export function runVector(id: string, file: string | Uint8Array): VectorRun {
  let v: JsonObject;
  try {
    v = readVector(file);
  } catch (error) {
    // Any other error (nesting too deep to read, say) fails this file too.
    const format = error instanceof VectorFormatError;
    return {
      id,
      scope: "cycle",
      status: "fail",
      checks: 1,
      failures: [`${format ? "not a vector" : "error"}: ${messageOf(error)}`],
      ...(format ? { noVector: messageOf(error) } : {}),
    };
  }
  const chk = new Checker();
  const scope = scopeOf(v);
  let note: string | undefined;
  try {
    note = runChecks(chk, v, scope, registryOf(v["params"]));
  } catch (error) {
    chk.fail(`${failureKind(error)}: ${messageOf(error)}`);
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
