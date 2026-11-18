export const PROFILE_WAVES_FEED_HREF = "/waves?view=profile-feed";
// Share reading position across feed layouts; a fresh native menu entry resets it.
export const PROFILE_WAVES_FEED_SCROLL_KEY = "profile-waves-feed";
export const PROFILE_FEED_RETURN_PARAM = "returnTo";

type SearchParams = Pick<URLSearchParams, "get">;

export function isProfileWavesFeed(pathname: string, search: SearchParams) {
  return pathname === "/waves" && search.get("view") === "profile-feed";
}

/** Only this app-owned destination is accepted, never an arbitrary return URL. */
export function returnsToProfileWavesFeed(search: SearchParams) {
  return search.get(PROFILE_FEED_RETURN_PARAM) === PROFILE_WAVES_FEED_HREF;
}

/** Called on navigation so every native Feed → Wave entry keeps its origin. */
export function withProfileFeedReturn(href: string, isApp: boolean) {
  if (
    !isApp ||
    !href.startsWith("/waves/") ||
    !isProfileWavesFeed(
      globalThis.location.pathname,
      new URLSearchParams(globalThis.location.search)
    )
  ) {
    return href;
  }
  const destination = new URL(href, globalThis.location.href);
  destination.searchParams.set(
    PROFILE_FEED_RETURN_PARAM,
    PROFILE_WAVES_FEED_HREF
  );
  return destination.pathname + destination.search + destination.hash;
}
