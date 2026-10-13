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
 * "verified": the wallet's sign-in signature was checked in this browser,
 * either by ECDSA recovery or, for a contract wallet, by its EIP-1271 check
 * read from Ethereum.
 * "contract-wallet": it does not recover to the wallet and no Ethereum read
 * was available, so the grant rests on 6529.io's sign-in check.
 */
type WalletSignatureCheck = "verified" | "contract-wallet";

/** Checks a contract wallet's signature on Ethereum (EIP-1271), if available. */
export type ContractSignatureVerifier = (args: {
  readonly address: Hex;
  readonly message: string;
  readonly signature: Hex;
  readonly chainId: number;
}) => Promise<boolean>;

interface VerifyOptions {
  readonly verifyContractSignature?: ContractSignatureVerifier | undefined;
}

const HEX_DIGITS = /^0x[0-9a-fA-F]+$/;
/** 0x plus a 65-byte ECDSA signature. */
const ECDSA_SIGNATURE_HEX_LENGTH = 132;

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

async function recoversToWallet(grant: ApiDeviceGrantProof): Promise<boolean> {
  try {
    const recovered = await recoverMessageAddress({
      message: grant.message,
      signature: grant.wallet_signature as Hex,
    });
    return same(recovered, grant.wallet);
  } catch {
    return false;
  }
}

async function checkContractWalletSignature(
  grant: ApiDeviceGrantProof,
  verifyContractSignature: ContractSignatureVerifier | undefined
): Promise<WalletSignatureCheck | null> {
  if (!verifyContractSignature) {
    return "contract-wallet";
  }
  try {
    const valid = await verifyContractSignature({
      address: grant.wallet as Hex,
      message: grant.message,
      signature: grant.wallet_signature as Hex,
      chainId: grant.chain_id,
    });
    return valid ? "verified" : null;
  } catch {
    // Ethereum unreachable: fall back to the labelled sign-in check.
    return "contract-wallet";
  }
}

async function checkGrant(
  grant: ApiDeviceGrantProof,
  { verifyContractSignature }: VerifyOptions
): Promise<WalletSignatureCheck | null> {
  let consistent = false;
  try {
    consistent = isGrantMessageConsistent(grant);
  } catch {
    consistent = false;
  }
  if (!consistent) {
    return null;
  }
  // A value that is not hex bytes cannot be attributed to any wallet.
  const signature = grant.wallet_signature;
  if (!HEX_DIGITS.test(signature) || signature.length % 2 !== 0) {
    return null;
  }
  if (
    signature.length === ECDSA_SIGNATURE_HEX_LENGTH &&
    (await recoversToWallet(grant))
  ) {
    return "verified";
  }
  // Not the wallet's own ECDSA signature: only a contract wallet (EIP-1271)
  // can have signed it, so check that on Ethereum where possible.
  return await checkContractWalletSignature(grant, verifyContractSignature);
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
  data: ApiDropSignedEvents,
  options: VerifyOptions
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
          grantCheck = checkGrant(grant, options);
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
  data: ApiDropSignedEvents,
  options: VerifyOptions = {}
): Promise<DropSignatureVerdict> {
  const hasContentEvents = data.events.some((event) =>
    CONTENT_KINDS.has(event.kind)
  );
  if (!hasContentEvents) {
    return { status: "unsigned" };
  }
  const verified = await verifyContentEvents(data, options);
  const currentEventId = data.current_event_id;
  const current = currentEventId
    ? verified.find(({ event }) => same(event.id, currentEventId))
    : undefined;
  if (currentEventId && !current) {
    // The server claims the current content is signed but that event does not
    // verify: never fall back to an older signed version.
    return { status: "invalid" };
  }
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
