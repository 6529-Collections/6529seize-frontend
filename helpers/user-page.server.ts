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
 * Request-scoped profile loaders shared by `generateMetadata`, the profile page
 * and the profile header.
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

/**
 * Loads the profile statements once per request. `identitySegment` is the exact
 * path segment sent to the API, so callers that encode it differently stay
 * separate requests instead of silently sharing a differently-addressed result.
 * Rejects when the API call fails; callers decide how to degrade.
 */
export const loadProfileStatements = cache(
  async (identitySegment: string): Promise<CicStatement[]> => {
    const headers = await getAppCommonHeaders();
    return await commonApiFetch<CicStatement[]>({
      endpoint: `profiles/${identitySegment}/cic/statements`,
      headers,
    });
  }
);
