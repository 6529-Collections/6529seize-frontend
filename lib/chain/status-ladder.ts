/**
 * The status ladder for chain actions, as a pure function of evidence.
 *
 * Source: 6529chain `design/web-and-mobile-signing.md` (P41) §5.3 and
 * `consensus-specification.md` (P30) §10.4. The user sees exactly one
 * label per transaction, and "Confirmed" is never used (audit H4):
 *
 *   Signed -> Submitted -> Committed -> Finalized -> In decision D
 *
 * - Submitted: CheckTx code 0 from at least one gateway (the gateway's word).
 * - Committed: inclusion verified by a light client; without one the label
 *   reads "Committed (reported by n gateways)" (GW5: every status is a claim).
 * - Finalized: header h+1 verified, result code 0, the record state-proven.
 * - In decision D: the settled decision record, state-proven.
 *
 * Overlays replace the label when they apply: Rejected (every gateway
 * refused with 0x01xx-0x03xx), Failed (included with a handler code),
 * Expired, Replaced, Reduced. "Anchored" (A* on Ethereum) is an optional
 * desktop stage in P30 §10.4 and is not modelled here.
 *
 * Evidence only accumulates, so labels never move backwards. Finalized and
 * In decision need verified evidence; a `ProofVerifier` supplies it. Proof
 * formats for the adopted engine are not specified yet (R1 §1.7), so
 * clients without a verifier stop at Committed (reported), as P41 §5.4
 * requires.
 */
import type { Hex } from "viem";

import { isRefusalCode } from "./codec/errors";

export const CHAIN_STATUS_VERSION = 1;

export type ChainStatusLabel = "signed" | "submitted" | "committed" | "finalized" | "in-decision";

export type ChainStatusOverlay = "rejected" | "failed" | "expired" | "replaced" | "reduced";

export interface GatewayRef {
  /** Stable ID of one gateway endpoint. */
  readonly id: string;
  /** Operator identity; GW4 counts distinct operators, not endpoints. */
  readonly operator: string;
}

export interface Inclusion {
  readonly height: bigint;
  readonly index: number;
}

export interface DecisionRef {
  readonly decisionId: Hex;
  readonly decisionTimeMs: bigint;
}

export interface ChainStatus {
  readonly v: typeof CHAIN_STATUS_VERSION;
  readonly txId: Hex;
  readonly label: ChainStatusLabel;
  readonly overlay: ChainStatusOverlay | null;
  /** True when the label's (or overlay's) evidence was verified on the device. */
  readonly verified: boolean;
  /** Distinct operators whose claims carry the label or overlay; 0 when verified alone. */
  readonly reportedBy: number;
  readonly inclusion: Inclusion | null;
  readonly resultCode: number | null;
  readonly decision: DecisionRef | null;
  /** Gateways disagree about where (or whether) the transaction landed. */
  readonly conflict: boolean;
}

interface SubmissionEvidence {
  readonly operator: string;
  /** null: the gateway did not answer. */
  readonly code: number | null;
}

interface InclusionClaim extends Inclusion {
  readonly operator: string;
  readonly code: number;
}

interface DropClaim {
  readonly operator: string;
  readonly reason: "expired" | "replaced";
}

export interface LadderEvidence {
  readonly txId: Hex;
  readonly submissions: Readonly<Record<string, SubmissionEvidence>>;
  readonly inclusionClaims: Readonly<Record<string, InclusionClaim>>;
  readonly dropClaims: Readonly<Record<string, DropClaim>>;
  readonly verifiedInclusion: Inclusion | null;
  readonly verifiedResult: (Inclusion & { readonly code: number }) | null;
  readonly verifiedDecision: DecisionRef | null;
  readonly verifiedDrop: "expired" | "replaced" | null;
  readonly reducedTo: bigint | null;
}

export type LadderEvent =
  | { readonly type: "submit-answer"; readonly gateway: GatewayRef; readonly code: number }
  | { readonly type: "submit-silent"; readonly gateway: GatewayRef }
  | {
      readonly type: "inclusion-claim";
      readonly gateway: GatewayRef;
      readonly height: bigint;
      readonly index: number;
      readonly code: number;
    }
  | {
      readonly type: "drop-claim";
      readonly gateway: GatewayRef;
      readonly reason: "expired" | "replaced";
    }
  | { readonly type: "inclusion-verified"; readonly height: bigint; readonly index: number }
  | {
      readonly type: "result-verified";
      readonly height: bigint;
      readonly index: number;
      readonly code: number;
    }
  | { readonly type: "decision-verified"; readonly decision: DecisionRef }
  | { readonly type: "drop-verified"; readonly reason: "expired" | "replaced" }
  | { readonly type: "reduced"; readonly amount: bigint };

export function initialEvidence(txId: Hex): LadderEvidence {
  return {
    txId,
    submissions: {},
    inclusionClaims: {},
    dropClaims: {},
    verifiedInclusion: null,
    verifiedResult: null,
    verifiedDecision: null,
    verifiedDrop: null,
    reducedTo: null,
  };
}

function withSubmission(
  evidence: LadderEvidence,
  gateway: GatewayRef,
  code: number | null
): LadderEvidence {
  const previous = evidence.submissions[gateway.id];
  // An answer is never overwritten by a later silence from the same gateway.
  if (code === null && previous !== undefined && previous.code !== null) {
    return evidence;
  }
  // A code 0 stays: the gateway accepted the bytes once.
  if (previous?.code === 0) {
    return evidence;
  }
  return {
    ...evidence,
    submissions: { ...evidence.submissions, [gateway.id]: { operator: gateway.operator, code } },
  };
}

/** Folds one observation into the evidence. Pure. */
export function applyLadderEvent(evidence: LadderEvidence, event: LadderEvent): LadderEvidence {
  switch (event.type) {
    case "submit-answer":
      return withSubmission(evidence, event.gateway, event.code);
    case "submit-silent":
      return withSubmission(evidence, event.gateway, null);
    case "inclusion-claim":
      return {
        ...evidence,
        inclusionClaims: {
          ...evidence.inclusionClaims,
          [event.gateway.id]: {
            operator: event.gateway.operator,
            height: event.height,
            index: event.index,
            code: event.code,
          },
        },
      };
    case "drop-claim":
      return {
        ...evidence,
        dropClaims: {
          ...evidence.dropClaims,
          [event.gateway.id]: { operator: event.gateway.operator, reason: event.reason },
        },
      };
    case "inclusion-verified":
      return { ...evidence, verifiedInclusion: { height: event.height, index: event.index } };
    case "result-verified":
      return {
        ...evidence,
        verifiedInclusion: evidence.verifiedInclusion ?? { height: event.height, index: event.index },
        verifiedResult: { height: event.height, index: event.index, code: event.code },
      };
    case "decision-verified":
      return { ...evidence, verifiedDecision: event.decision };
    case "drop-verified":
      return { ...evidence, verifiedDrop: event.reason };
    case "reduced":
      return { ...evidence, reducedTo: event.amount };
  }
}

interface ClaimGroup {
  readonly inclusion: Inclusion;
  readonly code: number;
  readonly operators: number;
}

const distinct = (operators: readonly string[]): number => new Set(operators).size;

function inclusionGroups(evidence: LadderEvidence): ClaimGroup[] {
  const groups = new Map<string, { claim: InclusionClaim; operators: string[] }>();
  for (const claim of Object.values(evidence.inclusionClaims)) {
    const key = `${claim.height.toString()}:${claim.index}:${claim.code}`;
    const group = groups.get(key);
    if (group === undefined) {
      groups.set(key, { claim, operators: [claim.operator] });
    } else {
      group.operators.push(claim.operator);
    }
  }
  return [...groups.values()]
    .map(({ claim, operators }) => ({
      inclusion: { height: claim.height, index: claim.index },
      code: claim.code,
      operators: distinct(operators),
    }))
    .sort((a, b) => b.operators - a.operators);
}

function positiveLabel(evidence: LadderEvidence, claimed: boolean): ChainStatusLabel {
  const result = evidence.verifiedResult;
  if (result?.code === 0) {
    return evidence.verifiedDecision === null ? "finalized" : "in-decision";
  }
  if (evidence.verifiedInclusion !== null || claimed) {
    return "committed";
  }
  const accepted = Object.values(evidence.submissions).some((s) => s.code === 0);
  return accepted ? "submitted" : "signed";
}

function isRejected(evidence: LadderEvidence, label: ChainStatusLabel): boolean {
  const answers = Object.values(evidence.submissions);
  return (
    label === "signed" &&
    answers.length > 0 &&
    answers.every((s) => s.code !== null && isRefusalCode(s.code))
  );
}

function dropOverlay(evidence: LadderEvidence): { reason: "expired" | "replaced"; operators: number } | null {
  const claims = Object.values(evidence.dropClaims);
  if (claims.length === 0) {
    return null;
  }
  const replaced = claims.filter((c) => c.reason === "replaced");
  const chosen = replaced.length > 0 ? replaced : claims;
  return {
    reason: replaced.length > 0 ? "replaced" : "expired",
    operators: distinct(chosen.map((c) => c.operator)),
  };
}

function submittedBy(evidence: LadderEvidence): number {
  return distinct(
    Object.values(evidence.submissions)
      .filter((s) => s.code === 0)
      .map((s) => s.operator)
  );
}

function base(evidence: LadderEvidence): Omit<ChainStatus, "label" | "overlay" | "verified" | "reportedBy"> {
  return {
    v: CHAIN_STATUS_VERSION,
    txId: evidence.txId,
    inclusion: null,
    resultCode: null,
    decision: null,
    conflict: false,
  };
}

function verifiedStatus(evidence: LadderEvidence): ChainStatus | null {
  const result = evidence.verifiedResult;
  if (result !== null) {
    const ok = result.code === 0;
    return {
      ...base(evidence),
      label: positiveLabel(evidence, true),
      overlay: ok ? null : "failed",
      verified: true,
      reportedBy: 0,
      inclusion: { height: result.height, index: result.index },
      resultCode: result.code,
      decision: ok ? evidence.verifiedDecision : null,
    };
  }
  if (evidence.verifiedDrop !== null) {
    return {
      ...base(evidence),
      label: positiveLabel(evidence, false),
      overlay: evidence.verifiedDrop,
      verified: true,
      reportedBy: 0,
    };
  }
  return null;
}

/** The one status a user sees for this evidence (P41 §5.3). */
export function deriveChainStatus(evidence: LadderEvidence): ChainStatus {
  const verified = verifiedStatus(evidence);
  if (verified !== null) {
    return withReduction(verified, evidence);
  }
  const groups = inclusionGroups(evidence);
  const top = groups[0];
  const label = positiveLabel(evidence, top !== undefined);
  const conflict = groups.length > 1;
  if (top !== undefined || evidence.verifiedInclusion !== null) {
    const inclusion = evidence.verifiedInclusion ?? top?.inclusion ?? null;
    const failedClaim = top !== undefined && top.code !== 0;
    return withReduction(
      {
        ...base(evidence),
        label,
        overlay: failedClaim ? "failed" : null,
        // A reported handler failure is a claim even after inclusion is verified.
        verified: evidence.verifiedInclusion !== null && !failedClaim,
        reportedBy: top?.operators ?? 0,
        inclusion,
        resultCode: top?.code ?? null,
        conflict,
      },
      evidence
    );
  }
  const drop = dropOverlay(evidence);
  if (drop !== null) {
    return { ...base(evidence), label, overlay: drop.reason, verified: false, reportedBy: drop.operators };
  }
  return withReduction(
    {
      ...base(evidence),
      label,
      overlay: isRejected(evidence, label) ? "rejected" : null,
      verified: false,
      reportedBy: label === "submitted" ? submittedBy(evidence) : 0,
    },
    evidence
  );
}

function withReduction(status: ChainStatus, evidence: LadderEvidence): ChainStatus {
  return status.overlay === null && evidence.reducedTo !== null
    ? { ...status, overlay: "reduced" }
    : status;
}

/** Overlays after which nothing further can change the transaction's fate. */
export function isFinalOverlay(overlay: ChainStatusOverlay | null): boolean {
  return overlay === "rejected" || overlay === "failed" || overlay === "expired" || overlay === "replaced";
}

/**
 * English source copy for the labels, kept here until the ChainStatusLabel
 * component (W6 unit C5) moves it into the i18n catalogue. Nothing renders
 * these strings yet. Placeholders: `{count}`, `{decision}`.
 */
export const CHAIN_STATUS_COPY_EN = {
  signed: "Signed",
  submitted: "Submitted",
  committed: "Committed",
  committedReported: "Committed (reported by {count} gateways)",
  finalized: "Finalized",
  inDecision: "In decision {decision}",
  rejected: "Rejected",
  failed: "Failed",
  expired: "Expired",
  replaced: "Replaced",
  reduced: "Reduced",
} as const;

export type ChainStatusCopyKey = keyof typeof CHAIN_STATUS_COPY_EN;

/** Which copy key and placeholder values describe a status. */
export function chainStatusCopy(status: ChainStatus): {
  readonly key: ChainStatusCopyKey;
  readonly values: Readonly<Record<string, string>>;
} {
  if (status.overlay !== null) {
    return { key: status.overlay, values: {} };
  }
  switch (status.label) {
    case "committed":
      return status.verified
        ? { key: "committed", values: {} }
        : { key: "committedReported", values: { count: String(status.reportedBy) } };
    case "in-decision":
      return { key: "inDecision", values: { decision: status.decision?.decisionId ?? "" } };
    case "signed":
    case "submitted":
    case "finalized":
      return { key: status.label, values: {} };
  }
}
