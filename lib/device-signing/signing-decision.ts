/**
 * When a write that this browser is expected to sign cannot be signed, the
 * write waits here for the user's explicit choice. A single host component
 * (SignedWriteDecisionHost) shows the prompts one at a time.
 */

/** What the user did, named in the prompt. */
export type SignedWriteAction = "post" | "edit" | "delete" | "react";

/** Why a write that was expected to be signed is not (yet) signed. */
export type SigningFailureReason =
  /** Signing did not finish within the budget. */
  | "timeout"
  /** The cross-tab key lock could not be taken. */
  | "lock"
  /** IndexedDB failed while reading or updating the key record. */
  | "storage-error"
  /** WebCrypto failed to sign. */
  | "crypto-error"
  /** 6529.io rejected the signature; the grant can still sign. */
  | "rejected"
  /** The grant can no longer sign (revoked, expired, unknown or gone). */
  | "grant-unusable";

export type SigningDecision = "retry" | "unsigned" | "cancel";

interface SigningDecisionRequest {
  readonly action: SignedWriteAction;
  readonly reason: SigningFailureReason;
}

export interface PendingSigningDecision extends SigningDecisionRequest {
  readonly id: number;
}

interface QueuedDecision extends PendingSigningDecision {
  readonly resolve: (decision: SigningDecision) => void;
}

/** Thrown when no prompt host is mounted, so a write never goes unsigned silently. */
export class SigningDecisionUnavailableError extends Error {
  constructor() {
    super("This write could not be signed and no prompt is available");
    this.name = "SigningDecisionUnavailableError";
  }
}

let queue: readonly QueuedDecision[] = [];
/** Stable snapshot of the head of the queue, for useSyncExternalStore. */
let current: PendingSigningDecision | null = null;
let nextId = 1;
let hostCount = 0;
const listeners = new Set<() => void>();

const emit = () => {
  const head = queue[0];
  if (head?.id !== current?.id) {
    current = head
      ? { id: head.id, action: head.action, reason: head.reason }
      : null;
  }
  for (const listener of listeners) {
    listener();
  }
};

const settle = (id: number, decision: SigningDecision): void => {
  const entry = queue.find((candidate) => candidate.id === id);
  if (!entry) {
    return;
  }
  queue = queue.filter((candidate) => candidate.id !== id);
  emit();
  entry.resolve(decision);
};

/**
 * Asks the user how to continue. Resolves "cancel" when the signal aborts.
 * Rejects when no host is mounted.
 */
export function requestSigningDecision(
  request: SigningDecisionRequest,
  signal?: AbortSignal
): Promise<SigningDecision> {
  if (hostCount === 0) {
    return Promise.reject(new SigningDecisionUnavailableError());
  }
  if (signal?.aborted) {
    return Promise.resolve("cancel");
  }
  return new Promise<SigningDecision>((resolve) => {
    const id = nextId++;
    queue = [...queue, { ...request, id, resolve }];
    signal?.addEventListener("abort", () => settle(id, "cancel"), {
      once: true,
    });
    emit();
  });
}

/** Answers a pending prompt. Unknown or settled ids are ignored. */
export function resolveSigningDecision(
  id: number,
  decision: SigningDecision
): void {
  settle(id, decision);
}

/** The prompt to show now, or null. */
export function getCurrentSigningDecision(): PendingSigningDecision | null {
  return current;
}

export function subscribeToSigningDecisions(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** Marks a prompt host as mounted for as long as the returned cleanup is not called. */
export function registerSigningDecisionHost(): () => void {
  hostCount += 1;
  let registered = true;
  return () => {
    if (!registered) {
      return;
    }
    registered = false;
    hostCount -= 1;
  };
}
