/**
 * Signed records: device-signed interim events (D111 format, unchanged) of
 * the kinds the relays carry on per-person streams and inboxes. Every kind
 * signs under the `post` scope, which every device grant carries, so no
 * grant changes and no new wallet prompt.
 * @api
 */
export const RecordKind = {
  RECORD: 9,
  SEALED: 10,
  LOG: 11,
  DEL: 12,
} as const;

/** @api */
export type RecordKind = (typeof RecordKind)[keyof typeof RecordKind];

/** @api */
export const RECORD_GRANT_SCOPE = "post";

/**
 * Record types, sealed item types and SEALED labels.
 * @api
 */
export const RECORD_TYPE_PATTERN = /^[a-z0-9.-]{1,32}$/;
/** @api */
export const RECORD_KEY_MAX_BYTES = 200;

// A UTF-16 surrogate without its pair: not Unicode, not encodable as UTF-8.
const LONE_SURROGATE =
  /[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?<![\uD800-\uDBFF])[\uDC00-\uDFFF]/;

/**
 * Whether a string is well-formed Unicode (no lone surrogate).
 * @api
 */
export function isWellFormed(value: string): boolean {
  return !LONE_SURROGATE.test(value);
}
