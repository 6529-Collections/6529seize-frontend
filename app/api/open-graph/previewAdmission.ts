import { NextResponse } from "next/server";

import {
  AdmissionQueue,
  AdmissionQueueError,
} from "@/lib/fetch/admissionQueue";
import { createClientRateLimiter } from "@/lib/security/clientRateLimit";

/**
 * Fair-use bounds shared by the link-preview routes (`/api/open-graph` and
 * `/api/farcaster`), which fetch caller-chosen URLs in the page-rendering
 * process.
 *
 * Per client address: one address can carry many people (an office, an
 * event's Wi-Fi), and the process-wide caps below already bound server
 * cost, so this budget only keeps one address from taking the whole queue.
 * Every URL counts, cached or not, so the budget is the same however a caller
 * groups its URLs.
 */
const PREVIEW_URLS_PER_CLIENT_WINDOW = 1200;
const PREVIEW_CLIENT_WINDOW_MS = 60 * 1000;

/**
 * Per process: at most 32 previews fetch at once (each reads at most 1 MiB of
 * HTML), and up to 256 more wait for a slot for at most 10 s. Beyond that the
 * caller is asked to retry shortly. A generic page fetch has an 8 s deadline,
 * so wait plus fetch stays inside the browser client's 20 s timeout.
 *
 * The caller's abort signal applies only while it waits for a slot. Admitted
 * work runs to its own deadlines and its result is cached, so a viewer who
 * scrolls away still warms the preview for the next one.
 */
const PREVIEW_FETCH_CONCURRENCY = 32;
const PREVIEW_FETCH_MAX_PENDING = 256;
const PREVIEW_FETCH_WAIT_MS = 10 * 1000;
const PREVIEW_BUSY_RETRY_AFTER_SECONDS = 5;

/** Bytes of a preview page read for metadata; the rest is not downloaded. */
export const PREVIEW_HTML_MAX_BYTES = 1024 * 1024;

export const PREVIEW_BUSY_MESSAGE =
  "Link previews are busy. Try again shortly.";

export const PREVIEW_CLIENT_LIMIT_MESSAGE = "Too many link preview requests";

/** Charges one unit per requested URL; returns a 429 response when over. */
export const enforcePreviewClientLimit = createClientRateLimiter({
  limit: PREVIEW_URLS_PER_CLIENT_WINDOW,
  windowMs: PREVIEW_CLIENT_WINDOW_MS,
  errorMessage: PREVIEW_CLIENT_LIMIT_MESSAGE,
});

/**
 * Charges as many of `requested` URLs as the client's remaining budget
 * covers. Returns how many were charged, and the 429 answer when none were.
 */
export function chargePreviewUrls(
  request: Pick<Request, "headers">,
  requested: number
): { readonly allowed: number; readonly limited: NextResponse | null } {
  let limited: NextResponse | null = null;
  for (let count = requested; count >= 1; count -= 1) {
    limited = enforcePreviewClientLimit(request, count);
    if (!limited) {
      return { allowed: count, limited: null };
    }
  }
  return { allowed: 0, limited };
}

const previewFetchAdmission = new AdmissionQueue({
  concurrency: PREVIEW_FETCH_CONCURRENCY,
  maxPending: PREVIEW_FETCH_MAX_PENDING,
  waitMs: PREVIEW_FETCH_WAIT_MS,
});

/**
 * Runs outbound preview work in one of the process-wide fetch slots. Rejects
 * with an AdmissionQueueError when no slot frees up in time, or when the
 * caller goes away while waiting.
 */
export async function withPreviewFetchSlot<T>(
  signal: AbortSignal | undefined,
  work: () => Promise<T>
): Promise<T> {
  const release = await previewFetchAdmission.acquire(signal);
  try {
    return await work();
  } finally {
    release();
  }
}

export const isPreviewBusyError = (
  error: unknown
): error is AdmissionQueueError => error instanceof AdmissionQueueError;

export const PREVIEW_BUSY_HEADERS: Readonly<Record<string, string>> = {
  "Cache-Control": "no-store",
  "Retry-After": String(PREVIEW_BUSY_RETRY_AFTER_SECONDS),
};

/** The answer when no fetch slot was available. */
export function previewBusyResponse(): NextResponse {
  return NextResponse.json(
    { error: PREVIEW_BUSY_MESSAGE },
    { status: 503, headers: PREVIEW_BUSY_HEADERS }
  );
}
