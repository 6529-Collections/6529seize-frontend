import { publicEnv } from "@/config/env";
import Cookies from "js-cookie";
import { jwtDecode } from "jwt-decode";
import { API_AUTH_COOKIE } from "../../constants";
import { safeLocalStorage } from "../../helpers/safeLocalStorage";

export const WALLET_AUTH_COOKIE = "wallet-auth";

// TODO: remove these cookies once migration is complete
const WALLET_ADDRESS_COOKIE = "wallet-address";
const WALLET_REFRESH_TOKEN_COOKIE = "wallet-refresh-token";
const WALLET_ROLE_COOKIE = "wallet-role";

const WALLET_ADDRESS_STORAGE_KEY = "6529-wallet-address";
const WALLET_REFRESH_TOKEN_STORAGE_KEY = "6529-wallet-refresh-token";
const WALLET_ROLE_STORAGE_KEY = "6529-wallet-role";

const COOKIE_OPTIONS = {
  secure: true,
  sameSite: "strict" as const,
};

const getJwtExpiration = (jwt: string): number => {
  const decodedJwt = jwtDecode<{
    exp: number;
  }>(jwt);
  return decodedJwt.exp;
};

// TODO: remove these cookies once migration is complete
export const migrateCookiesToLocalStorage = () => {
  const walletAddress = Cookies.get(WALLET_ADDRESS_COOKIE);
  const walletRefreshToken = Cookies.get(WALLET_REFRESH_TOKEN_COOKIE);
  const walletRole = Cookies.get(WALLET_ROLE_COOKIE);

  if (walletAddress) {
    safeLocalStorage.setItem(WALLET_ADDRESS_STORAGE_KEY, walletAddress);
    Cookies.remove(WALLET_ADDRESS_COOKIE);
  }
  if (walletRefreshToken) {
    safeLocalStorage.setItem(
      WALLET_REFRESH_TOKEN_STORAGE_KEY,
      walletRefreshToken
    );
    Cookies.remove(WALLET_REFRESH_TOKEN_COOKIE);
  }
  if (walletRole) {
    safeLocalStorage.setItem(WALLET_ROLE_STORAGE_KEY, walletRole);
    Cookies.remove(WALLET_ROLE_COOKIE);
  }
};

export const setAuthJwt = (
  address: string,
  jwt: string,
  refreshToken: string,
  role?: string
) => {
  const jwtExpiration = getJwtExpiration(jwt);
  const now = Math.floor(Date.now() / 1000);
  const expiresInSeconds = jwtExpiration - now;
  const expiresInDays = expiresInSeconds / 86400;

  // custom expiry for auth token
  Cookies.set(WALLET_AUTH_COOKIE, jwt, {
    ...COOKIE_OPTIONS,
    expires: expiresInDays,
  });

  safeLocalStorage.setItem(WALLET_ADDRESS_STORAGE_KEY, address);
  safeLocalStorage.setItem(WALLET_REFRESH_TOKEN_STORAGE_KEY, refreshToken);
  if (role) {
    safeLocalStorage.setItem(WALLET_ROLE_STORAGE_KEY, role);
  }
};

export const getStagingAuth = (): string | null => {
  return Cookies.get(API_AUTH_COOKIE) ?? publicEnv.STAGING_API_KEY ?? null;
};

export const getAuthJwt = () => {
  if (publicEnv.USE_DEV_AUTH === "true") {
    return publicEnv.DEV_MODE_AUTH_JWT ?? null;
  }
  return Cookies.get(WALLET_AUTH_COOKIE) ?? null;
};

export const getRefreshToken = () => {
  return safeLocalStorage.getItem(WALLET_REFRESH_TOKEN_STORAGE_KEY) ?? null;
};

export const getWalletAddress = () => {
  if (publicEnv.USE_DEV_AUTH === "true") {
    return publicEnv.DEV_MODE_WALLET_ADDRESS ?? null;
  }
  return safeLocalStorage.getItem(WALLET_ADDRESS_STORAGE_KEY) ?? null;
};

export const getWalletRole = () => {
  return safeLocalStorage.getItem(WALLET_ROLE_STORAGE_KEY) ?? null;
};

export const removeAuthJwt = () => {
  Cookies.remove(WALLET_AUTH_COOKIE, COOKIE_OPTIONS);
  safeLocalStorage.removeItem(WALLET_ADDRESS_STORAGE_KEY);
  safeLocalStorage.removeItem(WALLET_REFRESH_TOKEN_STORAGE_KEY);
  safeLocalStorage.removeItem(WALLET_ROLE_STORAGE_KEY);
};

/**
 * Validates JWT role against wallet role with fail-fast security checks
 *
 * @param freshJwt - The fresh JWT token from server response
 * @param walletRole - The role associated with the current wallet
 * @param requestedRole - The role that was requested (optional)
 * @returns The validated role from the fresh JWT
 * @throws Error if validation fails
 */
export const syncWalletRoleWithServer = (
  serverRole: string | null,
  address: string
): void => {
  const currentRole = getWalletRole();
  if (currentRole !== serverRole) {
    // Update local storage to match server
    if (serverRole) {
      safeLocalStorage.setItem(
        `auth-role-${address.toLowerCase()}`,
        serverRole
      );
    } else {
      safeLocalStorage.removeItem(`auth-role-${address.toLowerCase()}`);
    }
  }
};

export const validateJwtRole = (
  freshJwt: string,
  walletRole: string | null,
  requestedRole: string | null = null
): string | null => {
  if (!freshJwt) {
    throw new Error("Fresh JWT is required for role validation");
  }

  // Extract role from the fresh JWT
  const decodedJwt = jwtDecode<{
    id: string;
    sub: string;
    iat: number;
    exp: number;
  }>(freshJwt);

  const freshTokenRole = decodedJwt.id || null;

  // SECURITY: Role validation using the fresh token from server
  if (walletRole && freshTokenRole && freshTokenRole !== walletRole) {
    throw new Error(
      `Role mismatch in fresh token: wallet role ${walletRole} does not match fresh token role ${freshTokenRole}`
    );
  }

  if (!walletRole && freshTokenRole) {
    throw new Error(
      `Unexpected role ${freshTokenRole} in fresh token when wallet has no role`
    );
  }

  if (walletRole && !freshTokenRole) {
    throw new Error(
      `Missing role in fresh token when wallet has role ${walletRole}`
    );
  }

  // SECURITY: Ensure the requested role matches what we got from server
  if (requestedRole && freshTokenRole !== requestedRole) {
    throw new Error(
      `Server returned unexpected role: requested ${requestedRole}, received ${freshTokenRole}`
    );
  }

  return freshTokenRole;
};
