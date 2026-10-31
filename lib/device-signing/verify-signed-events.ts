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
import { isAllowedGrantDomain, parseDeviceGrantMessage } from "./grant-message";
import {
  computeInterimEventId,
  DEVICE_EVENT_KIND_SCOPE,
  DeviceEventKind,
  ED25519_KEY_TYPE,
} from "./interim-event";

/**
 * How this browser verified the wallet's sign-in signature on a grant:
 * "verified": it recovers (ECDSA) to the wallet.
 * "contract-verified": the wallet has contract code on Ethereum and its
 * EIP-1271 check returned the magic value for this signature.
 */
export type WalletSignatureCheck = "verified" | "contract-verified";

/**
 * A grant's wallet signature: verified, "unverifiable" when only a contract
 * check on Ethereum could decide it and that check could not run, or null
 * when it is invalid.
 */
type GrantCheck = WalletSignatureCheck | "unverifiable" | null;

/**
 * Reads contract wallets on Ethereum mainnet. Each method throws when
 * Ethereum cannot be read, which makes the verdict "unverifiable".
 */
export interface ContractWalletReader {
  /** Whether the address has contract code. */
  readonly hasCode: (address: Hex) => Promise<boolean>;
  /**
   * The contract's EIP-1271 isValidSignature(hash, signature) result, or
   * null when the call reverts or returns no data.
   */
  readonly isValidSignature: (args: {
    readonly address: Hex;
    readonly hash: Hex;
    readonly signature: Hex;
  }) => Promise<Hex | null>;
}

const ETHEREUM_MAINNET_CHAIN_ID = 1;
/** bytes4(keccak256("isValidSignature(bytes32,bytes)")) */
const EIP1271_MAGIC_VALUE = "0x1626ba7e";

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
  /** Without it, a grant only a contract wallet could have signed is "unverifiable". */
  readonly contractWallets?: ContractWalletReader | undefined;
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
  /**
   * The signed events verify, but the grant's wallet signature needs a
   * contract-wallet check on Ethereum that could not run (no client, an
   * unreachable node or another chain). Never shown as signed.
   */
  | { readonly status: "unverifiable" }
  | {
      readonly status: "signed";
      readonly signature: VerifiedDropSignature;
      /** Whether the drop's current content is the signed version. */
      readonly currentContentSigned: boolean;
    };

interface VerifiedEvent {
  readonly event: ApiDeviceSignedEvent;
  readonly grant: ApiDeviceGrantProof;
  readonly walletSignature: WalletSignatureCheck | "unverifiable";
}

const CONTENT_KINDS: ReadonlySet<number> = new Set([
  DeviceEventKind.POST,
  DeviceEventKind.EDIT,
]);

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

/**
 * A signature that does not recover to the wallet is valid only if the
 * wallet is a contract on Ethereum whose EIP-1271 check accepts it. Without
 * code at the address it is invalid; when that cannot be read it is
 * "unverifiable", never trusted.
 */
async function checkContractWalletSignature(
  grant: ApiDeviceGrantProof,
  contractWallets: ContractWalletReader | undefined
): Promise<GrantCheck> {
  // Contract code is only read on Ethereum mainnet.
  if (!contractWallets || grant.chain_id !== ETHEREUM_MAINNET_CHAIN_ID) {
    return "unverifiable";
  }
  const address = grant.wallet as Hex;
  try {
    if (!(await contractWallets.hasCode(address))) {
      return null;
    }
    const result = await contractWallets.isValidSignature({
      address,
      hash: hashMessage(grant.message),
      signature: grant.wallet_signature as Hex,
    });
    return result !== null && same(result, EIP1271_MAGIC_VALUE)
      ? "contract-verified"
      : null;
  } catch {
    return "unverifiable";
  }
}

async function checkGrant(
  grant: ApiDeviceGrantProof,
  { contractWallets }: VerifyOptions
): Promise<GrantCheck> {
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
  // can have signed it.
  return await checkContractWalletSignature(grant, contractWallets);
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
  const grantChecks = new Map<string, Promise<GrantCheck>>();
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
  if (shown.walletSignature === "unverifiable") {
    return { status: "unverifiable" };
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
