import {
  bytesToHex,
  isAddress,
  isHex,
  keccak256,
  toHex,
  type Address,
  type Hex,
} from "viem";
import type { Action } from "@/lib/provenance-core/actions";
import { literalId, literalProblem } from "@/lib/provenance-core/actions";
import { parseCid } from "@/lib/provenance-core/cid";

/**
 * The governance calls the page offers, as typed form drafts, and their conversion into registry
 * actions. Every failure returns a message key with its values, so the page shows a localized
 * reason next to the field instead of throwing.
 */
export type GovernanceKind =
  | "registerCanonicalization"
  | "registerRecordType"
  | "registerSchema"
  | "setPublisher"
  | "deleteVersion"
  | "deleteVersions"
  | "deleteSubject"
  | "freeze"
  | "declareSuccessor"
  | "transferOwnership"
  | "acceptOwnership";

export const GOVERNANCE_KINDS: readonly GovernanceKind[] = [
  "registerCanonicalization",
  "registerRecordType",
  "registerSchema",
  "setPublisher",
  "deleteVersion",
  "deleteVersions",
  "deleteSubject",
  "transferOwnership",
  "acceptOwnership",
  "declareSuccessor",
  "freeze",
];

export interface GovernanceDraft {
  kind: GovernanceKind;
  literal: string;
  cid: string;
  digest: string;
  algorithm: "1" | "2";
  canonicalization: string;
  address: string;
  authorized: boolean;
  subject: string;
  fromVersion: string;
  toVersion: string;
  reason: string;
}

export const emptyDraft = (kind: GovernanceKind): GovernanceDraft => ({
  kind,
  literal: "",
  cid: "",
  digest: "",
  algorithm: "1",
  canonicalization: "RFC8785_JCS",
  address: "",
  authorized: true,
  subject: "",
  fromVersion: "1",
  toVersion: "1",
  reason: "",
});

export type FormProblemKey =
  | "provenance.governance.form.error.literal"
  | "provenance.governance.form.error.cid"
  | "provenance.governance.form.error.digest"
  | "provenance.governance.form.error.address"
  | "provenance.governance.form.error.subject"
  | "provenance.governance.form.error.version"
  | "provenance.governance.form.error.range"
  | "provenance.governance.form.error.reason";

export type DraftResult =
  | { ok: true; action: Action }
  | {
      ok: false;
      field: keyof GovernanceDraft;
      key: FormProblemKey;
      detail?: string;
    };

const isBytes32 = (s: string): s is Hex => isHex(s) && s.length === 66;

/** A subject given as 32-byte hex, or as the text its ID is the keccak256 of. */
export function subjectIdOf(text: string): Hex | undefined {
  const t = text.trim();
  if (!t) return undefined;
  return isBytes32(t) ? t : keccak256(toHex(new TextEncoder().encode(t)));
}

function version(text: string): number | undefined {
  const t = text.trim();
  if (!/^[1-9]\d{0,9}$/.test(t)) return undefined;
  const n = Number(t);
  return n <= 0xffffffff ? n : undefined;
}

type Fail = Extract<DraftResult, { ok: false }>;
const fail = (
  field: keyof GovernanceDraft,
  key: FormProblemKey,
  detail?: string
): Fail => ({ ok: false, field, key, detail });
const isFail = (x: unknown): x is Fail =>
  typeof x === "object" && x !== null && "ok" in x;

function literalOf(d: GovernanceDraft): string | Fail {
  const literal = d.literal.trim();
  const p = literalProblem(literal);
  return p === undefined
    ? literal
    : fail("literal", "provenance.governance.form.error.literal", p);
}

function cidOf(d: GovernanceDraft, required: boolean): Hex | Fail {
  const text = d.cid.trim();
  if (text === "")
    return required
      ? fail("cid", "provenance.governance.form.error.cid")
      : "0x";
  try {
    return bytesToHex(parseCid(text));
  } catch (e) {
    return fail(
      "cid",
      "provenance.governance.form.error.cid",
      e instanceof Error ? e.message : String(e)
    );
  }
}

function addressOf(d: GovernanceDraft): Address | Fail {
  const text = d.address.trim();
  return isAddress(text, { strict: false })
    ? text
    : fail("address", "provenance.governance.form.error.address");
}

function registration(d: GovernanceDraft): DraftResult {
  const literal = literalOf(d);
  if (isFail(literal)) return literal;
  if (d.kind === "registerRecordType")
    return { ok: true, action: { kind: d.kind, literal } };
  if (d.kind === "registerCanonicalization") {
    const specCid = cidOf(d, false);
    return isFail(specCid)
      ? specCid
      : { ok: true, action: { kind: d.kind, literal, specCid } };
  }
  const digest = d.digest.trim();
  if (!isBytes32(digest))
    return fail("digest", "provenance.governance.form.error.digest");
  const canonicalization = d.canonicalization.trim();
  const canonProblem = literalProblem(canonicalization);
  if (canonProblem !== undefined)
    return fail(
      "canonicalization",
      "provenance.governance.form.error.literal",
      canonProblem
    );
  const cid = cidOf(d, true);
  if (isFail(cid)) return cid;
  return {
    ok: true,
    action: {
      kind: "registerSchema",
      literal,
      documentHash: {
        algorithm: Number(d.algorithm),
        digest,
        canonicalizationId: literalId(canonicalization),
      },
      cid,
      // Governance registers schemas by hash and CID only; the document is not stored on-chain.
      document: "0x",
    },
  };
}

function authority(d: GovernanceDraft): DraftResult {
  const address = addressOf(d);
  if (isFail(address)) return address;
  if (d.kind === "setPublisher")
    return {
      ok: true,
      action: { kind: d.kind, publisher: address, authorized: d.authorized },
    };
  if (d.kind === "declareSuccessor")
    return { ok: true, action: { kind: d.kind, successor: address } };
  return { ok: true, action: { kind: "transferOwnership", newOwner: address } };
}

function deletion(d: GovernanceDraft): DraftResult {
  const subjectId = subjectIdOf(d.subject);
  if (subjectId === undefined)
    return fail("subject", "provenance.governance.form.error.subject");
  const reasonDigest = d.reason.trim();
  if (!isBytes32(reasonDigest))
    return fail("reason", "provenance.governance.form.error.reason");
  if (d.kind === "deleteSubject")
    return { ok: true, action: { kind: d.kind, subjectId, reasonDigest } };
  const from = version(d.fromVersion);
  if (from === undefined)
    return fail("fromVersion", "provenance.governance.form.error.version");
  if (d.kind === "deleteVersion")
    return {
      ok: true,
      action: { kind: d.kind, subjectId, version: from, reasonDigest },
    };
  const to = version(d.toVersion);
  if (to === undefined)
    return fail("toVersion", "provenance.governance.form.error.version");
  if (to < from)
    return fail("toVersion", "provenance.governance.form.error.range");
  return {
    ok: true,
    action: {
      kind: "deleteVersions",
      subjectId,
      fromVersion: from,
      toVersion: to,
      reasonDigest,
    },
  };
}

const BUILDERS: Record<GovernanceKind, (d: GovernanceDraft) => DraftResult> = {
  registerCanonicalization: registration,
  registerRecordType: registration,
  registerSchema: registration,
  setPublisher: authority,
  declareSuccessor: authority,
  transferOwnership: authority,
  deleteVersion: deletion,
  deleteVersions: deletion,
  deleteSubject: deletion,
  freeze: () => ({ ok: true, action: { kind: "freeze" } }),
  acceptOwnership: () => ({ ok: true, action: { kind: "acceptOwnership" } }),
};

export function draftToAction(d: GovernanceDraft): DraftResult {
  return BUILDERS[d.kind](d);
}

/** A readable form of a decoded argument: integers and booleans as text, bytes and addresses as hex. */
export function formatArg(value: unknown): string {
  if (typeof value === "bigint") return value.toString();
  if (typeof value === "boolean") return value ? "true" : "false";
  if (typeof value === "string") return value === "" ? '""' : value;
  if (Array.isArray(value)) return `[${value.map(formatArg).join(", ")}]`;
  if (typeof value === "object" && value !== null) {
    return `{ ${Object.entries(value)
      .map(([k, v]) => `${k}: ${formatArg(v)}`)
      .join(", ")} }`;
  }
  return String(value);
}
