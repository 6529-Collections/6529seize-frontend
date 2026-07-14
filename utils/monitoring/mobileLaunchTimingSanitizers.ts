const WALLET_ADDRESS_PATTERN = /^0x[a-fA-F0-9]{40}$/;
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const LONG_HEX_PATTERN = /^[a-fA-F0-9]{32,}$/;
const LONG_TOKEN_PATTERN = /^[A-Za-z0-9_-]{24,}$/;
const NUMERIC_PATTERN = /^\d+$/;

const IDENTIFIER_PARENT_SEGMENTS = new Set([
  "account",
  "accounts",
  "address",
  "addresses",
  "collection",
  "collections",
  "contract",
  "contracts",
  "delegation",
  "delegations",
  "drop",
  "drops",
  "group",
  "groups",
  "handle",
  "handles",
  "identity",
  "identities",
  "profile",
  "profiles",
  "proxy",
  "proxies",
  "token",
  "tokens",
  "user",
  "users",
  "wallet",
  "wallets",
  "wave",
  "waves",
]);

const STATIC_ACTION_SEGMENTS = new Set([
  "activity",
  "auth",
  "bulk",
  "create",
  "delete",
  "distribution",
  "feed",
  "followers",
  "following",
  "groups",
  "health",
  "latest",
  "list",
  "login",
  "metrics",
  "nonce",
  "notifications",
  "proxies",
  "query",
  "rank",
  "reactions",
  "read",
  "recent",
  "search",
  "stats",
  "subscriptions",
  "unread",
  "update",
  "votes",
  "waves",
]);

const STATIC_TOP_LEVEL_ROUTE_SEGMENTS = new Set([
  "6529-gradient",
  "about",
  "accept-connection-sharing",
  "access",
  "api",
  "author",
  "blog",
  "buidl",
  "capital",
  "casabatllo",
  "category",
  "cdn-cgi",
  "city",
  "consolidation-mapping-tool",
  "delegation",
  "delegation-mapping-tool",
  "discover",
  "dispute-resolution",
  "drop-forge",
  "education",
  "element_category",
  "email-signatures",
  "emma",
  "error",
  "feed",
  "gm-or-die-small-mp4",
  "join",
  "join-6529",
  "meme-accounting",
  "meme-calendar",
  "meme-gas",
  "meme-lab",
  "messages",
  "museum",
  "network",
  "news",
  "nextgen",
  "nft-activity",
  "notifications",
  "om",
  "open-data",
  "open-mobile",
  "rememes",
  "restricted",
  "sentry-example-page",
  "slide-page",
  "the-memes",
  "tools",
  "waves",
  "xtdh",
]);

const USER_ROUTE_TAB_SEGMENTS = new Set([
  "brain",
  "collected",
  "curations",
  "followers",
  "groups",
  "identity",
  "proxy",
  "subscriptions",
  "waves",
  "xtdh",
]);

const STATIC_ABOUT_SECTION_SEGMENTS = new Set([
  "100m-project",
  "media",
  "mission",
  "open-metaverse",
  "press",
  "rules",
]);

const STATIC_MESSAGES_SEGMENTS = new Set(["create"]);
const STATIC_WAVES_SEGMENTS = new Set(["create"]);
const STATIC_APP_WALLETS_SEGMENTS = new Set(["import-wallet"]);
const STATIC_REMEMES_SEGMENTS = new Set(["add"]);
const STATIC_THE_MEMES_SEGMENTS = new Set(["mint"]);
const STATIC_MEME_LAB_SEGMENTS = new Set(["collection"]);
const STATIC_NEXTGEN_SEGMENTS = new Set(["collection", "manager", "token"]);

type RoutePatternSegment =
  | string
  | {
      readonly kind: "param";
      readonly excludedValues?: ReadonlySet<string>;
    }
  | {
      readonly kind: "catchAll";
      readonly optional: boolean;
      readonly excludedValues?: ReadonlySet<string>;
    };

type RouteFamilyPattern = {
  readonly template: string;
  readonly segments: readonly RoutePatternSegment[];
};

// Keep route_family aligned with App Router templates instead of raw params.
const ROUTE_FAMILY_PATTERNS: readonly RouteFamilyPattern[] = [
  {
    template: "/messages/[wave]",
    segments: ["messages", routeParam(STATIC_MESSAGES_SEGMENTS)],
  },
  {
    template: "/waves/[wave]",
    segments: ["waves", routeParam(STATIC_WAVES_SEGMENTS)],
  },
  {
    template: "/tools/app-wallets/[app-wallet-address]",
    segments: ["tools", "app-wallets", routeParam(STATIC_APP_WALLETS_SEGMENTS)],
  },
  {
    template: "/drop-forge/craft/[id]",
    segments: ["drop-forge", "craft", routeParam()],
  },
  {
    template: "/drop-forge/launch/[id]",
    segments: ["drop-forge", "launch", routeParam()],
  },
  {
    template: "/rememes/[contract]/[id]",
    segments: ["rememes", routeParam(STATIC_REMEMES_SEGMENTS), routeParam()],
  },
  {
    template: "/the-memes/[id]/distribution",
    segments: [
      "the-memes",
      routeParam(STATIC_THE_MEMES_SEGMENTS),
      "distribution",
    ],
  },
  {
    template: "/the-memes/[id]",
    segments: ["the-memes", routeParam(STATIC_THE_MEMES_SEGMENTS)],
  },
  {
    template: "/meme-lab/collection/[collection]",
    segments: ["meme-lab", "collection", routeParam()],
  },
  {
    template: "/meme-lab/[id]/distribution",
    segments: [
      "meme-lab",
      routeParam(STATIC_MEME_LAB_SEGMENTS),
      "distribution",
    ],
  },
  {
    template: "/meme-lab/[id]",
    segments: ["meme-lab", routeParam(STATIC_MEME_LAB_SEGMENTS)],
  },
  {
    template: "/nextgen/collection/[collection]/art",
    segments: ["nextgen", "collection", routeParam(), "art"],
  },
  {
    template: "/nextgen/collection/[collection]/distribution-plan",
    segments: ["nextgen", "collection", routeParam(), "distribution-plan"],
  },
  {
    template: "/nextgen/collection/[collection]/mint",
    segments: ["nextgen", "collection", routeParam(), "mint"],
  },
  {
    template: "/nextgen/collection/[collection]/trait-sets",
    segments: ["nextgen", "collection", routeParam(), "trait-sets"],
  },
  {
    template: "/nextgen/collection/[collection]/[[...view]]",
    segments: ["nextgen", "collection", routeParam(), routeCatchAll(true)],
  },
  {
    template: "/nextgen/token/[token]/[[...view]]",
    segments: ["nextgen", "token", routeParam(), routeCatchAll(true)],
  },
  {
    template: "/nextgen/[[...view]]",
    segments: ["nextgen", routeCatchAll(true, STATIC_NEXTGEN_SEGMENTS)],
  },
  {
    template: "/delegation/[...section]",
    segments: ["delegation", routeCatchAll(false)],
  },
  {
    template: "/network/nerd/[[...focus]]",
    segments: ["network", "nerd", routeCatchAll(true)],
  },
  {
    template: "/about/[section]",
    segments: ["about", routeParam(STATIC_ABOUT_SECTION_SEGMENTS)],
  },
  {
    template: "/6529-gradient/[id]",
    segments: ["6529-gradient", routeParam()],
  },
  {
    template: "/emma/plans/[id]",
    segments: ["emma", "plans", routeParam()],
  },
];

export function sanitizeEndpointGroup(endpoint: string): string {
  return sanitizePathLikeValue(endpoint);
}

export function sanitizeRouteFamily(route: string): string {
  return getAppRouteFamilyTemplate(route) ?? sanitizePathLikeValue(route);
}

function sanitizePathLikeValue(value: string): string {
  const path = extractPathWithoutQuery(value);
  const segments = path
    .split("/")
    .map((segment) => segment.trim())
    .filter(Boolean);

  if (segments.length === 0) {
    return "/";
  }

  const safeSegments = segments.map((segment, index) =>
    sanitizePathSegment(
      index > 0
        ? {
            segment,
            previousSegment: segments[index - 1] ?? "",
          }
        : {
            segment,
          }
    )
  );

  return `/${safeSegments.join("/")}`;
}

function getAppRouteFamilyTemplate(route: string): string | undefined {
  const segments = getRouteSegments(route);

  if (segments.length === 0) {
    return undefined;
  }

  const matchingPattern = ROUTE_FAMILY_PATTERNS.find((pattern) =>
    matchesRouteFamilyPattern(pattern, segments)
  );

  return matchingPattern?.template ?? getUserRouteTemplate(segments);
}

function getRouteSegments(route: string): string[] {
  return extractPathWithoutQuery(route)
    .split("/")
    .map((segment) => safeDecodeURIComponent(segment.trim()).toLowerCase())
    .filter(Boolean);
}

function getUserRouteTemplate(segments: readonly string[]): string | undefined {
  if (STATIC_TOP_LEVEL_ROUTE_SEGMENTS.has(segments[0] ?? "")) {
    return undefined;
  }

  if (segments.length === 1) {
    return "/[user]";
  }

  if (segments.length === 2 && USER_ROUTE_TAB_SEGMENTS.has(segments[1] ?? "")) {
    return `/[user]/${segments[1]}`;
  }

  return undefined;
}

function matchesRouteFamilyPattern(
  pattern: RouteFamilyPattern,
  segments: readonly string[]
): boolean {
  let segmentIndex = 0;

  for (const patternSegment of pattern.segments) {
    if (typeof patternSegment === "string") {
      if (segments[segmentIndex] !== patternSegment) {
        return false;
      }

      segmentIndex += 1;
      continue;
    }

    if (patternSegment.kind === "param") {
      const segment = segments[segmentIndex];
      if (
        segment === undefined ||
        patternSegment.excludedValues?.has(segment)
      ) {
        return false;
      }

      segmentIndex += 1;
      continue;
    }

    return matchesRouteCatchAll(patternSegment, segments, segmentIndex);
  }

  return segmentIndex === segments.length;
}

function matchesRouteCatchAll(
  patternSegment: Extract<RoutePatternSegment, { readonly kind: "catchAll" }>,
  segments: readonly string[],
  segmentIndex: number
): boolean {
  const remainingCount = segments.length - segmentIndex;

  if (remainingCount === 0) {
    return patternSegment.optional;
  }

  const firstRemainingSegment = segments[segmentIndex];
  if (
    firstRemainingSegment !== undefined &&
    patternSegment.excludedValues?.has(firstRemainingSegment)
  ) {
    return false;
  }

  return true;
}

function routeParam(excludedValues?: ReadonlySet<string>): RoutePatternSegment {
  if (excludedValues) {
    return { kind: "param", excludedValues };
  }

  return { kind: "param" };
}

function routeCatchAll(
  optional: boolean,
  excludedValues?: ReadonlySet<string>
): RoutePatternSegment {
  if (excludedValues) {
    return { kind: "catchAll", optional, excludedValues };
  }

  return { kind: "catchAll", optional };
}

function extractPathWithoutQuery(value: string): string {
  const trimmed = value.trim();
  if (trimmed.length === 0) {
    return "/";
  }

  try {
    const url = new URL(trimmed, "https://launch.local");
    return url.pathname || "/";
  } catch {
    return trimmed.split(/[?#]/, 1)[0] || "/";
  }
}

function sanitizePathSegment({
  segment,
  previousSegment,
}: {
  readonly segment: string;
  readonly previousSegment?: string;
}): string {
  const decoded = safeDecodeURIComponent(segment);
  const lower = decoded.toLowerCase();

  if (looksLikeSensitiveIdentifier(decoded)) {
    return getIdentifierPlaceholder(decoded);
  }

  if (shouldRedactAfterParent(previousSegment, lower)) {
    return ":id";
  }

  return sanitizeStaticSegment(lower);
}

function shouldRedactAfterParent(
  previousSegment: string | undefined,
  currentSegment: string
): boolean {
  if (previousSegment === undefined) {
    return false;
  }

  const previousLower = safeDecodeURIComponent(previousSegment).toLowerCase();

  return (
    IDENTIFIER_PARENT_SEGMENTS.has(previousLower) &&
    !STATIC_ACTION_SEGMENTS.has(currentSegment)
  );
}

function looksLikeSensitiveIdentifier(segment: string): boolean {
  return (
    WALLET_ADDRESS_PATTERN.test(segment) ||
    UUID_PATTERN.test(segment) ||
    LONG_HEX_PATTERN.test(segment) ||
    LONG_TOKEN_PATTERN.test(segment) ||
    NUMERIC_PATTERN.test(segment) ||
    segment.startsWith("@")
  );
}

function getIdentifierPlaceholder(segment: string): string {
  if (WALLET_ADDRESS_PATTERN.test(segment)) {
    return ":wallet";
  }
  if (UUID_PATTERN.test(segment)) {
    return ":uuid";
  }
  if (segment.startsWith("@")) {
    return ":handle";
  }
  return ":id";
}

function sanitizeStaticSegment(segment: string): string {
  const sanitized = segment.replace(/[^a-z0-9._-]/g, "_").slice(0, 64);
  return sanitized.length > 0 ? sanitized : ":segment";
}

function safeDecodeURIComponent(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}
