// Copied from 6529-Collections/6529-provenance-app src/jcs.ts at commit 906377e17438133e8a61f154edf9c6a5792b9f3f.
// Do not edit here: change the package and run ops/scripts/sync-provenance-core.mjs.
// Replaced by @6529-collections/provenance-core from npm once that is published.
// SPDX-License-Identifier: Apache-2.0
/**
 * RFC 8785 JSON Canonicalization Scheme (JCS).
 *
 * The parser is strict where RFC 8785 requires I-JSON (RFC 7493): it rejects duplicate member
 * names and lone surrogates, which JSON.parse accepts silently. Numbers are IEEE 754 doubles, as
 * RFC 8785 specifies; a number literal that a double cannot hold exactly is accepted and rounded,
 * so its canonical form differs from the input, and the canonical-form check then reports the
 * bytes as not canonical.
 *
 * Profile payloads are stricter. The 6529 provenance profile allows only integers from
 * -(2^53 - 1) to 2^53 - 1, written without a fraction or exponent, so every implementation reads
 * the same value; a larger number, such as a token ID, is a string. `parseProfileJson` checks that
 * rule on each number's original text, before it becomes a double and could be rounded.
 */

export type JsonValue = null | boolean | number | string | JsonValue[] | { [key: string]: JsonValue };

export class JcsError extends Error {
  constructor(
    message: string,
    readonly position?: number,
  ) {
    super(position === undefined ? message : `${message} at character ${position}`);
    this.name = "JcsError";
  }
}

const WS = new Set([0x20, 0x09, 0x0a, 0x0d]);

/** The largest integer magnitude the profile allows in a payload: 2^53 - 1. */
export const PROFILE_MAX_INTEGER = 2n ** 53n - 1n;

export interface ParseOptions {
  /** Refuse any number that is not an integer within ±PROFILE_MAX_INTEGER, written plainly. */
  profileNumbers?: boolean | undefined;
}

/** Parses JSON text under I-JSON rules. Throws JcsError with the character position. */
export function parseStrictJson(text: string, options: ParseOptions = {}): JsonValue {
  let i = 0;

  const skip = () => {
    while (i < text.length && WS.has(text.charCodeAt(i))) i++;
  };

  const expect = (literal: string) => {
    if (text.startsWith(literal, i)) {
      i += literal.length;
      return;
    }
    throw new JcsError(`expected ${literal}`, i);
  };

  const parseString = (): string => {
    const start = i;
    i++; // opening quote
    let out = "";
    while (true) {
      if (i >= text.length) throw new JcsError("unterminated string", start);
      const c = text.charCodeAt(i);
      if (c === 0x22) {
        i++;
        break;
      }
      if (c < 0x20) throw new JcsError("control character in string", i);
      if (c === 0x5c) {
        const e = text[i + 1];
        i += 2;
        switch (e) {
          case '"':
            out += '"';
            break;
          case "\\":
            out += "\\";
            break;
          case "/":
            out += "/";
            break;
          case "b":
            out += "\b";
            break;
          case "f":
            out += "\f";
            break;
          case "n":
            out += "\n";
            break;
          case "r":
            out += "\r";
            break;
          case "t":
            out += "\t";
            break;
          case "u": {
            const hex = text.slice(i, i + 4);
            if (!/^[0-9a-fA-F]{4}$/.test(hex)) throw new JcsError("bad \\u escape", i - 2);
            out += String.fromCharCode(Number.parseInt(hex, 16));
            i += 4;
            break;
          }
          default:
            throw new JcsError("bad escape", i - 2);
        }
        continue;
      }
      out += text[i];
      i++;
    }
    assertWellFormed(out, start);
    return out;
  };

  const parseNumber = (): number => {
    const m = /^-?(0|[1-9]\d*)(\.\d+)?([eE][+-]?\d+)?/.exec(text.slice(i));
    if (!m) throw new JcsError("bad number", i);
    if (options.profileNumbers) {
      if (m[2] !== undefined || m[3] !== undefined)
        throw new JcsError(`profile numbers are integers without a fraction or exponent: ${m[0]}`, i);
      const big = BigInt(m[0]);
      if (big > PROFILE_MAX_INTEGER || big < -PROFILE_MAX_INTEGER)
        throw new JcsError(`${m[0]} is outside -(2^53 - 1) to 2^53 - 1; write it as a string`, i);
    }
    i += m[0].length;
    const n = Number(m[0]);
    if (!Number.isFinite(n)) throw new JcsError("number out of range", i - m[0].length);
    return n;
  };

  const parseValue = (depth: number): JsonValue => {
    if (depth > 512) throw new JcsError("nesting deeper than 512", i);
    skip();
    const c = text[i];
    if (c === "{") {
      i++;
      const obj: { [key: string]: JsonValue } = Object.create(null);
      const seen = new Set<string>();
      skip();
      if (text[i] === "}") {
        i++;
        return obj;
      }
      while (true) {
        skip();
        if (text[i] !== '"') throw new JcsError("expected member name", i);
        const keyPos = i;
        const key = parseString();
        if (seen.has(key)) throw new JcsError(`duplicate member name ${JSON.stringify(key)}`, keyPos);
        seen.add(key);
        skip();
        expect(":");
        obj[key] = parseValue(depth + 1);
        skip();
        if (text[i] === ",") {
          i++;
          continue;
        }
        if (text[i] === "}") {
          i++;
          return obj;
        }
        throw new JcsError("expected , or }", i);
      }
    }
    if (c === "[") {
      i++;
      const arr: JsonValue[] = [];
      skip();
      if (text[i] === "]") {
        i++;
        return arr;
      }
      while (true) {
        arr.push(parseValue(depth + 1));
        skip();
        if (text[i] === ",") {
          i++;
          continue;
        }
        if (text[i] === "]") {
          i++;
          return arr;
        }
        throw new JcsError("expected , or ]", i);
      }
    }
    if (c === '"') return parseString();
    if (c === "t") return (expect("true"), true);
    if (c === "f") return (expect("false"), false);
    if (c === "n") return (expect("null"), null);
    return parseNumber();
  };

  const value = parseValue(0);
  skip();
  if (i !== text.length) throw new JcsError("unexpected text after the JSON value", i);
  return value;
}

function assertWellFormed(s: string, position?: number) {
  for (let k = 0; k < s.length; k++) {
    const c = s.charCodeAt(k);
    if (c >= 0xd800 && c <= 0xdbff) {
      const d = s.charCodeAt(k + 1);
      if (!(d >= 0xdc00 && d <= 0xdfff)) throw new JcsError("lone surrogate in string", position);
      k++;
    } else if (c >= 0xdc00 && c <= 0xdfff) {
      throw new JcsError("lone surrogate in string", position);
    }
  }
}

/**
 * Serializes a value under RFC 8785: members sorted by their UTF-16 code units, no whitespace,
 * strings and numbers as ECMAScript JSON.stringify writes them. Throws JcsError for a string or
 * member name with a lone surrogate, which I-JSON forbids and UTF-8 cannot encode.
 */
export function canonicalizeValue(value: JsonValue): string {
  if (value === null) return "null";
  if (typeof value === "boolean") return value ? "true" : "false";
  if (typeof value === "number") {
    if (!Number.isFinite(value)) throw new JcsError("NaN and Infinity have no JSON form");
    // ECMAScript Number::toString is the number serialization RFC 8785 section 3.2.2.3 requires.
    return JSON.stringify(value);
  }
  if (typeof value === "string") {
    assertWellFormed(value);
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) return `[${value.map(canonicalizeValue).join(",")}]`;
  // RFC 8785 section 3.2.3 orders keys by UTF-16 code units, which is what < compares; localeCompare
  // would not.
  const keys = Object.keys(value).sort(compareCodeUnits);
  for (const k of keys) assertWellFormed(k);
  return `{${keys.map((k) => `${JSON.stringify(k)}:${canonicalizeValue(value[k] as JsonValue)}`).join(",")}}`;
}

const utf8 = new TextEncoder();
const utf8Strict = new TextDecoder("utf-8", { fatal: true, ignoreBOM: true });

/** Decodes UTF-8 bytes, rejecting invalid sequences and a byte order mark. */
export function decodeUtf8Strict(bytes: Uint8Array): string {
  if (bytes[0] === 0xef && bytes[1] === 0xbb && bytes[2] === 0xbf) {
    throw new JcsError("the bytes start with a UTF-8 byte order mark");
  }
  try {
    return utf8Strict.decode(bytes);
  } catch {
    throw new JcsError("the bytes are not valid UTF-8");
  }
}

/**
 * Parses JSON text under I-JSON rules and the profile's number rule (`PROFILE_MAX_INTEGER`).
 * Throws JcsError naming the first number that breaks the rule.
 */
export function parseProfileJson(text: string): JsonValue {
  return parseStrictJson(text, { profileNumbers: true });
}

/** Parses JSON bytes and returns their RFC 8785 canonical UTF-8 bytes. */
export function jcsBytes(bytes: Uint8Array): Uint8Array {
  return utf8.encode(canonicalizeValue(parseStrictJson(decodeUtf8Strict(bytes))));
}

/** Canonical bytes of a value already parsed. */
export function jcsOfValue(value: JsonValue): Uint8Array {
  return utf8.encode(canonicalizeValue(value));
}

/** Resolves an RFC 6901 JSON Pointer such as "/payload". The empty pointer is the whole value. */
export function resolvePointer(value: JsonValue, pointer: string): JsonValue {
  if (pointer === "") return value;
  if (!pointer.startsWith("/")) throw new JcsError(`a JSON Pointer starts with "/": ${pointer}`);
  let cur: JsonValue = value;
  for (const raw of pointer.slice(1).split("/")) {
    const token = raw.replace(/~1/g, "/").replace(/~0/g, "~");
    if (Array.isArray(cur)) {
      if (!/^(0|[1-9]\d*)$/.test(token) || Number(token) >= cur.length) {
        throw new JcsError(`no element ${token} at ${pointer}`);
      }
      cur = cur[Number(token)] as JsonValue;
    } else if (cur !== null && typeof cur === "object" && Object.prototype.hasOwnProperty.call(cur, token)) {
      cur = cur[token] as JsonValue;
    } else {
      throw new JcsError(`no member ${JSON.stringify(token)} at ${pointer}`);
    }
  }
  return cur;
}

/** Orders strings by UTF-16 code units, the order RFC 8785 requires for object keys. */
export function compareCodeUnits(a: string, b: string): number {
  if (a < b) return -1;
  return a > b ? 1 : 0;
}
