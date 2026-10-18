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

const LITERALS: readonly (readonly [string, JsonValue])[] = [
  ["true", true],
  ["false", false],
  ["null", null],
];

function isDigit(c: string | undefined): boolean {
  return c !== undefined && c >= "0" && c <= "9";
}

function digitsEnd(text: string, from: number): number {
  let at = from;
  while (isDigit(text[at])) {
    at++;
  }
  return at;
}

/**
 * The end of the JSON number starting at `start` (RFC 8259 §6:
 * `-? (0 | [1-9] digits) (. digits)? ([eE] [+-]? digits)?`), or -1 when none
 * starts there. A fraction or an exponent without digits is not part of it.
 */
function numberEnd(text: string, start: number): number {
  let at = text[start] === "-" ? start + 1 : start;
  if (text[at] === "0") {
    at++;
  } else if (isDigit(text[at])) {
    at = digitsEnd(text, at);
  } else {
    return -1;
  }
  if (text[at] === "." && isDigit(text[at + 1])) {
    at = digitsEnd(text, at + 1);
  }
  if (text[at] === "e" || text[at] === "E") {
    const sign = text[at + 1] === "+" || text[at + 1] === "-" ? 1 : 0;
    if (isDigit(text[at + 1 + sign])) {
      at = digitsEnd(text, at + 1 + sign);
    }
  }
  return at;
}

/** A recursive-descent reader over one JSON text. */
class ExactParser {
  at = 0;

  constructor(private readonly text: string) {}

  fail(what: string): never {
    throw new VectorFormatError(`${what} at offset ${this.at}`);
  }

  space(): void {
    while (
      this.at < this.text.length &&
      " \t\n\r".includes(this.text[this.at] as string)
    ) {
      this.at++;
    }
  }

  value(): JsonValue {
    this.space();
    const c = this.text[this.at];
    if (c === "{") {
      return this.object();
    }
    if (c === "[") {
      return this.array();
    }
    if (c === '"') {
      return this.string();
    }
    for (const [word, literal] of LITERALS) {
      if (this.text.startsWith(word, this.at)) {
        this.at += word.length;
        return literal;
      }
    }
    return this.number();
  }

  private string(): string {
    const start = this.at;
    this.at++;
    while (this.at < this.text.length && this.text[this.at] !== '"') {
      this.at += this.text[this.at] === "\\" ? 2 : 1;
    }
    if (this.at >= this.text.length) {
      this.fail("an unterminated string");
    }
    this.at++;
    try {
      return JSON.parse(this.text.slice(start, this.at)) as string;
    } catch {
      return this.fail("an invalid string");
    }
  }

  private number(): JsonValue {
    const end = numberEnd(this.text, this.at);
    if (end < 0) {
      return this.fail("not JSON");
    }
    const literal = this.text.slice(this.at, end);
    this.at = end;
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
  }

  /** After a member or an element: true past the closing bracket, false past a comma. */
  private closes(close: "}" | "]"): boolean {
    this.space();
    const c = this.text[this.at];
    if (c === ",") {
      this.at++;
      return false;
    }
    if (c === close) {
      this.at++;
      return true;
    }
    return this.fail(`',' or '${close}' expected`);
  }

  private object(): JsonValue {
    this.at++;
    const out = Object.create(null) as { [key: string]: JsonValue };
    this.space();
    if (this.text[this.at] === "}") {
      this.at++;
      return out;
    }
    for (;;) {
      this.space();
      if (this.text[this.at] !== '"') {
        this.fail("a member name expected");
      }
      const key = this.string();
      if (Object.hasOwn(out, key)) {
        this.fail(`the member ${JSON.stringify(key)} named twice`);
      }
      this.space();
      if (this.text[this.at] !== ":") {
        this.fail("':' expected");
      }
      this.at++;
      out[key] = this.value();
      if (this.closes("}")) {
        return out;
      }
    }
  }

  private array(): JsonValue[] {
    this.at++;
    const out: JsonValue[] = [];
    this.space();
    if (this.text[this.at] === "]") {
      this.at++;
      return out;
    }
    for (;;) {
      out.push(this.value());
      if (this.closes("]")) {
        return out;
      }
    }
  }
}

/** Parses JSON (RFC 8259) without losing any integer. */
export function parseJsonExact(text: string): JsonValue {
  const parser = new ExactParser(text);
  const result = parser.value();
  parser.space();
  if (parser.at !== text.length) {
    parser.fail("text after the JSON value");
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
