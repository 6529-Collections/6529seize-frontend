import { publicEnv } from "@/config/env";
import { getDesktopShellApi } from "@/helpers/desktop-shell";

/**
 * Pages whose query and fragment are the task itself and carry nothing
 * secret (the validator session draft is meant to be shared). Elsewhere
 * only the path is carried over, so a transient token in the app's URL
 * never reaches the system browser.
 */
const PAGES_KEEPING_QUERY_AND_FRAGMENT = new Set(["/validator/authorize"]);

/** The website's host for this build, e.g. `6529.io`, for copy. */
export function getWebsiteHost(): string {
  try {
    return new URL(publicEnv.BASE_ENDPOINT).host;
  } catch {
    return "6529.io";
  }
}

/** The current page on the website (same path; see above for the rest). */
function getWebsiteUrlForCurrentPage(): string | null {
  try {
    const site = new URL(publicEnv.BASE_ENDPOINT);
    const { pathname, search, hash } = globalThis.location;
    const rest = PAGES_KEEPING_QUERY_AND_FRAGMENT.has(pathname)
      ? `${search}${hash}`
      : "";
    return new URL(`${pathname}${rest}`, site.origin).href;
  } catch {
    return null;
  }
}

/**
 * Opens the current page on the website in the system browser, where the
 * user's browser wallet signs directly. Returns false outside 6529 Desktop
 * or when nothing could be opened.
 */
export function continueInBrowser(): boolean {
  const api = getDesktopShellApi();
  const url = getWebsiteUrlForCurrentPage();
  if (!api || !url) return false;
  try {
    api.openExternal(url);
    return true;
  } catch {
    return false;
  }
}
