/**
 * RFC 8785 JSON Canonicalization Scheme.
 *
 * Numbers serialize with the ECMAScript algorithm (`JSON.stringify` of a
 * finite double), strings with ECMAScript string escaping, and object members
 * sort by their UTF-16 code units. Values outside I-JSON throw.
 */
export class JcsError extends Error {
  constructor(reason: string) {
    super(`jcs_${reason}`);
    this.name = "JcsError";
  }
}

function compareUtf16(left: string, right: string): number {
  if (left < right) return -1;
  if (left > right) return 1;
  return 0;
}

function serializeString(value: string): string {
  if (hasLoneSurrogate(value)) {
    throw new JcsError("lone_surrogate");
  }
  return JSON.stringify(value);
}

function hasLoneSurrogate(value: string): boolean {
  for (let index = 0; index < value.length; index += 1) {
    const unit = value.charCodeAt(index);
    if (unit >= 0xd800 && unit <= 0xdbff) {
      const next = value.charCodeAt(index + 1);
      if (!(next >= 0xdc00 && next <= 0xdfff)) return true;
      index += 1;
    } else if (unit >= 0xdc00 && unit <= 0xdfff) {
      return true;
    }
  }
  return false;
}

function serializeNumber(value: number): string {
  if (!Number.isFinite(value)) throw new JcsError("non_finite_number");
  // ECMAScript Number::toString, which RFC 8785 adopts; -0 becomes "0".
  return JSON.stringify(value);
}

export function canonicalizeJson(value: unknown): string {
  if (value === null) return "null";
  switch (typeof value) {
    case "boolean":
      return value ? "true" : "false";
    case "number":
      return serializeNumber(value);
    case "string":
      return serializeString(value);
    case "object": {
      if (Array.isArray(value)) {
        return `[${value.map((item: unknown) => canonicalizeJson(item)).join(",")}]`;
      }
      const record = value as Record<string, unknown>;
      const members = Object.keys(record)
        .sort(compareUtf16)
        .map(
          (key) => `${serializeString(key)}:${canonicalizeJson(record[key])}`
        );
      return `{${members.join(",")}}`;
    }
    case "bigint":
    case "function":
    case "symbol":
    case "undefined":
      throw new JcsError("unsupported_value");
  }
  throw new JcsError("unsupported_value");
}

const encoder = new TextEncoder();

export function canonicalizeJsonBytes(value: unknown): Uint8Array {
  return encoder.encode(canonicalizeJson(value));
}
