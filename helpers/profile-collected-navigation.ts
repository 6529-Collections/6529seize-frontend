import { CollectedCollectionType } from "@/entities/IProfile";

export const PROFILE_COLLECTED_RETURN_PARAM = "returnTo";

const COLLECTED_CARD_ANCHOR_PREFIX = "collected-card-";
const PROFILE_COLLECTED_PATH_PATTERN = /^\/([^/?#]+)\/collected\/?$/;
const SAFE_URL_BASE = "https://6529.io";
const MAX_PROFILE_LENGTH = 128;
const MAX_QUERY_VALUE_LENGTH = 256;
const COLLECTED_COLLECTION_ANCHOR_VALUES = new Set(
  Object.values(CollectedCollectionType).map((collection) =>
    collection.toLowerCase()
  )
);

const ALLOWED_COLLECTED_QUERY_PARAMS = [
  "activity",
  "address",
  "collection",
  "distribution-page",
  "locale",
  "page",
  "seized",
  "sort-by",
  "sort-direction",
  "subcollection",
  "szn",
  "wallet-activity",
  "wallet-activity-page",
] as const;

const hasUnsafeCharacters = (value: string): boolean =>
  value.includes("\\") || /[\u0000-\u001f\u007f]/.test(value);

const hasPathTraversal = (value: string): boolean => {
  try {
    return /(?:^|\/)\.{1,2}(?:\/|$)/.test(decodeURIComponent(value));
  } catch {
    return true;
  }
};

const buildRelativeUrl = ({
  pathname,
  search,
  hash = "",
}: {
  readonly pathname: string;
  readonly search: string;
  readonly hash?: string | undefined;
}): string => pathname + (search ? "?" + search : "") + hash;

const hasNumericTokenId = (value: string | undefined): boolean =>
  value !== undefined && /^\d+$/.test(value);

const isCollectedTokenPath = (pathname: string): boolean => {
  const segments = pathname.split("/").filter(Boolean);

  if (
    segments.length === 2 &&
    hasNumericTokenId(segments[1]) &&
    ["the-memes", "6529-gradient", "meme-lab"].includes(segments[0] ?? "")
  ) {
    return true;
  }

  return (
    segments[0] === "nextgen" &&
    segments[1] === "token" &&
    hasNumericTokenId(segments[2]) &&
    (segments.length === 3 || segments.length === 4)
  );
};

const getProfileSegment = (pathname: string): string | null => {
  const match = PROFILE_COLLECTED_PATH_PATTERN.exec(pathname);
  const encodedProfile = match?.[1];
  if (!encodedProfile) {
    return null;
  }

  try {
    const profile = decodeURIComponent(encodedProfile);
    if (
      !profile ||
      profile.length > MAX_PROFILE_LENGTH ||
      profile === "." ||
      profile === ".." ||
      profile.includes("/") ||
      hasUnsafeCharacters(profile)
    ) {
      return null;
    }
    return profile;
  } catch {
    return null;
  }
};

const getSafeCollectedSearch = (searchParams: URLSearchParams): string => {
  const safeSearchParams = new URLSearchParams();

  for (const key of ALLOWED_COLLECTED_QUERY_PARAMS) {
    const value = searchParams.get(key);
    if (
      value !== null &&
      value.length <= MAX_QUERY_VALUE_LENGTH &&
      !hasUnsafeCharacters(value)
    ) {
      safeSearchParams.set(key, value);
    }
  }

  return safeSearchParams.toString();
};

export const getCollectedCardAnchorId = ({
  collection,
  tokenId,
}: {
  readonly collection: CollectedCollectionType;
  readonly tokenId: number;
}): string =>
  `${COLLECTED_CARD_ANCHOR_PREFIX}${collection.toLowerCase()}-${tokenId}`;

export const isCollectedCardAnchorId = (value: string): boolean => {
  const match = /^collected-card-([a-z]+)-\d+$/.exec(value);
  return (
    match?.[1] !== undefined && COLLECTED_COLLECTION_ANCHOR_VALUES.has(match[1])
  );
};

interface ProfileCollectedReturnContext {
  readonly href: string;
  readonly profile: string;
}

export function getProfileCollectedReturnContext(
  value: string | null | undefined
): ProfileCollectedReturnContext | null {
  const trimmed = value?.trim();
  if (
    !trimmed ||
    !trimmed.startsWith("/") ||
    trimmed.startsWith("//") ||
    hasUnsafeCharacters(trimmed) ||
    hasPathTraversal(trimmed)
  ) {
    return null;
  }

  try {
    const url = new URL(trimmed, SAFE_URL_BASE);
    if (url.origin !== SAFE_URL_BASE) {
      return null;
    }

    const profile = getProfileSegment(url.pathname);
    if (!profile) {
      return null;
    }

    const safeSearch = getSafeCollectedSearch(url.searchParams);
    let safeHash = "";
    if (url.hash) {
      const decodedHash = decodeURIComponent(url.hash.slice(1));
      if (isCollectedCardAnchorId(decodedHash)) {
        safeHash = `#${decodedHash}`;
      }
    }

    return {
      href: buildRelativeUrl({
        pathname: url.pathname,
        search: safeSearch,
        hash: safeHash,
      }),
      profile,
    };
  } catch {
    return null;
  }
}

export function getProfileCollectedTokenReturnContext({
  pathname,
  returnTo,
}: {
  readonly pathname: string;
  readonly returnTo: string | null | undefined;
}): ProfileCollectedReturnContext | null {
  if (!isCollectedTokenPath(pathname)) {
    return null;
  }

  return getProfileCollectedReturnContext(returnTo);
}

export function buildProfileCollectedReturnPath({
  pathname,
  searchParams,
}: {
  readonly pathname: string;
  readonly searchParams: string;
}): string | null {
  const candidate = buildRelativeUrl({ pathname, search: searchParams });
  return getProfileCollectedReturnContext(candidate)?.href ?? null;
}

export function buildCollectedCardHref({
  tokenPath,
  collection,
  tokenId,
  returnTo,
}: {
  readonly tokenPath: string;
  readonly collection: CollectedCollectionType;
  readonly tokenId: number;
  readonly returnTo?: string | null | undefined;
}): string {
  if (!returnTo || collection === CollectedCollectionType.NETWORK) {
    return tokenPath;
  }

  const returnContext = getProfileCollectedReturnContext(returnTo);
  if (!returnContext) {
    return tokenPath;
  }

  const returnPathWithoutHash = returnContext.href.split("#", 1)[0] ?? "";
  const anchoredReturnTo = `${returnPathWithoutHash}#${getCollectedCardAnchorId(
    {
      collection,
      tokenId,
    }
  )}`;
  const params = new URLSearchParams({
    [PROFILE_COLLECTED_RETURN_PARAM]: anchoredReturnTo,
  });
  return `${tokenPath}?${params.toString()}`;
}

export function stripCollectedReturnFromTokenRoute(route: string): string {
  try {
    const url = new URL(route, SAFE_URL_BASE);
    if (!isCollectedTokenPath(url.pathname)) {
      return buildRelativeUrl({
        pathname: url.pathname,
        search: url.search.slice(1),
        hash: url.hash,
      });
    }

    url.searchParams.delete(PROFILE_COLLECTED_RETURN_PARAM);
    const safeSearch = url.searchParams.toString();
    return buildRelativeUrl({
      pathname: url.pathname,
      search: safeSearch,
      hash: url.hash,
    });
  } catch {
    return route;
  }
}
