/**
 * Result codes of 6529chain's Phase 1 error registry.
 *
 * Source: `design/phase1-operation-schemas.md` (proposal P40) §4.1-§4.2.
 * Only the codes this client produces or classifies are named here; any
 * other code still classifies by its range. Codes are consensus values;
 * messages are not (P40 §2.6).
 */

export const ChainResultCode = {
  OK: 0x0000,
  MALFORMED: 0x0101,
  TRAILING_BYTES: 0x0102,
  OVERSIZE: 0x0103,
  WRONG_NETWORK: 0x0104,
  UNKNOWN_SCHEMA: 0x0105,
  UNKNOWN_OP: 0x0106,
  UNKNOWN_VERSION: 0x0107,
  FIELD_BOUND: 0x0109,
  BAD_ENUM: 0x010a,
  BAD_TEXT: 0x010b,
  UNSORTED_SET: 0x010c,
  FIELD_RULE: 0x010d,
  HEADER_RULE: 0x010e,
  SIGNATURE_LIST: 0x010f,
  BAD_CID: 0x0111,
  BAD_SIGNATURE: 0x0201,
  NONCANONICAL_SIGNATURE: 0x0202,
  KEY_TYPE_NOT_ALLOWED: 0x0204,
  PRE_IDENTITY_OP: 0x020c,
  NONCE: 0x0301,
  NOT_YET_VALID: 0x0302,
  EXPIRED: 0x0303,
  VALIDITY_TOO_LONG: 0x0304,
  FEE_MODE_NOT_ALLOWED: 0x0309,
  WORK_TOO_HIGH: 0x030a,
  STALE_VERSION: 0x1001,
} as const;

export type ChainResultCodeName = keyof typeof ChainResultCode;

/** P40 §4.1 ranges, as the status ladder needs them (P41 §5.3 overlays). */
export type ChainResultClass =
  | "ok"
  | "inadmissible"
  | "mempool-policy"
  | "validator-message"
  | "failed"
  | "system-fault"
  | "unassigned";

export function classifyResultCode(code: number): ChainResultClass {
  if (code === ChainResultCode.OK) {
    return "ok";
  }
  if (code >= 0x0100 && code <= 0x037f) {
    return "inadmissible";
  }
  if (code >= 0x0380 && code <= 0x03ff) {
    return "mempool-policy";
  }
  if (code >= 0x0400 && code <= 0x04ff) {
    return "validator-message";
  }
  if (code >= 0x1000 && code <= 0x2eff) {
    return "failed";
  }
  if (code >= 0xf000 && code <= 0xffff) {
    return "system-fault";
  }
  return "unassigned";
}

/**
 * True for the codes a gateway returns when it refuses a transaction:
 * P41 §5.3's "Rejected" overlay is "every gateway returned an inadmissible
 * code (0x01xx-0x03xx)". Mempool-policy codes (0x0380-0x03FF) sit inside
 * that span, so they count as refusals too.
 */
export function isRefusalCode(code: number): boolean {
  return code >= 0x0100 && code <= 0x03ff;
}

/**
 * P40 §2.6: `detail = (f << 16) | i`. f is a body field number (1-63), a
 * header field as 0x100 + n, or 0x200 for the signature list; i is a
 * 1-based list item, or 0.
 */
export function resultDetail(field: number, item = 0): number {
  return ((field << 16) | item) >>> 0;
}

export const HEADER_FIELD_BASE = 0x100;
export const SIGNATURE_LIST_FIELD = 0x200;

/** A codec or schema-rule failure, carrying the P40 code it maps to. */
export class ChainCodecError extends Error {
  readonly code: number;
  readonly reason: string;
  readonly path: readonly (string | number)[];
  readonly detail: number;

  constructor(
    code: number,
    reason: string,
    path: readonly (string | number)[] = [],
    detail = 0
  ) {
    super(path.length > 0 ? `${reason} at ${path.join(".")}` : reason);
    this.name = "ChainCodecError";
    this.code = code;
    this.reason = reason;
    this.path = path;
    this.detail = detail;
  }

  /** The same failure with its location prefixed and a P40 detail set. */
  at(prefix: readonly (string | number)[], detail: number): ChainCodecError {
    return new ChainCodecError(
      this.code,
      this.reason,
      [...prefix, ...this.path],
      detail
    );
  }
}
