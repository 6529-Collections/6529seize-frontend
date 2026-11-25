import { keccak256, sha256, stringToBytes, type Hex } from "viem";
import { taggedHash } from "@/lib/chain/codec/ids";
import { chainGateway } from "@/lib/chain-identity/gateway";
import { canonicalJson } from "@/lib/device-signing/canonical-json";

/**
 * Off-chain documents rule version 7 points at (P40 5.2, P37): wave
 * metadata (class 3) and decision metadata (class 10) by CID; group
 * definitions (6), outcome templates (7) and entry manifests (8) by
 * commitment. Each is canonical JSON and a newline, as the waves import
 * writes its documents, kept in the gateway's document store by its CID.
 */

export const DocClass = {
  WAVE: 3,
  MODERATION_REASON: 4,
  GROUP: 6,
  OUTCOME_TEMPLATE: 7,
  ENTRY_MANIFEST: 8,
  DECISION: 10,
} as const;

const CID_PREFIX = "01551220";
const NONCE_BYTES = 16;

/** The bytes of a document: canonical JSON and a newline. */
export const docBytes = (doc: object): Uint8Array =>
  stringToBytes(`${canonicalJson(doc)}\n`);

/** A binary CIDv1, raw codec, sha2-256: 0x01 0x55 0x12 0x20 || sha256. */
export const docCid = (bytes: Uint8Array): Hex =>
  `0x${CID_PREFIX}${sha256(bytes).slice(2)}`;

/**
 * A fresh 128-bit nonce for a committed document, as the 32-byte word the
 * commitment takes (the nonce in the high 16 bytes).
 */
export function freshDocNonce(): Hex {
  const random = new Uint8Array(NONCE_BYTES);
  globalThis.crypto.getRandomValues(random);
  const hex = [...random]
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
  return `0x${hex}${"00".repeat(32 - NONCE_BYTES)}`;
}

/**
 * P40 5.2's commitment: `H("6529.OffchainDoc.v1", uint8 docClass, bytes32
 * nonce, bytes32 keccak256(docBytes))`. The document carries its nonce, so
 * anyone holding it can check the commitment.
 */
export const docCommitment = (
  docClass: number,
  nonce: Hex,
  bytes: Uint8Array
): Hex =>
  taggedHash("6529.OffchainDoc.v1", [
    { uint: docClass, bits: 8 },
    { bytes32: nonce },
    { bytes32: keccak256(bytes) },
  ]);

/** Keeps a document in the gateway's store under its CID; returns the CID. */
export async function storeDoc(
  bytes: Uint8Array,
  signal?: AbortSignal
): Promise<Hex> {
  const cid = docCid(bytes);
  await chainGateway.uploadDoc(bytes, cid, signal);
  return cid;
}
