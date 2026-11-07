/**
 * Canonical JSON (RFC 8785) for the value subset the sanctions artifacts use,
 * matching the backend reference implementation byte for byte (spec section
 * 3). Floats, `undefined`, lone surrogates and non-plain objects throw.
 */

const LONE_SURROGATE =
  /[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(^|[^\uD800-\uDBFF])[\uDC00-\uDFFF]/;

/** RFC 8785 key order: UTF-16 code units, which is `<` on JS strings. */
function compareUtf16(a: string, b: string): number {
  if (a < b) {
    return -1;
  }
  return a > b ? 1 : 0;
}

function serializeString(value: string, path: string): string {
  if (LONE_SURROGATE.test(value)) {
    throw new TypeError(`Lone surrogate in string at ${path}`);
  }
  return JSON.stringify(value);
}

function serializeNumber(value: number, path: string): string {
  if (!Number.isSafeInteger(value)) {
    throw new TypeError(`Only safe integers are allowed at ${path}`);
  }
  return value === 0 ? "0" : String(value);
}

function serializeObject(value: object, path: string): string {
  const prototype: unknown = Object.getPrototypeOf(value);
  if (prototype !== Object.prototype && prototype !== null) {
    throw new TypeError(`Only plain objects are allowed at ${path}`);
  }
  const record = value as Record<string, unknown>;
  const members = Object.keys(record)
    .sort(compareUtf16)
    .map((key) => {
      const memberPath = `${path}.${key}`;
      return `${serializeString(key, path)}:${serialize(record[key], memberPath)}`;
    });
  return `{${members.join(",")}}`;
}

function serializeArray(value: ReadonlyArray<unknown>, path: string): string {
  const items = value.map((item, index) => {
    const itemPath = `${path}[${index}]`;
    return serialize(item, itemPath);
  });
  return `[${items.join(",")}]`;
}

function serialize(value: unknown, path: string): string {
  if (value === null) {
    return "null";
  }
  switch (typeof value) {
    case "boolean":
      return value ? "true" : "false";
    case "number":
      return serializeNumber(value, path);
    case "string":
      return serializeString(value, path);
    case "object":
      return Array.isArray(value)
        ? serializeArray(value, path)
        : serializeObject(value, path);
    case "bigint":
    case "symbol":
    case "undefined":
    case "function":
      break;
  }
  throw new TypeError(`Unsupported ${typeof value} at ${path}`);
}

export function canonicalJson(value: unknown): string {
  return serialize(value, "$");
}
