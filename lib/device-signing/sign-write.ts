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
import { canonicalizeBody } from "./canonical-json";
import { allocateDeviceSeq, forgetDeviceGrant } from "./device-key-store";
import { signEventId } from "./ed25519";
import { isSignedMessagesEnabled } from "./feature";
import {
  computeInterimEventId,
  DEVICE_EVENT_KIND_SCOPE,
  ED25519_KEY_TYPE,
  INTERIM_EVENT_KIND_VERSION,
  type DeviceEventKind,
} from "./interim-event";
import { withinTimeBudget } from "./time-budget";

interface DeviceSignedWrite {
  readonly kind: DeviceEventKind;
  readonly wave: string;
  readonly refs: readonly string[];
  /** The request body without device_signature, or null without a body. */
  readonly body: object | null;
}

type SendWrite<T> = (deviceSignature: ApiDeviceSignature | null) => Promise<T>;

interface SignedEnvelope {
  readonly address: string;
  readonly signature: ApiDeviceSignature;
}

/** Signing must never hold up a write; past this budget it goes unsigned. */
const SIGNING_BUDGET_MS = 1500;
const INVALID_DEVICE_SIGNATURE_PREFIX = "Invalid device signature:";
const INVALID_DEVICE_SIGNATURE_CODE = "INVALID_DEVICE_SIGNATURE";
/**
 * Reasons that mean the grant itself can no longer sign. Others (a reused
 * sequence, clock skew, a malformed envelope) keep the grant; the write is
 * still resent once unsigned and the next write signs with a fresh sequence.
 */
const GRANT_UNUSABLE_REASONS: readonly string[] = [
  "unknown grant",
  "grant was revoked",
  "grant expired",
  "grant does not include",
  "grant wallet does not belong",
  "signature does not verify",
];

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

async function signWrite(
  write: DeviceSignedWrite
): Promise<SignedEnvelope | null> {
  try {
    const address = getWalletAddress();
    if (!address) {
      return null;
    }
    const allocation = await allocateDeviceSeq(address, Date.now());
    if (!allocation) {
      return null;
    }
    const { grant, record, seq } = allocation;
    // Proxy sessions act for another profile and never sign as the wallet.
    // An unused sequence number is a harmless gap.
    if (!isOwnProfileSession(address, record.ownProfileId)) {
      return null;
    }
    if (!grant.scopes.includes(DEVICE_EVENT_KIND_SCOPE[write.kind])) {
      return null;
    }
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
      address: record.address,
      signature: {
        grant_id: grant.id,
        seq,
        claimed_time: claimedTime,
        signature,
      },
    };
  } catch {
    return null;
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
  return getStructuredApiErrorCode(error) === INVALID_DEVICE_SIGNATURE_CODE
    ? ""
    : null;
}

const isGrantUnusable = (reason: string): boolean =>
  GRANT_UNUSABLE_REASONS.some((prefix) => reason.startsWith(prefix));

async function sendWithFallback<T>(
  write: DeviceSignedWrite,
  send: SendWrite<T>
): Promise<T> {
  const envelope = await withinTimeBudget(signWrite(write), SIGNING_BUDGET_MS);
  if (!envelope) {
    return await send(null);
  }
  try {
    return await send(envelope.signature);
  } catch (error) {
    const reason = getInvalidDeviceSignatureReason(error);
    if (reason === null) {
      throw error;
    }
    if (isGrantUnusable(reason)) {
      try {
        await forgetDeviceGrant(envelope.address, envelope.signature.grant_id);
      } catch {
        // The unsigned resend below does not depend on local cleanup.
      }
    }
    // Never resend the same envelope: this retry goes unsigned.
    return await send(null);
  }
}

/**
 * Sends a drop write, attaching a device signature when this device holds an
 * active grant for the active wallet. Any signing problem sends the write
 * unsigned exactly as before; a rejected signature is resent once unsigned,
 * and the local grant is dropped when the reason shows it can no longer sign.
 * Every call signs with a newly allocated sequence number.
 */
export function sendDeviceSignedWrite<T>(
  write: DeviceSignedWrite,
  send: SendWrite<T>
): Promise<T> {
  if (!isSignedMessagesEnabled()) {
    return send(null);
  }
  return sendWithFallback(write, send);
}
