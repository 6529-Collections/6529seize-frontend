/**
 * CE: the canonical encoding of 6529chain's native objects.
 *
 * Source: `design/canonical-encodings.md` (P28) §2.6, grammar:
 *
 *   uintN, intN    N/8 bytes, big-endian; intN two's complement
 *   bool           0x00 or 0x01
 *   bytesN         N bytes; address = bytes20
 *   bytes, string  uint32 length || bytes        (length <= schema maximum)
 *   list<T>        uint32 count || T ...         (count <= schema maximum)
 *   set<T>         list<T>, strictly ascending by encoded bytes
 *   optional<T>    0x00, or 0x01 || T            (a present T is never zero)
 *   struct         fields in schema order; no tags, padding or alignment
 *
 * Decoders reject trailing bytes, lengths above the schema maximum,
 * unsorted or duplicate set entries, a present optional holding zero, and
 * strings that fail P28 §2.5. Error codes follow P40 §2.3 step 1 and §4.2.
 *
 * `map<K, V>`, `variant` and enum range checks are not needed by the
 * schemas in this directory and are not implemented; enum ranges are
 * schema rules (see `rules.ts`).
 */
import { bytesToHex, type Hex } from "viem";

import { ChainCodecError, ChainResultCode } from "./errors";
import type {
  CeType,
  FixedBytesType,
  IntType,
  ListType,
  SetType,
  StringType,
  StructType,
  UintType,
  ValueOf,
} from "./schema";

type Path = readonly (string | number)[];

const HEX_RE = /^0x[0-9a-fA-F]*$/;
const ADDRESS_BYTES = 20;
const LENGTH_PREFIX_BYTES = 4;

const utf8Encoder = new TextEncoder();
const utf8Decoder = new TextDecoder("utf-8", { fatal: true, ignoreBOM: true });

function malformed(reason: string, path: Path): ChainCodecError {
  return new ChainCodecError(ChainResultCode.MALFORMED, reason, path);
}

function bound(reason: string, path: Path): ChainCodecError {
  return new ChainCodecError(ChainResultCode.FIELD_BOUND, reason, path);
}

/** Parses `0x` hex into bytes; rejects odd lengths and other characters. */
export function hexBytes(value: unknown, path: Path = []): Uint8Array {
  if (typeof value !== "string" || value.length % 2 !== 0 || !HEX_RE.test(value)) {
    throw malformed("expected 0x-prefixed even-length hex", path);
  }
  const out = new Uint8Array((value.length - 2) / 2);
  for (let i = 0; i < out.length; i += 1) {
    out[i] = Number.parseInt(value.slice(2 + i * 2, 4 + i * 2), 16);
  }
  return out;
}

export function toHex(value: Uint8Array): Hex {
  return bytesToHex(value);
}

/** Lexicographic byte order; a proper prefix sorts first. */
export function compareBytes(a: Uint8Array, b: Uint8Array): number {
  const n = Math.min(a.length, b.length);
  for (let i = 0; i < n; i += 1) {
    const diff = (a[i] ?? 0) - (b[i] ?? 0);
    if (diff !== 0) {
      return diff;
    }
  }
  return a.length - b.length;
}

function isAllZero(value: Uint8Array): boolean {
  return value.every((byte) => byte === 0);
}

/**
 * P28 §2.5 at the encoding level: UTF-8 without a leading byte-order mark,
 * no NUL, no noncharacters. (Lone surrogates cannot reach here: the strict
 * decoder rejects them and the encoder checks for them.) The design does
 * not say whether an interior U+FEFF counts as a byte-order mark; only a
 * leading one is rejected. Closed alphabets and NFC for identifiers are
 * schema rules (`rules.ts`).
 */
function textProblem(value: string): string | null {
  if (value.codePointAt(0) === 0xfeff) {
    return "leading byte-order mark";
  }
  for (const char of value) {
    const cp = char.codePointAt(0) ?? 0;
    if (cp === 0) {
      return "NUL character";
    }
    if (cp >= 0xd800 && cp <= 0xdfff) {
      return "lone surrogate";
    }
    if ((cp >= 0xfdd0 && cp <= 0xfdef) || (cp & 0xfffe) === 0xfffe) {
      return "noncharacter";
    }
  }
  return null;
}

function intRange(type: UintType | IntType): { min: bigint; max: bigint } {
  const bits = BigInt(type.bits);
  if (type.kind === "uint") {
    return { min: 0n, max: (1n << bits) - 1n };
  }
  return { min: -(1n << (bits - 1n)), max: (1n << (bits - 1n)) - 1n };
}

function checkedInt(type: UintType | IntType, value: unknown, path: Path): bigint {
  const wide = type.bits > 32;
  let big: bigint;
  if (wide) {
    if (typeof value !== "bigint") {
      throw malformed(`expected bigint for ${type.kind}${type.bits}`, path);
    }
    big = value;
  } else {
    if (typeof value !== "number" || !Number.isInteger(value)) {
      throw malformed(`expected integer for ${type.kind}${type.bits}`, path);
    }
    big = BigInt(value);
  }
  const { min, max } = intRange(type);
  if (big < min || big > max) {
    throw bound(`${type.kind}${type.bits} out of range`, path);
  }
  return big;
}

function intBytes(value: bigint, bits: number): Uint8Array {
  const size = bits / 8;
  let unsigned = value < 0n ? (1n << BigInt(bits)) + value : value;
  const out = new Uint8Array(size);
  for (let i = size - 1; i >= 0; i -= 1) {
    out[i] = Number(unsigned & 0xffn);
    unsigned >>= 8n;
  }
  return out;
}

function bytesToInt(raw: Uint8Array, type: UintType | IntType): number | bigint {
  let value = 0n;
  for (const byte of raw) {
    value = (value << 8n) | BigInt(byte);
  }
  if (type.kind === "int" && raw.length > 0 && ((raw[0] ?? 0) & 0x80) !== 0) {
    value -= 1n << BigInt(type.bits);
  }
  return type.bits > 32 ? value : Number(value);
}

function structObject(value: unknown, path: Path): Readonly<Record<string, unknown>> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw malformed("expected an object", path);
  }
  return value as Readonly<Record<string, unknown>>;
}

function arrayValue(value: unknown, path: Path): readonly unknown[] {
  if (!Array.isArray(value)) {
    throw malformed("expected an array", path);
  }
  return value as readonly unknown[];
}

/** The zero value of a type: what an absent optional decodes to. */
export function zeroValue<T extends CeType>(type: T): ValueOf<T> {
  return zeroOf(type) as ValueOf<T>;
}

function zeroOf(type: CeType): unknown {
  switch (type.kind) {
    case "uint":
    case "int":
      return type.bits > 32 ? 0n : 0;
    case "bool":
      return false;
    case "address":
      return toHex(new Uint8Array(ADDRESS_BYTES));
    case "bytesN":
      return toHex(new Uint8Array(type.size));
    case "bytes":
      return "0x";
    case "string":
      return "";
    case "list":
    case "set":
      return [];
    case "optional":
      return zeroOf(type.inner);
    case "struct":
      return Object.fromEntries(
        type.fields.map(([name, fieldType]) => [name, zeroOf(fieldType)])
      );
  }
}

/** True when `value` is the zero value of `type` (P28 §2.6 optional rule). */
export function isZeroValue(type: CeType, value: unknown): boolean {
  switch (type.kind) {
    case "uint":
    case "int":
      return value === 0 || value === 0n;
    case "bool":
      return value === false;
    case "address":
    case "bytesN":
      return (
        typeof value === "string" &&
        value.length % 2 === 0 &&
        HEX_RE.test(value) &&
        isAllZero(hexBytes(value))
      );
    case "bytes":
      return value === "0x";
    case "string":
      return value === "";
    case "list":
    case "set":
      return Array.isArray(value) && value.length === 0;
    case "optional":
      return isZeroValue(type.inner, value);
    case "struct": {
      const object = structObject(value, []);
      return type.fields.every(([name, fieldType]) =>
        isZeroValue(fieldType, object[name])
      );
    }
  }
}

/** Accumulates CE bytes. */
export class CeWriter {
  private readonly chunks: Uint8Array[] = [];
  private length = 0;

  raw(chunk: Uint8Array): this {
    this.chunks.push(chunk);
    this.length += chunk.length;
    return this;
  }

  write<T extends CeType>(type: T, value: ValueOf<T>, path: Path = []): this {
    writeValue(this, type, value, path);
    return this;
  }

  bytes(): Uint8Array {
    const out = new Uint8Array(this.length);
    let offset = 0;
    for (const chunk of this.chunks) {
      out.set(chunk, offset);
      offset += chunk.length;
    }
    return out;
  }
}

function writeLength(writer: CeWriter, length: number): void {
  writer.raw(intBytes(BigInt(length), 32));
}

function fixedHex(value: unknown, size: number, path: Path): Uint8Array {
  const raw = hexBytes(value, path);
  if (raw.length !== size) {
    throw malformed(`expected ${size} bytes`, path);
  }
  return raw;
}

function stringBytes(type: StringType, value: unknown, path: Path): Uint8Array {
  if (typeof value !== "string") {
    throw malformed("expected a string", path);
  }
  const problem = textProblem(value);
  if (problem !== null) {
    throw new ChainCodecError(ChainResultCode.BAD_TEXT, problem, path);
  }
  const raw = utf8Encoder.encode(value);
  if (raw.length > type.max) {
    throw bound(`string longer than ${type.max} bytes`, path);
  }
  return raw;
}

function writeSequence(
  writer: CeWriter,
  type: ListType | SetType,
  value: unknown,
  path: Path
): void {
  const items = arrayValue(value, path);
  if (items.length > type.max) {
    throw bound(`more than ${type.max} entries`, path);
  }
  writeLength(writer, items.length);
  let previous: Uint8Array | null = null;
  items.forEach((item, index) => {
    const encoded = new CeWriter();
    writeValue(encoded, type.item, item, [...path, index]);
    const chunk = encoded.bytes();
    if (type.kind === "set" && previous !== null && compareBytes(previous, chunk) >= 0) {
      throw new ChainCodecError(
        ChainResultCode.UNSORTED_SET,
        "set entries must be strictly ascending",
        [...path, index]
      );
    }
    previous = chunk;
    writer.raw(chunk);
  });
}

function writeStruct(writer: CeWriter, type: StructType, value: unknown, path: Path): void {
  const object = structObject(value, path);
  for (const [name, fieldType] of type.fields) {
    writeValue(writer, fieldType, object[name], [...path, name]);
  }
}

function writeValue(writer: CeWriter, type: CeType, value: unknown, path: Path): void {
  switch (type.kind) {
    case "uint":
    case "int":
      writer.raw(intBytes(checkedInt(type, value, path), type.bits));
      return;
    case "bool":
      if (typeof value !== "boolean") {
        throw malformed("expected a boolean", path);
      }
      writer.raw(Uint8Array.of(value ? 1 : 0));
      return;
    case "address":
      writer.raw(fixedHex(value, ADDRESS_BYTES, path));
      return;
    case "bytesN":
      writer.raw(fixedHex(value, type.size, path));
      return;
    case "bytes": {
      const raw = hexBytes(value, path);
      if (raw.length > type.max) {
        throw bound(`more than ${type.max} bytes`, path);
      }
      writeLength(writer, raw.length);
      writer.raw(raw);
      return;
    }
    case "string": {
      const raw = stringBytes(type, value, path);
      writeLength(writer, raw.length);
      writer.raw(raw);
      return;
    }
    case "list":
    case "set":
      writeSequence(writer, type, value, path);
      return;
    case "optional":
      if (isZeroValue(type.inner, value)) {
        writer.raw(Uint8Array.of(0));
        return;
      }
      writer.raw(Uint8Array.of(1));
      writeValue(writer, type.inner, value, path);
      return;
    case "struct":
      writeStruct(writer, type, value, path);
  }
}

/** Reads CE bytes, front to back, rejecting anything non-canonical. */
export class CeReader {
  private offset = 0;

  constructor(private readonly input: Uint8Array) {}

  get position(): number {
    return this.offset;
  }

  take(count: number, path: Path = []): Uint8Array {
    if (count > this.input.length - this.offset) {
      throw malformed("unexpected end of input", path);
    }
    const out = this.input.subarray(this.offset, this.offset + count);
    this.offset += count;
    return out;
  }

  read<T extends CeType>(type: T, path: Path = []): ValueOf<T> {
    return readValue(this, type, path) as ValueOf<T>;
  }

  /** The bytes between two earlier positions. */
  slice(start: number, end: number): Uint8Array {
    return this.input.subarray(start, end);
  }

  /** Every byte must be consumed (P40 code 0x0102). */
  end(): void {
    if (this.offset !== this.input.length) {
      throw new ChainCodecError(
        ChainResultCode.TRAILING_BYTES,
        `${this.input.length - this.offset} trailing bytes`
      );
    }
  }
}

function readLength(reader: CeReader, max: number, path: Path): number {
  const raw = reader.take(LENGTH_PREFIX_BYTES, path);
  const length = Number(bytesToInt(raw, { kind: "uint", bits: 32 }));
  if (length > max) {
    throw bound(`length ${length} above maximum ${max}`, path);
  }
  return length;
}

function readFixed(reader: CeReader, type: FixedBytesType, path: Path): Hex {
  return toHex(reader.take(type.size, path));
}

function readString(reader: CeReader, type: StringType, path: Path): string {
  const raw = reader.take(readLength(reader, type.max, path), path);
  let text: string;
  try {
    text = utf8Decoder.decode(raw);
  } catch {
    throw new ChainCodecError(ChainResultCode.BAD_TEXT, "invalid UTF-8", path);
  }
  const problem = textProblem(text);
  if (problem !== null) {
    throw new ChainCodecError(ChainResultCode.BAD_TEXT, problem, path);
  }
  return text;
}

function readSequence(reader: CeReader, type: ListType | SetType, path: Path): unknown[] {
  const count = readLength(reader, type.max, path);
  const items: unknown[] = [];
  let previousStart = -1;
  let previousEnd = -1;
  for (let index = 0; index < count; index += 1) {
    const start = reader.position;
    items.push(readValue(reader, type.item, [...path, index]));
    const end = reader.position;
    if (type.kind === "set" && previousStart >= 0) {
      const order = compareSlices(reader, [previousStart, previousEnd], [start, end]);
      if (order >= 0) {
        throw new ChainCodecError(
          ChainResultCode.UNSORTED_SET,
          "set entries must be strictly ascending",
          [...path, index]
        );
      }
    }
    previousStart = start;
    previousEnd = end;
  }
  return items;
}

function compareSlices(
  reader: CeReader,
  a: readonly [number, number],
  b: readonly [number, number]
): number {
  return compareBytes(reader.slice(a[0], a[1]), reader.slice(b[0], b[1]));
}

function readOptional(reader: CeReader, type: CeType, path: Path): unknown {
  const flag = reader.take(1, path)[0];
  if (flag === 0) {
    return zeroOf(type);
  }
  if (flag !== 1) {
    throw malformed("optional flag must be 0x00 or 0x01", path);
  }
  const value = readValue(reader, type, path);
  if (isZeroValue(type, value)) {
    throw malformed("a present optional must not hold the zero value", path);
  }
  return value;
}

function readValue(reader: CeReader, type: CeType, path: Path): unknown {
  switch (type.kind) {
    case "uint":
    case "int":
      return bytesToInt(reader.take(type.bits / 8, path), type);
    case "bool": {
      const flag = reader.take(1, path)[0];
      if (flag !== 0 && flag !== 1) {
        throw malformed("bool must be 0x00 or 0x01", path);
      }
      return flag === 1;
    }
    case "address":
      return toHex(reader.take(ADDRESS_BYTES, path));
    case "bytesN":
      return readFixed(reader, type, path);
    case "bytes":
      return toHex(reader.take(readLength(reader, type.max, path), path));
    case "string":
      return readString(reader, type, path);
    case "list":
    case "set":
      return readSequence(reader, type, path);
    case "optional":
      return readOptional(reader, type.inner, path);
    case "struct":
      return Object.fromEntries(
        type.fields.map(([name, fieldType]) => [
          name,
          readValue(reader, fieldType, [...path, name]),
        ])
      );
  }
}

/** CE bytes of one value. */
export function encodeCe<T extends CeType>(type: T, value: ValueOf<T>): Uint8Array {
  return new CeWriter().write(type, value).bytes();
}

/** Decodes exactly one value; trailing bytes are an error. */
export function decodeCe<T extends CeType>(type: T, input: Uint8Array): ValueOf<T> {
  const reader = new CeReader(input);
  const value = reader.read(type);
  reader.end();
  return value;
}

/**
 * Sorts set entries into CE order (ascending by encoded bytes), so a caller
 * can build a value that encodes. EIP-712 hashes arrays in the order given,
 * so the sorted order must also be the signed order (P28 §7.6).
 */
export function sortSetEntries<T extends CeType>(
  item: T,
  entries: readonly ValueOf<T>[]
): ValueOf<T>[] {
  return entries
    .map((entry) => ({ entry, key: new CeWriter().write(item, entry).bytes() }))
    .sort((a, b) => compareBytes(a.key, b.key))
    .map(({ entry }) => entry);
}
