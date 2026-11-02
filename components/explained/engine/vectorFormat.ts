/**
 * The vector format's shape (6529chain `design/tdh-reference/README.md`,
 * "Vector format"; P26 §3.2), checked over the whole file before any value
 * is read as an input: a JSON object of known keys, each container of its
 * kind, each entry an object with its required members, the cycle, each
 * transfer and each consolidation event with no member the format does not
 * name (E13), each event of a known kind and each transfer's contract one of
 * the three names, raw logs with their timestamps, and registry overrides by
 * §10 name. Anything else makes the file no vector (`VectorFormatError`),
 * never an input with no result.
 */

import {
  VectorFormatError,
  canonicalJson,
  isObject,
  type JsonObject,
  type JsonValue,
} from "./json";
import { LOG_FIELDS } from "./logs";
import { REGISTRY_FIELDS } from "./registry";

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
  raw_logs: LOG_FIELDS,
  cutoff_invalid: ["date", "headers", "finalized"],
};
/**
 * E13: the format's own objects hold the members it names and no other. A
 * raw log is JSON-RPC's object, not the format's: its other members, such as
 * `blockHash`, are allowed and not read (vector 106).
 */
const ONLY_MEMBERS: Readonly<Record<string, ReadonlySet<string>>> = {
  transfers: new Set(ENTRY_FIELDS["transfers"]),
  consolidation_events: new Set([
    ...(ENTRY_FIELDS["consolidation_events"] ?? []),
    "use_case",
    "timestamp",
  ]),
};
const CYCLE_MEMBERS = new Set(["block", "timestamp"]);
const CYCLE_KEYS = [
  "transfers",
  "consolidation_events",
  "raw_logs",
  "claim_max",
  "expected",
  "expected_invalid",
];
const REGISTRY_NAMES = new Set(REGISTRY_FIELDS.map(([name]) => name as string));

/** A list member of the vector, or none. */
export function list(v: JsonObject, key: string): readonly JsonValue[] {
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
  const only = ONLY_MEMBERS[key];
  const other = only
    ? Object.keys(entry).find((f) => !only.has(f))
    : undefined;
  if (other !== undefined) {
    throw new VectorFormatError(
      `an entry of ${key} has the member ${other}, which the format does not name (E13)`
    );
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
    raw_logs: list(v, "raw_logs"),
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
  const other = isObject(cycle)
    ? Object.keys(cycle).find((k) => !CYCLE_MEMBERS.has(k))
    : undefined;
  if (other !== undefined) {
    throw new VectorFormatError(
      `cycle has the member ${other}, which the format does not name (E13)`
    );
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
export function checkFormat(v: JsonValue): asserts v is JsonObject {
  if (!isObject(v)) {
    throw new VectorFormatError("a vector is a JSON object");
  }
  checkTopLevel(v);
  checkNames(checkEntries(v));
  checkCycleShape(v);
}

/** A reader value as text: a string as itself, anything else as JSON. */
export function show(x: JsonValue | undefined): string {
  return typeof x === "string" ? x : canonicalJson(x ?? null);
}
