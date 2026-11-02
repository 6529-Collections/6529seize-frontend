/**
 * Retry and failure-policy primitives for the postbuild sitemap step.
 *
 * The sitemap is generated after `next build` from live public API feeds. A
 * single slow or failed request used to fail the whole build. These helpers
 * retry each feed with jittered exponential backoff and then apply one of two
 * policies when a feed is still unavailable (or fails its sanity floor):
 *
 * - `fail`: stop the build. Used for production deploy builds so that a
 *   truncated sitemap is never published silently.
 * - `fallback`: skip only that section, emit the remaining sections, and print
 *   a loud warning. Used for pull-request and local builds.
 */

export type SitemapFailurePolicy = "fail" | "fallback";

/** The build environment, supplied by the caller at the build boundary. */
export type SitemapEnvironment = Readonly<Record<string, string | undefined>>;

export interface SitemapRetryOptions {
  readonly attempts?: number | undefined;
  readonly baseDelayMs?: number | undefined;
  readonly maxDelayMs?: number | undefined;
  readonly random?: (() => number) | undefined;
  readonly sleep?: ((ms: number) => Promise<void>) | undefined;
  readonly onRetry?: ((message: string) => void) | undefined;
}

interface SitemapSectionOptions {
  readonly policy: SitemapFailurePolicy;
  /** Optional sections are skipped with a warning even under `fail`. */
  readonly optional?: boolean | undefined;
  readonly retry?: SitemapRetryOptions | undefined;
  /** Progress messages, such as a retry being scheduled. */
  readonly log?: ((message: string) => void) | undefined;
  /** Loud messages, such as a section being skipped. */
  readonly warn?: ((message: string) => void) | undefined;
}

type SitemapSectionResult<T> =
  | {
      readonly name: string;
      readonly status: "loaded";
      readonly items: readonly T[];
    }
  | {
      readonly name: string;
      readonly status: "skipped";
      readonly items: readonly [];
      readonly reason: string;
    };

const DEFAULT_ATTEMPTS = 3;
const DEFAULT_BASE_DELAY_MS = 2_000;
const DEFAULT_MAX_DELAY_MS = 15_000;
const COMMIT_SHA_PATTERN = /^[0-9a-f]{40}$/iu;

const errorMessage = (error: unknown): string =>
  error instanceof Error ? error.message : String(error);

const defaultSleep = (ms: number): Promise<void> =>
  new Promise((resolve) => {
    setTimeout(resolve, ms);
  });

/**
 * Delay before retry number `retry` (1 = the first retry). Equal jitter keeps
 * at least half of the exponential delay so retries still back off while the
 * remainder is spread out.
 */
export function getSitemapRetryDelayMs(
  retry: number,
  options: SitemapRetryOptions = {}
): number {
  const base = options.baseDelayMs ?? DEFAULT_BASE_DELAY_MS;
  const max = options.maxDelayMs ?? DEFAULT_MAX_DELAY_MS;
  const random = options.random ?? Math.random;
  const ceiling = Math.min(max, base * 2 ** (retry - 1));
  return Math.round(ceiling / 2 + (ceiling / 2) * random());
}

/**
 * Runs `task`, retrying failures. Attempts are intentionally sequential: each
 * retry waits out its backoff before the next request, so it is written as a
 * recursive attempt function rather than a loop with awaits.
 */
export async function runSitemapTaskWithRetry<T>(
  label: string,
  task: () => Promise<T>,
  options: SitemapRetryOptions = {}
): Promise<T> {
  const attempts = Math.max(1, options.attempts ?? DEFAULT_ATTEMPTS);
  const sleep = options.sleep ?? defaultSleep;

  const attempt = async (number: number): Promise<T> => {
    try {
      return await task();
    } catch (error) {
      if (number >= attempts) {
        throw new Error(
          `Sitemap ${label} failed after ${attempts} attempt${
            attempts === 1 ? "" : "s"
          }: ${errorMessage(error)}`,
          { cause: error }
        );
      }
      const delayMs = getSitemapRetryDelayMs(number, options);
      options.onRetry?.(
        `${label} attempt ${number}/${attempts} failed (${errorMessage(
          error
        )}); retrying in ${delayMs} ms`
      );
      await sleep(delayMs);
      return attempt(number + 1);
    }
  };

  return attempt(1);
}

/**
 * Loads one sitemap section with retries. When it is still unavailable, the
 * `fail` policy rethrows (unless the section is optional) and the `fallback`
 * policy returns an empty, clearly marked "skipped" result.
 */
export async function loadSitemapSection<T>(
  name: string,
  load: () => Promise<readonly T[]>,
  options: SitemapSectionOptions
): Promise<SitemapSectionResult<T>> {
  try {
    const items = await runSitemapTaskWithRetry(name, load, {
      ...options.retry,
      onRetry: options.retry?.onRetry ?? options.log,
    });
    return { name, status: "loaded", items };
  } catch (error) {
    if (options.policy === "fail" && options.optional !== true) {
      throw error;
    }
    const reason = errorMessage(error);
    options.warn?.(
      `${name} section skipped, so the sitemap will not list it: ${reason}`
    );
    return { name, status: "skipped", items: [], reason };
  }
}

/**
 * Production deploy builds are the only builds whose sitemap is published. The
 * production artifact workflow sets `VERSION` to the exact 40-character commit
 * being built; pull-request and local builds do not. `SITEMAP_FAILURE_POLICY`
 * overrides the detection explicitly.
 */
export function resolveSitemapFailurePolicy(
  env: SitemapEnvironment
): SitemapFailurePolicy {
  const explicit = env["SITEMAP_FAILURE_POLICY"];
  if (explicit === "fail" || explicit === "fallback") {
    return explicit;
  }
  const isProductionDeployBuild =
    env["GITHUB_ACTIONS"] === "true" &&
    COMMIT_SHA_PATTERN.test(env["VERSION"] ?? "");
  return isProductionDeployBuild ? "fail" : "fallback";
}

const escapeWorkflowCommandData = (message: string): string =>
  message
    .replaceAll("%", "%25")
    .replaceAll("\r", "%0D")
    .replaceAll("\n", "%0A");

/** Prints a build-log warning, plus a GitHub Actions annotation in CI. */
export function emitSitemapWarning(
  message: string,
  env: SitemapEnvironment
): void {
  process.stderr.write(`[sitemap] WARNING: ${message}\n`);
  if (env["GITHUB_ACTIONS"] === "true") {
    process.stdout.write(
      `::warning title=Sitemap generation::${escapeWorkflowCommandData(
        message
      )}\n`
    );
  }
}
