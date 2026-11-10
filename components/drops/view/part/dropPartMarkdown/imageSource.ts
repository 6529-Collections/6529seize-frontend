import { publicEnv } from "@/config/env";

/**
 * Same-site images in a post may only be static files: a file at the site
 * root (`/name.png`), a build asset or an emoji. Any other same-site path
 * (`/api/...`, route handlers, pages) is not loaded as an image, so showing a
 * post never makes the viewer's browser call the app's own endpoints.
 */
const STATIC_IMAGE_DIRECTORIES = ["/_next/static/", "/emojis/"] as const;
const STATIC_IMAGE_FILE_NAME = /^[^/]+\.(?:avif|gif|jpe?g|png|svg|webp)$/i;

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

const isStaticImagePath = (pathname: string): boolean => {
  const fileName = pathname.slice(pathname.lastIndexOf("/") + 1);
  if (!STATIC_IMAGE_FILE_NAME.test(fileName)) {
    return false;
  }
  const directory = pathname.slice(0, pathname.length - fileName.length);
  return (
    directory === "/" ||
    STATIC_IMAGE_DIRECTORIES.some((prefix) => directory.startsWith(prefix))
  );
};

/**
 * Whether a Markdown image source may be loaded. Images on other sites and
 * inline `data:` images are unaffected; same-site sources, including relative
 * paths, must be static image files.
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

  return url.search === "" && isStaticImagePath(url.pathname);
}
