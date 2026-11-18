import { publicEnv } from "@/config/env";

/** Where 6529 Desktop releases are published. */
export const DEFAULT_DESKTOP_DOWNLOAD_PAGE = "https://6529.io/desktop";
const RELEASE_SITE_ORIGIN = "https://6529.io";
const MAX_URL_LENGTH = 2048;

/** The site this build serves (staging and local builds have their own). */
function getSiteOrigin(): string | null {
  try {
    return new URL(publicEnv.BASE_ENDPOINT).origin;
  } catch {
    return null;
  }
}

/**
 * The download page an `update-available` event names (`downloadPage`),
 * only when it is an https page on 6529.io or on this build's own site
 * (staging); otherwise the 6529.io download page. Never any other address
 * the event carries.
 */
export function readDesktopDownloadPage(info: unknown): string {
  if (typeof info !== "object" || info === null) {
    return DEFAULT_DESKTOP_DOWNLOAD_PAGE;
  }
  const page = (info as { readonly downloadPage?: unknown }).downloadPage;
  if (typeof page !== "string" || page.length > MAX_URL_LENGTH) {
    return DEFAULT_DESKTOP_DOWNLOAD_PAGE;
  }
  try {
    const url = new URL(page);
    const onAllowedSite =
      url.origin === RELEASE_SITE_ORIGIN || url.origin === getSiteOrigin();
    const noCredentials = url.username === "" && url.password === "";
    return url.protocol === "https:" && onAllowedSite && noCredentials
      ? url.href
      : DEFAULT_DESKTOP_DOWNLOAD_PAGE;
  } catch {
    return DEFAULT_DESKTOP_DOWNLOAD_PAGE;
  }
}
