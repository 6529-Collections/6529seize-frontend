import {
  DROP_FORGE_PATH,
  DROP_FORGE_SECTIONS,
  DROP_FORGE_TITLE,
} from "@/components/drop-forge/drop-forge.constants";

import type { PageSearchResult } from "../HeaderSearchModalItem";

export interface RankedPageMatch {
  readonly page: PageSearchResult;
  readonly normalizedTitle: string;
  readonly priority: number;
}

export const PAGE_SEARCH_ALIASES_BY_HREF: Record<string, string[]> = {
  "/about/6529-apps": [
    "6529 Apps",
    "6529 Desktop",
    "6529 Mobile",
    "Apps",
    "Desktop",
    "Mobile",
    "iOS app",
    "Android app",
    "Windows app",
    "macOS app",
    "Linux app",
  ],
  [DROP_FORGE_PATH]: [DROP_FORGE_TITLE],
  [DROP_FORGE_SECTIONS.CRAFT.path]: [`${DROP_FORGE_TITLE} Craft`],
  [DROP_FORGE_SECTIONS.LAUNCH.path]: [`${DROP_FORGE_TITLE} Launch`],
  "/discover": ["Discovery", "Wave discovery", "Discover Waves"],
  "/messages": ["Messages", "Direct messages", "DMs"],
  "/the-memes": ["NFTs", "Meme Cards"],
  "/network/nerd": [
    "Network leaderboard",
    "Collector leaderboard",
    "TDH leaderboard",
    "Cards collected leaderboard",
    "Interactions leaderboard",
    "Purchases sales transfers",
  ],
  "/network/wave-score": [
    "Wave scoring",
    "Wave score formula",
    "Wave score calculator",
    "Visibility score",
    "Hotness score",
    "Wave REP formula",
  ],
};

const singularizePageSearchToken = (token: string): string => {
  if (token.length <= 3) {
    return token;
  }

  if (token.endsWith("ies") && token.length > 4) {
    return `${token.slice(0, -3)}y`;
  }

  if (
    token.endsWith("ches") ||
    token.endsWith("shes") ||
    token.endsWith("xes") ||
    token.endsWith("zes") ||
    token.endsWith("sses")
  ) {
    return token.slice(0, -2);
  }

  if (token.endsWith("s") && !token.endsWith("ss")) {
    return token.slice(0, -1);
  }

  return token;
};

export const getPageSearchTokens = (value: string): string[] =>
  value
    .toLowerCase()
    .split(/[^a-z0-9]+/g)
    .filter(Boolean)
    .map(singularizePageSearchToken);

const pageTokensMatchInOrder = (
  candidateTokens: readonly string[],
  queryTokens: readonly string[],
  matcher: (candidateToken: string, queryToken: string) => boolean
) => {
  if (queryTokens.length === 0) {
    return false;
  }

  let candidateIndex = 0;

  return queryTokens.every((queryToken) => {
    while (candidateIndex < candidateTokens.length) {
      const candidateToken = candidateTokens[candidateIndex];
      candidateIndex += 1;

      if (candidateToken !== undefined && matcher(candidateToken, queryToken)) {
        return true;
      }
    }

    return false;
  });
};

const hasCanonicalPageTokenMatch = (
  values: readonly string[],
  queryTokens: readonly string[]
) => {
  if (queryTokens.length === 0) {
    return false;
  }

  return values.some((value) => {
    const candidateTokens = getPageSearchTokens(value);
    return pageTokensMatchInOrder(
      candidateTokens,
      queryTokens,
      (candidateToken, queryToken) => candidateToken === queryToken
    );
  });
};

const hasExactCanonicalPageTokenMatch = (
  values: readonly string[],
  queryTokens: readonly string[]
) => {
  if (queryTokens.length === 0) {
    return false;
  }

  return values.some((value) => {
    const candidateTokens = getPageSearchTokens(value);
    return (
      candidateTokens.length === queryTokens.length &&
      candidateTokens.every((token, index) => token === queryTokens[index])
    );
  });
};

const hasCanonicalPageTokenPrefixMatch = (
  values: readonly string[],
  queryTokens: readonly string[]
) => {
  if (queryTokens.length === 0) {
    return false;
  }

  return values.some((value) => {
    const candidateTokens = getPageSearchTokens(value);
    return pageTokensMatchInOrder(
      candidateTokens,
      queryTokens,
      (candidateToken, queryToken) => candidateToken.startsWith(queryToken)
    );
  });
};

export const getCompositePageSearchValues = (
  normalizedTitle: string,
  normalizedBreadcrumbs: readonly string[],
  normalizedSearchTerms: readonly string[]
): string[] => {
  const values = normalizedBreadcrumbs.flatMap((_, index) => {
    const breadcrumbSuffix = normalizedBreadcrumbs.slice(index);
    const suffixPrefix = breadcrumbSuffix.join(" ");

    return [normalizedTitle, ...normalizedSearchTerms]
      .map((value) => [suffixPrefix, value].filter(Boolean).join(" "))
      .filter(Boolean);
  });

  return [...new Set(values)];
};

type PageSearchMatchInputs = {
  readonly normalizedTitle: string;
  readonly normalizedHref: string;
  readonly hrefSegments: string[];
  readonly normalizedBreadcrumbs: string[];
  readonly normalizedSearchTerms: string[];
  readonly compositeValues: string[];
};

type PageSearchQuery = {
  readonly normalizedQuery: string;
  readonly canonicalQueryTokens: readonly string[];
};

export const getPageMatchPriority = (
  {
    normalizedTitle,
    normalizedHref,
    hrefSegments,
    normalizedBreadcrumbs,
    normalizedSearchTerms,
    compositeValues,
  }: PageSearchMatchInputs,
  normalizedQuery: string,
  canonicalQueryTokens: readonly string[]
): number => {
  const isPathLikeQuery =
    normalizedQuery.startsWith("/") || normalizedQuery.includes("/");
  const titleValues = [normalizedTitle];
  const hrefValues = [normalizedHref, ...hrefSegments];
  const checks = [
    normalizedTitle === normalizedQuery,
    normalizedHref === normalizedQuery,
    isPathLikeQuery && normalizedHref.startsWith(normalizedQuery),
    isPathLikeQuery && normalizedHref.includes(normalizedQuery),
    hasExactCanonicalPageTokenMatch(titleValues, canonicalQueryTokens),
    hrefSegments.includes(normalizedQuery),
    normalizedSearchTerms.includes(normalizedQuery),
    hasExactCanonicalPageTokenMatch(
      normalizedSearchTerms,
      canonicalQueryTokens
    ),
    compositeValues.includes(normalizedQuery),
    hasExactCanonicalPageTokenMatch(compositeValues, canonicalQueryTokens),
    normalizedTitle.startsWith(normalizedQuery),
    hasCanonicalPageTokenMatch(titleValues, canonicalQueryTokens),
    hasCanonicalPageTokenPrefixMatch(titleValues, canonicalQueryTokens),
    normalizedBreadcrumbs.includes(normalizedQuery),
    hasExactCanonicalPageTokenMatch(
      normalizedBreadcrumbs,
      canonicalQueryTokens
    ),
    hasCanonicalPageTokenPrefixMatch(
      normalizedBreadcrumbs,
      canonicalQueryTokens
    ),
    normalizedSearchTerms.some((term) => term.includes(normalizedQuery)),
    hasCanonicalPageTokenMatch(normalizedSearchTerms, canonicalQueryTokens),
    hasCanonicalPageTokenPrefixMatch(
      normalizedSearchTerms,
      canonicalQueryTokens
    ),
    hasCanonicalPageTokenMatch(compositeValues, canonicalQueryTokens),
    hasCanonicalPageTokenPrefixMatch(compositeValues, canonicalQueryTokens),
    normalizedTitle.includes(normalizedQuery),
    hrefSegments.some((segment) => segment.includes(normalizedQuery)),
    hasCanonicalPageTokenMatch(hrefValues, canonicalQueryTokens),
    hasCanonicalPageTokenPrefixMatch(hrefValues, canonicalQueryTokens),
    hasCanonicalPageTokenMatch(normalizedBreadcrumbs, canonicalQueryTokens),
  ];

  const matchIndex = checks.findIndex(Boolean);
  return matchIndex === -1 ? checks.length : matchIndex;
};

export const pageMatchesQuery = (
  {
    normalizedTitle,
    normalizedHref,
    normalizedBreadcrumbs,
    normalizedSearchTerms,
    compositeValues,
  }: PageSearchMatchInputs,
  { normalizedQuery, canonicalQueryTokens }: PageSearchQuery
) => {
  const isPathLikeQuery =
    normalizedQuery.startsWith("/") || normalizedQuery.includes("/");
  if (normalizedTitle.includes(normalizedQuery)) return true;
  if (isPathLikeQuery && normalizedHref.startsWith(normalizedQuery)) {
    return true;
  }
  if (isPathLikeQuery && normalizedHref.includes(normalizedQuery)) {
    return true;
  }
  if (normalizedSearchTerms.some((term) => term.includes(normalizedQuery))) {
    return true;
  }
  if (
    normalizedBreadcrumbs.some((breadcrumb) =>
      breadcrumb.includes(normalizedQuery)
    )
  ) {
    return true;
  }
  if (compositeValues.some((value) => value.includes(normalizedQuery))) {
    return true;
  }

  return (
    hasCanonicalPageTokenMatch(
      [
        normalizedTitle,
        normalizedHref,
        ...normalizedBreadcrumbs,
        ...normalizedSearchTerms,
        ...compositeValues,
      ],
      canonicalQueryTokens
    ) ||
    hasCanonicalPageTokenPrefixMatch(
      [
        normalizedTitle,
        normalizedHref,
        ...normalizedBreadcrumbs,
        ...normalizedSearchTerms,
        ...compositeValues,
      ],
      canonicalQueryTokens
    )
  );
};
