import Cookies from "js-cookie";
import { jwtDecode } from "jwt-decode";
import { publicEnv } from "@/config/env";
import { API_AUTH_COOKIE, MAX_CONNECTED_PROFILES } from "@/constants/constants";
import { safeLocalStorage } from "@/helpers/safeLocalStorage";

export const WALLET_AUTH_COOKIE = "wallet-auth";
export const WALLET_ACCOUNTS_UPDATED_EVENT = "6529-wallet-accounts-updated";

const WALLET_ADDRESS_STORAGE_KEY = "6529-wallet-address";
const WALLET_REFRESH_TOKEN_STORAGE_KEY = "6529-wallet-refresh-token";
const WALLET_ROLE_STORAGE_KEY = "6529-wallet-role";
const WALLET_ACCOUNTS_STORAGE_KEY = "6529-wallet-accounts";
const WALLET_ACTIVE_ADDRESS_STORAGE_KEY = "6529-wallet-active-address";

export interface ConnectedWalletAccount {
  readonly address: string;
  readonly refreshToken: string;
  readonly role: string | null;
  readonly jwt: string | null;
}

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

const normalizeAddress = (address: string): string => address.toLowerCase();

const emitWalletAccountsUpdated = (): void => {
  if (globalThis.window !== undefined) {
    globalThis.dispatchEvent(new CustomEvent(WALLET_ACCOUNTS_UPDATED_EVENT));
  }
};

const setWalletAuthCookie = (jwt: string | null): void => {
  if (!jwt) {
    Cookies.remove(WALLET_AUTH_COOKIE, COOKIE_OPTIONS);
    return;
  }

  try {
    const jwtExpiration = getJwtExpiration(jwt);
    const now = Math.floor(Date.now() / 1000);
    const expiresInSeconds = jwtExpiration - now;
    if (expiresInSeconds <= 0) {
      Cookies.remove(WALLET_AUTH_COOKIE, COOKIE_OPTIONS);
      return;
    }
    const expiresInDays = expiresInSeconds / 86400;

    Cookies.set(WALLET_AUTH_COOKIE, jwt, {
      ...COOKIE_OPTIONS,
      expires: expiresInDays,
    });
  } catch {
    Cookies.remove(WALLET_AUTH_COOKIE, COOKIE_OPTIONS);
  }
};

const readAccountsFromStorage = (): ConnectedWalletAccount[] => {
  const raw = safeLocalStorage.getItem(WALLET_ACCOUNTS_STORAGE_KEY);
  if (!raw) return [];

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return [];
  }

  if (!Array.isArray(parsed)) return [];

  const dedupe = new Set<string>();
  const accounts: ConnectedWalletAccount[] = [];

  for (const item of parsed) {
    if (!item || typeof item !== "object") continue;
    const record = item as Partial<ConnectedWalletAccount>;
    if (
      typeof record.address !== "string" ||
      record.address.trim().length === 0 ||
      typeof record.refreshToken !== "string" ||
      record.refreshToken.trim().length === 0
    ) {
      continue;
    }

    const normalized = normalizeAddress(record.address);
    if (dedupe.has(normalized)) continue;
    dedupe.add(normalized);

    accounts.push({
      address: record.address,
      refreshToken: record.refreshToken,
      role: typeof record.role === "string" ? record.role : null,
      jwt: typeof record.jwt === "string" ? record.jwt : null,
    });
  }

  return accounts;
};

const writeAccountsToStorage = (
  accounts: readonly ConnectedWalletAccount[]
): void => {
  if (accounts.length === 0) {
    safeLocalStorage.removeItem(WALLET_ACCOUNTS_STORAGE_KEY);
    return;
  }

  safeLocalStorage.setItem(
    WALLET_ACCOUNTS_STORAGE_KEY,
    JSON.stringify(accounts)
  );
};

const getActiveAddressFromStorage = (): string | null => {
  const activeAddress = safeLocalStorage.getItem(
    WALLET_ACTIVE_ADDRESS_STORAGE_KEY
  );
  return activeAddress && activeAddress.trim().length > 0
    ? activeAddress
    : null;
};

const setActiveAddressInStorage = (address: string | null): void => {
  if (!address) {
    safeLocalStorage.removeItem(WALLET_ACTIVE_ADDRESS_STORAGE_KEY);
    return;
  }
  safeLocalStorage.setItem(WALLET_ACTIVE_ADDRESS_STORAGE_KEY, address);
};

const synchronizeLegacyStorage = (
  activeAccount: ConnectedWalletAccount | null
): void => {
  if (!activeAccount) {
    safeLocalStorage.removeItem(WALLET_ADDRESS_STORAGE_KEY);
    safeLocalStorage.removeItem(WALLET_REFRESH_TOKEN_STORAGE_KEY);
    safeLocalStorage.removeItem(WALLET_ROLE_STORAGE_KEY);
    return;
  }

  safeLocalStorage.setItem(WALLET_ADDRESS_STORAGE_KEY, activeAccount.address);
  safeLocalStorage.setItem(
    WALLET_REFRESH_TOKEN_STORAGE_KEY,
    activeAccount.refreshToken
  );

  const addressRoleStorageKey = getAddressRoleStorageKey(activeAccount.address);
  if (activeAccount.role) {
    safeLocalStorage.setItem(WALLET_ROLE_STORAGE_KEY, activeAccount.role);
    safeLocalStorage.setItem(addressRoleStorageKey, activeAccount.role);
  } else {
    safeLocalStorage.removeItem(WALLET_ROLE_STORAGE_KEY);
    safeLocalStorage.removeItem(addressRoleStorageKey);
  }
};

const getActiveAccountFromAccounts = (
  accounts: readonly ConnectedWalletAccount[]
): ConnectedWalletAccount | null => {
  if (accounts.length === 0) return null;

  const activeAddress = getActiveAddressFromStorage();
  if (!activeAddress) return accounts[0] ?? null;

  const active = accounts.find(
    (account) =>
      normalizeAddress(account.address) === normalizeAddress(activeAddress)
  );
  return active ?? accounts[0] ?? null;
};

const migrateLegacyStorageIfNeeded = (): void => {
  const hasAccountsStorage =
    safeLocalStorage.getItem(WALLET_ACCOUNTS_STORAGE_KEY) !== null;
  if (hasAccountsStorage) return;

  const legacyAddress = safeLocalStorage.getItem(WALLET_ADDRESS_STORAGE_KEY);
  const legacyRefreshToken = safeLocalStorage.getItem(
    WALLET_REFRESH_TOKEN_STORAGE_KEY
  );
  if (!legacyAddress || !legacyRefreshToken) return;

  const legacyRole = safeLocalStorage.getItem(WALLET_ROLE_STORAGE_KEY);
  const legacyJwt = Cookies.get(WALLET_AUTH_COOKIE) ?? null;

  const legacyAccount: ConnectedWalletAccount = {
    address: legacyAddress,
    refreshToken: legacyRefreshToken,
    role: legacyRole,
    jwt: legacyJwt,
  };

  writeAccountsToStorage([legacyAccount]);
  setActiveAddressInStorage(legacyAddress);
};

const getStoredAccounts = (): ConnectedWalletAccount[] => {
  migrateLegacyStorageIfNeeded();
  return readAccountsFromStorage();
};

const persistAccountsWithActive = (
  accounts: readonly ConnectedWalletAccount[],
  activeAddress: string | null
): void => {
  writeAccountsToStorage(accounts);
  setActiveAddressInStorage(activeAddress);

  const activeAccount =
    activeAddress === null
      ? null
      : (accounts.find(
          (account) =>
            normalizeAddress(account.address) ===
            normalizeAddress(activeAddress)
        ) ?? null);

  synchronizeLegacyStorage(activeAccount);
  setWalletAuthCookie(activeAccount?.jwt ?? null);
};

export const getConnectedWalletAccounts = (): ConnectedWalletAccount[] => {
  return getStoredAccounts();
};

export const canStoreAnotherWalletAccount = (
  address?: string | null
): boolean => {
  const accounts = getStoredAccounts();

  if (!address) {
    return accounts.length < MAX_CONNECTED_PROFILES;
  }

  const normalizedAddress = normalizeAddress(address);
  const alreadyExists = accounts.some(
    (account) => normalizeAddress(account.address) === normalizedAddress
  );

  return alreadyExists || accounts.length < MAX_CONNECTED_PROFILES;
};

export const setActiveWalletAccount = (address: string): boolean => {
  const accounts = getStoredAccounts();
  const account = accounts.find(
    (account) => normalizeAddress(account.address) === normalizeAddress(address)
  );
  if (!account) return false;

  persistAccountsWithActive(accounts, account.address);
  emitWalletAccountsUpdated();
  return true;
};

export const setAuthJwt = (
  address: string,
  jwt: string,
  refreshToken: string,
  role?: string
): boolean => {
  const nextAccount: ConnectedWalletAccount = {
    address,
    refreshToken,
    role: role ?? null,
    jwt,
  };

  const storedAccounts = getStoredAccounts();
  const accountIndex = storedAccounts.findIndex(
    (account) => normalizeAddress(account.address) === normalizeAddress(address)
  );
  const nextAccounts = [...storedAccounts];
  if (accountIndex >= 0) {
    nextAccounts.splice(accountIndex, 1, nextAccount);
  } else {
    if (nextAccounts.length >= MAX_CONNECTED_PROFILES) {
      return false;
    }
    nextAccounts.push(nextAccount);
  }
  persistAccountsWithActive(nextAccounts, address);

  const addressRoleStorageKey = getAddressRoleStorageKey(address);
  if (role) {
    safeLocalStorage.setItem(addressRoleStorageKey, role);
  } else {
    safeLocalStorage.removeItem(addressRoleStorageKey);
  }

  emitWalletAccountsUpdated();
  return true;
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
  const activeAccount = getActiveAccountFromAccounts(getStoredAccounts());
  if (activeAccount?.refreshToken) return activeAccount.refreshToken;
  return safeLocalStorage.getItem(WALLET_REFRESH_TOKEN_STORAGE_KEY) ?? null;
};

export const getWalletAddress = () => {
  if (publicEnv.USE_DEV_AUTH === "true") {
    return publicEnv.DEV_MODE_WALLET_ADDRESS ?? null;
  }
  const activeAccount = getActiveAccountFromAccounts(getStoredAccounts());
  if (activeAccount?.address) return activeAccount.address;
  return safeLocalStorage.getItem(WALLET_ADDRESS_STORAGE_KEY) ?? null;
};

export const getWalletRole = () => {
  const activeAccount = getActiveAccountFromAccounts(getStoredAccounts());
  if (activeAccount) return activeAccount.role;
  return safeLocalStorage.getItem(WALLET_ROLE_STORAGE_KEY) ?? null;
};

export const removeAuthJwt = () => {
  const accounts = getStoredAccounts();
  const activeAccount = getActiveAccountFromAccounts(accounts);

  if (!activeAccount) {
    const legacyAddress = safeLocalStorage.getItem(WALLET_ADDRESS_STORAGE_KEY);
    if (legacyAddress) {
      safeLocalStorage.removeItem(getAddressRoleStorageKey(legacyAddress));
    }
    persistAccountsWithActive([], null);
    emitWalletAccountsUpdated();
    return;
  }

  const remainingAccounts = accounts.filter(
    (account) =>
      normalizeAddress(account.address) !==
      normalizeAddress(activeAccount.address)
  );

  safeLocalStorage.removeItem(getAddressRoleStorageKey(activeAccount.address));

  const nextActiveAddress = remainingAccounts[0]?.address ?? null;
  persistAccountsWithActive(remainingAccounts, nextActiveAddress);
  emitWalletAccountsUpdated();
};

/**
 * Synchronizes wallet role storage with the authoritative value from the server.
 */
export const syncWalletRoleWithServer = (
  serverRole: string | null,
  address: string
): void => {
  const accounts = getStoredAccounts();
  const normalizedAddress = normalizeAddress(address);
  const nextAccounts = accounts.map((account) => {
    if (normalizeAddress(account.address) !== normalizedAddress) {
      return account;
    }
    return {
      ...account,
      role: serverRole,
    };
  });

  if (nextAccounts.length > 0) {
    const activeAccount = getActiveAccountFromAccounts(nextAccounts);
    persistAccountsWithActive(nextAccounts, activeAccount?.address ?? null);
  }

  const addressRoleStorageKey = getAddressRoleStorageKey(address);

  if (serverRole) {
    safeLocalStorage.setItem(WALLET_ROLE_STORAGE_KEY, serverRole);
    safeLocalStorage.setItem(addressRoleStorageKey, serverRole);
  } else {
    safeLocalStorage.removeItem(WALLET_ROLE_STORAGE_KEY);
    safeLocalStorage.removeItem(addressRoleStorageKey);
  }

  emitWalletAccountsUpdated();
};
