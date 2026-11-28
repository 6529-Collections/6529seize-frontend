// Copied from 6529-Collections/6529-provenance-app src/cid.ts at commit 906377e17438133e8a61f154edf9c6a5792b9f3f.
// Do not edit here: change the package and run ops/scripts/sync-provenance-core.mjs.
// Replaced by @6529-collections/provenance-core from npm once that is published.
// SPDX-License-Identifier: Apache-2.0
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

// Multiformats unsigned varints are minimal: a varint longer than one byte never ends in 0x00.
function readVarint(bytes: Uint8Array, offset: number): [value: number, next: number] {
  let value = 0;
  let shift = 0;
  for (let i = offset; i < bytes.length && i < offset + 9; i++) {
    const b = bytes[i] as number;
    value += (b & 0x7f) * 2 ** shift;
    if ((b & 0x80) === 0) {
      if (b === 0 && i > offset) throw new Error("CID: a varint is not minimally encoded");
      return [value, i + 1];
    }
    shift += 7;
  }
  throw new Error("CID: truncated varint");
}

/** Digest lengths of the multihash functions whose length is fixed. */
const DIGEST_LENGTHS: Record<number, number> = { 0x12: 32, 0x1b: 32 };

/** The CID length bounds of the registry's rule CID-1. */
export const MIN_CID_BYTES = 34;
export const MAX_CID_BYTES = 64;

/**
 * Why the registry would refuse these CID bytes, or undefined when it accepts them. Mirrors the
 * contract's rule CID-1: no CID (empty), or 34 to 64 bytes whose first byte is 0x01. The contract
 * checks nothing else, so this does not decode the CID.
 */
export function cidProblem(cid: Hex | Uint8Array): string | undefined {
  const bytes = typeof cid === "string" ? hexToBytes(cid) : cid;
  if (bytes.length === 0) return undefined;
  if (bytes.length < MIN_CID_BYTES || bytes.length > MAX_CID_BYTES)
    return `The CID is ${bytes.length} bytes; the registry takes 34 to 64.`;
  if (bytes[0] !== 0x01)
    return `The CID starts with byte 0x${(bytes[0] as number).toString(16).padStart(2, "0")}; the registry takes only a binary CIDv1, which starts with 0x01.`;
  return undefined;
}

/** The CIDv1 of a CIDv0: dag-pb with the same SHA-256 multihash. */
export function cidV0ToV1(v0: Uint8Array): Uint8Array {
  if (!(v0.length === 34 && v0[0] === 0x12 && v0[1] === 0x20)) throw new Error("CID: not a CIDv0");
  return Uint8Array.from([0x01, 0x70, ...v0]);
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
  const fixed = DIGEST_LENGTHS[hashCode];
  if (fixed !== undefined && len !== fixed)
    throw new Error(`CID: a ${MULTIHASH_NAMES[hashCode]} digest is ${fixed} bytes, not ${len}`);
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
  // RFC 4648 encoders leave fewer than 5 bits over, all zero; anything else is not a canonical
  // encoding of any bytes.
  if (bits >= 5 || buffer !== 0) throw new Error("base32: the text does not end on a byte boundary");
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
  if (/^0x[0-9a-fA-F]*$/.test(t)) {
    if (t.length % 2 !== 0) throw new Error(`CID: hex ${t} has an odd number of digits`);
    return hexToBytes(t as Hex);
  }
  if (t.startsWith("Qm")) return base58Decode(t);
  if (t.startsWith("b") || t.startsWith("B")) return base32Decode(t.slice(1));
  throw new Error("CID: only base32 CIDv1 (b...), base58 CIDv0 (Qm...) or hex are read");
}

/** Binary CIDv1 of a single raw IPFS block holding exactly these bytes: 0x01 0x55 0x12 0x20 ‖ SHA-256. */
export function rawCidV1(bytes: Uint8Array): Uint8Array {
  const digest = hexToBytes(sha256(bytes));
  return Uint8Array.from([0x01, 0x55, 0x12, 0x20, ...digest]);
}

/**
 * The UnixFS import settings this package reproduces: CIDv1, raw leaves, a fixed 1 MiB chunker and
 * the balanced layout, the settings of `ipfs add --cid-version=1 --raw-leaves --chunker=size-1048576`
 * and of 6529's add endpoint. A file up to `UNIXFS_CHUNK_BYTES` is one raw block, so its CID is
 * `rawCidV1`. A larger file is a dag-pb root over raw leaves of `UNIXFS_CHUNK_BYTES` each.
 */
export const UNIXFS_CHUNK_BYTES = 1024 * 1024;
/** Links per dag-pb node in the balanced layout. One root covers up to 174 leaves, 174 MiB. */
export const UNIXFS_MAX_LINKS = 174;
/** The largest file `unixfsFileCidV1` can address: one root over `UNIXFS_MAX_LINKS` leaves. */
export const UNIXFS_MAX_FILE_BYTES = UNIXFS_CHUNK_BYTES * UNIXFS_MAX_LINKS;

function pbField(field: number, wireType: 0 | 2, payload: number[]): number[] {
  const key = writeVarint((field << 3) | wireType);
  return wireType === 2 ? [...key, ...writeVarint(payload.length), ...payload] : [...key, ...payload];
}

/**
 * Binary CIDv1 of a file added to IPFS with the settings above (`UNIXFS_CHUNK_BYTES`). Up to 1 MiB
 * this is `rawCidV1(bytes)`. Above it, the CID of a dag-pb root whose links name the raw leaves in
 * order, each link with an empty name and the leaf's size, and whose UnixFS data is a File with the
 * total size and each leaf's size. Throws above `UNIXFS_MAX_FILE_BYTES`, where the balanced layout
 * adds a second level this package does not build.
 */
export function unixfsFileCidV1(bytes: Uint8Array): Uint8Array {
  if (bytes.length <= UNIXFS_CHUNK_BYTES) return rawCidV1(bytes);
  if (bytes.length > UNIXFS_MAX_FILE_BYTES)
    throw new Error(
      `UnixFS: ${bytes.length} bytes is over the ${UNIXFS_MAX_FILE_BYTES} a single root of ${UNIXFS_MAX_LINKS} leaves holds.`,
    );
  const links: number[] = [];
  const sizes: number[] = [];
  for (let off = 0; off < bytes.length; off += UNIXFS_CHUNK_BYTES) {
    const leaf = bytes.subarray(off, off + UNIXFS_CHUNK_BYTES);
    sizes.push(leaf.length);
    const link = [
      ...pbField(1, 2, Array.from(rawCidV1(leaf))),
      ...pbField(2, 2, []),
      ...pbField(3, 0, writeVarint(leaf.length)),
    ];
    links.push(...pbField(2, 2, link));
  }
  const unixfs = [
    ...pbField(1, 0, writeVarint(2)),
    ...pbField(3, 0, writeVarint(bytes.length)),
    ...sizes.flatMap((s) => pbField(4, 0, writeVarint(s))),
  ];
  const node = Uint8Array.from([...links, ...pbField(1, 2, unixfs)]);
  return encodeCidV1(0x70, 0x12, hexToBytes(sha256(node)));
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
 * block (codec 0x55) hashed with SHA-256 or Keccak-256. A dag-pb CID addresses a UnixFS graph; a
 * file added with the settings `unixfsFileCidV1` reproduces can be checked by recomputing that CID,
 * and any other graph needs its blocks.
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
