export const PROFILE_WAVES_FEED_HREF = "/waves?view=profile-feed";
// Share reading position across feed layouts; a fresh native menu entry resets it.
export const PROFILE_WAVES_FEED_SCROLL_KEY = "profile-waves-feed";
const PROFILE_FEED_RETURN_PARAM = "returnTo";

type SearchParams = Pick<URLSearchParams, "get">;

export function isProfileWavesFeed(pathname: string, search: SearchParams) {
  return pathname === "/waves" && search.get("view") === "profile-feed";
}

/** Only this app-owned destination is accepted, never an arbitrary return URL. */
export function returnsToProfileWavesFeed(search: SearchParams) {
  return search.get(PROFILE_FEED_RETURN_PARAM) === PROFILE_WAVES_FEED_HREF;
}
