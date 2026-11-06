/**
 * The transition table of the action lifecycle. `step` is a pure reducer:
 * (state, event) -> { state, legal }. An event that does not apply returns
 * the same state object with `legal: false`; `transition` reports those in
 * development and tests and never throws.
 *
 * `TRANSITIONS` lists, for every state kind, the client events it accepts;
 * an event missing from a row is illegal there. Chain events (gateway
 * answers, inclusion, finality, decisions) follow one rule for every state:
 * they fold into status-ladder evidence and the ladder's derivation picks
 * the state.
 *
 * Invariants (each one is a test in machine.test.ts):
 * - The mode never changes. Server mode never reaches a chain stage and
 *   never uses chain words; its `submitted` ("posted") is terminal.
 * - Chain stages (submitted < committed < finalized < in-decision) never
 *   move backwards, and an accepted action never returns to a client-side
 *   state.
 * - Terminal states are stable: every event leaves them as they are.
 * - Open outcome: a rejected, failed, expired or replaced outcome that the
 *   ladder derived from gateway claims alone is not terminal. Every status
 *   is a claim until verified (P41 GW5), so more evidence can still move
 *   it. A verified outcome, or one the client decided, is terminal.
 * - `SEND_OK` is accepted from `queued` and `send-failed` as well as from
 *   `sending`: a request can reach the server after its response failed.
 * - Retries (`DEFAULT_RETRY_POLICY`): the first retry after 1 s, doubling
 *   to at most 30 s; after 5 attempts only a manual retry is offered
 *   (`nextRetryAt: null`). Retry times come from the event's `at`, so the
 *   reducer never reads a clock.
 */
import { initialEvidence, isFinalOverlay } from "@/lib/chain/status-ladder";

import {
  CHAIN_LABEL_RANK,
  chainProgress,
  foldChainEvent,
  isChainEvent,
  type ChainActionEvent,
} from "./chain";
import {
  hasTransitionObservers,
  notifyTransitionObservers,
  reportIllegalTransition,
  type IllegalTransitionReporter,
  type TransitionObserver,
} from "./report";
import type {
  ActionEvent,
  ActionEventType,
  ActionMode,
  ActionState,
  ActionStateKind,
  ChainProgress,
  DraftState,
  RetryPolicy,
  SendFailedState,
  TransitionResult,
} from "./types";

export interface TransitionOptions {
  readonly policy?: RetryPolicy | undefined;
  /** Receives illegal transitions; null silences them. Default: the module's. */
  readonly reporter?: IllegalTransitionReporter | null | undefined;
  /** Also observes this call, besides the app-wide transition observers. */
  readonly observer?: TransitionObserver | null | undefined;
}

export const DEFAULT_RETRY_POLICY: RetryPolicy = {
  baseDelayMs: 1_000,
  factor: 2,
  maxDelayMs: 30_000,
  maxAutoAttempts: 5,
};

const CHAIN = "chain" satisfies ActionMode;
const SERVER = "server" satisfies ActionMode;

/** Outcome states; terminal unless the outcome is still only a claim. */
const OUTCOME_KINDS: ReadonlySet<ActionStateKind> = new Set([
  "rejected",
  "failed",
  "expired",
  "replaced",
  "cancelled",
]);

export function createActionState(mode: ActionMode): DraftState {
  return { kind: "draft", mode };
}

function chainOf(state: ActionState): ChainProgress | null {
  return "chain" in state ? state.chain : null;
}

/**
 * An outcome the ladder derived from gateway claims alone stays open to
 * evidence: every status is a claim until verified (P41 GW5), so a verified
 * result can still overrule one gateway's report of a failure.
 */
function isOpenOutcome(state: ActionState): boolean {
  const chain = chainOf(state);
  return (
    OUTCOME_KINDS.has(state.kind) &&
    state.mode === CHAIN &&
    chain !== null &&
    chain.status.overlay === state.kind &&
    !chain.status.verified
  );
}

/** True when no event can change the state. Server-mode `submitted` is terminal. */
export function isTerminalActionState(state: ActionState): boolean {
  if (state.kind === "submitted") {
    return state.mode === SERVER;
  }
  return OUTCOME_KINDS.has(state.kind) && !isOpenOutcome(state);
}

/** Epoch ms of the next automatic retry after `attempt` failed at `at`. */
export function nextRetryAt(
  attempt: number,
  at: number,
  policy: RetryPolicy = DEFAULT_RETRY_POLICY
): number | null {
  if (attempt >= policy.maxAutoAttempts) {
    return null;
  }
  const delay =
    policy.baseDelayMs * Math.pow(policy.factor, Math.max(0, attempt - 1));
  return at + Math.min(policy.maxDelayMs, delay);
}

// Client events --------------------------------------------------------------

type StateOf<K extends ActionStateKind> = Extract<
  ActionState,
  { readonly kind: K }
>;
type ClientEventType = Exclude<ActionEventType, ChainActionEvent["type"]>;
type EventOf<T extends ClientEventType> = Extract<
  ActionEvent,
  { readonly type: T }
>;

/** The next state, or null when the event is illegal in this state. */
type Rule<K extends ActionStateKind, T extends ClientEventType> = (
  state: StateOf<K>,
  event: EventOf<T>,
  policy: RetryPolicy
) => ActionState | null;

type Rules<K extends ActionStateKind> = {
  readonly [T in ClientEventType]?: Rule<K, T>;
};

type PreAcceptanceState = StateOf<
  "signed" | "queued" | "sending" | "send-failed"
>;

function sendFailed(
  state: PreAcceptanceState,
  at: number,
  error: string | null,
  policy: RetryPolicy
): SendFailedState {
  return {
    kind: "send-failed",
    mode: state.mode,
    attempt: state.attempt,
    evidence: state.evidence,
    retryable: true,
    nextRetryAt: nextRetryAt(state.attempt, at, policy),
    error,
  };
}

const startSending = (state: PreAcceptanceState): ActionState => ({
  kind: "sending",
  mode: state.mode,
  attempt: state.attempt + 1,
  evidence: state.evidence,
});

const toQueued = (state: PreAcceptanceState): ActionState => ({
  kind: "queued",
  mode: state.mode,
  attempt: state.attempt,
  evidence: state.evidence,
});

const cancel = (state: ActionState): ActionState => ({
  kind: "cancelled",
  mode: state.mode,
});

/** Keeps the evidence collected before a pre-acceptance state settles. */
const chainProgressOf = (state: PreAcceptanceState): ChainProgress | null =>
  state.evidence === null ? null : chainProgress(state.evidence);

const failWith = (
  state: PreAcceptanceState,
  error: string | undefined
): ActionState => ({
  kind: "failed",
  mode: state.mode,
  reason: error ?? null,
  chain: chainProgressOf(state),
});

/** Server mode: the API accepted the action (its response, or the echo). */
const accept = (state: PreAcceptanceState): ActionState | null =>
  state.mode === SERVER
    ? {
        kind: "submitted",
        mode: state.mode,
        attempt: state.attempt,
        chain: null,
      }
    : null;

/** Server mode: the API refused the content. */
const refuse = (
  state: PreAcceptanceState,
  event: EventOf<"REJECTED">
): ActionState | null =>
  state.mode === SERVER
    ? {
        kind: "rejected",
        mode: state.mode,
        reason: event.reason ?? null,
        chain: null,
      }
    : null;

const TRANSITIONS: { readonly [K in ActionStateKind]: Rules<K> } = {
  draft: {
    SUBMIT: (state, event) => {
      if (event.requiresSignature) {
        return { kind: "awaiting-signature", mode: state.mode };
      }
      // Every chain action is signed.
      return state.mode === CHAIN
        ? null
        : { kind: "sending", mode: state.mode, attempt: 1, evidence: null };
    },
    CANCEL: cancel,
  },
  "awaiting-signature": {
    WALLET_SIGNED: (state, event) => {
      if (state.mode === SERVER) {
        return { kind: "signed", mode: state.mode, attempt: 0, evidence: null };
      }
      return event.txId === undefined
        ? null
        : {
            kind: "signed",
            mode: state.mode,
            attempt: 0,
            evidence: initialEvidence(event.txId),
          };
    },
    WALLET_REJECTED: (state) => ({
      kind: "signature-rejected",
      mode: state.mode,
      reason: "wallet",
    }),
    TIMEOUT: (state) => ({
      kind: "signature-rejected",
      mode: state.mode,
      reason: "timeout",
    }),
    CANCEL: cancel,
  },
  signed: { SEND: startSending, OFFLINE: toQueued, CANCEL: cancel },
  queued: {
    SEND: startSending,
    OFFLINE: (state) => state,
    CANCEL: cancel,
    TIMEOUT: (state) => ({
      kind: "expired",
      mode: state.mode,
      chain: chainProgressOf(state),
    }),
    // A request sent before the connection dropped may still be accepted.
    SEND_OK: accept,
  },
  sending: {
    SEND_OK: accept,
    REJECTED: refuse,
    SEND_ERROR: (state, event, policy) =>
      event.retryable
        ? sendFailed(state, event.at, event.error ?? null, policy)
        : failWith(state, event.error),
    TIMEOUT: (state, event, policy) =>
      sendFailed(state, event.at, "timeout", policy),
    OFFLINE: toQueued,
  },
  "send-failed": {
    // The failed request may have reached the server after all.
    SEND_OK: accept,
    REJECTED: refuse,
    RETRY: startSending,
    // A late answer to the request that already failed.
    SEND_ERROR: (state, event) =>
      event.retryable ? state : failWith(state, event.error),
    OFFLINE: toQueued,
    CANCEL: cancel,
  },
  "signature-rejected": {
    RETRY: (state) => ({ kind: "awaiting-signature", mode: state.mode }),
    CANCEL: cancel,
  },
  // The echo and the response can both report acceptance.
  submitted: {
    SEND_OK: (state) => (state.mode === SERVER ? state : null),
  },
  committed: {},
  finalized: {},
  "in-decision": {},
  reduced: {},
  rejected: {},
  failed: {},
  expired: {},
  replaced: {},
  cancelled: {},
};

// Chain events ---------------------------------------------------------------

function stageRank(state: ActionState): number {
  const chain = chainOf(state);
  if (chain !== null) {
    return CHAIN_LABEL_RANK[chain.status.label];
  }
  return state.kind === "submitted"
    ? CHAIN_LABEL_RANK.submitted
    : CHAIN_LABEL_RANK.signed;
}

function evidenceOf(state: ActionState): ChainProgress["evidence"] | null {
  if ("evidence" in state) {
    return state.evidence;
  }
  return chainOf(state)?.evidence ?? null;
}

function isPreAcceptance(state: ActionState): state is PreAcceptanceState {
  return (
    state.kind === "signed" ||
    state.kind === "queued" ||
    state.kind === "sending" ||
    state.kind === "send-failed"
  );
}

/** The state the ladder's derived status puts a chain action in. */
function chainState(
  state: ActionState,
  progress: ChainProgress
): ActionState | null {
  const { status } = progress;
  if (status.overlay !== null && isFinalOverlay(status.overlay)) {
    if (status.overlay === "rejected" || status.overlay === "failed") {
      return {
        kind: status.overlay,
        mode: CHAIN,
        reason: null,
        chain: progress,
      };
    }
    if (status.overlay === "expired" || status.overlay === "replaced") {
      return { kind: status.overlay, mode: CHAIN, chain: progress };
    }
  }
  if (CHAIN_LABEL_RANK[status.label] < stageRank(state)) {
    // Chain stages only move forward.
    return null;
  }
  const attempt = "attempt" in state ? state.attempt : 1;
  if (status.label === "signed") {
    // Not accepted yet: keep the client-side state, with the new evidence.
    if (isPreAcceptance(state)) {
      return { ...state, evidence: progress.evidence };
    }
    // Another gateway's answer outweighed the refusals: in flight again.
    return state.kind === "rejected"
      ? { kind: "sending", mode: CHAIN, attempt, evidence: progress.evidence }
      : null;
  }
  if (status.overlay === "reduced") {
    return { kind: "reduced", mode: CHAIN, attempt, chain: progress };
  }
  if (status.label === "submitted") {
    return { kind: "submitted", mode: CHAIN, attempt, chain: progress };
  }
  return { kind: status.label, mode: CHAIN, attempt, chain: progress };
}

function stepChainEvent(
  state: ActionState,
  event: ChainActionEvent
): TransitionResult {
  if (state.mode !== CHAIN) {
    return { state, legal: false };
  }
  if (isTerminalActionState(state)) {
    // Late gateway answers after the outcome is settled are expected.
    return { state, legal: true };
  }
  const evidence = evidenceOf(state);
  const next =
    evidence === null
      ? null
      : chainState(state, foldChainEvent(evidence, event));
  return next === null ? { state, legal: false } : { state: next, legal: true };
}

// Reducer --------------------------------------------------------------------

/** Pure transition. Illegal events return the input state with `legal: false`. */
export function step(
  state: ActionState,
  event: ActionEvent,
  policy: RetryPolicy = DEFAULT_RETRY_POLICY
): TransitionResult {
  if (isChainEvent(event)) {
    return stepChainEvent(state, event);
  }
  // The table is typed per state kind and event type; TypeScript cannot
  // correlate the two unions at this lookup, hence the widening.
  const rules = TRANSITIONS[state.kind] as Rules<ActionStateKind>;
  const rule = rules[event.type] as
    | ((
        state: ActionState,
        event: ActionEvent,
        policy: RetryPolicy
      ) => ActionState | null)
    | undefined;
  const next = rule === undefined ? null : rule(state, event, policy);
  return next === null ? { state, legal: false } : { state: next, legal: true };
}

/**
 * The reducer for callers: `(state, event) -> state`. An illegal event is a
 * no-op that is reported outside production; it never throws.
 */
export function transition(
  state: ActionState,
  event: ActionEvent,
  options: TransitionOptions = {}
): ActionState {
  const result = step(state, event, options.policy ?? DEFAULT_RETRY_POLICY);
  if (!result.legal) {
    reportIllegalTransition(
      { from: state.kind, mode: state.mode, event: event.type },
      options.reporter
    );
  }
  if (hasTransitionObservers(options.observer)) {
    notifyTransitionObservers(
      Object.freeze({
        from: state.kind,
        event: event.type,
        to: result.state.kind,
        mode: state.mode,
        legal: result.legal,
      }),
      options.observer
    );
  }
  return result.state;
}
