import { jwtDecode } from "jwt-decode";
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

/** Classifies UI scope; the API remains responsible for authorizing access. */
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

/** Finds the received proxy for the token's acting profile without changing state. */
export const resolveActiveProfileProxy = <
  T extends { readonly created_by: { readonly id: string } },
>({
  address,
  authRole,
  receivedProfileProxies,
}: {
  readonly address: string | null | undefined;
  readonly authRole: string | null | undefined;
  readonly receivedProfileProxies: readonly T[] | undefined;
}): T | undefined => {
  if (!address || !authRole) return undefined;
  return receivedProfileProxies?.find(
    (proxy) => proxy.created_by.id === authRole
  );
};

/** Checks the token's actor synchronously, before a React profile update can lag it. */
export const isAuthSessionForProfile = ({
  address,
  profileId,
  proxyProfileId,
}: {
  readonly address: string | null;
  readonly profileId: string | null | undefined;
  readonly proxyProfileId: string | null | undefined;
}): boolean => {
  const token = getAuthJwt();
  if (!token || !address || !profileId) return false;
  try {
    const actor = jwtDecode<{ sub: string; role?: string | null }>(token);
    if (actor.sub.toLowerCase() !== address.toLowerCase()) return false;
    const authRole = actor.role ?? null;
    return proxyProfileId
      ? authRole === proxyProfileId
      : isDirectProfileAuthSession({
          authRole,
          profileId,
          hasActiveProxy: false,
        });
  } catch {
    return false;
  }
};
