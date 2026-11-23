// Copied from 6529-Collections/6529-provenance-app src/jcs.ts at commit 171ab352f90bb56f3e2248d4fd5b8e69b2a39092.
// Do not edit here: change the package and run ops/scripts/sync-provenance-core.mjs.
// Replaced by @6529-collections/provenance-core from npm once that is published.
/**
 * RFC 8785 JSON Canonicalization Scheme (JCS).
 *
 * The parser is strict where RFC 8785 requires I-JSON (RFC 7493): it rejects duplicate member
 * names and lone surrogates, which JSON.parse accepts silently. Numbers are IEEE 754 doubles, as
 * RFC 8785 specifies; a number literal that a double cannot hold exactly is accepted and rounded,
 * so its canonical form differs from the input, and the canonical-form check then reports the
 * bytes as not canonical.
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

/** Parses JSON text under I-JSON rules. Throws JcsError with the character position. */
export function parseStrictJson(text: string): JsonValue {
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

function assertWellFormed(s: string, position: number) {
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
 * strings and numbers as ECMAScript JSON.stringify writes them.
 */
export function canonicalizeValue(value: JsonValue): string {
  if (value === null) return "null";
  if (typeof value === "boolean") return value ? "true" : "false";
  if (typeof value === "number") {
    if (!Number.isFinite(value)) throw new JcsError("NaN and Infinity have no JSON form");
    // ECMAScript Number::toString is the number serialization RFC 8785 section 3.2.2.3 requires.
    return JSON.stringify(value);
  }
  if (typeof value === "string") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canonicalizeValue).join(",")}]`;
  // Array.prototype.sort without a comparator orders by UTF-16 code units, as section 3.2.3 requires.
  const keys = Object.keys(value).sort();
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
