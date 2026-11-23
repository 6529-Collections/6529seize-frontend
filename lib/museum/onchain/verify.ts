import { keccak256, sha256, type Hex } from "viem";
import { rawCidFromSha256 } from "./cid";
import {
  HASH_ALGORITHM_KECCAK256,
  HASH_ALGORITHM_SHA256,
  LF_NORMALIZED_LITERAL,
  RAW_BYTES_LF_LITERAL,
  RAW_BYTES_LITERAL,
  RFC8785_JCS_LITERAL,
} from "./constants";
import { canonicalizeJson, canonicalizeJsonBytes } from "./jcs";

export interface OnchainHashRef {
  readonly algorithm: number;
  readonly digest: Hex;
  readonly canonicalizationId: Hex;
}

/** What the chain says the bytes must be. */
interface OnchainContentExpectation {
  readonly contentHash: OnchainHashRef;
  /** The canonicalization's registered literal, read with `canonicalization(id)`. */
  readonly canonicalizationLiteral: string;
  /** The version's CID; `0x` when it has none. */
  readonly cid: Hex;
}

/**
 * Content to check. `json` is a parsed value to canonicalize, `text` is a
 * decoded document, and `bytes` are exactly what a byte host served.
 */
type OnchainContentInput =
  | { readonly kind: "json"; readonly value: unknown }
  | { readonly kind: "text"; readonly text: string }
  | { readonly kind: "bytes"; readonly bytes: Uint8Array };

export type OnchainVerificationStatus =
  | "verified"
  | "digest_mismatch"
  | "cid_mismatch"
  | "not_canonical"
  | "unsupported";

interface OnchainVerificationResult {
  readonly status: OnchainVerificationStatus;
  readonly computedDigest: Hex | null;
  /** Whether the CID was checked and matched; null when there is no raw CID. */
  readonly cidMatches: boolean | null;
}

const encoder = new TextEncoder();
const strictDecoder = new TextDecoder("utf-8", { fatal: true });

export function normalizeLineEndings(text: string): string {
  return text.replaceAll(/\r\n?/gu, "\n");
}

function hashBytes(algorithm: number, bytes: Uint8Array): Hex | null {
  if (algorithm === HASH_ALGORITHM_KECCAK256) return keccak256(bytes);
  if (algorithm === HASH_ALGORITHM_SHA256) return sha256(bytes);
  return null;
}

function bytesEqual(left: Uint8Array, right: Uint8Array): boolean {
  if (left.length !== right.length) return false;
  for (let index = 0; index < left.length; index += 1) {
    if (left[index] !== right[index]) return false;
  }
  return true;
}

function jcsBytes(input: OnchainContentInput): Uint8Array | "not_canonical" {
  if (input.kind === "json") return canonicalizeJsonBytes(input.value);
  try {
    const text =
      input.kind === "text" ? input.text : strictDecoder.decode(input.bytes);
    const canonical = encoder.encode(canonicalizeJson(JSON.parse(text)));
    const served = input.kind === "text" ? encoder.encode(text) : input.bytes;
    return bytesEqual(canonical, served) ? canonical : "not_canonical";
  } catch {
    return "not_canonical";
  }
}

function lfBytes(
  input: OnchainContentInput
): Uint8Array | "not_canonical" | "unsupported" {
  if (input.kind === "json") return "unsupported";
  if (input.kind === "text") {
    return encoder.encode(normalizeLineEndings(input.text));
  }
  try {
    const text = strictDecoder.decode(input.bytes);
    return normalizeLineEndings(text) === text ? input.bytes : "not_canonical";
  } catch {
    return "not_canonical";
  }
}

/**
 * The canonical bytes for a canonicalization, or a reason they cannot be
 * produced. Served bytes must already be canonical: a byte host that returns
 * a different encoding of the same JSON has not served the published record.
 */
function canonicalBytes(
  literal: string,
  input: OnchainContentInput
): Uint8Array | "not_canonical" | "unsupported" {
  if (literal === RFC8785_JCS_LITERAL) return jcsBytes(input);
  if (literal === LF_NORMALIZED_LITERAL || literal === RAW_BYTES_LF_LITERAL) {
    return lfBytes(input);
  }
  if (literal === RAW_BYTES_LITERAL) {
    if (input.kind === "bytes") return input.bytes;
    return input.kind === "text" ? encoder.encode(input.text) : "unsupported";
  }
  return "unsupported";
}

/**
 * Checks content against a version read from the registry: the digest under
 * the version's algorithm and canonicalization, then, for a raw CIDv1, the
 * SHA-256 the CID names. Only `verified` content may be shown as the record.
 */
export function verifyOnchainContent(
  expected: OnchainContentExpectation,
  input: OnchainContentInput
): OnchainVerificationResult {
  const bytes = canonicalBytes(expected.canonicalizationLiteral, input);
  if (bytes === "unsupported" || bytes === "not_canonical") {
    return { status: bytes, computedDigest: null, cidMatches: null };
  }
  const computedDigest = hashBytes(expected.contentHash.algorithm, bytes);
  if (computedDigest === null) {
    return { status: "unsupported", computedDigest: null, cidMatches: null };
  }
  if (
    computedDigest.toLowerCase() !== expected.contentHash.digest.toLowerCase()
  ) {
    return { status: "digest_mismatch", computedDigest, cidMatches: null };
  }
  const cidMatches = checkRawCid(expected.cid, bytes);
  if (cidMatches === false) {
    return { status: "cid_mismatch", computedDigest, cidMatches };
  }
  return { status: "verified", computedDigest, cidMatches };
}

/** True or false for a raw SHA-256 CIDv1, null for no CID or another form. */
export function checkRawCid(cid: Hex, bytes: Uint8Array): boolean | null {
  if (cid === "0x" || cid.length !== 2 + 36 * 2) return null;
  if (!cid.toLowerCase().startsWith("0x01551220")) return null;
  return rawCidFromSha256(sha256(bytes)).toLowerCase() === cid.toLowerCase();
}

export function keccakUtf8(text: string): Hex {
  return keccak256(encoder.encode(text));
}
