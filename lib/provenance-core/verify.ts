// Copied from 6529-Collections/6529-provenance-app src/verify.ts at commit 906377e17438133e8a61f154edf9c6a5792b9f3f.
// Do not edit here: change the package and run ops/scripts/sync-provenance-core.mjs.
// Replaced by @6529-collections/provenance-core from npm once that is published.
// SPDX-License-Identifier: Apache-2.0
import { bytesToHex, hexToBytes, keccak256, sha256, type Hex } from "viem";
import {
  cidCoversBytes,
  decodeCidBytes,
  unixfsFileCidV1,
  UNIXFS_MAX_FILE_BYTES,
  type DecodedCid,
} from "./cid";
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

/** How a canonicalization literal defines canonical bytes, as far as this package knows it. */
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

function withoutBom(bytes: Uint8Array): Uint8Array {
  return bytes[0] === 0xef && bytes[1] === 0xbb && bytes[2] === 0xbf ? bytes.subarray(3) : bytes;
}

/**
 * Whether bytes are in the canonical form of their canonicalization.
 *
 * - `canonical`: they are.
 * - `not-canonical`: they can be read but are not in canonical form, such as pretty-printed JSON, a
 *   CR byte or a byte order mark.
 * - `unknown`: the package does not know the canonicalization, so it did not check the form.
 * - `invalid`: they cannot be read under it: not UTF-8, or not I-JSON.
 */
export type FormCheck = "canonical" | "not-canonical" | "unknown" | "invalid";

export interface CanonicalResult {
  /** The canonical form of the fetched bytes, or of the JSON value at `pointer`. For `unknown`, the bytes as fetched. */
  bytes: Uint8Array;
  /** The JSON Pointer used to select the value, for JCS. */
  pointer?: string | undefined;
  /** Whether the fetched bytes were already the canonical bytes. False for a non-empty pointer and for `unknown`. */
  alreadyCanonical: boolean;
  /** The form of the fetched bytes. */
  form: FormCheck;
  note?: string | undefined;
}

/**
 * Converts fetched bytes into the canonical form of their canonicalization. A leading UTF-8 byte
 * order mark is dropped for JCS and LF text, since neither canonical form has one. Throws a
 * JcsError when JCS bytes are not I-JSON, or when JCS or LF text is not valid UTF-8: RAW_BYTES_LF
 * and its Sepolia alias LF_NORMALIZED are UTF-8 text. An unknown canonicalization returns the bytes
 * as fetched with form `unknown`: the package cannot say what their canonical form is.
 */
export function canonicalize(kind: CanonicalizationKind, fetched: Uint8Array, pointer = ""): CanonicalResult {
  if (kind === "jcs") {
    const value = parseStrictJson(decodeUtf8Strict(withoutBom(fetched)));
    const selected = resolvePointer(value, pointer);
    const bytes = utf8.encode(canonicalizeValue(selected));
    const alreadyCanonical = pointer === "" && equalBytes(bytes, fetched);
    return { bytes, pointer, alreadyCanonical, form: alreadyCanonical ? "canonical" : "not-canonical" };
  }
  if (kind === "lf") {
    const text = withoutBom(fetched);
    decodeUtf8Strict(text);
    const bytes = normalizeLf(text);
    const alreadyCanonical = equalBytes(bytes, fetched);
    return { bytes, alreadyCanonical, form: alreadyCanonical ? "canonical" : "not-canonical" };
  }
  if (kind === "raw") return { bytes: fetched, alreadyCanonical: true, form: "canonical" };
  return {
    bytes: fetched,
    alreadyCanonical: false,
    form: "unknown",
    note: "The package does not know this canonicalization; it hashed the bytes as fetched and did not check their form.",
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

/**
 * What the check covers. `whole`: the fetched file. `member`: only the JSON value at
 * `canonical.pointer`; the rest of the file, such as an envelope around a payload, is not checked.
 */
export type VerifyScope = "whole" | "member";

/**
 * The outcome of a check. Only `match` means that the fetched bytes are the published bytes, in
 * their canonical form, at the location the version names; `verified` is true for `match` only.
 *
 * - `match`: the fetched bytes hash to the digest, are in canonical form, and the version's CID
 *   either addresses them, is absent (an Arweave-only version), or cannot be checked without an
 *   IPFS node (`cid.status` says which).
 * - `unknown-form`: the fetched bytes hash to the digest, but the package does not know the
 *   canonicalization, so their form is unchecked.
 * - `cid-mismatch`: the fetched bytes hash to the digest and are canonical, but the version's CID
 *   does not address them, or is not a valid CID. The version names a location that does not hold
 *   these bytes.
 * - `not-canonical`: the fetched bytes, or their canonical form, hash to the digest, but the
 *   fetched bytes are not in canonical form: pretty-printed JSON, a CR byte, a byte order mark.
 * - `canonical-match`: only with `acceptCanonicalForm`. The fetched bytes are not canonical, and
 *   their canonical form hashes to the digest.
 * - `member-match`: only with `pointer` or `tryMembers`. The canonical form of one JSON member
 *   hashes to the digest. Nothing else in the file is checked.
 * - `mismatch`: neither the fetched bytes nor their canonical form hash to the digest.
 * - `invalid`: the bytes cannot be read under the canonicalization (not UTF-8, not I-JSON), or the
 *   algorithm is not 1 or 2.
 */
export type Verdict =
  | "match"
  | "unknown-form"
  | "cid-mismatch"
  | "not-canonical"
  | "canonical-match"
  | "member-match"
  | "mismatch"
  | "invalid";

export interface VerifyOptions {
  /**
   * An RFC 6901 JSON Pointer, for RFC8785_JCS. The check then covers only the value at that
   * pointer, and a hit is a `member-match`.
   */
  pointer?: string | undefined;
  /**
   * For RFC8785_JCS with no pointer: when the whole file does not match, try each top-level member
   * whose value is a JSON object, in document order. Off by default.
   */
  tryMembers?: boolean | undefined;
  /**
   * Give `canonical-match` when the fetched bytes are not canonical but their canonical form hashes
   * to the digest. Off by default, and such bytes then give `not-canonical`.
   */
  acceptCanonicalForm?: boolean | undefined;
}

export interface VerifyResult {
  /**
   * True for verdict `match` only. A screen shows content as verified when, and only when, this is
   * true. Every other verdict needs its own wording; `member-match` covers one JSON member, not the file.
   */
  verified: boolean;
  verdict: Verdict;
  /** The form of the fetched bytes (scope `whole`); for scope `member`, `not-canonical`, since a member is never the file. */
  form: FormCheck;
  /** True when the fetched bytes, exactly as fetched, hash to the registry's digest. */
  digestMatch: boolean;
  /**
   * True when `canonical.bytes` hash to the registry's digest: the canonical form of the whole file,
   * or of the member for scope `member`.
   */
  canonicalDigestMatch: boolean;
  scope: VerifyScope;
  /** The digest of the fetched bytes as fetched, or "0x" when the algorithm is unknown. */
  computedDigest: Hex;
  /** The digest of `canonical.bytes`, or "0x" when there are none. */
  canonicalDigest: Hex;
  expectedDigest: Hex;
  algorithm: number;
  kind: CanonicalizationKind;
  canonical: CanonicalResult;
  /** The CID checked against the fetched bytes, or against the member's canonical bytes for scope `member`. */
  cid: CidCheck;
  /** For scope `whole`, the CID checked against the canonical bytes when they differ from the fetched bytes. */
  canonicalCid?: CidCheck | undefined;
  fetchedLength: number;
  canonicalLength: number;
  /** The JSON Pointers tried, in order. "" is the whole file. */
  pointersTried: string[];
  error?: string | undefined;
}

function checkCid(cidHex: Hex | undefined, bytes: Uint8Array): CidCheck {
  if (!cidHex || cidHex === "0x") return { status: "absent" };
  let cid: DecodedCid;
  try {
    cid = decodeCidBytes(cidHex);
  } catch (e) {
    return { status: "invalid", reason: (e as Error).message };
  }
  if (cidCoversBytes(cid)) {
    const computed = cid.hashCode === 0x12 ? sha256(bytes) : keccak256(bytes);
    return bytesToHex(cid.digest) === computed
      ? { status: "match", cid }
      : { status: "mismatch", cid, computed };
  }
  // A dag-pb CID over SHA-256 is checked by rebuilding the file's graph with the import settings
  // unixfsFileCidV1 reproduces. Another chunker gives another CID for the same bytes, so a
  // difference makes the CID uncheckable here, not wrong.
  if (
    cid.version === 1 &&
    cid.codec === 0x70 &&
    cid.hashCode === 0x12 &&
    bytes.length <= UNIXFS_MAX_FILE_BYTES
  ) {
    const rebuilt = bytesToHex(unixfsFileCidV1(bytes));
    if (rebuilt === bytesToHex(cid.bytes)) return { status: "match", cid };
    return {
      status: "not-checkable",
      cid,
      reason: `The dag-pb CID is not the one ${rebuilt} that 1 MiB raw-leaf chunks give; other import settings need an IPFS node to check.`,
    };
  }
  return {
    status: "not-checkable",
    cid,
    reason: `A ${cid.codecName} CID addresses a block graph; checking it needs an IPFS node.`,
  };
}

/**
 * Checks fetched bytes against a version's content hash and CID, by the rule of the contract's
 * integrator guide: hash the bytes as fetched, compare the result with the digest, then check that
 * the bytes are in canonical form, then check the CID. The three answers are separate fields:
 * `digestMatch`, `form` and `cid`. Only verdict `match`, and so `verified`, means the bytes are the
 * published bytes in canonical form at the location the version names.
 *
 * Member checks are opt-in. With `pointer` or `tryMembers`, a JSON member whose canonical form
 * hashes to the digest gives `member-match`, and `digestMatch` stays false. Only that member is
 * verified: a file with a genuine payload and a forged envelope still gives `member-match`, so a
 * caller that shows the envelope's fields must not present them as verified.
 *
 * The third argument may be a JSON Pointer string, the same as `{ pointer }`.
 */
export function verifyBytes(
  fetched: Uint8Array,
  expected: Expected,
  options?: string | VerifyOptions,
): VerifyResult {
  const o: VerifyOptions = typeof options === "string" ? { pointer: options } : (options ?? {});
  const kind = canonicalizationKind(expected.canonicalizationLiteral);
  const want = expected.digest.toLowerCase();
  const tried: string[] = [];
  const hash = (bytes: Uint8Array): Hex => hashBytes(expected.algorithm, bytes);

  let computedDigest: Hex = "0x";
  let algorithmError: string | undefined;
  try {
    computedDigest = hash(fetched);
  } catch (e) {
    algorithmError = (e as Error).message;
  }
  const digestMatch = computedDigest.toLowerCase() === want;

  const result = (
    verdict: Verdict,
    scope: VerifyScope,
    canonical: CanonicalResult | undefined,
    form: FormCheck,
    error?: string,
  ): VerifyResult => {
    const c = canonical ?? { bytes: new Uint8Array(), alreadyCanonical: false, form };
    const canonicalDigest: Hex = canonical && !algorithmError ? hash(c.bytes) : "0x";
    const whole = scope === "whole";
    return {
      verified: verdict === "match",
      verdict,
      form,
      digestMatch,
      canonicalDigestMatch: canonicalDigest !== "0x" && canonicalDigest.toLowerCase() === want,
      scope,
      computedDigest,
      canonicalDigest,
      expectedDigest: expected.digest,
      algorithm: expected.algorithm,
      kind,
      canonical: c,
      cid: checkCid(expected.cid, whole ? fetched : c.bytes),
      canonicalCid:
        whole && canonical && !equalBytes(c.bytes, fetched) ? checkCid(expected.cid, c.bytes) : undefined,
      fetchedLength: fetched.length,
      canonicalLength: c.bytes.length,
      pointersTried: tried,
      ...(error === undefined ? {} : { error }),
    };
  };

  if (algorithmError) {
    tried.push(o.pointer ?? "");
    return result("invalid", o.pointer ? "member" : "whole", undefined, "invalid", algorithmError);
  }

  const member = (pointer: string, value: JsonValue): VerifyResult => {
    const bytes = utf8.encode(canonicalizeValue(value));
    const canonical: CanonicalResult = { bytes, pointer, alreadyCanonical: false, form: "not-canonical" };
    const hit = hash(bytes).toLowerCase() === want;
    return result(hit ? "member-match" : "mismatch", "member", canonical, "not-canonical");
  };

  if (o.pointer !== undefined && o.pointer !== "") {
    tried.push(o.pointer);
    if (kind !== "jcs") {
      return result(
        "invalid",
        "member",
        undefined,
        "invalid",
        "a JSON Pointer needs the RFC8785_JCS canonicalization",
      );
    }
    try {
      return member(o.pointer, resolvePointer(parseStrictJson(decodeUtf8Strict(fetched)), o.pointer));
    } catch (e) {
      return result("invalid", "member", undefined, "invalid", (e as Error).message);
    }
  }

  tried.push("");
  let canonical: CanonicalResult;
  try {
    canonical = canonicalize(kind, fetched);
  } catch (e) {
    // Bytes that hash to the digest but cannot be read under the canonicalization were published
    // that way. They are still not in canonical form, so they are not a match.
    return result(
      digestMatch ? "not-canonical" : "invalid",
      "whole",
      undefined,
      "invalid",
      (e as Error).message,
    );
  }
  if (canonical.form === "unknown") {
    return result(digestMatch ? "unknown-form" : "mismatch", "whole", canonical, "unknown");
  }
  const canonicalMatch = hash(canonical.bytes).toLowerCase() === want;
  if (canonical.form === "canonical") {
    if (digestMatch) {
      const r = result("match", "whole", canonical, "canonical");
      if (r.cid.status === "mismatch" || r.cid.status === "invalid") {
        return { ...r, verdict: "cid-mismatch", verified: false };
      }
      return r;
    }
  } else if (digestMatch) {
    return result("not-canonical", "whole", canonical, "not-canonical");
  } else if (canonicalMatch) {
    return result(
      o.acceptCanonicalForm ? "canonical-match" : "not-canonical",
      "whole",
      canonical,
      "not-canonical",
    );
  }

  const whole = result("mismatch", "whole", canonical, canonical.form);
  if (!o.tryMembers || kind !== "jcs") return whole;
  const parsed = parseStrictJson(decodeUtf8Strict(withoutBom(fetched)));
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return whole;
  for (const [key, value] of Object.entries(parsed)) {
    // Only object members are tried: a short scalar, such as a string, is easy to plant in a file
    // next to forged content.
    if (!value || typeof value !== "object" || Array.isArray(value)) continue;
    const pointer = `/${key.replace(/~/g, "~0").replace(/\//g, "~1")}`;
    tried.push(pointer);
    const r = member(pointer, value);
    if (r.verdict === "member-match") return r;
  }
  return { ...whole, pointersTried: tried };
}

export function hexOf(bytes: Uint8Array): Hex {
  return bytesToHex(bytes);
}

export function bytesOf(h: Hex): Uint8Array {
  return hexToBytes(h);
}
