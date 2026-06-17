type CanonicalJsonSeen = WeakSet<object>;

export class CanonicalJsonError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CanonicalJsonError";
  }
}

export function canonicalizeJson(value: unknown): string {
  return canonicalize(value, new WeakSet());
}

function canonicalize(value: unknown, seen: CanonicalJsonSeen): string {
  if (value === null) {
    return "null";
  }

  switch (typeof value) {
    case "string":
      return JSON.stringify(value);
    case "boolean":
      return value ? "true" : "false";
    case "number":
      return serializeNumber(value);
    case "undefined":
      throw new CanonicalJsonError("Cannot canonicalize undefined");
    case "bigint":
      throw new CanonicalJsonError("Cannot canonicalize bigint");
    case "function":
      throw new CanonicalJsonError("Cannot canonicalize functions");
    case "symbol":
      throw new CanonicalJsonError("Cannot canonicalize symbols");
    case "object":
      return canonicalizeObject(value, seen);
    default:
      throw new CanonicalJsonError(`Cannot canonicalize ${typeof value}`);
  }
}

function serializeNumber(value: number): string {
  if (!Number.isFinite(value)) {
    throw new CanonicalJsonError("Cannot canonicalize non-finite numbers");
  }

  // RFC 8785 uses ECMAScript number serialization; JSON.stringify delegates to
  // that behavior for finite JSON numbers and serializes -0 as 0.
  const serialized = JSON.stringify(value);
  if (serialized === undefined) {
    throw new CanonicalJsonError("Cannot canonicalize number");
  }
  return serialized;
}

function canonicalizeObject(value: object, seen: CanonicalJsonSeen): string {
  if (seen.has(value)) {
    throw new CanonicalJsonError("Cannot canonicalize cyclic objects");
  }

  if (Array.isArray(value)) {
    seen.add(value);
    const canonicalItems = value.map((item) => canonicalize(item, seen));
    seen.delete(value);
    return `[${canonicalItems.join(",")}]`;
  }

  const prototype = Object.getPrototypeOf(value);
  if (prototype !== Object.prototype && prototype !== null) {
    throw new CanonicalJsonError("Can only canonicalize plain JSON objects");
  }

  seen.add(value);
  const record = value as Record<string, unknown>;
  const canonicalProperties = Object.keys(record)
    .sort(compareUtf16CodeUnits)
    .map((key) => `${JSON.stringify(key)}:${canonicalize(record[key], seen)}`);
  seen.delete(value);
  return `{${canonicalProperties.join(",")}}`;
}

function compareUtf16CodeUnits(left: string, right: string): number {
  if (left < right) {
    return -1;
  }

  if (left > right) {
    return 1;
  }

  return 0;
}
