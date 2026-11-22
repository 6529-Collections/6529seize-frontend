import type { Hex } from "viem";
import {
  computeInterimEventId,
  ED25519_KEY_TYPE,
  INTERIM_EVENT_KIND_VERSION,
} from "@/lib/device-signing/interim-event";
import type { RecordKind } from "./record-kinds";

/** A signed record on the wire: the relays' SignedEvent, field for field. */
export interface SignedRecordEvent {
  readonly id: string;
  readonly kind: RecordKind;
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
  /** The canonical JSON exactly as hashed; null when there is no body. */
  readonly body: string | null;
  readonly body_hash: string;
  readonly body_size: number;
  readonly signature: string;
}

export const RECORD_KIND_VERSION = INTERIM_EVENT_KIND_VERSION;
export const RECORD_KEY_TYPE = ED25519_KEY_TYPE;

/** The EIP-712 digest of a record's signed fields (its event id). */
export function computeRecordEventId(
  event: Omit<SignedRecordEvent, "id" | "signature">
): Hex {
  return computeInterimEventId({
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
}

export const SIGNED_RECORDS_HEADER = "x-6529-signed-records";

/** base64url of the UTF-8 JSON array, for the `x-6529-signed-records` header. */
export function encodeSignedRecordsHeader(
  events: readonly SignedRecordEvent[]
): string {
  const bytes = new TextEncoder().encode(JSON.stringify(events));
  let binary = "";
  for (const byte of bytes) {
    binary += String.fromCodePoint(byte);
  }
  return btoa(binary)
    .replaceAll("+", "-")
    .replaceAll("/", "_")
    .replace(/=+$/, "");
}
