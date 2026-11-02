const DOT_ONLY_SEGMENT = /^\.+$/;

const decodeRouteIdentity = (value: string): string => {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
};

/**
 * The one canonical API path segment for a route identity: decoded once,
 * lowercased, then encoded once. Every spelling of the same identity (case,
 * percent-encoding) maps to the same segment, and the encoding keeps the
 * identity from changing the request path. Dot-only identities return null
 * because URL parsing would resolve them as path navigation.
 *
 * Shared by the server loaders and the client queries that refresh the same
 * data, so both always request the same endpoint.
 */
export const toProfileIdentitySegment = (
  routeIdentity: string
): string | null => {
  const normalized = decodeRouteIdentity(routeIdentity).toLowerCase();
  if (normalized === "" || DOT_ONLY_SEGMENT.test(normalized)) {
    return null;
  }
  return encodeURIComponent(normalized);
};
