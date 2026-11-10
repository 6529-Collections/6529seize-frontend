import { publicEnv } from "@/config/env";
import { hasImageFileExtension } from "@/helpers/download-file-type.helpers";

/**
 * Same-site images in a post load only when the path names an image file,
 * has no query string and is not an API or image-optimizer endpoint, so
 * showing a post never makes the viewer's browser call the app's endpoints.
 */
const ENDPOINT_PREFIXES = ["/api/", "/_next/image"] as const;

const getOrigin = (value: string | undefined): string | null => {
  if (!value) {
    return null;
  }
  try {
    return new URL(value).origin;
  } catch {
    return null;
  }
};

const getSiteOrigins = (): string[] =>
  [
    getOrigin(publicEnv.BASE_ENDPOINT),
    typeof globalThis.window === "undefined"
      ? null
      : getOrigin(globalThis.window.location.origin),
  ].filter((origin): origin is string => origin !== null);

const isSameSiteImageFile = (url: URL): boolean =>
  url.search === "" &&
  hasImageFileExtension(url.pathname) &&
  !ENDPOINT_PREFIXES.some((prefix) => url.pathname.startsWith(prefix));

/**
 * Whether a Markdown image source may be loaded. Images on other sites and
 * inline `data:` images are unaffected; same-site sources, including relative
 * paths, must be plain image files.
 */
export function isAllowedMarkdownImageSource(src: string): boolean {
  const trimmed = src.trim();
  if (trimmed.toLowerCase().startsWith("data:")) {
    return true;
  }

  const siteOrigins = getSiteOrigins();
  let url: URL;
  try {
    url = new URL(trimmed, siteOrigins[0]);
  } catch {
    // Not resolvable: the existing source check decides.
    return true;
  }

  if (!siteOrigins.includes(url.origin)) {
    return true;
  }

  return isSameSiteImageFile(url);
}
