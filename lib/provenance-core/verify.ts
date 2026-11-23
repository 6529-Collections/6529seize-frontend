// Copied from 6529-Collections/6529-provenance-app src/verify.ts at commit 171ab352f90bb56f3e2248d4fd5b8e69b2a39092.
// Do not edit here: change the package and run ops/scripts/sync-provenance-core.mjs.
// Replaced by @6529-collections/provenance-core from npm once that is published.
import { bytesToHex, hexToBytes, keccak256, sha256, type Hex } from "viem";
import { cidCoversBytes, decodeCidBytes, type DecodedCid } from "./cid";
import {
  canonicalizeValue,
  decodeUtf8Strict,
  parseStrictJson,
  resolvePointer,
  type JsonValue,
} from "./jcs";

export const ALGORITHMS: Record<number, string> = { 1: "Keccak-256", 2: "SHA-256" };

export function hashBytes(algorithm: number, bytes: Uint8Array): Hex {
  if (algorithm === 1) return keccak256(bytes);
  if (algorithm === 2) return sha256(bytes);
  throw new Error(`hash algorithm ${algorithm} is not defined by the registry`);
}

/** How the app turns fetched bytes into the bytes that are hashed, per canonicalization literal. */
export type CanonicalizationKind = "jcs" | "lf" | "raw" | "unknown";

export function canonicalizationKind(literal: string | undefined): CanonicalizationKind {
  switch (literal) {
    case "RFC8785_JCS":
      return "jcs";
    case "LF_NORMALIZED":
    case "RAW_BYTES_LF":
      return "lf";
    case "RAW_BYTES":
    case "RAW":
    case "IDENTITY":
      return "raw";
    default:
      return "unknown";
  }
}

/** CRLF and lone CR become LF. The bytes are not decoded, so any encoding passes through. */
export function normalizeLf(bytes: Uint8Array): Uint8Array {
  const out = new Uint8Array(bytes.length);
  let n = 0;
  for (let i = 0; i < bytes.length; i++) {
    const b = bytes[i] as number;
    if (b === 0x0d) {
      out[n++] = 0x0a;
      if (bytes[i + 1] === 0x0a) i++;
    } else {
      out[n++] = b;
    }
  }
  return out.slice(0, n);
}

const utf8 = new TextEncoder();

export interface CanonicalResult {
  bytes: Uint8Array;
  /** The JSON Pointer used to select the hashed value, for JCS. */
  pointer?: string | undefined;
  /** Whether the fetched bytes were already the canonical bytes. */
  alreadyCanonical: boolean;
  note?: string | undefined;
}

export function canonicalize(kind: CanonicalizationKind, fetched: Uint8Array, pointer = ""): CanonicalResult {
  if (kind === "jcs") {
    const value = parseStrictJson(decodeUtf8Strict(fetched));
    const selected = resolvePointer(value, pointer);
    const bytes = utf8.encode(canonicalizeValue(selected));
    return { bytes, pointer, alreadyCanonical: pointer === "" && equalBytes(bytes, fetched) };
  }
  if (kind === "lf") {
    const bytes = normalizeLf(fetched);
    return { bytes, alreadyCanonical: bytes.length === fetched.length };
  }
  return {
    bytes: fetched,
    alreadyCanonical: true,
    note:
      kind === "unknown"
        ? "The app does not know this canonicalization; it hashed the bytes as fetched."
        : undefined,
  };
}

export function equalBytes(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return false;
  return true;
}

export interface Expected {
  algorithm: number;
  digest: Hex;
  canonicalizationLiteral?: string | undefined;
  cid?: Hex | undefined;
}

export type CidCheck =
  | { status: "match"; cid: DecodedCid }
  | { status: "mismatch"; cid: DecodedCid; computed: Hex }
  | { status: "not-checkable"; cid: DecodedCid; reason: string }
  | { status: "absent" }
  | { status: "invalid"; reason: string };

export interface VerifyResult {
  /** True when the digest of the canonical bytes equals the registry's digest. */
  digestMatch: boolean;
  computedDigest: Hex;
  expectedDigest: Hex;
  algorithm: number;
  kind: CanonicalizationKind;
  canonical: CanonicalResult;
  cid: CidCheck;
  fetchedLength: number;
  canonicalLength: number;
  /** When the whole document did not match, the JSON Pointers tried, in order. */
  pointersTried: string[];
  error?: string | undefined;
}

function checkCid(cidHex: Hex | undefined, canonicalBytes: Uint8Array): CidCheck {
  if (!cidHex || cidHex === "0x") return { status: "absent" };
  let cid: DecodedCid;
  try {
    cid = decodeCidBytes(cidHex);
  } catch (e) {
    return { status: "invalid", reason: (e as Error).message };
  }
  if (!cidCoversBytes(cid)) {
    return {
      status: "not-checkable",
      cid,
      reason: `A ${cid.codecName} CID addresses a block graph; checking it needs an IPFS node.`,
    };
  }
  const computed = cid.hashCode === 0x12 ? sha256(canonicalBytes) : keccak256(canonicalBytes);
  return bytesToHex(cid.digest) === computed
    ? { status: "match", cid }
    : { status: "mismatch", cid, computed };
}

/**
 * Checks fetched bytes against a version's content hash and CID.
 *
 * For JCS, when the whole document does not match and no pointer was given, the check tries each
 * top-level member of a JSON object, because institutions often serve a record inside a wrapper
 * (for example an envelope with the hashed value under "payload"). The result names the member
 * that matched; nothing about a particular institution's format is assumed.
 */
export function verifyBytes(fetched: Uint8Array, expected: Expected, pointer?: string): VerifyResult {
  const kind = canonicalizationKind(expected.canonicalizationLiteral);
  const tried: string[] = [];
  const attempt = (p: string): VerifyResult => {
    tried.push(p);
    const canonical = canonicalize(kind, fetched, p);
    const computedDigest = hashBytes(expected.algorithm, canonical.bytes);
    const digestMatch = computedDigest.toLowerCase() === expected.digest.toLowerCase();
    return {
      digestMatch,
      computedDigest,
      expectedDigest: expected.digest,
      algorithm: expected.algorithm,
      kind,
      canonical,
      cid: checkCid(expected.cid, canonical.bytes),
      fetchedLength: fetched.length,
      canonicalLength: canonical.bytes.length,
      pointersTried: tried,
    };
  };

  const failed = (error: string): VerifyResult => ({
    digestMatch: false,
    computedDigest: "0x",
    expectedDigest: expected.digest,
    algorithm: expected.algorithm,
    kind,
    canonical: { bytes: new Uint8Array(), alreadyCanonical: false },
    cid: { status: "absent" },
    fetchedLength: fetched.length,
    canonicalLength: 0,
    pointersTried: tried,
    error,
  });

  try {
    const first = attempt(pointer ?? "");
    if (first.digestMatch || kind !== "jcs" || pointer !== undefined) return first;
    let whole: JsonValue;
    try {
      whole = parseStrictJson(decodeUtf8Strict(fetched));
    } catch {
      return first;
    }
    if (whole && typeof whole === "object" && !Array.isArray(whole)) {
      for (const key of Object.keys(whole)) {
        const p = `/${key.replace(/~/g, "~0").replace(/\//g, "~1")}`;
        const r = attempt(p);
        if (r.digestMatch) return r;
      }
    }
    return { ...first, pointersTried: tried };
  } catch (e) {
    return failed((e as Error).message);
  }
}

export function hexOf(bytes: Uint8Array): Hex {
  return bytesToHex(bytes);
}

export function bytesOf(h: Hex): Uint8Array {
  return hexToBytes(h);
}
