/**
 * Media resolver hosts a deployed build may use. Production builds use the
 * default (`https://media.6529.io`); the staging build serves user-provided
 * media from the separate content domain
 * (`https://media.6529usercontent.com`). Specs that run against both match
 * either host and keep the rest of the URL exact.
 */
const MEDIA_RESOLVER_ORIGIN_SOURCE =
  String.raw`https://media\.(?:6529\.io|6529usercontent\.com)`;

const escapeRegExp = (value: string): string =>
  value.replaceAll(/[.*+?^${}()|[\]\\]/g, String.raw`\$&`);

/**
 * Matches exactly `<media resolver origin><path>` on either media host, for
 * `page.route`, `toHaveAttribute` and request assertions. `path` starts with
 * `/` and is matched literally. The pattern is anchored at the end, so it does
 * not allow a trailing query string.
 */
export function mediaResolverUrlPattern(path: string): RegExp {
  if (!path.startsWith("/")) {
    throw new Error(`Media resolver path must start with "/": ${path}`);
  }
  return new RegExp(`^${MEDIA_RESOLVER_ORIGIN_SOURCE}${escapeRegExp(path)}$`);
}
