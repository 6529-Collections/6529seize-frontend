import type { ApiDeviceSignature } from "@/generated/models/ApiDeviceSignature";
import {
  getStructuredApiErrorCode,
  getStructuredApiErrorStatus,
} from "@/services/api/common-api";
import { isDirectProfileAuthSession } from "@/components/auth/auth-session-scope";
import {
  getConnectedWalletAccounts,
  getWalletAddress,
} from "@/services/auth/auth.utils";
import {
  recordDeviceSigningEvent,
  reportSignedWriteFallback,
  type SignedWriteFallbackReason,
  type SigningPhase,
} from "@/utils/monitoring/deviceSigningMonitoring";
import { canonicalizeBody } from "./canonical-json";
import {
  allocateDeviceSeq,
  forgetDeviceGrant,
  readUsableDeviceGrant,
} from "./device-key-store";
import { isEd25519Supported, signEventId } from "./ed25519";
import { isSignedMessagesEnabled } from "./feature";
import { readDeviceGrantHint } from "./grant-hint";
import {
  computeInterimEventId,
  DEVICE_EVENT_KIND_SCOPE,
  DeviceEventKind,
  ED25519_KEY_TYPE,
  INTERIM_EVENT_KIND_VERSION,
} from "./interim-event";
import {
  requestSigningDecision,
  SignedWriteCancelledError,
  type SignedWriteAction,
  type SigningFailureReason,
} from "./signing-decision";
import { withinTimeBudget } from "./time-budget";

interface DeviceSignedWrite {
  readonly kind: DeviceEventKind;
  readonly wave: string;
  readonly refs: readonly string[];
  /** The request body without device_signature, or null without a body. */
  readonly body: object | null;
  /** Aborts a write that is waiting for signing or for the user's choice. */
  readonly signal?: AbortSignal | undefined;
}

type SendWrite<T> = (deviceSignature: ApiDeviceSignature | null) => Promise<T>;

interface SignedEnvelope {
  readonly address: string;
  readonly signature: ApiDeviceSignature;
}

/**
 * How long a write expected to be signed waits for its signature. A write
 * that is not signed in time is never sent unsigned silently: the user is
 * asked to try again or send it unsigned. The key and grant are warmed when
 * a composer mounts or gains focus and when the tab becomes visible, so this
 * is rarely reached.
 */
const SIGNING_BUDGET_MS = 10_000;
/** A successful signature slower than this leaves a timing breadcrumb. */
const SLOW_SIGNING_MS = 1500;
/** Warming the same wallet more often than this is skipped. */
const PREWARM_INTERVAL_MS = 30_000;
/** Grants this close to expiry are not used (matches the key store). */
const HINT_EXPIRY_MARGIN_MS = 60 * 1000;
const INVALID_DEVICE_SIGNATURE_PREFIX = "Invalid device signature:";
const INVALID_DEVICE_SIGNATURE_CODE = "INVALID_DEVICE_SIGNATURE";
/**
 * A server without signed writes (for example after a backend rollback)
 * rejects the field itself. The grant is kept, but the write is never resent
 * unsigned by itself: a hostile server could strip signatures this way, so
 * the user chooses to try again or send it unsigned.
 */
const UNSUPPORTED_DEVICE_SIGNATURE_MESSAGE =
  '"device_signature" is not allowed';
/**
 * Reasons that mean the grant itself can no longer sign; the local grant is
 * forgotten. Others (a reused sequence, clock skew, a malformed envelope)
 * keep the grant, and trying again signs with a fresh sequence.
 */
const GRANT_UNUSABLE_REASONS: readonly string[] = [
  "unknown grant",
  "grant was revoked",
  "grant expired",
  "grant does not include",
  "grant wallet does not belong",
  "signature does not verify",
];

const ACTION_BY_KIND: Readonly<Record<DeviceEventKind, SignedWriteAction>> = {
  [DeviceEventKind.POST]: "post",
  [DeviceEventKind.EDIT]: "edit",
  [DeviceEventKind.TOMBSTONE]: "delete",
  [DeviceEventKind.REACT]: "react",
};

const now = (): number => performance.now();

/**
 * Whether the active session acts as the wallet's own profile. The server
 * returns the caller's own profile id as the session role, so a role alone
 * does not mean a proxy; a proxy session's role is another profile's id.
 * Unknown profile ids fail safe: the write goes unsigned.
 */
function isOwnProfileSession(
  address: string,
  ownProfileId: string | null | undefined
): boolean {
  const account = getConnectedWalletAccounts().find(
    (candidate) => candidate.address.toLowerCase() === address.toLowerCase()
  );
  if (account === undefined) {
    return false;
  }
  return isDirectProfileAuthSession({
    authRole: account.role,
    profileId: account.profileId ?? ownProfileId,
    hasActiveProxy: false,
  });
}

/** Where an attempt is, so a timeout or error can say where time went. */
interface SigningProgress {
  phase: Exclude<SigningPhase, "send">;
  /** Whether the key record held a usable grant, once read. */
  grantFound: boolean | null;
  readonly startedAt: number;
  lockedAt: number | null;
}

type LocalFailureReason = Extract<
  SigningFailureReason,
  "timeout" | "lock" | "storage-error" | "crypto-error"
>;

interface SigningFailure {
  readonly status: "failed";
  readonly reason: LocalFailureReason;
  readonly phase: SigningProgress["phase"];
  readonly elapsedMs: number;
  readonly lockWaitMs: number | undefined;
}

type SigningAttempt =
  | { readonly status: "signed"; readonly envelope: SignedEnvelope }
  /** Nothing to sign with: no wallet, no usable grant, a proxy or a missing scope. */
  | { readonly status: "unsigned" }
  | SigningFailure;

const UNSIGNED: SigningAttempt = { status: "unsigned" };

const FAILURE_BY_PHASE: Readonly<
  Record<SigningProgress["phase"], LocalFailureReason>
> = {
  lock: "lock",
  storage: "storage-error",
  sign: "crypto-error",
};

async function signWrite(
  address: string,
  write: DeviceSignedWrite,
  progress: SigningProgress
): Promise<SigningAttempt> {
  const allocation = await allocateDeviceSeq(address, Date.now(), () => {
    progress.phase = "storage";
    progress.lockedAt = now();
  });
  progress.grantFound = allocation !== null;
  if (!allocation) {
    return UNSIGNED;
  }
  const { grant, record, seq } = allocation;
  // Proxy sessions act for another profile and never sign as the wallet.
  // An unused sequence number is a harmless gap.
  if (!isOwnProfileSession(address, record.ownProfileId)) {
    return UNSIGNED;
  }
  if (!grant.scopes.includes(DEVICE_EVENT_KIND_SCOPE[write.kind])) {
    return UNSIGNED;
  }
  progress.phase = "sign";
  const { bodyHash, bodySize } = canonicalizeBody(write.body);
  const claimedTime = Date.now();
  const eventId = computeInterimEventId({
    kind: write.kind,
    kindVersion: INTERIM_EVENT_KIND_VERSION,
    wave: write.wave,
    author: grant.wallet.toLowerCase(),
    keyType: ED25519_KEY_TYPE,
    deviceKey: grant.device_key,
    authRef: grant.id,
    seq,
    anchor: 0,
    claimedTime,
    refs: write.refs,
    bodyHash,
    bodySize,
  });
  const signature = await signEventId(record.keyPair.privateKey, eventId);
  return {
    status: "signed",
    envelope: {
      address: record.address,
      signature: {
        grant_id: grant.id,
        seq,
        claimed_time: claimedTime,
        signature,
      },
    },
  };
}

/**
 * Whether this browser was expected to sign the write. Once the key record
 * was read, it decides; when it could not be read in time, the grant note
 * kept beside it does.
 */
function isSignatureExpected(
  address: string,
  write: DeviceSignedWrite,
  progress: SigningProgress
): boolean {
  if (progress.grantFound !== null) {
    return progress.grantFound;
  }
  const hint = readDeviceGrantHint(address);
  return (
    hint !== null &&
    hint.expiresAt > Date.now() + HINT_EXPIRY_MARGIN_MS &&
    hint.scopes.includes(DEVICE_EVENT_KIND_SCOPE[write.kind]) &&
    isOwnProfileSession(address, hint.ownProfileId)
  );
}

const elapsedSince = (from: number, to: number | null): number | undefined =>
  to === null ? undefined : to - from;

async function attemptSignature(
  write: DeviceSignedWrite
): Promise<SigningAttempt> {
  const address = getWalletAddress();
  if (!address) {
    return UNSIGNED;
  }
  const progress: SigningProgress = {
    phase: "lock",
    grantFound: null,
    startedAt: now(),
    lockedAt: null,
  };
  let attempt: SigningAttempt | null;
  let failure: LocalFailureReason;
  try {
    attempt = await withinTimeBudget(
      signWrite(address, write, progress),
      SIGNING_BUDGET_MS
    );
    failure = "timeout";
  } catch {
    attempt = null;
    failure = FAILURE_BY_PHASE[progress.phase];
  }
  const elapsedMs = now() - progress.startedAt;
  const lockWaitMs = elapsedSince(progress.startedAt, progress.lockedAt);
  if (attempt) {
    if (attempt.status === "signed" && elapsedMs >= SLOW_SIGNING_MS) {
      recordDeviceSigningEvent("Slow device signature", {
        signing_action: ACTION_BY_KIND[write.kind],
        elapsed_ms: Math.round(elapsedMs),
        lock_wait_ms: Math.round(lockWaitMs ?? elapsedMs),
      });
    }
    return attempt;
  }
  if (!isSignatureExpected(address, write, progress)) {
    return UNSIGNED;
  }
  return {
    status: "failed",
    reason: failure,
    phase: progress.phase,
    elapsedMs,
    lockWaitMs,
  };
}

const lastPrewarmAt = new Map<string, number>();

/**
 * Loads this browser's key record (opening IndexedDB and restoring the
 * WebCrypto key), reads its grant and initializes Ed25519, so the next
 * write signs quickly. Called when a composer mounts or gains focus and when
 * the tab becomes visible. Never throws; repeated calls are throttled.
 */
export async function prewarmDeviceSigning(): Promise<void> {
  if (!isSignedMessagesEnabled()) {
    return;
  }
  try {
    const address = getWalletAddress()?.toLowerCase();
    if (!address) {
      return;
    }
    const startedAt = Date.now();
    const last = lastPrewarmAt.get(address);
    if (last !== undefined && startedAt - last < PREWARM_INTERVAL_MS) {
      return;
    }
    lastPrewarmAt.set(address, startedAt);
    if (!(await isEd25519Supported())) {
      return;
    }
    await readUsableDeviceGrant(address, startedAt);
  } catch {
    // Warming is an optimization; signing reads the record itself.
  }
}

const getErrorMessage = (error: unknown): string | null => {
  if (typeof error === "string") {
    return error;
  }
  return error instanceof Error ? error.message : null;
};

/**
 * The server's reason when it rejected the device signature (not the write
 * itself), or null for any other failure. Structured errors carry the code
 * and the "error" text; legacy errors carry the text only.
 */
export function getInvalidDeviceSignatureReason(error: unknown): string | null {
  const status = getStructuredApiErrorStatus(error);
  if (status !== undefined && status !== 400) {
    return null;
  }
  const message = getErrorMessage(error) ?? "";
  if (message.startsWith(INVALID_DEVICE_SIGNATURE_PREFIX)) {
    return message.slice(INVALID_DEVICE_SIGNATURE_PREFIX.length).trim();
  }
  if (message.includes(UNSUPPORTED_DEVICE_SIGNATURE_MESSAGE)) {
    return "";
  }
  return getStructuredApiErrorCode(error) === INVALID_DEVICE_SIGNATURE_CODE
    ? ""
    : null;
}

const isGrantUnusable = (reason: string): boolean =>
  GRANT_UNUSABLE_REASONS.some((prefix) => reason.startsWith(prefix));

type SignatureRejection =
  | { readonly kind: "unsupported" }
  | { readonly kind: "rejected"; readonly grantUnusable: boolean };

function getSignatureRejection(error: unknown): SignatureRejection | null {
  const reason = getInvalidDeviceSignatureReason(error);
  if (reason === null) {
    return null;
  }
  if (getErrorMessage(error)?.includes(UNSUPPORTED_DEVICE_SIGNATURE_MESSAGE)) {
    return { kind: "unsupported" };
  }
  return { kind: "rejected", grantUnusable: isGrantUnusable(reason) };
}

const abortError = (): SignedWriteCancelledError =>
  new SignedWriteCancelledError();

/**
 * Asks the user how to continue after a signing failure. Resolves true to
 * try signing again and false to send unsigned; throws when cancelled.
 */
async function askToContinue(
  write: DeviceSignedWrite,
  reason: SigningFailureReason
): Promise<boolean> {
  const action = ACTION_BY_KIND[write.kind];
  const decision = await requestSigningDecision(
    { action, reason },
    write.signal
  );
  recordDeviceSigningEvent("Signing prompt answered", {
    signing_action: action,
    signing_fallback_reason: reason,
    decision,
  });
  if (decision === "cancel") {
    throw abortError();
  }
  return decision === "retry";
}

const reportFallback = (
  write: DeviceSignedWrite,
  reason: SignedWriteFallbackReason,
  failure?: SigningFailure
): void =>
  reportSignedWriteFallback({
    action: ACTION_BY_KIND[write.kind],
    reason,
    phase: failure?.phase ?? "send",
    elapsedMs: failure?.elapsedMs,
    lockWaitMs: failure?.lockWaitMs,
  });

/** A finished write, or a request to sign it again. */
type SendStep<T> =
  | { readonly done: true; readonly value: T }
  | { readonly done: false };

const SIGN_AGAIN = { done: false } as const;

const finish = async <T>(value: Promise<T>): Promise<SendStep<T>> => ({
  done: true,
  value: await value,
});

/** After a failure: sign again, or send unsigned, as the user chooses. */
async function continueAfterFailure<T>(
  write: DeviceSignedWrite,
  send: SendWrite<T>,
  reason: SigningFailureReason
): Promise<SendStep<T>> {
  return (await askToContinue(write, reason))
    ? SIGN_AGAIN
    : await finish(send(null));
}

async function forgetGrantQuietly(envelope: SignedEnvelope): Promise<void> {
  try {
    await forgetDeviceGrant(envelope.address, envelope.signature.grant_id);
  } catch {
    // Local cleanup does not change what the user is asked.
  }
}

/** Sends the signed write once; a rejected signature is never resent as is. */
async function sendSigned<T>(
  write: DeviceSignedWrite,
  send: SendWrite<T>,
  envelope: SignedEnvelope
): Promise<SendStep<T>> {
  try {
    return await finish(send(envelope.signature));
  } catch (error) {
    const rejection = getSignatureRejection(error);
    if (rejection === null) {
      throw error;
    }
    if (rejection.kind === "unsupported") {
      reportFallback(write, "unsupported");
      return await continueAfterFailure(write, send, "unsupported");
    }
    if (rejection.grantUnusable) {
      await forgetGrantQuietly(envelope);
    }
    const reason = rejection.grantUnusable ? "grant-unusable" : "rejected";
    reportFallback(write, reason);
    return await continueAfterFailure(write, send, reason);
  }
}

/** A write expected to be signed that has no signature this attempt. */
async function continueWithoutSignature<T>(
  write: DeviceSignedWrite,
  send: SendWrite<T>,
  attempt: Exclude<SigningAttempt, { status: "signed" }>
): Promise<SendStep<T>> {
  const failure = attempt.status === "failed" ? attempt : undefined;
  const reason = failure?.reason ?? "grant-unusable";
  reportFallback(write, reason, failure);
  return await continueAfterFailure(write, send, reason);
}

async function sendWithSignature<T>(
  write: DeviceSignedWrite,
  send: SendWrite<T>
): Promise<T> {
  // Once a write was expected to be signed it stays expected: a grant that
  // disappears while the user decides is a reason to ask again, never to
  // send unsigned silently.
  let signatureExpected = false;
  for (;;) {
    if (write.signal?.aborted) {
      throw abortError();
    }
    const attempt = await attemptSignature(write);
    if (attempt.status === "unsigned" && !signatureExpected) {
      return await send(null);
    }
    signatureExpected = true;
    const step =
      attempt.status === "signed"
        ? await sendSigned(write, send, attempt.envelope)
        : await continueWithoutSignature(write, send, attempt);
    if (step.done) {
      return step.value;
    }
  }
}

/**
 * Sends a drop write, attaching a device signature when this browser holds
 * an active grant for the active wallet. Without a grant (and in proxy
 * sessions, the apps and browsers without Ed25519) the write is sent
 * unsigned exactly as before. With a grant the write waits for its
 * signature; if signing fails or 6529.io rejects the signature, even by not
 * accepting device signatures at all, the write stays pending until the user
 * chooses to try again or send it unsigned. Every attempt signs with a newly
 * allocated sequence number.
 */
export function sendDeviceSignedWrite<T>(
  write: DeviceSignedWrite,
  send: SendWrite<T>
): Promise<T> {
  if (!isSignedMessagesEnabled()) {
    return send(null);
  }
  return sendWithSignature(write, send);
}
