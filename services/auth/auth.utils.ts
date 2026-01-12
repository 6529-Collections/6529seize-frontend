import { publicEnv } from "@/config/env";
import { API_AUTH_COOKIE } from "@/constants/constants";
import { safeLocalStorage } from "@/helpers/safeLocalStorage";
import Cookies from "js-cookie";
import { jwtDecode } from "jwt-decode";

export const WALLET_AUTH_COOKIE = "wallet-auth";

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

const getAddressRoleStorageKey = (address: string): string => {
  return `auth-role-${address.toLowerCase()}`;
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
  const addressRoleStorageKey = getAddressRoleStorageKey(address);
  if (role) {
    safeLocalStorage.setItem(WALLET_ROLE_STORAGE_KEY, role);
    safeLocalStorage.setItem(addressRoleStorageKey, role);
  } else {
    safeLocalStorage.removeItem(WALLET_ROLE_STORAGE_KEY);
    safeLocalStorage.removeItem(addressRoleStorageKey);
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
  const storedAddress = safeLocalStorage.getItem(WALLET_ADDRESS_STORAGE_KEY);
  Cookies.remove(WALLET_AUTH_COOKIE, COOKIE_OPTIONS);
  safeLocalStorage.removeItem(WALLET_ADDRESS_STORAGE_KEY);
  safeLocalStorage.removeItem(WALLET_REFRESH_TOKEN_STORAGE_KEY);
  safeLocalStorage.removeItem(WALLET_ROLE_STORAGE_KEY);
  if (storedAddress) {
    safeLocalStorage.removeItem(getAddressRoleStorageKey(storedAddress));
  }
};

/**
 * Synchronizes wallet role storage with the authoritative value from the server.
 */
export const syncWalletRoleWithServer = (
  serverRole: string | null,
  address: string
): void => {
  const addressRoleStorageKey = getAddressRoleStorageKey(address);

  if (serverRole) {
    safeLocalStorage.setItem(WALLET_ROLE_STORAGE_KEY, serverRole);
    safeLocalStorage.setItem(addressRoleStorageKey, serverRole);
  } else {
    safeLocalStorage.removeItem(WALLET_ROLE_STORAGE_KEY);
    safeLocalStorage.removeItem(addressRoleStorageKey);
  }
};
