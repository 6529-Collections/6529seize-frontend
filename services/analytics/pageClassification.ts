import { USER_PAGE_TABS } from "@/components/user/layout/userTabs.config";

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
  "dispute-resolution",
  "education",
  "element_category",
  "email-signatures",
  "emma",
  "error",
  "feed",
  "gm-or-die-small-mp4",
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
  const pageGroup =
    segments.length > 0 ? toAnalyticsIdentifier(segments[0] ?? "") : "home";
  const logicalPage =
    segments.length > 0 ? toAnalyticsIdentifier(segments.join("_")) : "home";

  return {
    logicalPage: logicalPage || "home",
    pageGroup: pageGroup || "home",
    routePattern: pathname,
    trackingKey: pathname,
  };
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
