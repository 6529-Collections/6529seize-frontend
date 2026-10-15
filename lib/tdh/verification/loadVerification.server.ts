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
 * Server-side loader for the public TDH verification files. Every page and
 * card renders each outcome explicitly:
 *
 * | Base URL | Environment | Result |
 * | Set      | Any         | fetched; `error` on failure |
 * | Unset    | Production  | `awaiting` (daily reports not started) |
 * | Unset    | Elsewhere   | `sample` (bundled, labelled sample data) |
 *
 * Production is decided by the app's host (6529.io), not by NODE_ENV,
 * because staging builds also run with NODE_ENV=production.
 */

export const INDEX_REVALIDATE_SECONDS = 600;
export const LATEST_DAY_REVALIDATE_SECONDS = 600;
export const OLDER_DAY_REVALIDATE_SECONDS = 3_600;
const FETCH_TIMEOUT_MS = 8_000;
const LOCAL_HOSTNAMES = new Set(["localhost", "127.0.0.1", "[::1]"]);

export type VerificationErrorReason = "config" | "network" | "http" | "invalid";

export type VerificationSource =
  | { readonly kind: "remote"; readonly base: URL }
  | { readonly kind: "sample" }
  | { readonly kind: "awaiting" }
  | { readonly kind: "invalid" };

export type IndexLoad =
  | {
      readonly status: "ok";
      readonly source: "remote";
      readonly index: VerificationIndex;
      readonly indexUrl: string;
      readonly baseUrl: string;
    }
  | {
      readonly status: "ok";
      readonly source: "sample";
      readonly index: VerificationIndex;
      readonly indexUrl: null;
      readonly baseUrl: null;
    }
  | { readonly status: "awaiting" }
  | { readonly status: "error"; readonly reason: VerificationErrorReason };

export type DayLoad =
  | {
      readonly status: "ok";
      readonly day: VerificationDay;
      readonly dayUrl: string | null;
    }
  | { readonly status: "not-found" }
  | { readonly status: "error"; readonly reason: VerificationErrorReason };

export interface VerificationLoaderOptions {
  readonly base: string | undefined;
  readonly isProduction: boolean;
  readonly fetchImpl?: typeof fetch;
  readonly loadSample?: () => Promise<{
    readonly index: VerificationIndex;
    readonly days: Readonly<Record<number, VerificationDay>>;
  }>;
}

export function resolveVerificationSource(
  base: string | undefined,
  isProduction: boolean
): VerificationSource {
  const trimmed = base?.trim() ?? "";
  if (trimmed.length === 0) {
    return isProduction ? { kind: "awaiting" } : { kind: "sample" };
  }
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

type FetchResult =
  | { readonly ok: true; readonly json: unknown }
  | {
      readonly ok: false;
      readonly reason: VerificationErrorReason;
      readonly status?: number;
    };

async function fetchJson(
  fetchImpl: typeof fetch,
  url: URL,
  revalidate: number
): Promise<FetchResult> {
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

async function loadBundledSample() {
  const sample = await import("./sampleData");
  return {
    index: sample.SAMPLE_VERIFICATION_INDEX,
    days: sample.SAMPLE_VERIFICATION_DAYS,
  };
}

export function createVerificationLoader(options: VerificationLoaderOptions) {
  const source = resolveVerificationSource(options.base, options.isProduction);
  const fetchImpl = options.fetchImpl ?? globalThis.fetch;
  const loadSample = options.loadSample ?? loadBundledSample;

  async function loadIndex(): Promise<IndexLoad> {
    if (source.kind === "awaiting") {
      return { status: "awaiting" };
    }
    if (source.kind === "invalid") {
      return { status: "error", reason: "config" };
    }
    if (source.kind === "sample") {
      const sample = await loadSample();
      return {
        status: "ok",
        source: "sample",
        index: sample.index,
        indexUrl: null,
        baseUrl: null,
      };
    }
    const url = new URL("index.json", source.base);
    const result = await fetchJson(fetchImpl, url, INDEX_REVALIDATE_SECONDS);
    if (!result.ok) {
      return { status: "error", reason: result.reason };
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
    if (source.kind === "awaiting") {
      return { status: "not-found" };
    }
    if (source.kind === "invalid") {
      return { status: "error", reason: "config" };
    }
    if (source.kind === "sample") {
      const sample = await loadSample();
      const day = sample.days[cycleDay];
      return day
        ? { status: "ok", day, dayUrl: null }
        : { status: "not-found" };
    }
    const url = new URL(`days/${cycleDay}.json`, source.base);
    const result = await fetchJson(fetchImpl, url, revalidate);
    if (!result.ok) {
      return result.status === 404
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
