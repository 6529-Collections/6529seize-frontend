import { getAppEnvironment } from "@/config/appEnvironment";
import { publicEnv } from "@/config/env";
import { getMobileDestination } from "@/helpers/mobileAppDestination";
import { isUniversalLinkPath } from "@/helpers/mobileAppLinks";

const hasRawUnsafeCharacters = (value: string): boolean =>
  value.includes("\\") || /[\u0000-\u001f\u007f]/.test(value);

const getOrigin = (siteUrl: string | undefined): string | null => {
  if (!siteUrl) {
    return null;
  }

  try {
    const origin = new URL(siteUrl).origin;
    return origin === "null" ? null : origin;
  } catch {
    return null;
  }
};

/**
 * The root-relative path (pathname, query and fragment) of a link to this
 * site, or null when the link is not provably on this site.
 *
 * `href` is either an absolute URL whose origin (scheme, host and port) is
 * exactly the site origin, without credentials, or a root-relative path.
 * The path must not begin with `//` and the link must not contain a
 * backslash or control characters, before or after percent-decoding, so the
 * result can never be read by a browser as a link to another host.
 */
export function getInternalLinkPath(
  href: string,
  siteUrl: string | undefined = publicEnv.BASE_ENDPOINT
): string | null {
  const origin = getOrigin(siteUrl);
  if (!origin || hasRawUnsafeCharacters(href)) {
    return null;
  }

  if (href.startsWith("/")) {
    return getMobileDestination(href, origin);
  }

  let url: URL;
  try {
    url = new URL(href);
  } catch {
    return null;
  }

  if (url.origin !== origin || url.username || url.password) {
    return null;
  }

  return getMobileDestination(
    `${url.pathname}${url.search}${url.hash}`,
    origin
  );
}

/** Resolve a page inside the running app, including legacy production URLs. */
export function getInternalPageLinkPath(
  href: string,
  siteUrl: string | undefined = publicEnv.BASE_ENDPOINT
): string | null {
  const origin = getOrigin(siteUrl);
  if (!origin) return null;

  let path = getInternalLinkPath(href, origin);
  if (path === null && getAppEnvironment(origin).isProduction) {
    try {
      const url = new URL(href);
      if (
        (url.protocol === "http:" || url.protocol === "https:") &&
        !url.port &&
        getAppEnvironment(url.origin).isProduction
      ) {
        path = getInternalLinkPath(href, url.origin);
      }
    } catch {
      return null;
    }
  }

  const pathname = path?.split(/[?#]/, 1)[0];
  return pathname && isUniversalLinkPath(pathname) ? path : null;
}
