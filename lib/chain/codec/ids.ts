/**
 * Tagged hashes and deterministic identifiers.
 *
 * Source: P28 §2.4 (identifiers), §3.1-§3.2 (TAG, NETWORK_ID, tag
 * registry), §2.7 (`H(name, fields)`); P40 §3.5 (object kinds) and §5.3
 * (REP category IDs); P31's DerivedId as P40 uses it.
 *
 *   TAG(name)        = keccak256(ASCII name)
 *   H(name, f1..fk)  = keccak256(abi.encode(TAG(name), f1, ..., fk))
 *
 * Only static ABI types are needed here, so `abi.encode` is the
 * concatenation of 32-byte words.
 */
import { keccak256, type Hex } from "viem";

import { hexBytes, toHex } from "./ce";

const utf8 = new TextEncoder();
const WORD = 32;
const ADDRESS_BYTES = 20;

/** One ABI word: an unsigned integer, a bytes32 or an address. */
export type AbiWord =
  | { readonly uint: bigint | number; readonly bits: number }
  | { readonly bytes32: Hex }
  | { readonly address: Hex };

function uintWord(value: bigint, bits: number): Uint8Array {
  if (value < 0n || value >= 1n << BigInt(bits)) {
    throw new RangeError(`uint${bits} out of range`);
  }
  const out = new Uint8Array(WORD);
  let rest = value;
  for (let i = WORD - 1; i >= 0; i -= 1) {
    out[i] = Number(rest & 0xffn);
    rest >>= 8n;
  }
  return out;
}

function fixedWord(value: Hex, size: number, alignLeft: boolean): Uint8Array {
  const raw = hexBytes(value);
  if (raw.length !== size) {
    throw new RangeError(`expected ${size} bytes`);
  }
  const out = new Uint8Array(WORD);
  out.set(raw, alignLeft ? 0 : WORD - size);
  return out;
}

function encodeWord(input: AbiWord): Uint8Array {
  if ("uint" in input) {
    return uintWord(BigInt(input.uint), input.bits);
  }
  if ("bytes32" in input) {
    return fixedWord(input.bytes32, WORD, true);
  }
  return fixedWord(input.address, ADDRESS_BYTES, false);
}

export function tag(name: string): Hex {
  return keccak256(utf8.encode(name));
}

/** P28 §2.7 `H(name, fields)` over static fields. */
export function taggedHash(name: string, fields: readonly AbiWord[]): Hex {
  const words = [hexBytes(tag(name)), ...fields.map(encodeWord)];
  const preimage = new Uint8Array(words.length * WORD);
  words.forEach((w, index) => preimage.set(w, index * WORD));
  return keccak256(preimage);
}

export const keccakUtf8 = (text: string): Hex => keccak256(utf8.encode(text));

/**
 * P28 §3.1: `NETWORK_ID = H("6529.Network.v1", keccak256(chainId),
 * genesisCommitment)`. The genesis commitment (P39 §2.2) exists only at
 * genesis, so production signing waits on it (owner decision O5); devnets
 * and tests use their own values.
 */
export function networkId(chainId: string, genesisCommitment: Hex): Hex {
  return taggedHash("6529.Network.v1", [
    { bytes32: keccakUtf8(chainId) },
    { bytes32: genesisCommitment },
  ]);
}

/** P40 §3.5 object kinds (uint16, the P31 family ID of the holding record). */
export const ObjectKind = {
  PRINCIPAL: 0x0101,
  ADDRESS: 0x0102,
  CAPABILITY: 0x0301,
  GROUP: 0x0401,
  WAVE: 0x0501,
  COMPETITION: 0x0601,
  ENTRY: 0x0603,
  DECISION: 0x060a,
  AWARD: 0x0680,
  ASSET: 0x0902,
  SPONSOR_ALLOWANCE: 0x0a01,
} as const;

export type ObjectKind = (typeof ObjectKind)[keyof typeof ObjectKind];

/** P28 §2.4: `H("6529.ObjectId.v1", creatingTxId, uint32 subIndex, uint16 kind)`. */
export function objectId(txId: Hex, subIndex: number, kind: number): Hex {
  return taggedHash("6529.ObjectId.v1", [
    { bytes32: txId },
    { uint: subIndex, bits: 32 },
    { uint: kind, bits: 16 },
  ]);
}

/** P28 §3.2 / P31 §6.1: `H("6529.DerivedId.v1", parentId, uint64 index, uint16 kind)`. */
export function derivedId(parent: Hex, index: bigint, kind: number): Hex {
  return taggedHash("6529.DerivedId.v1", [
    { bytes32: parent },
    { uint: index, bits: 64 },
    { uint: kind, bits: 16 },
  ]);
}

/** P40 §3.5: a decision's ID derives from its competition and scheduled time D (ms). */
export function decisionId(competitionId: Hex, decisionTimeMs: bigint): Hex {
  return derivedId(competitionId, decisionTimeMs, ObjectKind.DECISION);
}

/**
 * P28 §2.4 / §7.8 key IDs. Key types 1 and 3 (secp256k1 wallet, contract
 * wallet) use the address as an ABI word; other key types hash the key
 * type with keccak256 of the public key, so IDs never collide across types.
 */
export function addressKeyId(addressHex: Hex): Hex {
  const raw = hexBytes(addressHex);
  if (raw.length !== ADDRESS_BYTES) {
    throw new RangeError("expected a 20-byte address");
  }
  const out = new Uint8Array(WORD);
  out.set(raw, WORD - ADDRESS_BYTES);
  return toHex(out);
}

export function publicKeyId(keyType: number, publicKey: Hex): Hex {
  return taggedHash("6529.KeyId.v1", [
    { uint: keyType, bits: 8 },
    { bytes32: keccak256(hexBytes(publicKey)) },
  ]);
}

/**
 * P40 §5.3: `categoryId = H("6529.RepCategory.v1", keccak256(categoryKey))`,
 * categoryKey being the name in ASCII lowercase. The name must already
 * pass the closed alphabet (`isRepCategoryName`).
 */
export function repCategoryId(name: string): Hex {
  return taggedHash("6529.RepCategory.v1", [{ bytes32: keccakUtf8(name.toLowerCase()) }]);
}
