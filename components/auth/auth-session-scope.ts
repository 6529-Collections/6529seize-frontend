import { getAuthJwt } from "@/services/auth/auth.utils";
import { getRole } from "@/services/auth/jwt-validation.utils";
import { logErrorSecurely } from "@/utils/error-sanitizer";

/** Undefined keeps private data closed while the current token is unavailable. */
export const getAuthSessionRole = (): string | null | undefined => {
  try {
    const token = getAuthJwt();
    // Legacy tokens can omit role; a missing or unreadable token stays unresolved.
    return token ? (getRole(token) ?? null) : undefined;
  } catch (error) {
    logErrorSecurely("derive_auth_role", error);
    return undefined;
  }
};

export const isDirectProfileAuthSession = ({
  authRole,
  profileId,
  hasActiveProxy,
}: {
  readonly authRole: string | null | undefined;
  readonly profileId: string | null | undefined;
  readonly hasActiveProxy: boolean;
}): boolean =>
  Boolean(profileId) &&
  !hasActiveProxy &&
  (authRole === null || authRole === profileId);
