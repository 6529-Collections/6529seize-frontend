import { isIP } from "node:net";
import { NextResponse } from "next/server";

import { isForbiddenAddress } from "@/lib/security/urlGuard";

const DEFAULT_MAX_BUCKETS = 10_000;
const UNIDENTIFIED_CLIENT_KEY = "unidentified";
const UNIDENTIFIED_LIMIT_MULTIPLIER = 10;
const IPV4_MAPPED_IPV6_PREFIX = "::ffff:";
const IPV6_PREFIX_GROUPS = 4;
const IPV6_GROUPS = 8;

type RateLimitBucket = {
  count: number;
  readonly resetAt: number;
};

type ClientRateLimiterOptions = {
  /** Budget, in request cost units, for one client per window. */
  readonly limit: number;
  readonly windowMs: number;
  readonly errorMessage: string;
  readonly maxBuckets?: number | undefined;
};

function normaliseForwardedAddress(value: string | undefined): string | null {
  const address = value?.trim().toLowerCase() ?? "";
  if (address.startsWith(IPV4_MAPPED_IPV6_PREFIX)) {
    const mapped = address.slice(IPV4_MAPPED_IPV6_PREFIX.length);
    if (isIP(mapped) === 4) {
      return mapped;
    }
  }
  return isIP(address) === 0 ? null : address;
}

function toHexGroups(part: string): string[] {
  return part
    ? part.split(":").map((group) => Number.parseInt(group, 16).toString(16))
    : [];
}

/** One IPv6 subscriber usually controls a whole /64, so bucket by prefix. */
function getIpv6NetworkKey(address: string): string {
  const [head = "", tail] = address.split("::");
  const headGroups = toHexGroups(head);
  const tailGroups = toHexGroups(tail ?? "");
  const zeroGroups =
    tail === undefined
      ? []
      : Array.from(
          {
            length: Math.max(
              0,
              IPV6_GROUPS - headGroups.length - tailGroups.length
            ),
          },
          () => "0"
        );
  const prefix = [...headGroups, ...zeroGroups, ...tailGroups].slice(
    0,
    IPV6_PREFIX_GROUPS
  );
  return `${prefix.join(":")}::/64`;
}

/**
 * The load balancer appends the connecting client address to
 * X-Forwarded-For, and any proxy hop after it (such as nginx in front of
 * Node) appends its own private peer address. Client-supplied entries are
 * always to the left of the load balancer's, so walk from the right, skip
 * private infrastructure hops, and use the first public address.
 */
function getClientKey(headers: Headers): string | null {
  const entries = headers.get("x-forwarded-for")?.split(",") ?? [];
  for (let index = entries.length - 1; index >= 0; index -= 1) {
    const address = normaliseForwardedAddress(entries[index]);
    if (!address) {
      return null;
    }
    if (!isForbiddenAddress(address)) {
      return isIP(address) === 6 ? getIpv6NetworkKey(address) : address;
    }
  }
  return null;
}

/**
 * Fixed-window, per-client limiter held in this server process. Requests
 * without a public client address (local development, internal callers)
 * share one larger budget.
 */
export function createClientRateLimiter({
  limit,
  windowMs,
  errorMessage,
  maxBuckets = DEFAULT_MAX_BUCKETS,
}: ClientRateLimiterOptions) {
  const buckets = new Map<string, RateLimitBucket>();

  function pruneExpiredBuckets(now: number): void {
    // Buckets are inserted when their window opens, so the oldest come first.
    for (const [key, bucket] of buckets) {
      if (bucket.resetAt > now) {
        break;
      }
      buckets.delete(key);
    }
  }

  function openBucket(key: string, now: number): RateLimitBucket {
    buckets.delete(key);
    while (buckets.size >= maxBuckets) {
      const oldest = buckets.keys().next();
      if (oldest.done) {
        break;
      }
      buckets.delete(oldest.value);
    }
    const bucket: RateLimitBucket = { count: 0, resetAt: now + windowMs };
    buckets.set(key, bucket);
    return bucket;
  }

  return function enforceClientRateLimit(
    request: Pick<Request, "headers">,
    cost = 1
  ): NextResponse | null {
    const now = Date.now();
    pruneExpiredBuckets(now);

    const clientKey = getClientKey(request.headers);
    const key = clientKey ?? UNIDENTIFIED_CLIENT_KEY;
    const budget = clientKey ? limit : limit * UNIDENTIFIED_LIMIT_MULTIPLIER;
    const existing = buckets.get(key);
    const bucket =
      existing && existing.resetAt > now ? existing : openBucket(key, now);

    if (bucket.count + cost <= budget) {
      bucket.count += cost;
      return null;
    }

    const retryAfterSeconds = Math.max(
      1,
      Math.ceil((bucket.resetAt - now) / 1000)
    );
    return NextResponse.json(
      { error: errorMessage },
      {
        status: 429,
        headers: {
          "Cache-Control": "no-store",
          "Retry-After": retryAfterSeconds.toString(),
        },
      }
    );
  };
}
