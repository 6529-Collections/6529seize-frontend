import { getAppEnvironment } from "@/config/appEnvironment";
import LruTtlCache from "@/lib/cache/lruTtl";
import { discardResponse } from "@/lib/fetch/fetchDeadline";

/**
 * `unavailable` means the API gave no definitive answer (timeout, network
 * error, 5xx or another unexpected status). The gate fails closed on it.
 */
type AccessVerdict = "allow" | "unauthorized" | "restricted" | "unavailable";

// staging.6529.io and personal <slug>staging.6529.io hosts (see dev-setup/).
const STAGING_HOSTNAME_PATTERN = /^[a-z0-9-]*staging\.6529\.io$/;
const ACCESS_PROBE_TIMEOUT_MS = 1500;
const ACCESS_VERDICT_TTL_MS = 60_000;
const ACCESS_VERDICT_CACHE_MAX_ENTRIES = 500;
// Longer x-6529-auth values are still probed, just never cached or shared.
const MAX_CACHEABLE_AUTH_VALUE_LENGTH = 256;
const UNAVAILABLE_LOG_INTERVAL_MS = 60_000;

const verdictCache = new LruTtlCache<string, AccessVerdict>({
  max: ACCESS_VERDICT_CACHE_MAX_ENTRIES,
  ttlMs: ACCESS_VERDICT_TTL_MS,
});
const inFlightProbes = new Map<string, Promise<AccessVerdict>>();
let lastUnavailableLogAt = Number.NEGATIVE_INFINITY;

/**
 * True when the build's baked `BASE_ENDPOINT` is a staging host. Request
 * headers such as `Host` never take part, so they cannot switch the gate off.
 */
export function isStagingDeployment(baseEndpoint: string): boolean {
  return STAGING_HOSTNAME_PATTERN.test(
    getAppEnvironment(baseEndpoint).hostname
  );
}

/**
 * The probe forwards only `x-6529-auth`, so that value is the whole per-visitor
 * input to the API's decision and serves directly as the in-process cache key.
 * It is not hashed: the process already holds these values (request
 * cookies), the map never leaves memory, and a hash or HMAC here is modelled
 * by code scanning as weak password hashing. Capping the length bounds
 * memory; overlong values are not cached.
 */
function getVerdictCacheKey(authValue: string): string | undefined {
  return authValue.length <= MAX_CACHEABLE_AUTH_VALUE_LENGTH
    ? authValue
    : undefined;
}

function classifyStatus(status: number): AccessVerdict {
  if (status === 401) {
    return "unauthorized";
  }
  if (status === 403) {
    return "restricted";
  }
  return status >= 200 && status < 300 ? "allow" : "unavailable";
}

function logUnavailable(reason: string): void {
  const now = Date.now();
  if (now - lastUnavailableLogAt < UNAVAILABLE_LOG_INTERVAL_MS) {
    return;
  }
  lastUnavailableLogAt = now;
  console.warn(`[proxy] staging access probe unavailable (${reason})`);
}

async function runAccessProbe(
  apiEndpoint: string,
  authValue: string,
  cacheKey: string | undefined
): Promise<AccessVerdict> {
  let response: Response;
  try {
    response = await fetch(`${apiEndpoint}/api/`, {
      headers: { "x-6529-auth": authValue },
      signal: AbortSignal.timeout(ACCESS_PROBE_TIMEOUT_MS),
    });
  } catch (error: unknown) {
    logUnavailable(error instanceof Error ? error.name : "request error");
    return "unavailable";
  }

  discardResponse(response);
  const verdict = classifyStatus(response.status);
  if (verdict === "unavailable") {
    logUnavailable(`status ${response.status}`);
  } else if (cacheKey !== undefined) {
    verdictCache.set(cacheKey, verdict);
  }
  return verdict;
}

/**
 * Resolves the staging access verdict for one `x-6529-auth` value.
 *
 * Definitive answers (2xx, 401, 403) are cached briefly, and concurrent
 * requests for the same value share one probe. Anything else is
 * `unavailable` and is never cached. Overlong values skip the cache.
 */
export function getAccessVerdict({
  apiEndpoint,
  authValue,
}: {
  readonly apiEndpoint: string;
  readonly authValue: string;
}): Promise<AccessVerdict> {
  const cacheKey = getVerdictCacheKey(authValue);
  if (cacheKey === undefined) {
    return runAccessProbe(apiEndpoint, authValue, undefined);
  }

  const cached = verdictCache.get(cacheKey);
  if (cached) {
    return Promise.resolve(cached);
  }

  const inFlight = inFlightProbes.get(cacheKey);
  if (inFlight) {
    return inFlight;
  }

  const probe = runAccessProbe(apiEndpoint, authValue, cacheKey).finally(() => {
    inFlightProbes.delete(cacheKey);
  });
  inFlightProbes.set(cacheKey, probe);
  return probe;
}
