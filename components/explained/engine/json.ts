/**
 * JSON read without losing an integer, for P26's conformance vectors (the
 * vector format's "Types"): every integer in full, a `bigint` from 2^53 on;
 * `-0`, fractions and exponents kept apart from integers, so they fail any
 * integer type; a member named twice refused, so the file is no vector.
 */

/**
 * A JSON number that is no integer in canonical form: `-0` (vector 80), or
 * one with a fraction or an exponent. The engine refuses it as an integer.
 */
export class JsonNonInteger {
  constructor(readonly text: string) {}
}

const NEGATIVE_ZERO = new JsonNonInteger("-0");

export type JsonValue =
  | null
  | boolean
  | string
  | number
  | bigint
  | JsonNonInteger
  | JsonValue[]
  | { [key: string]: JsonValue };

/** Not a vector at all: not JSON, a member twice, or a broken shape. */
export class VectorFormatError extends Error {
  override readonly name = "VectorFormatError";
}

const NUMBER = /-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?/y;
const LITERALS: readonly (readonly [string, JsonValue])[] = [
  ["true", true],
  ["false", false],
  ["null", null],
];

/** Parses JSON (RFC 8259) without losing any integer. */
export function parseJsonExact(text: string): JsonValue {
  let at = 0;
  const fail = (what: string): never => {
    throw new VectorFormatError(`${what} at offset ${at}`);
  };
  const space = (): void => {
    while (at < text.length && " \t\n\r".includes(text[at] as string)) {
      at++;
    }
  };
  const string = (): string => {
    const start = at;
    at++;
    while (at < text.length && text[at] !== '"') {
      at += text[at] === "\\" ? 2 : 1;
    }
    if (at >= text.length) {
      fail("an unterminated string");
    }
    at++;
    try {
      return JSON.parse(text.slice(start, at)) as string;
    } catch {
      return fail("an invalid string");
    }
  };
  const number = (): JsonValue => {
    NUMBER.lastIndex = at;
    const match = NUMBER.exec(text);
    if (match === null) {
      return fail("not JSON");
    }
    const literal = match[0];
    at += literal.length;
    if (/[.eE]/.test(literal)) {
      return new JsonNonInteger(literal);
    }
    if (literal === "-0") {
      return NEGATIVE_ZERO;
    }
    const n = BigInt(literal);
    return n <= BigInt(Number.MAX_SAFE_INTEGER) &&
      n >= -BigInt(Number.MAX_SAFE_INTEGER)
      ? Number(n)
      : n;
  };
  const value = (): JsonValue => {
    space();
    const c = text[at];
    if (c === "{") {
      at++;
      const out: { [key: string]: JsonValue } = Object.create(null) as {
        [key: string]: JsonValue;
      };
      space();
      if (text[at] === "}") {
        at++;
        return out;
      }
      for (;;) {
        space();
        if (text[at] !== '"') {
          fail("a member name expected");
        }
        const key = string();
        if (Object.hasOwn(out, key)) {
          fail(`the member ${JSON.stringify(key)} named twice`);
        }
        space();
        if (text[at] !== ":") {
          fail("':' expected");
        }
        at++;
        out[key] = value();
        space();
        if (text[at] === ",") {
          at++;
        } else if (text[at] === "}") {
          at++;
          return out;
        } else {
          fail("',' or '}' expected");
        }
      }
    }
    if (c === "[") {
      at++;
      const out: JsonValue[] = [];
      space();
      if (text[at] === "]") {
        at++;
        return out;
      }
      for (;;) {
        out.push(value());
        space();
        if (text[at] === ",") {
          at++;
        } else if (text[at] === "]") {
          at++;
          return out;
        } else {
          fail("',' or ']' expected");
        }
      }
    }
    if (c === '"') {
      return string();
    }
    for (const [word, literal] of LITERALS) {
      if (text.startsWith(word, at)) {
        at += word.length;
        return literal;
      }
    }
    return number();
  };
  const result = value();
  space();
  if (at !== text.length) {
    fail("text after the JSON value");
  }
  return result;
}

/** A deterministic serialization: members in order, integers in full. */
export function canonicalJson(value: JsonValue): string {
  if (value instanceof JsonNonInteger) {
    return value.text;
  }
  if (typeof value === "bigint") {
    return value.toString();
  }
  if (Array.isArray(value)) {
    return `[${value.map(canonicalJson).join(",")}]`;
  }
  if (value !== null && typeof value === "object") {
    return `{${Object.entries(value)
      .map(([k, v]) => `${JSON.stringify(k)}:${canonicalJson(v)}`)
      .join(",")}}`;
  }
  return JSON.stringify(value);
}

export type JsonObject = { readonly [key: string]: JsonValue };

export function isObject(value: JsonValue | undefined): value is JsonObject {
  return (
    value !== null &&
    value !== undefined &&
    typeof value === "object" &&
    !Array.isArray(value) &&
    !(value instanceof JsonNonInteger)
  );
}
