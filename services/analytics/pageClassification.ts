import { USER_PAGE_TABS } from "@/components/user/layout/userTabs.config";
import { sanitizeRouteFamily } from "@/utils/monitoring/mobileLaunchTimingSanitizers";

type SearchParamsLike =
  | Pick<URLSearchParams, "get">
  | { get(name: string): string | null }
  | null
  | undefined;

type PageViewClassification = {
  readonly logicalPage: string;
  readonly pageGroup: string;
  readonly routePattern: string;
  readonly trackingKey: string;
};

const RESERVED_TOP_LEVEL_ROUTE_SEGMENTS = new Set([
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
  "slide-page",
  "the-memes",
  "tools",
  "validator",
  "waves",
  "xtdh",
]);

const PROFILE_ROUTE_CLASSIFICATIONS = new Map(
  USER_PAGE_TABS.map((tab) => [
    tab.route.toLowerCase(),
    {
      logicalPage:
        tab.route.length > 0
          ? `profile_${toAnalyticsIdentifier(tab.route)}`
          : "profile_identity",
      routePattern: tab.route.length > 0 ? `/:handle/${tab.route}` : "/:handle",
    },
  ])
);

function toAnalyticsIdentifier(value: string): string {
  const normalized = value.trim().toLowerCase();
  let result = "";
  let previousWasUnderscore = false;

  for (const character of normalized) {
    const isLowercaseLetter = character >= "a" && character <= "z";
    const isDigit = character >= "0" && character <= "9";

    if (isLowercaseLetter || isDigit) {
      result += character;
      previousWasUnderscore = false;
      continue;
    }

    if (!previousWasUnderscore) {
      result += "_";
      previousWasUnderscore = true;
    }
  }

  while (result.startsWith("_")) {
    result = result.slice(1);
  }

  while (result.endsWith("_")) {
    result = result.slice(0, -1);
  }

  return result;
}

function classifyHomePage(): PageViewClassification {
  return {
    logicalPage: "home",
    pageGroup: "home",
    routePattern: "/",
    trackingKey: "/",
  };
}

function classifyWavesPage(
  pathname: string,
  segments: readonly string[],
  searchParams: SearchParamsLike
): PageViewClassification {
  if (segments.length === 1) {
    return {
      logicalPage: "waves_index",
      pageGroup: "waves",
      routePattern: "/waves",
      trackingKey: pathname,
    };
  }

  if (segments[1]?.toLowerCase() === "create") {
    return {
      logicalPage: "waves_create",
      pageGroup: "waves",
      routePattern: "/waves/create",
      trackingKey: pathname,
    };
  }

  const dropId = searchParams?.get("drop");
  if (dropId) {
    return {
      logicalPage: "wave_drop_detail",
      pageGroup: "waves",
      routePattern: "/waves/:waveId?drop=:dropId",
      trackingKey: `${pathname}?drop=${dropId}`,
    };
  }

  return {
    logicalPage: "wave_page",
    pageGroup: "waves",
    routePattern: "/waves/:waveId",
    trackingKey: pathname,
  };
}

function classifyProfilePage(
  pathname: string,
  segments: readonly string[]
): PageViewClassification | null {
  const handle = segments[0]?.toLowerCase();
  if (!handle || RESERVED_TOP_LEVEL_ROUTE_SEGMENTS.has(handle)) {
    return null;
  }

  const subroute = segments[1]?.toLowerCase() ?? "";
  const knownProfileRoute = PROFILE_ROUTE_CLASSIFICATIONS.get(subroute);
  if (knownProfileRoute) {
    return {
      logicalPage: knownProfileRoute.logicalPage,
      pageGroup: "profile",
      routePattern: knownProfileRoute.routePattern,
      trackingKey: pathname,
    };
  }

  if (segments.length === 1) {
    return {
      logicalPage: "profile_identity",
      pageGroup: "profile",
      routePattern: "/:handle",
      trackingKey: pathname,
    };
  }

  return {
    logicalPage: "profile_subpage",
    pageGroup: "profile",
    routePattern: "/:handle/:subpage",
    trackingKey: pathname,
  };
}

function classifyFallbackPage(
  pathname: string,
  segments: readonly string[]
): PageViewClassification {
  const routePattern = sanitizeRouteFamily(pathname);
  const pageGroup =
    segments.length > 0 ? toAnalyticsIdentifier(segments[0] ?? "") : "home";
  const logicalPage = toAnalyticsIdentifier(routePattern);

  return {
    logicalPage: logicalPage || "home",
    pageGroup: pageGroup || "home",
    routePattern,
    trackingKey: pathname,
  };
}

type RouteParams = Readonly<Record<string, string | string[] | undefined>>;

const decodeSegment = (segment: string): string => {
  try {
    return decodeURIComponent(segment);
  } catch {
    return segment;
  }
};

/**
 * The App Router template of the current page, e.g. `/waves/[wave]`, built by
 * replacing each segment that holds a dynamic param (`useParams()`) with its
 * name. Static segments are folder names under `app/`. The query string is
 * never part of the result.
 */
export function toRouteTemplate(
  pathname: string,
  params: RouteParams | null | undefined
): string {
  const segments = (pathname.split(/[?#]/, 1)[0] ?? "")
    .split("/")
    .filter(Boolean);
  const decoded = segments.map(decodeSegment);
  const out: (string | null)[] = [...segments];
  const matches = (index: number, value: string) =>
    decoded[index] === value || segments[index] === value;

  // Params are ordered root to leaf, so match from the end: a static segment
  // with the same text as a param value sits before it, as in /waves/waves.
  let end = segments.length;
  for (const [name, value] of Object.entries(params ?? {}).reverse()) {
    const parts = typeof value === "string" ? [value] : (value ?? []);
    if (parts.length === 0) continue;
    for (let start = end - parts.length; start >= 0; start--) {
      if (!parts.every((part, offset) => matches(start + offset, part)))
        continue;
      out.fill(null, start, start + parts.length);
      out[start] = typeof value === "string" ? `[${name}]` : `[...${name}]`;
      end = start;
      break;
    }
  }

  const template = out.filter((segment) => segment !== null).join("/");
  return `/${template}`;
}

export function classifyPageView(args: {
  pathname: string;
  searchParams?: SearchParamsLike;
}): PageViewClassification {
  const pathname = args.pathname.trim();
  if (pathname.length === 0 || pathname === "/") {
    return classifyHomePage();
  }

  const normalizedPathname = pathname.startsWith("/")
    ? pathname
    : `/${pathname}`;
  const segments = normalizedPathname.split("/").filter(Boolean);
  const firstSegment = segments[0]?.toLowerCase();

  if (firstSegment === "waves") {
    return classifyWavesPage(
      normalizedPathname,
      segments,
      args.searchParams ?? null
    );
  }

  const profilePage = classifyProfilePage(normalizedPathname, segments);
  if (profilePage) {
    return profilePage;
  }

  return classifyFallbackPage(normalizedPathname, segments);
}
