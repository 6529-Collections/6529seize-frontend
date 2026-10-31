import { createHash } from "node:crypto";
import { cache } from "react";
import { getAppEnvironment } from "@/config/appEnvironment";
import { publicEnv } from "@/config/env";
import { resolveVerificationSource } from "./feedSource";
import {
  parseVerificationDay,
  parseVerificationIndex,
  type VerificationDay,
  type VerificationIndex,
} from "./schema";

/**
 * Server-side loader for the public TDH feed: 6529's daily comparison files
 * (`index.json`, `days/{cycleDay}.json`). Every page and card renders each
 * outcome explicitly:
 *
 * | Feed                              | Result                          |
 * | Index published, at least one day | `ok`                            |
 * | Index 403 or 404, or no days      | `awaiting` (no report yet)      |
 * | Any other failure                 | `error`, with its reason        |
 *
 * The base URL is `NEXT_PUBLIC_TDH_VERIFICATION_BASE` when it is set, and
 * otherwise 6529's public feed, so every environment shows the published
 * reports and nothing else: there is no bundled or sample data.
 *
 * The feed is served by CloudFront from a private bucket (Origin Access
 * Control), which answers 403, not 404, for a file that does not exist yet.
 * Both mean "not yet published": a missing index is `awaiting`, a missing day
 * `not-found`.
 */

const INDEX_REVALIDATE_SECONDS = 600;
export const LATEST_DAY_REVALIDATE_SECONDS = 600;
export const OLDER_DAY_REVALIDATE_SECONDS = 3_600;
/** The Lean proof manifest changes only with a new build of the model. */
export const FORMAL_MANIFEST_REVALIDATE_SECONDS = 3_600;
const FETCH_TIMEOUT_MS = 8_000;
/** What the feed answers for a file it does not hold (yet). */
const NOT_PUBLISHED_STATUSES = new Set([403, 404]);

/** Whether an HTTP status from the feed means "not yet published". */
export function isNotPublishedStatus(status: number | undefined): boolean {
  return status !== undefined && NOT_PUBLISHED_STATUSES.has(status);
}

type VerificationErrorReason = "config" | "network" | "http" | "invalid";

type IndexLoad =
  | {
      readonly status: "ok";
      readonly source: "remote";
      readonly index: VerificationIndex;
      readonly indexUrl: string;
      readonly baseUrl: string;
    }
  | { readonly status: "awaiting" }
  | { readonly status: "error"; readonly reason: VerificationErrorReason };

type DayLoad =
  | {
      readonly status: "ok";
      readonly day: VerificationDay;
      readonly dayUrl: string;
      /** SHA-256 of the day file's bytes; null when they were not read. */
      readonly sha256: string | null;
      /**
       * The file exactly as read, for a browser to hash again (a day's
       * receipt); null when its bytes were not read as text.
       */
      readonly text: string | null;
    }
  | { readonly status: "not-found" }
  | { readonly status: "error"; readonly reason: VerificationErrorReason };

interface VerificationLoaderOptions {
  readonly base: string | undefined;
  readonly isProduction: boolean;
  readonly fetchImpl?: typeof fetch;
}

type FeedFetchResult =
  | {
      readonly ok: true;
      readonly json: unknown;
      /** SHA-256 of the body's bytes; null when they could not be read. */
      readonly sha256: string | null;
      /** The body as text that encodes back to the same bytes, or null. */
      readonly text: string | null;
    }
  | {
      readonly ok: false;
      readonly reason: VerificationErrorReason;
      readonly status?: number;
    };

/**
 * The bytes as UTF-8 text that encodes back to exactly these bytes (a
 * byte-order mark kept), so a browser can hash the file a page was built
 * from; null when they are not valid UTF-8.
 */
function exactText(bytes: Uint8Array): string | null {
  try {
    return new TextDecoder("utf-8", { fatal: true, ignoreBOM: true }).decode(
      bytes
    );
  } catch {
    return null;
  }
}

export async function fetchFeedJson(
  fetchImpl: typeof fetch,
  url: URL,
  revalidate: number
): Promise<FeedFetchResult> {
  let response: Response;
  try {
    response = await fetchImpl(url.toString(), {
      headers: { accept: "application/json" },
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      next: { revalidate },
    } as RequestInit);
  } catch {
    return { ok: false, reason: "network" };
  }
  if (!response.ok) {
    return { ok: false, reason: "http", status: response.status };
  }
  try {
    // Read the bytes once: they are both parsed and hashed, so a day's page
    // can show the SHA-256 of exactly the file it was built from.
    if (typeof response.arrayBuffer === "function") {
      const bytes = new Uint8Array(await response.arrayBuffer());
      return {
        ok: true,
        json: JSON.parse(new TextDecoder().decode(bytes)) as unknown,
        sha256: createHash("sha256").update(bytes).digest("hex"),
        text: exactText(bytes),
      };
    }
    return {
      ok: true,
      json: (await response.json()) as unknown,
      sha256: null,
      text: null,
    };
  } catch {
    return { ok: false, reason: "invalid" };
  }
}

export function createVerificationLoader(options: VerificationLoaderOptions) {
  const source = resolveVerificationSource(options.base, options.isProduction);
  const fetchImpl = options.fetchImpl ?? globalThis.fetch;

  async function loadIndex(): Promise<IndexLoad> {
    if (source.kind === "invalid") {
      return { status: "error", reason: "config" };
    }
    const url = new URL("index.json", source.base);
    const result = await fetchFeedJson(
      fetchImpl,
      url,
      INDEX_REVALIDATE_SECONDS
    );
    if (!result.ok) {
      return isNotPublishedStatus(result.status)
        ? { status: "awaiting" }
        : { status: "error", reason: result.reason };
    }
    const parsed = parseVerificationIndex(result.json);
    if (!parsed.success) {
      return { status: "error", reason: "invalid" };
    }
    if (parsed.data.days.length === 0) {
      return { status: "awaiting" };
    }
    return {
      status: "ok",
      source: "remote",
      index: parsed.data,
      indexUrl: url.toString(),
      baseUrl: source.base.toString(),
    };
  }

  async function loadDay(
    cycleDay: number,
    revalidate: number = OLDER_DAY_REVALIDATE_SECONDS
  ): Promise<DayLoad> {
    if (!Number.isSafeInteger(cycleDay) || cycleDay <= 0) {
      return { status: "not-found" };
    }
    if (source.kind === "invalid") {
      return { status: "error", reason: "config" };
    }
    const url = new URL(`days/${cycleDay}.json`, source.base);
    const result = await fetchFeedJson(fetchImpl, url, revalidate);
    if (!result.ok) {
      return isNotPublishedStatus(result.status)
        ? { status: "not-found" }
        : { status: "error", reason: result.reason };
    }
    const parsed = parseVerificationDay(result.json);
    if (!parsed.success || parsed.data.cycleDay !== cycleDay) {
      return { status: "error", reason: "invalid" };
    }
    return {
      status: "ok",
      day: parsed.data,
      dayUrl: url.toString(),
      sha256: result.sha256,
      text: result.text,
    };
  }

  return { source, loadIndex, loadDay };
}

function environmentLoader() {
  return createVerificationLoader({
    base: publicEnv.NEXT_PUBLIC_TDH_VERIFICATION_BASE,
    isProduction: getAppEnvironment(publicEnv.BASE_ENDPOINT).isProduction,
  });
}

/** The index, deduplicated within one server render. */
export const loadVerificationIndex = cache(
  (): Promise<IndexLoad> => environmentLoader().loadIndex()
);

/** One day's file, deduplicated within one server render. */
export const loadVerificationDay = cache(
  (cycleDay: number, revalidate?: number): Promise<DayLoad> =>
    environmentLoader().loadDay(cycleDay, revalidate)
);
