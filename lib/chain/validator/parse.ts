/**
 * Strict readers for the validator's format-1 JSON (`types.ts`).
 *
 * Unknown fields are ignored and serde-default fields are filled, because
 * format 1 only ever adds fields. A missing required field, a wrong type, a
 * malformed hash, an unsafe integer or another format number is an error.
 */
import type { Hex } from "viem";

import {
  VALIDATOR_STATUS_FORMAT,
  type CertificateView,
  type CompareView,
  type CycleRecord,
  type DualRunReport,
  type HeaderView,
  type KeyOutcome,
  type SourceView,
  type WindowView,
} from "./types";

export class ValidatorFormatError extends Error {
  constructor(reason: string) {
    super(`validator format 1: ${reason}`);
    this.name = "ValidatorFormatError";
  }
}

type Json = Readonly<Record<string, unknown>>;

const HASH_RE = /^0x[0-9a-fA-F]{64}$/;

function object(value: unknown, what: string): Json {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new ValidatorFormatError(`${what} is not an object`);
  }
  return value as Json;
}

function uint(json: Json, key: string): number {
  const value = json[key];
  if (typeof value !== "number" || !Number.isSafeInteger(value) || value < 0) {
    throw new ValidatorFormatError(`${key} is not a safe unsigned integer`);
  }
  return value;
}

function uintOr(json: Json, key: string, fallback: number): number {
  return json[key] === undefined ? fallback : uint(json, key);
}

function uintOrNull(json: Json, key: string): number | null {
  return json[key] === undefined || json[key] === null ? null : uint(json, key);
}

function text(json: Json, key: string): string {
  const value = json[key];
  if (typeof value !== "string") {
    throw new ValidatorFormatError(`${key} is not a string`);
  }
  return value;
}

function textOrNull(json: Json, key: string): string | null {
  return json[key] === undefined || json[key] === null ? null : text(json, key);
}

function flag(json: Json, key: string): boolean {
  const value = json[key];
  if (typeof value !== "boolean") {
    throw new ValidatorFormatError(`${key} is not a boolean`);
  }
  return value;
}

function hash(json: Json, key: string): Hex {
  const value = text(json, key);
  if (!HASH_RE.test(value)) {
    throw new ValidatorFormatError(`${key} is not a 32-byte hash`);
  }
  return value.toLowerCase() as Hex;
}

function hashOrNull(json: Json, key: string): Hex | null {
  return json[key] === undefined || json[key] === null ? null : hash(json, key);
}

function array(json: Json, key: string, fallback?: readonly unknown[]): readonly unknown[] {
  const value = json[key];
  if (value === undefined && fallback !== undefined) {
    return fallback;
  }
  if (!Array.isArray(value)) {
    throw new ValidatorFormatError(`${key} is not an array`);
  }
  return value as readonly unknown[];
}

function numbers(json: Json, key: string, fallback?: readonly number[]): number[] {
  return array(json, key, fallback).map((item, index) => uint({ [index]: item }, String(index)));
}

function strings(json: Json, key: string): string[] {
  return array(json, key).map((item, index) => text({ [index]: item }, String(index)));
}

function tuple(json: Json, key: string, length: number): number[] {
  const values = numbers(json, key);
  if (values.length !== length) {
    throw new ValidatorFormatError(`${key} must have ${length} entries`);
  }
  return values;
}

function nested<T>(json: Json, key: string, read: (value: Json) => T): T | null {
  const value = json[key];
  return value === undefined || value === null ? null : read(object(value, key));
}

export function parseCertificateView(value: unknown): CertificateView {
  const json = object(value, "CertificateView");
  return {
    cycle_day: uint(json, "cycle_day"),
    cycle_root: hash(json, "cycle_root"),
    level: text(json, "level"),
    signed_weight: uint(json, "signed_weight"),
    w: uint(json, "w"),
    weight_own_node: uint(json, "weight_own_node"),
    weight_verified: uint(json, "weight_verified"),
    raw_signed_tdh: uint(json, "raw_signed_tdh"),
    raw_registered_tdh: uint(json, "raw_registered_tdh"),
    network_tdh: uint(json, "network_tdh"),
    signing_accounts: uint(json, "signing_accounts"),
    roster_count: uint(json, "roster_count"),
    roster_root: hash(json, "roster_root"),
    weight_basis: hash(json, "weight_basis"),
    flags: strings(json, "flags"),
    excluded_accounts: uint(json, "excluded_accounts"),
    verified_here: flag(json, "verified_here"),
    ours: flag(json, "ours"),
    key_count: uintOr(json, "key_count", 0),
    signed_keys: uintOr(json, "signed_keys", 0),
    roster_accounts: uintOr(json, "roster_accounts", 0),
    signer_weights: numbers(json, "signer_weights", []),
    unsigned_weights: numbers(json, "unsigned_weights", []),
    own_weight: uintOrNull(json, "own_weight"),
    own_signed: uintOr(json, "own_signed", 0),
    reported_by: uintOr(json, "reported_by", 0),
    strong_unix: uintOrNull(json, "strong_unix"),
  };
}

function parseHeader(json: Json): HeaderView {
  return {
    cycle_day: uint(json, "cycle_day"),
    boundary: uint(json, "boundary"),
    tdh_rule_id: hash(json, "tdh_rule_id"),
    cutoff_number: uint(json, "cutoff_number"),
    cutoff_hash: hash(json, "cutoff_hash"),
    cutoff_timestamp: uint(json, "cutoff_timestamp"),
    wallet_root: hash(json, "wallet_root"),
    wallet_count: uint(json, "wallet_count"),
    identity_count: uint(json, "identity_count"),
    total_tdh: uint(json, "total_tdh"),
    token_root: hash(json, "token_root"),
    token_count: uint(json, "token_count"),
  };
}

function parseWindow(json: Json): WindowView {
  return {
    opens: uint(json, "opens"),
    closes: uint(json, "closes"),
    final_at: uint(json, "final_at"),
    frozen_at: uint(json, "frozen_at"),
    late: flag(json, "late"),
  };
}

function parseKeyOutcome(value: unknown): KeyOutcome {
  const json = object(value, "KeyOutcome");
  return {
    key_id: hash(json, "key_id"),
    outcome: text(json, "outcome"),
    reason: textOrNull(json, "reason"),
    signed_unix: uintOrNull(json, "signed_unix"),
    published_unix: uintOrNull(json, "published_unix"),
    grant_hash: hashOrNull(json, "grant_hash"),
    in_certificate: flag(json, "in_certificate"),
  };
}

function parseSource(json: Json): SourceView {
  return {
    class: text(json, "class"),
    source_text: text(json, "source_text"),
    servers: strings(json, "servers"),
    anchor_number: uint(json, "anchor_number"),
  };
}

function parseDualRun(json: Json): DualRunReport {
  const [core = 0, programB = 0, python = 0] = tuple(json, "millis", 3);
  return {
    implementations: uint(json, "implementations"),
    outcome: text(json, "outcome"),
    differences: strings(json, "differences"),
    millis: [core, programB, python],
  };
}

function parseCompare(json: Json): CompareView {
  const [a = 0, b = 0, c = 0, d = 0] = tuple(json, "by_class", 4);
  const totals = json["totals"] === null || json["totals"] === undefined ? null : tuple(json, "totals", 2);
  return {
    status: text(json, "status"),
    identities_compared: uint(json, "identities_compared"),
    identities_differing: uint(json, "identities_differing"),
    wallets_compared: uint(json, "wallets_compared"),
    wallets_differing: uint(json, "wallets_differing"),
    by_class: [a, b, c, d],
    totals: totals === null ? null : [totals[0] ?? 0, totals[1] ?? 0],
    compared_unix: uintOrNull(json, "compared_unix"),
  };
}

export function parseCycleRecord(value: unknown): CycleRecord {
  const json = object(value, "CycleRecord");
  if (json["format"] !== VALIDATOR_STATUS_FORMAT) {
    throw new ValidatorFormatError("unknown format");
  }
  return {
    format: VALIDATOR_STATUS_FORMAT,
    day: uint(json, "day"),
    state: text(json, "state"),
    waiting: textOrNull(json, "waiting"),
    not_signed: textOrNull(json, "not_signed"),
    window: parseWindow(object(json["window"], "window")),
    finalized_unix: uintOrNull(json, "finalized_unix"),
    history_kind: textOrNull(json, "history_kind"),
    header: nested(json, "header", parseHeader),
    cycle_root: hashOrNull(json, "cycle_root"),
    history_root: hashOrNull(json, "history_root"),
    history_count: uintOrNull(json, "history_count"),
    source: nested(json, "source", parseSource),
    dual_run: nested(json, "dual_run", parseDualRun),
    keys: array(json, "keys").map(parseKeyOutcome),
    certificate: nested(json, "certificate", parseCertificateView),
    other_roots: array(json, "other_roots").map(parseCertificateView),
    compare: nested(json, "compare", parseCompare),
    compute_millis: uintOrNull(json, "compute_millis"),
    computed_unix: uintOrNull(json, "computed_unix"),
    updated_unix: uint(json, "updated_unix"),
  };
}
