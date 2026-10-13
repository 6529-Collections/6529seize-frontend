import { isIP } from "node:net";
import { NextResponse } from "next/server";

import { isForbiddenAddress } from "@/lib/security/urlGuard";

const DEFAULT_MAX_BUCKETS = 10_000;
const UNIDENTIFIED_CLIENT_KEY = "unidentified";
const UNIDENTIFIED_LIMIT_MULTIPLIER = 10;
const IPV6_GROUPS = 8;
const IPV6_PREFIX_GROUPS = 4;
const IPV6_GROUP_PATTERN = /^[\da-f]{1,4}$/;

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

type ForwardedAddress = {
  /** The address to classify as public or private. */
  readonly address: string;
  /** The rate-limit bucket key for this address. */
  readonly key: string;
};

/** Replaces a dotted IPv4 tail (as in `::ffff:1.2.3.4`) with two hex groups. */
function expandEmbeddedIpv4(address: string): string | null {
  const tailStart = address.lastIndexOf(":") + 1;
  const tail = address.slice(tailStart);
  if (!tail.includes(".")) {
    return address;
  }
  if (isIP(tail) !== 4) {
    return null;
  }
  const [a = 0, b = 0, c = 0, d = 0] = tail.split(".").map(Number);
  const high = ((a << 8) | b).toString(16);
  const low = ((c << 8) | d).toString(16);
  return `${address.slice(0, tailStart)}${high}:${low}`;
}

/** Expands an IPv6 address to its eight 16-bit groups, or null if malformed. */
function parseIpv6Groups(address: string): number[] | null {
  const expanded = expandEmbeddedIpv4(address);
  const halves = expanded?.split("::");
  if (!halves || halves.length > 2) {
    return null;
  }
  const [head = "", tail = ""] = halves;
  const headGroups = head ? head.split(":") : [];
  const tailGroups = tail ? tail.split(":") : [];
  const missingGroups = IPV6_GROUPS - headGroups.length - tailGroups.length;
  const isCompressed = halves.length === 2;
  if (isCompressed ? missingGroups < 1 : missingGroups !== 0) {
    return null;
  }
  const groups = [
    ...headGroups,
    ...Array.from({ length: isCompressed ? missingGroups : 0 }, () => "0"),
    ...tailGroups,
  ];
  if (!groups.every((group) => IPV6_GROUP_PATTERN.test(group))) {
    return null;
  }
  return groups.map((group) => Number.parseInt(group, 16));
}

function isIpv4MappedIpv6(groups: readonly number[]): boolean {
  return (
    groups.slice(0, 5).every((group) => group === 0) && groups[5] === 0xffff
  );
}

function toDottedIpv4(high: number, low: number): string {
  return [high >> 8, high & 0xff, low >> 8, low & 0xff].join(".");
}

function parseForwardedAddress(
  value: string | undefined
): ForwardedAddress | null {
  const address = value?.trim().toLowerCase() ?? "";
  const family = isIP(address);
  if (family === 4) {
    return { address, key: address };
  }
  if (family !== 6) {
    return null;
  }
  const groups = parseIpv6Groups(address);
  if (!groups) {
    return null;
  }
  if (isIpv4MappedIpv6(groups)) {
    const ipv4 = toDottedIpv4(groups[6] ?? 0, groups[7] ?? 0);
    return { address: ipv4, key: ipv4 };
  }
  // Classify the uncompressed form, and bucket by /64 because one IPv6
  // subscriber usually controls a whole /64.
  const canonical = groups.map((group) => group.toString(16));
  return {
    address: canonical.join(":"),
    key: `${canonical.slice(0, IPV6_PREFIX_GROUPS).join(":")}::/64`,
  };
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
    const forwarded = parseForwardedAddress(entries[index]);
    if (!forwarded) {
      return null;
    }
    if (!isForbiddenAddress(forwarded.address)) {
      return forwarded.key;
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
