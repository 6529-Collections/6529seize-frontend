import { getWalletAddress } from "@/services/auth/auth.utils";
import { canonicalizeBody } from "@/lib/device-signing/canonical-json";
import { allocateDeviceSeq } from "@/lib/device-signing/device-key-store";
import { isEd25519Supported, signEventId } from "@/lib/device-signing/ed25519";
import { isOwnProfileSession } from "@/lib/device-signing/own-profile-session";
import { withinTimeBudget } from "@/lib/device-signing/time-budget";
import {
  computeRecordEventId,
  RECORD_KEY_TYPE,
  RECORD_KIND_VERSION,
  type SignedRecordEvent,
} from "./record-event";
import { familyWave } from "./record-families";
import {
  isWellFormed,
  RECORD_GRANT_SCOPE,
  RECORD_KEY_MAX_BYTES,
  RECORD_TYPE_PATTERN,
  RecordKind,
} from "./record-kinds";
import { toBase64Url } from "./sealed-crypto";

/**
 * What a caller asks to sign: the kind, stream, refs and body.
 * @api
 */
export interface RecordDraft {
  readonly kind: RecordKind;
  readonly wave: string;
  readonly refs: readonly string[];
  readonly body: object | null;
}

/**
 * A RECORD (kind 9): refs [type] or [type, key]; a null body unsets the key.
 * @api
 */
export function recordDraft(
  family: "ps" | "pv",
  owner: string,
  type: string,
  key: string | null,
  body: object | null
): RecordDraft {
  if (!RECORD_TYPE_PATTERN.test(type)) {
    throw new Error(`Invalid record type: ${type}`);
  }
  if (key !== null && !isWellFormed(key)) {
    throw new Error("Record key is not well-formed Unicode");
  }
  if (
    key !== null &&
    new TextEncoder().encode(key).length > RECORD_KEY_MAX_BYTES
  ) {
    throw new Error("Record key is too long");
  }
  return {
    kind: RecordKind.RECORD,
    wave: familyWave(family, owner),
    refs: key === null ? [type] : [type, key],
    body,
  };
}

/**
 * A SEALED (kind 10) draft from the `c` bytes of sealed-crypto.
 * @api
 */
export function sealedDraft(
  wave: string,
  label: string,
  bytes: Uint8Array
): RecordDraft {
  if (!RECORD_TYPE_PATTERN.test(label)) {
    throw new Error(`Invalid sealed label: ${label}`);
  }
  return {
    kind: RecordKind.SEALED,
    wave,
    refs: [label],
    body: { c: toBase64Url(bytes), v: 1 },
  };
}

/**
 * A SEALED (kind 10) reference to a payload stored apart: its sha256 and
 * size (at most 4 MiB). Upload the payload with the same principal's
 * session that writes this record.
 * @api
 */
export function payloadDraft(
  wave: string,
  label: string,
  sha256: string,
  size: number
): RecordDraft {
  if (!RECORD_TYPE_PATTERN.test(label)) {
    throw new Error(`Invalid sealed label: ${label}`);
  }
  if (
    !/^0x[0-9a-f]{64}$/.test(sha256) ||
    !Number.isSafeInteger(size) ||
    size < 1 ||
    size > 4 * 1024 * 1024
  ) {
    throw new Error("A payload is a sha256 and 1 byte to 4 MiB");
  }
  return {
    kind: RecordKind.SEALED,
    wave,
    refs: [label],
    body: { h: sha256, n: size, v: 1 },
  };
}

/** @api */
export interface SignRecordsOptions {
  /** A finalized chain height, from the anchor source drops use. */
  readonly anchor: number;
  /**
   * The earliest claimed time, Unix ms: a change signed again must be
   * ordered after a newer one the API already holds from another device.
   */
  readonly notBefore?: number | undefined;
  readonly signal?: AbortSignal | undefined;
}

/** @api */
export type SignRecordsResult =
  | {
      readonly status: "signed";
      readonly events: SignedRecordEvent[];
      readonly grantId: string;
    }
  /** No wallet, no usable grant, a proxy session, or no Ed25519. */
  | { readonly status: "no-grant" }
  | {
      readonly status: "failed";
      readonly reason: "timeout" | "aborted" | "crypto-error";
    };

/** Matches sign-write's budget for a drop's signature. */
const SIGNING_BUDGET_MS = 10_000;

type Attempt =
  | {
      readonly status: "signed";
      readonly events: SignedRecordEvent[];
      readonly grantId: string;
    }
  | { readonly status: "no-grant" };

async function signAll(
  address: string,
  drafts: readonly RecordDraft[],
  options: SignRecordsOptions
): Promise<Attempt> {
  if (!(await isEd25519Supported())) {
    return { status: "no-grant" };
  }
  const events: SignedRecordEvent[] = [];
  let grantId: string | null = null;
  // Claimed times rise through the batch, so its records order as drafted
  // even when the batch goes out in several submits.
  let earliest = options.notBefore ?? 0;
  for (const draft of drafts) {
    if (options.signal?.aborted) {
      throw new DOMException("Signing was cancelled", "AbortError");
    }
    // One sequence number per record, persisted before it is signed.
    const allocation = await allocateDeviceSeq(address, Date.now());
    if (
      !allocation ||
      !allocation.grant.scopes.includes(RECORD_GRANT_SCOPE) ||
      !isOwnProfileSession(address, allocation.record.ownProfileId)
    ) {
      return { status: "no-grant" };
    }
    const { grant, record, seq } = allocation;
    if (grantId !== null && grantId !== grant.id) {
      // The grant changed between records; sign the batch again.
      return { status: "no-grant" };
    }
    grantId = grant.id;
    const { canonical, bodyHash, bodySize } = canonicalizeBody(draft.body);
    const fields = {
      kind: draft.kind,
      kind_version: RECORD_KIND_VERSION,
      wave: draft.wave,
      author: grant.wallet.toLowerCase(),
      key_type: RECORD_KEY_TYPE,
      device_key: grant.device_key.toLowerCase(),
      auth_ref: grant.id.toLowerCase(),
      seq,
      anchor: options.anchor,
      claimed_time: Math.max(Date.now(), earliest),
      refs: [...draft.refs],
      body: canonical,
      body_hash: bodyHash,
      body_size: bodySize,
    };
    earliest = fields.claimed_time + 1;
    const id = computeRecordEventId(fields);
    const signature = await signEventId(record.keyPair.privateKey, id);
    events.push({ ...fields, id, signature });
  }
  return grantId === null
    ? { status: "no-grant" }
    : { status: "signed", events, grantId };
}

/**
 * Signs each draft with this browser's device key under its grant, so the
 * person sees no wallet prompt. Records are always signed: there is no
 * unsigned fallback. The retry prompt and the "turn on signing" grant flow
 * belong to the call sites, which word their own action.
 * @api
 */
export async function signRecords(
  drafts: readonly RecordDraft[],
  options: SignRecordsOptions
): Promise<SignRecordsResult> {
  if (drafts.length === 0) {
    throw new Error("Nothing to sign");
  }
  if (!Number.isSafeInteger(options.anchor) || options.anchor <= 0) {
    throw new Error("Records need a finalized chain height as their anchor");
  }
  if (
    options.notBefore !== undefined &&
    !Number.isSafeInteger(options.notBefore)
  ) {
    throw new Error("notBefore is a time in whole milliseconds");
  }
  const address = getWalletAddress();
  if (!address) {
    return { status: "no-grant" };
  }
  try {
    const attempt = await withinTimeBudget(
      signAll(address.toLowerCase(), drafts, options),
      SIGNING_BUDGET_MS
    );
    return attempt ?? { status: "failed", reason: "timeout" };
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      return { status: "failed", reason: "aborted" };
    }
    return { status: "failed", reason: "crypto-error" };
  }
}
