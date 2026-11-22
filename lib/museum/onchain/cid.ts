import { bytesToHex, hexToBytes, type Hex } from "viem";

/** CIDv1, raw codec (0x55), multihash SHA2-256 (0x12) of 32 bytes (0x20). */
const RAW_SHA256_CID_PREFIX = Uint8Array.from([0x01, 0x55, 0x12, 0x20]);
const BASE32_ALPHABET = "abcdefghijklmnopqrstuvwxyz234567";

/** The raw CIDv1 of bytes whose SHA-256 is `sha256Digest`. */
export function rawCidFromSha256(sha256Digest: Hex): Hex {
  const digest = hexToBytes(sha256Digest);
  if (digest.length !== 32) throw new Error("cid_digest_length");
  const cid = new Uint8Array(RAW_SHA256_CID_PREFIX.length + digest.length);
  cid.set(RAW_SHA256_CID_PREFIX, 0);
  cid.set(digest, RAW_SHA256_CID_PREFIX.length);
  return bytesToHex(cid);
}

/** The SHA-256 a raw CIDv1 names, or null for any other CID form. */
export function sha256FromRawCid(cid: Hex): Hex | null {
  const bytes = hexToBytes(cid);
  if (bytes.length !== 36) return null;
  for (let index = 0; index < RAW_SHA256_CID_PREFIX.length; index += 1) {
    if (bytes[index] !== RAW_SHA256_CID_PREFIX[index]) return null;
  }
  return bytesToHex(bytes.slice(RAW_SHA256_CID_PREFIX.length));
}

/** Multibase base32 (lower case, no padding), the `bafk...` text form. */
export function cidToText(cid: Hex): string {
  const bytes = hexToBytes(cid);
  let output = "b";
  let buffer = 0;
  let bits = 0;
  for (const byte of bytes) {
    buffer = (buffer << 8) | byte;
    bits += 8;
    while (bits >= 5) {
      output += BASE32_ALPHABET[(buffer >>> (bits - 5)) & 31];
      bits -= 5;
    }
    buffer &= (1 << bits) - 1;
  }
  if (bits > 0) output += BASE32_ALPHABET[(buffer << (5 - bits)) & 31];
  return output;
}
