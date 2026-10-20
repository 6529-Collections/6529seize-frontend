import { cache } from "react";

import type { CicStatement } from "@/entities/IProfile";
import type { ApiIdentity } from "@/generated/models/ApiIdentity";
import { getAppCommonHeaders } from "@/helpers/server.app.helpers";
import { getUserProfile } from "@/helpers/server.helpers";
import { commonApiFetch } from "@/services/api/common-api";

type ProfileLoadResult =
  | { readonly ok: true; readonly profile: ApiIdentity }
  | { readonly ok: false; readonly error: unknown };

/**
 * Request-scoped profile loaders shared by `generateMetadata`, the profile
 * layout and header, and the profile tab pages.
 *
 * `React.cache` memoizes per server request only: nothing is shared between
 * requests or users, so the cookie-derived auth headers read inside each loader
 * can never leak across viewers. The loaders read those headers themselves so
 * the memoization key is only the public identity string.
 */

/**
 * Resolves the profile identity once per request. Failures are returned (not
 * thrown) so each caller can keep its own 404 / unavailable handling.
 */
export const loadUserProfile = cache(
  async (user: string): Promise<ProfileLoadResult> => {
    try {
      const headers = await getAppCommonHeaders();
      return { ok: true, profile: await getUserProfile({ user, headers }) };
    } catch (error) {
      return { ok: false, error };
    }
  }
);

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
 */
const toProfileIdentitySegment = (routeIdentity: string): string | null => {
  const normalized = decodeRouteIdentity(routeIdentity).toLowerCase();
  if (normalized === "" || DOT_ONLY_SEGMENT.test(normalized)) {
    return null;
  }
  return encodeURIComponent(normalized);
};

const loadProfileStatementsForSegment = cache(
  async (identitySegment: string): Promise<CicStatement[]> => {
    const headers = await getAppCommonHeaders();
    return await commonApiFetch<CicStatement[]>({
      endpoint: `profiles/${identitySegment}/cic/statements`,
      headers,
    });
  }
);

/**
 * Loads the profile statements once per request. Callers pass the route
 * identity as received; it is canonicalized here so the page, its metadata and
 * its header always share one request. Rejects when the identity is invalid or
 * the API call fails; callers decide how to degrade.
 */
export const loadProfileStatements = async (
  routeIdentity: string
): Promise<CicStatement[]> => {
  const identitySegment = toProfileIdentitySegment(routeIdentity);
  if (identitySegment === null) {
    throw new Error("Profile identity cannot be addressed as one path segment");
  }
  return await loadProfileStatementsForSegment(identitySegment);
};
