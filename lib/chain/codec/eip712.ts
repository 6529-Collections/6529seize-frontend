/**
 * EIP-712 hashing driven by the CE schemas.
 *
 * Source: P28 §7.2 and §7.6 (CE to EIP-712 mapping), P40 §2.2 (signing
 * digest). `list<T>`/`set<T>` map to `T[]`, `optional<T>` to `T` (zero means
 * absent), `bytes`/`string` hash their contents. The domain has name,
 * version and salt only: no chainId and no verifyingContract (P28 §7.6).
 *
 * This is a second, independent implementation beside viem's
 * `hashTypedData`; the tests check the two agree on every schema here, as
 * P28 §9 rule 9 asks for cross-implementation vectors.
 */
import { keccak256, type Hex } from "viem";

import { hexBytes, toHex } from "./ce";
import { ChainCodecError, ChainResultCode } from "./errors";
import type { CeType, StructType } from "./schema";
import { bytes32, string as ceString, struct } from "./schema";

const utf8 = new TextEncoder();
const WORD = 32;

export const EIP712_DOMAIN = struct("EIP712Domain", [
  ["name", ceString(64)],
  ["version", ceString(8)],
  ["salt", bytes32],
]);

export interface Eip712Domain {
  readonly name: string;
  readonly version: string;
  readonly salt: Hex;
}

function eip712TypeName(type: CeType): string {
  switch (type.kind) {
    case "uint":
    case "int":
      return `${type.kind}${type.bits}`;
    case "bool":
    case "address":
    case "bytes":
    case "string":
      return type.kind;
    case "bytesN":
      return `bytes${type.size}`;
    case "list":
    case "set":
      return `${eip712TypeName(type.item)}[]`;
    case "optional":
      return eip712TypeName(type.inner);
    case "struct":
      return type.name;
  }
}

function referencedStruct(type: CeType): StructType | null {
  if (type.kind === "list" || type.kind === "set") {
    return referencedStruct(type.item);
  }
  if (type.kind === "optional") {
    return referencedStruct(type.inner);
  }
  return type.kind === "struct" ? type : null;
}

function sameLayout(a: StructType, b: StructType): boolean {
  return encodeOne(a) === encodeOne(b);
}

function encodeOne(type: StructType): string {
  const members = type.fields
    .map(([name, fieldType]) => `${eip712TypeName(fieldType)} ${name}`)
    .join(",");
  return `${type.name}(${members})`;
}

function collectDependencies(primary: StructType): StructType[] {
  const found = new Map<string, StructType>();
  const pending: StructType[] = [primary];
  for (let next = pending.pop(); next !== undefined; next = pending.pop()) {
    for (const [, fieldType] of next.fields) {
      const dependency = referencedStruct(fieldType);
      if (dependency === null || dependency.name === primary.name) {
        continue;
      }
      const known = found.get(dependency.name);
      if (known === undefined) {
        found.set(dependency.name, dependency);
        pending.push(dependency);
      } else if (!sameLayout(known, dependency)) {
        // P28 §7.6 and §9 rule 1: a changed layout must be renamed.
        throw new ChainCodecError(
          ChainResultCode.MALFORMED,
          `two layouts named ${dependency.name}`
        );
      }
    }
  }
  return [...found.values()].sort((a, b) => (a.name < b.name ? -1 : 1));
}

/** EIP-712 `encodeType`: the primary type, then its dependencies by name. */
export function encodeType(primary: StructType): string {
  return [primary, ...collectDependencies(primary)].map(encodeOne).join("");
}

export function typeHash(primary: StructType): Hex {
  return keccak256(utf8.encode(encodeType(primary)));
}

function word(value: bigint, bits: number): Uint8Array {
  const out = new Uint8Array(WORD);
  const limit = 1n << BigInt(bits);
  if (value >= limit || value < -(limit >> 1n)) {
    throw new ChainCodecError(ChainResultCode.FIELD_BOUND, "integer out of range");
  }
  let unsigned = value < 0n ? (1n << 256n) + value : value;
  for (let i = WORD - 1; i >= 0; i -= 1) {
    out[i] = Number(unsigned & 0xffn);
    unsigned >>= 8n;
  }
  return out;
}

function intValue(value: unknown): bigint {
  if (typeof value === "bigint") {
    return value;
  }
  if (typeof value === "number" && Number.isInteger(value)) {
    return BigInt(value);
  }
  throw new ChainCodecError(ChainResultCode.MALFORMED, "expected an integer");
}

function padRight(raw: Uint8Array): Uint8Array {
  const out = new Uint8Array(WORD);
  out.set(raw.subarray(0, WORD));
  return out;
}

function padLeft(raw: Uint8Array): Uint8Array {
  const out = new Uint8Array(WORD);
  out.set(raw, WORD - raw.length);
  return out;
}

function concatBytes(parts: readonly Uint8Array[]): Uint8Array {
  const total = parts.reduce((sum, part) => sum + part.length, 0);
  const out = new Uint8Array(total);
  let offset = 0;
  for (const part of parts) {
    out.set(part, offset);
    offset += part.length;
  }
  return out;
}

function keccakBytes(input: Uint8Array): Uint8Array {
  return keccak256(input, "bytes");
}

function encodeData(type: CeType, value: unknown): Uint8Array {
  switch (type.kind) {
    case "uint":
    case "int":
      return word(intValue(value), type.bits);
    case "bool":
      if (typeof value !== "boolean") {
        throw new ChainCodecError(ChainResultCode.MALFORMED, "expected a boolean");
      }
      return word(value ? 1n : 0n, 8);
    case "address":
      return padLeft(hexBytes(value));
    case "bytesN":
      return padRight(hexBytes(value));
    case "bytes":
      return keccakBytes(hexBytes(value));
    case "string":
      if (typeof value !== "string") {
        throw new ChainCodecError(ChainResultCode.MALFORMED, "expected a string");
      }
      return keccakBytes(utf8.encode(value));
    case "list":
    case "set": {
      if (!Array.isArray(value)) {
        throw new ChainCodecError(ChainResultCode.MALFORMED, "expected an array");
      }
      const items = value as readonly unknown[];
      return keccakBytes(concatBytes(items.map((item) => encodeData(type.item, item))));
    }
    case "optional":
      return encodeData(type.inner, value);
    case "struct":
      return hashStructBytes(type, value);
  }
}

function hashStructBytes(type: StructType, value: unknown): Uint8Array {
  if (typeof value !== "object" || value === null) {
    throw new ChainCodecError(ChainResultCode.MALFORMED, `expected ${type.name}`);
  }
  const object = value as Readonly<Record<string, unknown>>;
  const parts = [
    hexBytes(typeHash(type)),
    ...type.fields.map(([name, fieldType]) => encodeData(fieldType, object[name])),
  ];
  return keccakBytes(concatBytes(parts));
}

/** EIP-712 `hashStruct(value)`. */
export function hashStruct(type: StructType, value: unknown): Hex {
  return toHex(hashStructBytes(type, value));
}

export function domainSeparator(domain: Eip712Domain): Hex {
  return hashStruct(EIP712_DOMAIN, domain);
}

/** `keccak256(0x19 || 0x01 || domainSeparator || structHash)`. */
export function typedDataDigest(separator: Hex, structHash: Hex): Hex {
  return keccak256(
    concatBytes([Uint8Array.of(0x19, 0x01), hexBytes(separator), hexBytes(structHash)])
  );
}
