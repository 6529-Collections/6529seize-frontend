import { getAuthJwt } from "@/services/auth/auth.utils";
import { getRole } from "@/services/auth/jwt-validation.utils";
import { logErrorSecurely } from "@/utils/error-sanitizer";

/** Undefined keeps private data closed while the current token is unavailable. */
export const getAuthSessionRole = (): string | null | undefined => {
  try {
    const token = getAuthJwt();
    return token ? getRole(token) : undefined;
  } catch (error) {
    logErrorSecurely("derive_auth_role", error);
    return undefined;
  }
};
