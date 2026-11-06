/**
 * The life of one user action (a post, a reaction, a vote), as an explicit
 * state machine. States are a discriminated union on `kind`; events are a
 * discriminated union on `type`. `machine.ts` holds the transition table.
 *
 * Two modes:
 * - "server": 6529.io's API acceptance is the end state (`submitted`, shown
 *   as "Posted" or "Sent"). No chain words are used in this mode.
 * - "chain": the full status ladder of `lib/chain/status-ladder.ts`
 *   (Submitted -> Committed -> Finalized -> In decision, plus overlays).
 */
import type { Hex } from "viem";

import type {
  ChainStatus,
  DecisionRef,
  GatewayRef,
  LadderEvidence,
} from "@/lib/chain/status-ladder";

export type ActionMode = "server" | "chain";

/** Chain evidence and the ladder status derived from it (chain mode only). */
export interface ChainProgress {
  readonly evidence: LadderEvidence;
  readonly status: ChainStatus;
}

interface StateBase<K extends string> {
  readonly kind: K;
  readonly mode: ActionMode;
}

/** Signed chain transactions carry their evidence from signing onwards. */
interface Attempted {
  /** Send attempts started so far. */
  readonly attempt: number;
  /** Chain mode: the evidence collected so far. Server mode: null. */
  readonly evidence: LadderEvidence | null;
}

export type DraftState = StateBase<"draft">;
export type AwaitingSignatureState = StateBase<"awaiting-signature">;
export type SignedState = StateBase<"signed"> & Attempted;
/** Waiting for connectivity before (re)sending. */
export type QueuedState = StateBase<"queued"> & Attempted;
export type SendingState = StateBase<"sending"> & Attempted;

/**
 * Accepted. Server mode: the API accepted it, which is the end state.
 * Chain mode: at least one gateway accepted it (CheckTx code 0).
 */
export interface SubmittedState extends StateBase<"submitted"> {
  readonly attempt: number;
  readonly chain: ChainProgress | null;
}

export type ChainStageKind = "committed" | "finalized" | "in-decision";

export interface ChainStageState<
  K extends ChainStageKind = ChainStageKind,
> extends StateBase<K> {
  readonly mode: "chain";
  readonly attempt: number;
  readonly chain: ChainProgress;
}

/** A vote reduced after acceptance; the chain label keeps advancing. */
export interface ReducedState extends StateBase<"reduced"> {
  readonly mode: "chain";
  readonly attempt: number;
  readonly chain: ChainProgress;
}

export interface SignatureRejectedState extends StateBase<"signature-rejected"> {
  readonly reason: "wallet" | "timeout";
}

/** A send that may be retried, automatically at `nextRetryAt` or by hand. */
export interface SendFailedState extends StateBase<"send-failed">, Attempted {
  readonly retryable: true;
  /** Epoch ms of the next automatic retry; null when only a manual retry is left. */
  readonly nextRetryAt: number | null;
  readonly error: string | null;
}

/** The server or every gateway refused the action. */
export interface RejectedState extends StateBase<"rejected"> {
  readonly reason: string | null;
  readonly chain: ChainProgress | null;
}

/** A send that cannot succeed, or a chain transaction included with a handler failure. */
export interface FailedState extends StateBase<"failed"> {
  readonly reason: string | null;
  readonly chain: ChainProgress | null;
}

export interface ExpiredState extends StateBase<"expired"> {
  readonly chain: ChainProgress | null;
}

export interface ReplacedState extends StateBase<"replaced"> {
  readonly mode: "chain";
  readonly chain: ChainProgress;
}

export type CancelledState = StateBase<"cancelled">;

export type ActionState =
  | DraftState
  | AwaitingSignatureState
  | SignedState
  | QueuedState
  | SendingState
  | SubmittedState
  | ChainStageState<"committed">
  | ChainStageState<"finalized">
  | ChainStageState<"in-decision">
  | ReducedState
  | SignatureRejectedState
  | SendFailedState
  | RejectedState
  | FailedState
  | ExpiredState
  | ReplacedState
  | CancelledState;

export type ActionStateKind = ActionState["kind"];

export type ActionEvent =
  /** The user submits. Chain actions always need a signature. */
  | { readonly type: "SUBMIT"; readonly requiresSignature: boolean }
  /** Chain mode needs the signed transaction's ID. */
  | { readonly type: "WALLET_SIGNED"; readonly txId?: Hex | undefined }
  | { readonly type: "WALLET_REJECTED" }
  /** Start, or resume, sending a signed or queued action. */
  | { readonly type: "SEND" }
  /** Connectivity was lost before the action was accepted. */
  | { readonly type: "OFFLINE" }
  /** Server mode: the API accepted the action. Repeats are harmless. */
  | { readonly type: "SEND_OK" }
  | {
      readonly type: "SEND_ERROR";
      readonly retryable: boolean;
      /** Epoch ms the error was seen; schedules the next retry. */
      readonly at: number;
      readonly error?: string | undefined;
    }
  | { readonly type: "RETRY" }
  | { readonly type: "CANCEL" }
  /** Server mode: the API refused the content (for example moderation). */
  | { readonly type: "REJECTED"; readonly reason?: string | undefined }
  /** A client-side wait ran out (signature, send, or offline queue). */
  | { readonly type: "TIMEOUT"; readonly at: number }
  /** A gateway's CheckTx answer; `code: null` when it did not answer. */
  | {
      readonly type: "GATEWAY_ACK";
      readonly gateway: GatewayRef;
      readonly code: number | null;
    }
  /** Inclusion claimed by a gateway, or verified on the device when `gateway` is absent. */
  | {
      readonly type: "INCLUSION";
      readonly gateway?: GatewayRef | undefined;
      readonly height: bigint;
      readonly index: number;
      /** The handler result a gateway reports with its claim (0 when absent). */
      readonly code?: number | undefined;
    }
  /** The result at height h, verified with header h+1. */
  | {
      readonly type: "FINALITY";
      readonly height: bigint;
      readonly index: number;
      readonly code: number;
    }
  | { readonly type: "DECISION"; readonly decision: DecisionRef }
  /** Claimed by a gateway, or verified when `gateway` is absent. */
  | { readonly type: "EXPIRED"; readonly gateway?: GatewayRef | undefined }
  | { readonly type: "REPLACED"; readonly gateway?: GatewayRef | undefined }
  | { readonly type: "REDUCED"; readonly amount: bigint };

export type ActionEventType = ActionEvent["type"];

/** Automatic retry schedule for retryable send failures. */
export interface RetryPolicy {
  readonly baseDelayMs: number;
  readonly factor: number;
  readonly maxDelayMs: number;
  /** After this many attempts only a manual retry is offered. */
  readonly maxAutoAttempts: number;
}

export interface TransitionResult {
  readonly state: ActionState;
  /** False when the event does not apply; `state` is then the input state. */
  readonly legal: boolean;
}
