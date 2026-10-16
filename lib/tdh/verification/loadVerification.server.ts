import { cache } from "react";
import { getAppEnvironment } from "@/config/appEnvironment";
import { publicEnv } from "@/config/env";
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

/** 6529's public TDH feed, written by the daily comparison job (D132). */
export const PUBLIC_TDH_FEED_BASE = "https://d379duzqnomz3w.cloudfront.net/";

const INDEX_REVALIDATE_SECONDS = 600;
export const LATEST_DAY_REVALIDATE_SECONDS = 600;
export const OLDER_DAY_REVALIDATE_SECONDS = 3_600;
/** The Lean proof manifest changes only with a new build of the model. */
export const FORMAL_MANIFEST_REVALIDATE_SECONDS = 3_600;
const FETCH_TIMEOUT_MS = 8_000;
const LOCAL_HOSTNAMES = new Set(["localhost", "127.0.0.1", "[::1]"]);
/** What the feed answers for a file it does not hold (yet). */
const NOT_PUBLISHED_STATUSES = new Set([403, 404]);

/** Whether an HTTP status from the feed means "not yet published". */
export function isNotPublishedStatus(status: number | undefined): boolean {
  return status !== undefined && NOT_PUBLISHED_STATUSES.has(status);
}

export type VerificationErrorReason = "config" | "network" | "http" | "invalid";

type VerificationSource =
  | { readonly kind: "remote"; readonly base: URL }
  | { readonly kind: "invalid" };

export type IndexLoad =
  | {
      readonly status: "ok";
      readonly source: "remote";
      readonly index: VerificationIndex;
      readonly indexUrl: string;
      readonly baseUrl: string;
    }
  | { readonly status: "awaiting" }
  | { readonly status: "error"; readonly reason: VerificationErrorReason };

export type DayLoad =
  | {
      readonly status: "ok";
      readonly day: VerificationDay;
      readonly dayUrl: string;
    }
  | { readonly status: "not-found" }
  | { readonly status: "error"; readonly reason: VerificationErrorReason };

interface VerificationLoaderOptions {
  readonly base: string | undefined;
  readonly isProduction: boolean;
  readonly fetchImpl?: typeof fetch;
}

export function resolveVerificationSource(
  base: string | undefined,
  isProduction: boolean
): VerificationSource {
  const configured = base?.trim() ?? "";
  const trimmed = configured.length === 0 ? PUBLIC_TDH_FEED_BASE : configured;
  let url: URL;
  try {
    url = new URL(trimmed);
  } catch {
    return { kind: "invalid" };
  }
  const isLocalHttp =
    url.protocol === "http:" && LOCAL_HOSTNAMES.has(url.hostname);
  if (url.protocol !== "https:" && !(isLocalHttp && !isProduction)) {
    return { kind: "invalid" };
  }
  if (url.username || url.password || url.search || url.hash) {
    return { kind: "invalid" };
  }
  if (!url.pathname.endsWith("/")) {
    url.pathname = `${url.pathname}/`;
  }
  return { kind: "remote", base: url };
}

type FeedFetchResult =
  | { readonly ok: true; readonly json: unknown }
  | {
      readonly ok: false;
      readonly reason: VerificationErrorReason;
      readonly status?: number;
    };

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
    return { ok: true, json: (await response.json()) as unknown };
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
    return { status: "ok", day: parsed.data, dayUrl: url.toString() };
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
