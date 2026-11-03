/**
 * JSON wire format v0 between this client and an HTTP gateway.
 *
 * The design specifies no gateway method list (R1 §1.8), so this format is
 * the client's own interim contract, versioned (`"v": 0`) and spoken only
 * by `http-transport.ts` and the mock gateway. Routes, relative to a
 * gateway's base URL:
 *
 *   POST v0/tx              body: SignedTx bytes (application/octet-stream)
 *                           -> {"v":0,"code":n,"detail":n}
 *   GET  v0/tx/{txId}       -> a TxLocation
 *   GET  v0/head            -> {"v":0,"height":"…","timeMs":"…"}
 *
 * uint64 values travel as decimal strings. Gateways are untrusted (GW5):
 * every field is checked, and anything malformed counts as no answer.
 */
import type { Hex } from "viem";

import type {
  ChainEvidence,
  CheckTxAnswer,
  DecisionClaim,
  GatewayHead,
  TxLocation,
} from "./transport";

export const GATEWAY_WIRE_VERSION = 0;

export class GatewayWireError extends Error {
  constructor(reason: string) {
    super(`gateway wire v0: ${reason}`);
    this.name = "GatewayWireError";
  }
}

type Json = Readonly<Record<string, unknown>>;

const HASH_RE = /^0x[0-9a-fA-F]{64}$/;
const DECIMAL_RE = /^(?:0|[1-9]\d{0,19})$/;
const UINT16_MAX = 0xffff;
const UINT32_MAX = 0xffffffff;

function object(value: unknown, what: string): Json {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new GatewayWireError(`${what} is not an object`);
  }
  return value as Json;
}

function versioned(value: unknown, what: string): Json {
  const json = object(value, what);
  if (json["v"] !== GATEWAY_WIRE_VERSION) {
    throw new GatewayWireError(`${what} has an unknown version`);
  }
  return json;
}

function integer(value: unknown, max: number, what: string): number {
  if (typeof value !== "number" || !Number.isInteger(value) || value < 0 || value > max) {
    throw new GatewayWireError(`${what} is not an integer in range`);
  }
  return value;
}

function uint64(value: unknown, what: string): bigint {
  if (typeof value !== "string" || !DECIMAL_RE.test(value)) {
    throw new GatewayWireError(`${what} is not a decimal uint64`);
  }
  const parsed = BigInt(value);
  if (parsed >= 1n << 64n) {
    throw new GatewayWireError(`${what} is above uint64`);
  }
  return parsed;
}

function hash(value: unknown, what: string): Hex {
  if (typeof value !== "string" || !HASH_RE.test(value)) {
    throw new GatewayWireError(`${what} is not a 32-byte hash`);
  }
  return value.toLowerCase() as Hex;
}

function evidence(value: unknown): ChainEvidence | null {
  if (value === null || value === undefined) {
    return null;
  }
  const json = object(value, "evidence");
  if (typeof json["kind"] !== "string") {
    throw new GatewayWireError("evidence kind is not a string");
  }
  return { kind: json["kind"], payload: json["payload"] ?? null };
}

function decision(value: unknown): DecisionClaim | null {
  if (value === null || value === undefined) {
    return null;
  }
  const json = object(value, "decision");
  return {
    decisionId: hash(json["decisionId"], "decisionId"),
    decisionTimeMs: uint64(json["decisionTimeMs"], "decisionTimeMs"),
    evidence: evidence(json["evidence"]),
  };
}

export function parseCheckTxAnswer(value: unknown): CheckTxAnswer {
  const json = versioned(value, "CheckTx answer");
  return {
    code: integer(json["code"], UINT16_MAX, "code"),
    detail: integer(json["detail"], UINT32_MAX, "detail"),
  };
}

export function parseTxLocation(value: unknown): TxLocation {
  const json = versioned(value, "location");
  switch (json["status"]) {
    case "pending":
      return { status: "pending" };
    case "absent":
      return { status: "absent" };
    case "dropped": {
      const reason = json["reason"];
      if (reason !== "expired" && reason !== "replaced") {
        throw new GatewayWireError("unknown drop reason");
      }
      return { status: "dropped", reason };
    }
    case "included":
      return {
        status: "included",
        height: uint64(json["height"], "height"),
        index: integer(json["index"], UINT32_MAX, "index"),
        code: integer(json["code"], UINT16_MAX, "code"),
        detail: integer(json["detail"], UINT32_MAX, "detail"),
        evidence: evidence(json["evidence"]),
        decision: decision(json["decision"]),
      };
    default:
      throw new GatewayWireError("unknown location status");
  }
}

export function parseGatewayHead(value: unknown): GatewayHead {
  const json = versioned(value, "head");
  return { height: uint64(json["height"], "height"), timeMs: uint64(json["timeMs"], "timeMs") };
}

export function checkTxAnswerJson(answer: CheckTxAnswer): Json {
  return { v: GATEWAY_WIRE_VERSION, code: answer.code, detail: answer.detail };
}

export function gatewayHeadJson(head: GatewayHead): Json {
  return {
    v: GATEWAY_WIRE_VERSION,
    height: head.height.toString(),
    timeMs: head.timeMs.toString(),
  };
}

export function txLocationJson(location: TxLocation): Json {
  switch (location.status) {
    case "pending":
    case "absent":
      return { v: GATEWAY_WIRE_VERSION, status: location.status };
    case "dropped":
      return { v: GATEWAY_WIRE_VERSION, status: "dropped", reason: location.reason };
    case "included":
      return {
        v: GATEWAY_WIRE_VERSION,
        status: "included",
        height: location.height.toString(),
        index: location.index,
        code: location.code,
        detail: location.detail,
        evidence: location.evidence,
        decision:
          location.decision === null
            ? null
            : {
                decisionId: location.decision.decisionId,
                decisionTimeMs: location.decision.decisionTimeMs.toString(),
                evidence: location.decision.evidence,
              },
      };
  }
}
