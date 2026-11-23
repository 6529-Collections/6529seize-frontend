import type { ApiSignedRecordsAnchor } from "@/generated/models/ApiSignedRecordsAnchor";
import { commonApiFetch } from "@/services/api/common-api";

/**
 * How long one answer serves later writes. A record may anchor up to
 * `maxAnchorLag` heights behind the finalized head: 120 heights, about one
 * hour of 30-second slots (P61 slotMs). A minute-old anchor is always
 * taken, and a burst of writes asks once.
 */
const ANCHOR_REUSE_MS = 60_000;

/** @api */
export interface RecordAnchor {
  /** The finalized height to sign as the record's anchor. */
  readonly anchor: number;
  /** The finalized block's slot start, Unix ms. */
  readonly finalizedTime: number;
  /** How many heights behind the finalized head the API still takes. */
  readonly maxAnchorLag: number;
}

let cached: { readonly value: RecordAnchor; readonly at: number } | null = null;
let inFlight: Promise<RecordAnchor> | null = null;

/**
 * The height to sign as a record's anchor, from GET /signed-records/anchor.
 * Throws when the API has no anchor (503 while the chain gateway is down);
 * the caller tries the write again later and never signs a guessed height.
 * `fresh` asks the API again, for a record that must be ordered after one
 * signed elsewhere since the last answer.
 * @api
 */
export async function fetchRecordAnchor(
  now: number = Date.now(),
  { fresh = false }: { readonly fresh?: boolean } = {}
): Promise<RecordAnchor> {
  if (
    !fresh &&
    cached &&
    now - cached.at >= 0 &&
    now - cached.at < ANCHOR_REUSE_MS
  ) {
    return cached.value;
  }
  if (inFlight && !fresh) {
    return inFlight;
  }
  const request: Promise<RecordAnchor> = requestAnchor()
    .then((value) => {
      // An older request can finish after a fresh one: never go back to a
      // lower height.
      if (!cached || value.anchor >= cached.value.anchor) {
        cached = { value, at: now };
      }
      return value;
    })
    .finally(() => {
      if (inFlight === request) {
        inFlight = null;
      }
    });
  inFlight = request;
  return request;
}

async function requestAnchor(): Promise<RecordAnchor> {
  const response = await commonApiFetch<ApiSignedRecordsAnchor>({
    endpoint: "signed-records/anchor",
    includeWalletAuth: false,
    cache: "no-store",
    errorMode: "structured",
  });
  const anchor = response.anchor;
  if (!Number.isSafeInteger(anchor) || anchor <= 0) {
    throw new Error("The API answered without a finalized anchor height");
  }
  return {
    anchor,
    finalizedTime: response.finalized_time,
    maxAnchorLag: response.max_anchor_lag,
  };
}

/** Tests only: forget the last answer. */
export function resetRecordAnchorForTests(): void {
  cached = null;
  inFlight = null;
}
