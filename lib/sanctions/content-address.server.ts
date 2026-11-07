import "server-only";

import { createHash } from "node:crypto";

const BASE32_ALPHABET = "abcdefghijklmnopqrstuvwxyz234567";

/** CIDv1 header: version 1, codec raw (0x55), multihash sha2-256 (0x12), 32 bytes. */
const CID_V1_RAW_SHA256_PREFIX = [0x01, 0x55, 0x12, 0x20];

function base32Lower(bytes: ReadonlyArray<number>): string {
  let output = "";
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
  if (bits > 0) {
    output += BASE32_ALPHABET[(buffer << (5 - bits)) & 31];
  }
  return output;
}

export function sha256Hex(bytes: Uint8Array): string {
  return createHash("sha256").update(bytes).digest("hex");
}

/**
 * The IPFS CIDv1 (raw codec, sha2-256) of a file stored as one block. It is a
 * re-encoding of the sha256, so anyone can recompute it without an IPFS node.
 */
export function rawBlockCid(bytes: Uint8Array): string {
  const digest = createHash("sha256").update(bytes).digest();
  return `b${base32Lower([...CID_V1_RAW_SHA256_PREFIX, ...digest])}`;
}
