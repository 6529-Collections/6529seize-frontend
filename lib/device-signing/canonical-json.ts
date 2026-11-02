import { keccak256, stringToBytes, type Hex } from "viem";

const ZERO_BODY_HASH: Hex = `0x${"0".repeat(64)}`;

function compareUtf16CodeUnits(left: string, right: string): number {
  if (left < right) {
    return -1;
  }
  if (left > right) {
    return 1;
  }
  return 0;
}

function canonicalNumber(value: number): string {
  if (!Number.isFinite(value)) {
    throw new TypeError("Cannot canonicalize non-finite numbers");
  }
  return JSON.stringify(value);
}

function canonicalObject(value: object): string {
  if (Array.isArray(value)) {
    return `[${value.map((item: unknown) => canonicalJson(item)).join(",")}]`;
  }
  const record = value as Record<string, unknown>;
  const members = Object.keys(record)
    .sort(compareUtf16CodeUnits)
    .map((key) => `${JSON.stringify(key)}:${canonicalJson(record[key])}`);
  return `{${members.join(",")}}`;
}

/**
 * RFC 8785 style canonical JSON: keys sorted by UTF-16 code units, no
 * whitespace, numbers and strings serialized by JSON.stringify.
 */
export function canonicalJson(value: unknown): string {
  if (value === null) {
    return "null";
  }
  switch (typeof value) {
    case "boolean":
      return value ? "true" : "false";
    case "number":
      return canonicalNumber(value);
    case "string":
      return JSON.stringify(value);
    case "object":
      return canonicalObject(value);
    case "bigint":
    case "symbol":
    case "undefined":
    case "function":
      break;
  }
  throw new TypeError(`Cannot canonicalize ${typeof value}`);
}

interface CanonicalBody {
  /** Canonical JSON exactly as hashed, or null when the write has no body. */
  readonly canonical: string | null;
  readonly bodyHash: Hex;
  readonly bodySize: number;
}

export function hashCanonicalString(canonical: string): {
  readonly bodyHash: Hex;
  readonly bodySize: number;
} {
  const bytes = stringToBytes(canonical);
  return { bodyHash: keccak256(bytes), bodySize: bytes.length };
}

/**
 * Canonicalizes a request body as it travels on the wire: undefined members
 * vanish exactly as JSON.stringify drops them. This must be the JSON wire
 * round trip, not a deep clone such as structuredClone, which would keep
 * undefined members and so sign different bytes than the server receives.
 */
export function canonicalizeBody(body: object | null): CanonicalBody {
  if (body === null) {
    return { canonical: null, bodyHash: ZERO_BODY_HASH, bodySize: 0 };
  }
  const wire = JSON.stringify(body);
  const canonical = canonicalJson(JSON.parse(wire));
  return { canonical, ...hashCanonicalString(canonical) };
}

export const EMPTY_BODY_HASH = ZERO_BODY_HASH;
