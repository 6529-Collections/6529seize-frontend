import type { ApiDeviceGrantProof } from "@/generated/models/ApiDeviceGrantProof";
import type { ApiDeviceSignedEvent } from "@/generated/models/ApiDeviceSignedEvent";
import type { ApiDropSignedEvents } from "@/generated/models/ApiDropSignedEvents";
import { hashMessage, recoverMessageAddress, type Hex } from "viem";
import {
  canonicalJson,
  EMPTY_BODY_HASH,
  hashCanonicalString,
} from "./canonical-json";
import { verifyEventIdSignature } from "./ed25519";
import { parseDeviceGrantMessage } from "./grant-message";
import {
  computeInterimEventId,
  DEVICE_EVENT_KIND_SCOPE,
  DeviceEventKind,
  ED25519_KEY_TYPE,
} from "./interim-event";

/**
 * "verified": the wallet's sign-in signature recovers in this browser.
 * "contract-wallet": it does not recover to the wallet (for example an
 * EIP-1271 contract wallet), so the grant rests on 6529.io's sign-in check.
 */
type WalletSignatureCheck = "verified" | "contract-wallet";

interface VerifiedDropSignature {
  readonly eventId: string;
  readonly wallet: string;
  readonly deviceKey: string;
  readonly grantExpiresAt: number;
  readonly walletSignature: WalletSignatureCheck;
}

export type DropSignatureVerdict =
  | { readonly status: "unsigned" }
  | { readonly status: "invalid" }
  | {
      readonly status: "signed";
      readonly signature: VerifiedDropSignature;
      /** Whether the drop's current content is the signed version. */
      readonly currentContentSigned: boolean;
    };

interface VerifiedEvent {
  readonly event: ApiDeviceSignedEvent;
  readonly grant: ApiDeviceGrantProof;
  readonly walletSignature: WalletSignatureCheck;
}

const CONTENT_KINDS: ReadonlySet<number> = new Set([
  DeviceEventKind.POST,
  DeviceEventKind.EDIT,
]);

const same = (left: string, right: string): boolean =>
  left.toLowerCase() === right.toLowerCase();

/** The grant message commits to exactly the key, scopes and expiry stored. */
const isGrantMessageConsistent = (grant: ApiDeviceGrantProof): boolean => {
  if (!same(hashMessage(grant.message), grant.id)) {
    return false;
  }
  const parsed = parseDeviceGrantMessage(grant.message);
  return (
    parsed !== null &&
    same(parsed.address, grant.wallet) &&
    same(parsed.deviceKeyHex, grant.device_key) &&
    parsed.scopes.join(",") === grant.scopes.join(",") &&
    parsed.expiresAtSeconds * 1000 === grant.expires_at
  );
};

async function checkGrant(
  grant: ApiDeviceGrantProof
): Promise<WalletSignatureCheck | null> {
  try {
    if (!isGrantMessageConsistent(grant)) {
      return null;
    }
    const recovered = await recoverMessageAddress({
      message: grant.message,
      signature: grant.wallet_signature as Hex,
    });
    return same(recovered, grant.wallet) ? "verified" : "contract-wallet";
  } catch {
    return "contract-wallet";
  }
}

const isBodyConsistent = (event: ApiDeviceSignedEvent): boolean => {
  if (event.body === null) {
    return same(event.body_hash, EMPTY_BODY_HASH) && event.body_size === 0;
  }
  const { bodyHash, bodySize } = hashCanonicalString(event.body);
  if (!same(bodyHash, event.body_hash) || bodySize !== event.body_size) {
    return false;
  }
  try {
    return canonicalJson(JSON.parse(event.body)) === event.body;
  } catch {
    return false;
  }
};

const isEventBoundToGrant = (
  event: ApiDeviceSignedEvent,
  grant: ApiDeviceGrantProof
): boolean => {
  const scope =
    DEVICE_EVENT_KIND_SCOPE[event.kind as keyof typeof DEVICE_EVENT_KIND_SCOPE];
  return (
    same(event.auth_ref, grant.id) &&
    same(event.device_key, grant.device_key) &&
    same(event.author, grant.wallet) &&
    event.key_type === ED25519_KEY_TYPE &&
    grant.scopes.includes(scope)
  );
};

async function verifyEvent(
  event: ApiDeviceSignedEvent,
  grant: ApiDeviceGrantProof
): Promise<boolean> {
  if (!isEventBoundToGrant(event, grant) || !isBodyConsistent(event)) {
    return false;
  }
  try {
    const eventId = computeInterimEventId({
      kind: event.kind,
      kindVersion: event.kind_version,
      wave: event.wave,
      author: event.author.toLowerCase(),
      keyType: event.key_type,
      deviceKey: event.device_key,
      authRef: event.auth_ref,
      seq: event.seq,
      anchor: event.anchor,
      claimedTime: event.claimed_time,
      refs: event.refs,
      bodyHash: event.body_hash,
      bodySize: event.body_size,
    });
    if (!same(eventId, event.id)) {
      return false;
    }
    return await verifyEventIdSignature({
      publicKeyHex: event.device_key,
      eventId,
      signatureHex: event.signature,
    });
  } catch {
    return false;
  }
}

async function verifyContentEvents(
  data: ApiDropSignedEvents
): Promise<VerifiedEvent[]> {
  const grants = new Map(
    data.grants.map((grant) => [grant.id.toLowerCase(), grant])
  );
  const grantChecks = new Map<string, Promise<WalletSignatureCheck | null>>();
  const results = await Promise.all(
    data.events
      .filter((event) => CONTENT_KINDS.has(event.kind))
      .map(async (event): Promise<VerifiedEvent | null> => {
        const grantId = event.auth_ref.toLowerCase();
        const grant = grants.get(grantId);
        if (!grant) {
          return null;
        }
        let grantCheck = grantChecks.get(grantId);
        if (!grantCheck) {
          grantCheck = checkGrant(grant);
          grantChecks.set(grantId, grantCheck);
        }
        const walletSignature = await grantCheck;
        if (!walletSignature || !(await verifyEvent(event, grant))) {
          return null;
        }
        return { event, grant, walletSignature };
      })
  );
  return results.filter((result): result is VerifiedEvent => result !== null);
}

/**
 * Verifies a drop's signed events entirely in the browser: each event id is
 * recomputed from its fields and canonical body, its Ed25519 signature is
 * checked against the grant's key, and the grant's sign-in message is checked
 * against the wallet signature.
 */
export async function verifyDropSignedEvents(
  data: ApiDropSignedEvents
): Promise<DropSignatureVerdict> {
  const hasContentEvents = data.events.some((event) =>
    CONTENT_KINDS.has(event.kind)
  );
  if (!hasContentEvents) {
    return { status: "unsigned" };
  }
  const verified = await verifyContentEvents(data);
  const currentEventId = data.current_event_id;
  const current = currentEventId
    ? verified.find(({ event }) => same(event.id, currentEventId))
    : undefined;
  const shown = current ?? verified.at(-1);
  if (!shown) {
    return { status: "invalid" };
  }
  return {
    status: "signed",
    currentContentSigned: current !== undefined,
    signature: {
      eventId: shown.event.id,
      wallet: shown.grant.wallet,
      deviceKey: shown.grant.device_key,
      grantExpiresAt: shown.grant.expires_at,
      walletSignature: shown.walletSignature,
    },
  };
}
