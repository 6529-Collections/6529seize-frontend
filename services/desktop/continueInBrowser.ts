import { publicEnv } from "@/config/env";
import { getDesktopShellApi } from "@/helpers/desktop-shell";

/**
 * The page the user is on, on the website: the same path, query and
 * fragment on 6529.io (or the build's own site), for actions 6529 Desktop
 * does not sign itself.
 */
function getWebsiteUrlForCurrentPage(): string | null {
  try {
    const site = new URL(publicEnv.BASE_ENDPOINT);
    const { pathname, search, hash } = globalThis.location;
    return new URL(`${pathname}${search}${hash}`, site.origin).href;
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
