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
import {
  computeAppGrantId,
  isAppGrantMessage,
  parseAppGrantMessage,
  recoverAppGrantSigner,
} from "./app-grant";
import { verifyEventIdSignature } from "./ed25519";
import { isAllowedGrantDomain, parseDeviceGrantMessage } from "./grant-message";
import { isRecognizedAppGrantOrigin } from "./grant-origins";
import {
  computeInterimEventId,
  DEVICE_EVENT_KIND_SCOPE,
  DeviceEventKind,
  ED25519_KEY_TYPE,
} from "./interim-event";

/**
 * How this browser verified the wallet's signature on a grant (sign-in or app):
 * "verified": it recovers (ECDSA) to the wallet.
 * "contract-verified": the wallet has contract code on Ethereum and its
 * EIP-1271 check returned the magic value for this signature.
 */
export type WalletSignatureCheck = "verified" | "contract-verified";

/**
 * A grant's wallet signature: verified, "unverifiable" when only a contract
 * check on Ethereum could decide it and that check could not run,
 * "unrecognized-origin" for a valid app grant signed for an origin no 6529
 * client produces, or null when it is invalid.
 */
type GrantCheck =
  | WalletSignatureCheck
  | "unverifiable"
  | "unrecognized-origin"
  | null;

/**
 * Grant checks shared by verifications that run without a contract-wallet
 * reader, so a wallet signature many posts share is recovered once.
 */
export type GrantCheckCache = Map<string, Promise<GrantCheck>>;

const MAX_CACHED_GRANT_CHECKS = 200;

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

/** A drop part another drop points at (a reply target or a quote). */
interface DisplayedDropRef {
  readonly dropId: string;
  readonly partId: number;
}

/**
 * What the reader is shown for the drop, compared with the signed body.
 * Media is identified by its URL (the server stores the signed URL and binds
 * an upload id to it), attachments by their ids. The server does not keep
 * the order media and attachments were signed in, so both are compared as
 * sets; parts are matched by their part id.
 */
interface DisplayedDropContent {
  readonly title: string | null;
  /** The drop this one replies to, when the reader is shown one. */
  readonly replyToDropId: string | null;
  readonly parts: readonly {
    /** 1-based: the signed body's parts[partId - 1]. */
    readonly partId: number;
    readonly content: string | null;
    /** The quoted drop part, when the reader is shown one. */
    readonly quote: DisplayedDropRef | null;
    readonly media: readonly {
      readonly url: string;
      readonly uploadId: string | null;
    }[];
    readonly attachmentIds: readonly string[];
  }[];
  /**
   * The drop's part count when only its first parts are shown (some lists
   * load one part); null when every part is shown.
   */
  readonly totalParts: number | null;
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
  /** Shares grant checks across verifications (ignored with a contract reader). */
  readonly grantCheckCache?: GrantCheckCache | undefined;
}

const belongsToExpectedDrop = (
  event: ApiDeviceSignedEvent,
  expected: ExpectedDrop | undefined
): boolean =>
  expected === undefined ||
  (same(event.wave, expected.waveId) &&
    expected.authorWallets.some((wallet) => same(wallet, event.author)));

const listOf = (value: unknown): readonly unknown[] =>
  Array.isArray(value) ? value : [];

type DisplayableDrop = Pick<ApiDrop, "title" | "parts"> &
  Partial<Pick<ApiDrop, "reply_to" | "parts_count">>;

/** Some read paths omit a part's media or attachments. */
const listOrEmpty = <T>(list: readonly T[] | undefined): readonly T[] =>
  list ?? [];

const toDisplayedRef = (
  ref: { readonly drop_id: string; readonly drop_part_id: number } | null
): DisplayedDropRef | null =>
  ref ? { dropId: ref.drop_id, partId: ref.drop_part_id } : null;

export const toDisplayedDropContent = (
  drop: DisplayableDrop
): DisplayedDropContent => ({
  title: drop.title ?? null,
  replyToDropId: drop.reply_to?.drop_id ?? null,
  parts: drop.parts.map((part, index) => ({
    partId: typeof part.part_id === "number" ? part.part_id : index + 1,
    content: part.content ?? null,
    quote: toDisplayedRef(part.quoted_drop ?? null),
    media: listOrEmpty(part.media).map((media) => ({
      url: media.url,
      uploadId: media.media_upload_id ?? null,
    })),
    attachmentIds: listOrEmpty(part.attachments).map(
      (attachment) => attachment.attachment_id
    ),
  })),
  totalParts:
    typeof drop.parts_count === "number" && drop.parts_count > drop.parts.length
      ? drop.parts_count
      : null,
});

const asText = (value: unknown): string =>
  typeof value === "string" ? value : "";

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

/** A signed `{ drop_id, drop_part_id }`, or null. */
function readSignedRef(value: unknown): DisplayedDropRef | null {
  if (!isRecord(value)) {
    return null;
  }
  const dropId = value["drop_id"];
  const partId = value["drop_part_id"];
  return typeof dropId === "string" && typeof partId === "number"
    ? { dropId, partId }
    : null;
}

/** A quote shown must be the one signed; a part shown without one shows nothing unsigned. */
const matchesShownQuote = (
  signed: unknown,
  shown: DisplayedDropRef | null
): boolean => {
  if (shown === null) {
    return true;
  }
  const quote = readSignedRef(signed);
  return (
    quote !== null &&
    same(quote.dropId, shown.dropId) &&
    quote.partId === shown.partId
  );
};

interface MediaIdentity {
  readonly url: string;
  readonly uploadId: string | null;
}

const compareText = (left: string, right: string): number =>
  left < right ? -1 : Number(left > right);

const byIdentity = (left: MediaIdentity, right: MediaIdentity): number =>
  compareText(left.url, right.url) ||
  compareText(left.uploadId ?? "", right.uploadId ?? "");

/** Signed media as identities, or null when one is malformed. */
function readSignedMedia(signed: readonly unknown[]): MediaIdentity[] | null {
  const media: MediaIdentity[] = [];
  for (const item of signed) {
    if (!isRecord(item) || typeof item["url"] !== "string") {
      return null;
    }
    const uploadId = item["media_upload_id"];
    media.push({
      url: item["url"],
      uploadId: typeof uploadId === "string" ? uploadId : null,
    });
  }
  return media;
}

/**
 * The same media, in any order (the server does not keep the signed
 * order); an upload id is compared when both sides name one.
 */
function matchesShownMedia(
  signed: readonly unknown[],
  shown: readonly MediaIdentity[]
): boolean {
  const signedMedia = readSignedMedia(signed);
  if (signedMedia?.length !== shown.length) {
    return false;
  }
  signedMedia.sort(byIdentity);
  const shownMedia = [...shown].sort(byIdentity);
  return signedMedia.every((media, index) => {
    const item = shownMedia[index];
    return (
      item?.url === media.url &&
      (media.uploadId === null ||
        item.uploadId === null ||
        media.uploadId === item.uploadId)
    );
  });
}

/** The same attachments, in any order. */
function matchesShownAttachments(
  signed: readonly unknown[],
  shown: readonly string[]
): boolean {
  const signedIds: string[] = [];
  for (const attachment of signed) {
    const id = isRecord(attachment) ? attachment["attachment_id"] : undefined;
    if (typeof id !== "string") {
      return false;
    }
    signedIds.push(id);
  }
  if (signedIds.length !== shown.length) {
    return false;
  }
  const shownIds = [...shown].sort(compareText);
  return signedIds
    .sort(compareText)
    .every((id, index) => id === shownIds[index]);
}

const matchesShownPart = (
  part: unknown,
  shown: DisplayedDropContent["parts"][number] | undefined
): boolean =>
  shown !== undefined &&
  isRecord(part) &&
  asText(part["content"]) === asText(shown.content) &&
  matchesShownQuote(part["quoted_drop"], shown.quote) &&
  matchesShownMedia(listOf(part["media"]), shown.media) &&
  matchesShownAttachments(listOf(part["attachments"]), shown.attachmentIds);

/** "partial": what is shown matches, but not every part of the post is shown. */
type DisplayedMatch = "match" | "partial" | "mismatch";

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

/**
 * How the parts shown compare with the signed parts: every part shown must
 * be the signed part with its part id. When fewer parts are loaded than the
 * post has, what is shown matches but the whole post was not compared
 * ("partial"), so it is reported neither as signed nor as a mismatch.
 */
function compareShownParts(
  signedParts: readonly unknown[],
  displayed: DisplayedDropContent
): DisplayedMatch {
  const partIds = new Set(displayed.parts.map((part) => part.partId));
  const everyShownPartSigned =
    partIds.size === displayed.parts.length &&
    displayed.parts.every((shown) =>
      matchesShownPart(signedParts[shown.partId - 1], shown)
    );
  if (!everyShownPartSigned) {
    return "mismatch";
  }
  if (
    displayed.totalParts !== null &&
    signedParts.length !== displayed.totalParts
  ) {
    // 6529.io says the post has another number of parts than was signed.
    return "mismatch";
  }
  return displayed.parts.length < signedParts.length ? "partial" : "match";
}

/** The reply target a post's body signs, or null for a post that is not a reply. */
const signedReplyTarget = (body: Record<string, unknown>): string | null =>
  readSignedRef(body["reply_to"])?.dropId ?? null;

/**
 * Whether the signed post or edit body is what the reader is shown. A
 * post's body signs its reply target; an edit's does not, so an edited drop
 * shows its reply target against the original post when that is signed.
 */
function compareDisplayed(
  event: ApiDeviceSignedEvent,
  displayed: DisplayedDropContent,
  replyTarget: string | null | undefined
): DisplayedMatch {
  const body = parseSignedBody(event);
  if (!isRecord(body) || asText(body["title"]) !== asText(displayed.title)) {
    return "mismatch";
  }
  const signedTarget =
    event.kind === DeviceEventKind.POST ? signedReplyTarget(body) : replyTarget;
  // A reply target shown must be the signed one. One left out (a deleted
  // target, for example) shows nothing unsigned.
  const replyMatches =
    displayed.replyToDropId === null ||
    signedTarget === undefined ||
    (signedTarget !== null && same(signedTarget, displayed.replyToDropId));
  return replyMatches
    ? compareShownParts(listOf(body["parts"]), displayed)
    : "mismatch";
}

/**
 * The event's refs name what it acts on: a post its reply target (exactly
 * what its body signs), an edit the drop being shown.
 */
function hasConsistentRefs(
  event: ApiDeviceSignedEvent,
  expected: ExpectedDrop | undefined
): boolean {
  if (event.kind === DeviceEventKind.EDIT) {
    return (
      expected === undefined ||
      (event.refs.length === 1 && same(event.refs[0] ?? "", expected.dropId))
    );
  }
  const body = parseSignedBody(event);
  const target = isRecord(body) ? signedReplyTarget(body) : null;
  return target === null
    ? event.refs.length === 0
    : event.refs.length === 1 && same(event.refs[0] ?? "", target);
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
  /** Where the device was authorized: a site host or a 6529 app's name. */
  readonly origin: string;
}

export type DropSignatureVerdict =
  | { readonly status: "unsigned" }
  | { readonly status: "invalid" }
  /**
   * The signed events verify, but the grant's wallet signature needs a
   * contract-wallet check on Ethereum that could not run (no client, an
   * unreachable node or another chain), or the device was authorized from
   * an origin no 6529 client produces (`unrecognizedOrigin`). Never shown as
   * signed.
   */
  | { readonly status: "unverifiable"; readonly unrecognizedOrigin?: string }
  | {
      readonly status: "signed";
      readonly signature: VerifiedDropSignature;
      /** Whether the drop's current content is the signed version. */
      readonly currentContentSigned: boolean;
    };

interface VerifiedEvent {
  readonly event: ApiDeviceSignedEvent;
  readonly grant: ApiDeviceGrantProof;
  readonly walletSignature: Exclude<GrantCheck, null>;
}

const CONTENT_KINDS: ReadonlySet<number> = new Set([
  DeviceEventKind.POST,
  DeviceEventKind.EDIT,
]);

/**
 * An app grant (6529 Mobile or Desktop, EIP-712) commits to exactly the
 * stored terms; its id is the typed-data digest. Its origin is what the
 * wallet was shown, a site host or an app's name, and is checked against the
 * recognized origins once the signature is known to be valid.
 */
const isAppGrantConsistent = (grant: ApiDeviceGrantProof): boolean => {
  const parsed = parseAppGrantMessage(grant.message);
  if (parsed === null) {
    return false;
  }
  const { fields } = parsed;
  return (
    same(computeAppGrantId(parsed.message), grant.id) &&
    fields.origin === grant.domain &&
    grant.chain_id === ETHEREUM_MAINNET_CHAIN_ID &&
    same(fields.wallet, grant.wallet) &&
    same(fields.deviceKeyHex, grant.device_key) &&
    fields.scopes.join(",") === grant.scopes.join(",") &&
    fields.expiresAtSeconds * 1000 === grant.expires_at
  );
};

/** The grant message commits to exactly the key, scopes and expiry stored. */
const isGrantMessageConsistent = (grant: ApiDeviceGrantProof): boolean => {
  if (isAppGrantMessage(grant.message)) {
    return isAppGrantConsistent(grant);
  }
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
  if (isAppGrantMessage(grant.message)) {
    const parsed = parseAppGrantMessage(grant.message);
    const signer = parsed
      ? await recoverAppGrantSigner(parsed.message, grant.wallet_signature)
      : null;
    return signer !== null && same(signer, grant.wallet);
  }
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
      // An app grant's id is its EIP-712 digest (checked as consistent).
      hash: isAppGrantMessage(grant.message)
        ? (grant.id as Hex)
        : hashMessage(grant.message),
      signature: grant.wallet_signature as Hex,
    });
    return result !== null && same(result, EIP1271_MAGIC_VALUE)
      ? "contract-verified"
      : null;
  } catch {
    return "unverifiable";
  }
}

/**
 * A valid app grant signed for an origin no 6529 client produces is never
 * reported as verified. Sign-in grants name an allowed host or are invalid.
 */
const withRecognizedOrigin = (
  grant: ApiDeviceGrantProof,
  check: GrantCheck
): GrantCheck =>
  check !== null &&
  isAppGrantMessage(grant.message) &&
  !isRecognizedAppGrantOrigin(grant.domain)
    ? "unrecognized-origin"
    : check;

async function checkGrant(
  grant: ApiDeviceGrantProof,
  options: VerifyOptions
): Promise<GrantCheck> {
  return withRecognizedOrigin(grant, await checkGrantSignature(grant, options));
}

async function checkGrantSignature(
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

/** Everything checkGrant reads, so a cached check is only reused for the same grant. */
const grantCheckKey = (grant: ApiDeviceGrantProof): string =>
  JSON.stringify([
    grant.id.toLowerCase(),
    grant.message,
    grant.wallet_signature,
    grant.chain_id,
    grant.wallet,
    grant.device_key,
    grant.scopes,
    grant.domain,
    grant.expires_at,
  ]);

/**
 * One check per grant in this verification. Without a contract-wallet
 * reader (whose answers can change), checks are also shared through
 * `grantCheckCache`.
 */
function grantCheckFor(
  grant: ApiDeviceGrantProof,
  options: VerifyOptions,
  local: Map<string, Promise<GrantCheck>>
): Promise<GrantCheck> {
  const key = grantCheckKey(grant);
  const shared = options.contractWallets ? undefined : options.grantCheckCache;
  const known = local.get(key) ?? shared?.get(key);
  if (known) {
    local.set(key, known);
    return known;
  }
  const check = checkGrant(grant, options);
  local.set(key, check);
  if (shared) {
    if (shared.size >= MAX_CACHED_GRANT_CHECKS) {
      shared.clear();
    }
    shared.set(key, check);
  }
  return check;
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
        const grant = grants.get(event.auth_ref.toLowerCase());
        if (!grant) {
          return null;
        }
        const walletSignature = await grantCheckFor(
          grant,
          options,
          grantChecks
        );
        if (
          !walletSignature ||
          !belongsToExpectedDrop(event, options.expected) ||
          !hasConsistentRefs(event, options.expected) ||
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
  const shownMatch =
    current && options.displayed
      ? compareDisplayed(
          current.event,
          options.displayed,
          originalReplyTarget(verified)
        )
      : "match";
  if (shownMatch === "mismatch") {
    // A valid signature over content other than what is shown proves nothing
    // about the shown content.
    return { status: "invalid" };
  }
  if (shownMatch === "partial") {
    // Only some of the post's parts are loaded here: nothing is wrong, but
    // the post as a whole was not compared.
    return { status: "unverifiable" };
  }
  const shown = current ?? verified.at(-1);
  if (!shown) {
    return { status: "invalid" };
  }
  if (shown.walletSignature === "unverifiable") {
    return { status: "unverifiable" };
  }
  if (shown.walletSignature === "unrecognized-origin") {
    return { status: "unverifiable", unrecognizedOrigin: shown.grant.domain };
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
      origin: shown.grant.domain,
    },
  };
}

/**
 * The reply target the drop's original post signs (null: not a reply), or
 * undefined when no verified post is among the events, as for a drop posted
 * unsigned and edited signed.
 */
function originalReplyTarget(
  verified: readonly VerifiedEvent[]
): string | null | undefined {
  const post = verified.find(
    ({ event }) => event.kind === DeviceEventKind.POST
  );
  if (!post) {
    return undefined;
  }
  const body = parseSignedBody(post.event);
  return isRecord(body) ? signedReplyTarget(body) : null;
}
