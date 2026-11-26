import { keccak256, toBytes, type Hex } from "viem";
import { verifyEventIdSignature } from "@/lib/device-signing/ed25519";
import { computeInterimEventId } from "@/lib/device-signing/interim-event";
import { bytesToHexString } from "./relay-bytes";

/** CRP's SignedEvent: a record exactly as the orderer signed it. */
export interface RelaySignedEvent {
  readonly id: string;
  readonly kind: number;
  readonly kind_version: number;
  readonly wave: string;
  readonly author: string;
  readonly key_type: number;
  readonly device_key: string;
  readonly auth_ref: string;
  readonly seq: number;
  readonly anchor: number;
  readonly claimed_time: number;
  readonly refs: readonly string[];
  readonly body: string | null;
  readonly body_hash: string;
  readonly body_size: number;
  readonly signature: string;
}

/** One event as a relay serves it. */
export interface RelayItem {
  readonly rseq: number;
  readonly event: RelaySignedEvent;
}

const RecordKind = { RECORD: 9, SEALED: 10, LOG: 11, DEL: 12 } as const;

/** Whether the event is a DEL (kind 12): it removes records, it holds none. */
export function isDeletion(event: { readonly kind: number }): boolean {
  return event.kind === RecordKind.DEL;
}

/**
 * The event ids an orderer's DEL names (`{"ids": [...]}`); a malformed body
 * names none.
 */
export function deletedIdsOf(event: RelaySignedEvent): string[] {
  if (event.body === null) return [];
  const body = JSON.parse(event.body) as Record<string, unknown>;
  const ids = body["ids"];
  return Array.isArray(ids)
    ? ids
        .filter((id): id is string => typeof id === "string")
        .map((id) => id.toLowerCase())
    : [];
}

/** Where a record's content is: inline, or a payload by hash. */
interface ContentRef {
  readonly inline: Uint8Array | null;
  readonly payload: { readonly h: string; readonly n: number } | null;
  /** LOG records: the item's ciphertext, a payload the relays may drop. */
  readonly external: { readonly h: string; readonly n: number } | null;
}

const ZERO_HASH = `0x${"0".repeat(64)}`;

function isRef(value: unknown): value is { h: string; n: number } {
  const ref = value as { h?: unknown; n?: unknown } | null;
  return (
    typeof ref === "object" &&
    ref !== null &&
    typeof ref.h === "string" &&
    typeof ref.n === "number"
  );
}

function base64UrlToBytes(value: string): Uint8Array {
  const base64 = value.replaceAll("-", "+").replaceAll("_", "/");
  const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4);
  const binary = atob(padded);
  const out = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    out[index] = binary.codePointAt(index) ?? 0;
  }
  return out;
}

/**
 * True when the record is the orderer's, unaltered: its body hashes to
 * `body_hash`, its id recomputes, it names the pinned orderer key, and the
 * Ed25519 signature over the id verifies.
 */
export async function isOrdererRecord(
  event: RelaySignedEvent,
  ordererKey: string
): Promise<boolean> {
  if (event.device_key.toLowerCase() !== ordererKey.toLowerCase()) {
    return false;
  }
  if (event.body === null) {
    if (event.body_hash !== ZERO_HASH || event.body_size !== 0) return false;
  } else {
    const bytes = new TextEncoder().encode(event.body);
    if (
      keccak256(bytes) !== event.body_hash ||
      bytes.length !== event.body_size
    ) {
      return false;
    }
  }
  const id = computeInterimEventId({
    kind: event.kind,
    kindVersion: event.kind_version,
    wave: event.wave,
    author: event.author,
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
  if (id !== event.id) return false;
  return verifyEventIdSignature({
    publicKeyHex: event.device_key,
    eventId: event.id,
    signatureHex: event.signature,
  });
}

/** Where the content of a verified record is. Null for other kinds. */
export function contentRefOf(event: RelaySignedEvent): ContentRef | null {
  if (event.body === null) return null;
  const body = JSON.parse(event.body) as Record<string, unknown>;
  if (event.kind === RecordKind.LOG) {
    const ds = body["ds"];
    return {
      inline: typeof ds === "string" ? base64UrlToBytes(ds) : null,
      payload: isRef(ds) ? ds : null,
      external: isRef(body["data"]) ? body["data"] : null,
    };
  }
  if (event.kind === RecordKind.SEALED || event.kind === RecordKind.RECORD) {
    const c = body["c"];
    return {
      inline: typeof c === "string" ? base64UrlToBytes(c) : null,
      payload: isRef(body) ? { h: body.h, n: body.n } : null,
      external: null,
    };
  }
  return null;
}

/** SHA-256 of bytes as 0x-hex (content hashes and payload names). */
export async function sha256Hex(bytes: Uint8Array): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", bytes.slice().buffer);
  return bytesToHexString(new Uint8Array(digest));
}

/** A relay auth challenge's digest: the relays' tagged hash. */
export function relayAuthDigest(input: {
  readonly net: string;
  readonly relayId: string;
  readonly nonce: string;
  readonly grantId: string;
}): Hex {
  const word = (value: string) => toBytes(value as Hex, { size: 32 });
  const tag = keccak256(new TextEncoder().encode("6529.RelayAuth.v1"));
  const parts = [
    word(tag),
    word(keccak256(new TextEncoder().encode(input.net))),
    word(keccak256(new TextEncoder().encode(input.relayId))),
    word(input.nonce),
    word(input.grantId),
  ];
  const all = new Uint8Array(32 * parts.length);
  parts.forEach((part, index) => all.set(part, index * 32));
  return keccak256(all);
}
