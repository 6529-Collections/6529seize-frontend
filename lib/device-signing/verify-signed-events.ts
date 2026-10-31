import type { ApiDeviceGrantProof } from "@/generated/models/ApiDeviceGrantProof";
import type { ApiDrop } from "@/generated/models/ApiDrop";
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

/**
 * What the reader is shown for the drop, compared with the signed body. Media
 * and attachments are compared by count: requests may reference uploads by id
 * while the drop shows their resolved URLs.
 */
interface DisplayedDropContent {
  readonly title: string | null;
  readonly parts: readonly {
    readonly content: string | null;
    readonly mediaCount: number;
    readonly attachmentCount: number;
  }[];
}

const same = (left: string, right: string): boolean =>
  left.toLowerCase() === right.toLowerCase();

/** The drop the reader opened: events must belong to it to count. */
interface ExpectedDrop {
  readonly dropId: string;
  readonly waveId: string;
  /**
   * The author's wallets (its consolidation, from the profile data); an
   * event signed under another wallet's grant is not the author's.
   */
  readonly authorWallets: readonly string[];
}

interface VerifyOptions {
  readonly verifyContractSignature?: ContractSignatureVerifier | undefined;
  /** When given, the current content is "signed" only if it matches. */
  readonly displayed?: DisplayedDropContent | undefined;
  /** When given, only events of this drop, wave and author count. */
  readonly expected?: ExpectedDrop | undefined;
}

const belongsToExpectedDrop = (
  event: ApiDeviceSignedEvent,
  expected: ExpectedDrop | undefined
): boolean =>
  expected === undefined ||
  (same(event.wave, expected.waveId) &&
    expected.authorWallets.some((wallet) => same(wallet, event.author)));

const countOf = (value: unknown): number =>
  Array.isArray(value) ? value.length : 0;

export const toDisplayedDropContent = (
  drop: Pick<ApiDrop, "title" | "parts">
): DisplayedDropContent => ({
  title: drop.title ?? null,
  parts: drop.parts.map((part) => ({
    content: part.content ?? null,
    mediaCount: countOf(part.media),
    attachmentCount: countOf(part.attachments),
  })),
});

const asText = (value: unknown): string =>
  typeof value === "string" ? value : "";

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

function parseSignedBody(event: ApiDeviceSignedEvent): unknown {
  if (event.body === null) {
    return null;
  }
  try {
    return JSON.parse(event.body) as unknown;
  } catch {
    return null;
  }
}

/** Whether the signed post or edit body is what the reader is shown. */
function matchesDisplayed(
  event: ApiDeviceSignedEvent,
  displayed: DisplayedDropContent
): boolean {
  const body = parseSignedBody(event);
  if (!isRecord(body)) {
    return false;
  }
  const parts = Array.isArray(body["parts"]) ? body["parts"] : [];
  if (
    asText(body["title"]) !== asText(displayed.title) ||
    parts.length !== displayed.parts.length
  ) {
    return false;
  }
  return parts.every((part: unknown, index) => {
    const shown = displayed.parts[index];
    return (
      shown !== undefined &&
      isRecord(part) &&
      asText(part["content"]) === asText(shown.content) &&
      countOf(part["media"]) === shown.mediaCount &&
      countOf(part["attachments"]) === shown.attachmentCount
    );
  });
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

const SITE_DOMAIN = "6529.io";

/**
 * The host a SIWE domain names, or null unless it is exactly one bare host
 * (no scheme, path, query, fragment, user info, whitespace or empty label),
 * so a value such as "evil.example/x.6529.io" can never pass for a 6529 host.
 */
function toExactHost(domain: string): string | null {
  const value = domain.toLowerCase();
  if (value.split(".").includes("")) {
    return null;
  }
  try {
    return new URL(`https://${value}`).host === value ? value : null;
  } catch {
    return null;
  }
}

/**
 * Grants count only when the wallet signed them on a 6529 site: 6529.io or
 * one of its subdomains (production, staging, previews), without a port, or
 * exactly the site this check runs on (local builds and mirrors).
 */
function isAllowedGrantDomain(domain: string): boolean {
  const host = toExactHost(domain);
  if (host === null) {
    return false;
  }
  const currentHost =
    typeof globalThis.location === "object"
      ? globalThis.location.host.toLowerCase()
      : "";
  // An exact host has no path, so a port would end it with ":<port>".
  return (
    host === SITE_DOMAIN ||
    host.endsWith(`.${SITE_DOMAIN}`) ||
    host === currentHost
  );
}

/** The grant message commits to exactly the key, scopes and expiry stored. */
const isGrantMessageConsistent = (grant: ApiDeviceGrantProof): boolean => {
  if (!same(hashMessage(grant.message), grant.id)) {
    return false;
  }
  const parsed = parseDeviceGrantMessage(grant.message);
  return (
    parsed !== null &&
    isAllowedGrantDomain(parsed.domain) &&
    same(parsed.domain, grant.domain) &&
    parsed.chainId === grant.chain_id &&
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
        if (
          !walletSignature ||
          !belongsToExpectedDrop(event, options.expected) ||
          !(await verifyEvent(event, grant))
        ) {
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
  if (options.expected && !same(data.drop_id, options.expected.dropId)) {
    return { status: "invalid" };
  }
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
  if (
    current &&
    options.displayed &&
    !matchesDisplayed(current.event, options.displayed)
  ) {
    // A valid signature over content other than what is shown proves nothing
    // about the shown content.
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
