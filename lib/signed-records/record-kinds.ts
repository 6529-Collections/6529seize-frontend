/**
 * Signed records: device-signed interim events (D111 format, unchanged) of
 * the kinds the relays carry on per-person streams and inboxes. Every kind
 * signs under the `post` scope, which every device grant carries, so no
 * grant changes and no new wallet prompt.
 */
export const RecordKind = {
  RECORD: 9,
  SEALED: 10,
  LOG: 11,
  DEL: 12,
} as const;

export type RecordKind = (typeof RecordKind)[keyof typeof RecordKind];

export const RECORD_GRANT_SCOPE = "post";

/** Record types, sealed item types and SEALED labels. */
export const RECORD_TYPE_PATTERN = /^[a-z0-9.-]{1,32}$/;
export const RECORD_KEY_MAX_BYTES = 200;
