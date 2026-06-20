export const NATIVE_PROFILE_HISTORY_STATE_KEY =
  "__6529NativeProfileNavigation";

export const NATIVE_PROFILE_STACK_LIMIT = 3;

export type NativeProfileLocation = {
  readonly pathname: string;
  readonly search: string;
};

export type NativeProfileStackEntry = {
  readonly id: string;
  readonly href: string;
  readonly user: string;
};

export type NativeProfileHistoryValue = {
  readonly background: NativeProfileLocation;
  readonly stack: readonly NativeProfileStackEntry[];
};

export type NativeProfileTarget = {
  readonly href: string;
  readonly user: string;
};

const RESERVED_TOP_LEVEL_SEGMENTS = new Set([
  "6529-gradient",
  "_next",
  "about",
  "accept-connection-sharing",
  "access",
  "api",
  "app",
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
  "rep",
  "restricted",
  "sentry-example-page",
  "slide-page",
  "the-memes",
  "tools",
  "waves",
  "xtdh",
]);

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const isStackEntry = (value: unknown): value is NativeProfileStackEntry => {
  if (!isRecord(value)) {
    return false;
  }

  return (
    typeof value["id"] === "string" &&
    typeof value["href"] === "string" &&
    typeof value["user"] === "string"
  );
};

const isLocationValue = (value: unknown): value is NativeProfileLocation => {
  if (!isRecord(value)) {
    return false;
  }

  return (
    typeof value["pathname"] === "string" &&
    typeof value["search"] === "string"
  );
};

export const getNativeProfileHistoryValue = (
  state: unknown
): NativeProfileHistoryValue | null => {
  if (!isRecord(state)) {
    return null;
  }

  const value = state[NATIVE_PROFILE_HISTORY_STATE_KEY];
  if (!isRecord(value) || !isLocationValue(value["background"])) {
    return null;
  }

  if (!Array.isArray(value["stack"]) || !value["stack"].every(isStackEntry)) {
    return null;
  }

  return {
    background: value["background"],
    stack: value["stack"].slice(-NATIVE_PROFILE_STACK_LIMIT),
  };
};

export const withNativeProfileHistoryValue = (
  state: unknown,
  value: NativeProfileHistoryValue
): Record<string, unknown> => ({
  ...(isRecord(state) ? state : {}),
  [NATIVE_PROFILE_HISTORY_STATE_KEY]: {
    background: value.background,
    stack: value.stack.slice(-NATIVE_PROFILE_STACK_LIMIT),
  },
});

export const clearNativeProfileHistoryValue = (
  state: unknown
): Record<string, unknown> => {
  const nextState = { ...(isRecord(state) ? state : {}) };
  delete nextState[NATIVE_PROFILE_HISTORY_STATE_KEY];
  return nextState;
};

export const getNativeProfileLocation = (
  location: Pick<Location, "pathname" | "search">
): NativeProfileLocation => ({
  pathname: location.pathname,
  search: location.search,
});

export const isNativeProfileOverlaySource = (
  pathname: string,
  search: string
): boolean => {
  if (
    pathname === "/waves" ||
    pathname.startsWith("/waves/") ||
    pathname === "/messages" ||
    pathname.startsWith("/messages/")
  ) {
    return true;
  }

  if (pathname !== "/") {
    return false;
  }

  const searchParams = new URLSearchParams(search);
  const view = searchParams.get("view");
  return (
    view === "waves" ||
    view === "messages" ||
    searchParams.get("wave") !== null
  );
};

export const getNativeProfileTarget = ({
  href,
  origin,
}: {
  readonly href: string;
  readonly origin: string;
}): NativeProfileTarget | null => {
  let url: URL;

  try {
    url = new URL(href, origin);
  } catch {
    return null;
  }

  if (url.origin !== origin) {
    return null;
  }

  const rawUser = url.pathname.split("/").find(Boolean);
  if (!rawUser) {
    return null;
  }

  const normalizedUser = rawUser.toLowerCase();
  if (
    normalizedUser.includes(".") ||
    RESERVED_TOP_LEVEL_SEGMENTS.has(normalizedUser)
  ) {
    return null;
  }

  let user: string;
  try {
    user = decodeURIComponent(rawUser);
  } catch {
    user = rawUser;
  }

  return {
    href: `${url.pathname}${url.search}${url.hash}`,
    user,
  };
};
