// Copied from 6529-Collections/6529-provenance-app src/cid.ts at commit 117e850026f6e1d754e76a687e526f51cceca4a0.
// Do not edit here: change the package and run ops/scripts/sync-provenance-core.mjs.
// Replaced by @6529-collections/provenance-core from npm once that is published.
import { bytesToHex, hexToBytes, sha256, type Hex } from "viem";

/**
 * CIDs as the registry stores them: binary CIDv1, 34 to 64 bytes. The registry checks only the
 * length and the leading 0x01; the codec and hash function are the institution's choice.
 */

export const CODEC_NAMES: Record<number, string> = {
  0x55: "raw",
  0x70: "dag-pb",
  0x71: "dag-cbor",
  0x0129: "dag-json",
  0x0200: "json",
};

export const MULTIHASH_NAMES: Record<number, string> = {
  0x12: "sha2-256",
  0x1b: "keccak-256",
  0x1e: "blake3",
};

export interface DecodedCid {
  version: number;
  codec: number;
  codecName: string;
  hashCode: number;
  hashName: string;
  digest: Uint8Array;
  bytes: Uint8Array;
}

function readVarint(bytes: Uint8Array, offset: number): [value: number, next: number] {
  let value = 0;
  let shift = 0;
  for (let i = offset; i < bytes.length && i < offset + 9; i++) {
    const b = bytes[i] as number;
    value += (b & 0x7f) * 2 ** shift;
    if ((b & 0x80) === 0) return [value, i + 1];
    shift += 7;
  }
  throw new Error("CID: truncated varint");
}

function writeVarint(value: number): number[] {
  const out: number[] = [];
  let v = value;
  while (v >= 0x80) {
    out.push((v & 0x7f) | 0x80);
    v = Math.floor(v / 128);
  }
  out.push(v);
  return out;
}

export function decodeCidBytes(input: Uint8Array | Hex): DecodedCid {
  const bytes = typeof input === "string" ? hexToBytes(input) : input;
  if (bytes.length === 34 && bytes[0] === 0x12 && bytes[1] === 0x20) {
    return {
      version: 0,
      codec: 0x70,
      codecName: "dag-pb",
      hashCode: 0x12,
      hashName: "sha2-256",
      digest: bytes.slice(2),
      bytes,
    };
  }
  const [version, a] = readVarint(bytes, 0);
  if (version !== 1) throw new Error(`CID: version ${version} is not 1`);
  const [codec, b] = readVarint(bytes, a);
  const [hashCode, c] = readVarint(bytes, b);
  const [len, d] = readVarint(bytes, c);
  if (d + len !== bytes.length)
    throw new Error(`CID: digest length ${len} does not match ${bytes.length - d} bytes`);
  return {
    version,
    codec,
    codecName: CODEC_NAMES[codec] ?? `0x${codec.toString(16)}`,
    hashCode,
    hashName: MULTIHASH_NAMES[hashCode] ?? `0x${hashCode.toString(16)}`,
    digest: bytes.slice(d),
    bytes,
  };
}

const B32 = "abcdefghijklmnopqrstuvwxyz234567";

export function base32Encode(bytes: Uint8Array): string {
  let out = "";
  let buffer = 0;
  let bits = 0;
  for (const byte of bytes) {
    buffer = (buffer << 8) | byte;
    bits += 8;
    while (bits >= 5) {
      out += B32[(buffer >>> (bits - 5)) & 31];
      bits -= 5;
    }
    buffer &= (1 << bits) - 1;
  }
  if (bits > 0) out += B32[(buffer << (5 - bits)) & 31];
  return out;
}

export function base32Decode(text: string): Uint8Array {
  const out: number[] = [];
  let buffer = 0;
  let bits = 0;
  for (const ch of text.toLowerCase()) {
    const v = B32.indexOf(ch);
    if (v === -1) throw new Error(`base32: invalid character ${JSON.stringify(ch)}`);
    buffer = (buffer << 5) | v;
    bits += 5;
    if (bits >= 8) {
      out.push((buffer >>> (bits - 8)) & 0xff);
      bits -= 8;
    }
    buffer &= (1 << bits) - 1;
  }
  return Uint8Array.from(out);
}

const B58 = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";

export function base58Encode(bytes: Uint8Array): string {
  let n = 0n;
  for (const b of bytes) n = n * 256n + BigInt(b);
  let out = "";
  while (n > 0n) {
    out = B58[Number(n % 58n)] + out;
    n /= 58n;
  }
  for (const b of bytes) {
    if (b !== 0) break;
    out = `1${out}`;
  }
  return out;
}

export function base58Decode(text: string): Uint8Array {
  let n = 0n;
  for (const ch of text) {
    const v = B58.indexOf(ch);
    if (v === -1) throw new Error(`base58: invalid character ${JSON.stringify(ch)}`);
    n = n * 58n + BigInt(v);
  }
  const out: number[] = [];
  while (n > 0n) {
    out.unshift(Number(n % 256n));
    n /= 256n;
  }
  for (const ch of text) {
    if (ch !== "1") break;
    out.unshift(0);
  }
  return Uint8Array.from(out);
}

/** The text form of a CID: base32 with multibase prefix "b" for CIDv1, base58btc for CIDv0. */
export function cidToString(input: Uint8Array | Hex): string {
  const bytes = typeof input === "string" ? hexToBytes(input) : input;
  if (bytes.length === 34 && bytes[0] === 0x12 && bytes[1] === 0x20) return base58Encode(bytes);
  return `b${base32Encode(bytes)}`;
}

/** Parses a CID in text form (base32 "b…", or CIDv0 "Qm…") or hex to its binary form. */
export function parseCid(text: string): Uint8Array {
  const t = text.trim();
  if (/^0x[0-9a-fA-F]*$/.test(t)) return hexToBytes(t as Hex);
  if (t.startsWith("Qm")) return base58Decode(t);
  if (t.startsWith("b") || t.startsWith("B")) return base32Decode(t.slice(1));
  throw new Error("CID: only base32 CIDv1 (b...), base58 CIDv0 (Qm...) or hex are read");
}

/** Binary CIDv1 of a single raw IPFS block holding exactly these bytes: 0x01 0x55 0x12 0x20 ‖ SHA-256. */
export function rawCidV1(bytes: Uint8Array): Uint8Array {
  const digest = hexToBytes(sha256(bytes));
  return Uint8Array.from([0x01, 0x55, 0x12, 0x20, ...digest]);
}

/** Binary CIDv1 with any codec and multihash code over a given digest. */
export function encodeCidV1(codec: number, hashCode: number, digest: Uint8Array): Uint8Array {
  return Uint8Array.from([
    1,
    ...writeVarint(codec),
    ...writeVarint(hashCode),
    ...writeVarint(digest.length),
    ...digest,
  ]);
}

/**
 * Whether bytes can be checked against a CID without an IPFS node: true when the CID is a raw
 * block (codec 0x55) hashed with SHA-256 or Keccak-256. A dag-pb CID addresses a UnixFS graph,
 * and checking it needs the graph's blocks.
 */
export function cidCoversBytes(cid: DecodedCid): boolean {
  return cid.version === 1 && cid.codec === 0x55 && (cid.hashCode === 0x12 || cid.hashCode === 0x1b);
}

export function hex(bytes: Uint8Array): Hex {
  return bytesToHex(bytes);
}

/** The 43-character base64url Arweave transaction ID of 32 raw bytes. */
export function arweaveIdToString(id: Hex): string {
  const bytes = hexToBytes(id);
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export function arweaveIdFromString(text: string): Hex {
  const b64 = text.trim().replace(/-/g, "+").replace(/_/g, "/");
  const bin = atob(b64 + "=".repeat((4 - (b64.length % 4)) % 4));
  if (bin.length !== 32) throw new Error(`Arweave ID: ${bin.length} bytes, expected 32`);
  return bytesToHex(Uint8Array.from(bin, (c) => c.charCodeAt(0)));
}

export const ZERO32: Hex = "0x0000000000000000000000000000000000000000000000000000000000000000";
