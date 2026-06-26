import Cookies from "js-cookie";
import { jwtDecode } from "jwt-decode";
import { publicEnv } from "@/config/env";
import { API_AUTH_COOKIE, MAX_CONNECTED_PROFILES } from "@/constants/constants";
import { safeLocalStorage } from "@/helpers/safeLocalStorage";
import { removeNativeRefreshToken } from "./native-refresh-token-storage";

export const WALLET_AUTH_COOKIE = "wallet-auth";
export const WALLET_ACCOUNTS_UPDATED_EVENT = "6529-wallet-accounts-updated";
export const PROFILE_SWITCHED_EVENT = "6529-profile-switched";
export type AuthSessionVersion = "v2";

const WALLET_ADDRESS_STORAGE_KEY = "6529-wallet-address";
const WALLET_REFRESH_TOKEN_STORAGE_KEY = "6529-wallet-refresh-token";
const WALLET_ROLE_STORAGE_KEY = "6529-wallet-role";
const WALLET_ACCOUNTS_STORAGE_KEY = "6529-wallet-accounts";
const WALLET_ACTIVE_ADDRESS_STORAGE_KEY = "6529-wallet-active-address";

export interface ConnectedWalletAccount {
  readonly address: string;
  readonly refreshToken: string | null;
  readonly role: string | null;
  readonly jwt: string | null;
  readonly profileId: string | null;
  readonly profileHandle: string | null;
  readonly authSessionVersion?: AuthSessionVersion | null;
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

export const isAuthAddressAuthorized = ({
  address,
  connectedAccounts,
}: {
  readonly address: string | null | undefined;
  readonly connectedAccounts: readonly { readonly address: string }[];
}): boolean => {
  if (!address) {
    return false;
  }

  const normalizedAddress = normalizeAddress(address);
  const isStoredAddressAuthorized = connectedAccounts.some(
    (account) => normalizeAddress(account.address) === normalizedAddress
  );

  if (isStoredAddressAuthorized) {
    return true;
  }

  if (publicEnv.USE_DEV_AUTH !== "true") {
    return false;
  }

  const devWalletAddress = getWalletAddress();
  const devAuthJwt = getAuthJwt();

  return (
    typeof devWalletAddress === "string" &&
    devWalletAddress.length > 0 &&
    typeof devAuthJwt === "string" &&
    devAuthJwt.length > 0 &&
    normalizeAddress(devWalletAddress) === normalizedAddress
  );
};

const emitWalletAccountsUpdated = (): void => {
  if (globalThis.window !== undefined) {
    globalThis.dispatchEvent(new CustomEvent(WALLET_ACCOUNTS_UPDATED_EVENT));
  }
};

const emitProfileSwitched = (): void => {
  if (globalThis.window !== undefined) {
    globalThis.dispatchEvent(new CustomEvent(PROFILE_SWITCHED_EVENT));
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

const parseAccountsJson = (raw: string): unknown[] | null => {
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : null;
  } catch {
    return null;
  }
};

const hasRequiredAccountFields = (
  record: Partial<ConnectedWalletAccount>
): record is Partial<ConnectedWalletAccount> & {
  address: string;
} => typeof record.address === "string" && record.address.trim().length > 0;

const toStoredAccount = (
  record: Partial<ConnectedWalletAccount> & {
    address: string;
  }
): ConnectedWalletAccount => ({
  address: record.address,
  refreshToken:
    typeof record.refreshToken === "string" &&
    record.refreshToken.trim().length > 0
      ? record.refreshToken
      : null,
  role: typeof record.role === "string" ? record.role : null,
  jwt: typeof record.jwt === "string" ? record.jwt : null,
  profileId: typeof record.profileId === "string" ? record.profileId : null,
  profileHandle:
    typeof record.profileHandle === "string" ? record.profileHandle : null,
  authSessionVersion: record.authSessionVersion === "v2" ? "v2" : null,
});

const readAccountsFromStorage = (): ConnectedWalletAccount[] => {
  const raw = safeLocalStorage.getItem(WALLET_ACCOUNTS_STORAGE_KEY);
  const parsed = raw ? parseAccountsJson(raw) : null;
  if (!parsed) return [];

  const dedupe = new Set<string>();
  const accounts: ConnectedWalletAccount[] = [];

  for (const item of parsed) {
    if (!item || typeof item !== "object") continue;
    const record = item as Partial<ConnectedWalletAccount>;
    if (!hasRequiredAccountFields(record)) continue;

    const normalized = normalizeAddress(record.address);
    if (dedupe.has(normalized)) continue;
    dedupe.add(normalized);
    accounts.push(toStoredAccount(record));
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
  if (activeAccount.refreshToken) {
    safeLocalStorage.setItem(
      WALLET_REFRESH_TOKEN_STORAGE_KEY,
      activeAccount.refreshToken
    );
  } else {
    safeLocalStorage.removeItem(WALLET_REFRESH_TOKEN_STORAGE_KEY);
  }

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
    profileId: null,
    profileHandle: null,
    authSessionVersion: null,
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
  address?: string | null,
  {
    allowAdditionalAccounts = true,
  }: { readonly allowAdditionalAccounts?: boolean } = {}
): boolean => {
  const accounts = getStoredAccounts();

  if (!address) {
    if (accounts.length === 0) {
      return true;
    }
    if (!allowAdditionalAccounts) {
      return false;
    }
    return accounts.length < MAX_CONNECTED_PROFILES;
  }

  const normalizedAddress = normalizeAddress(address);
  const alreadyExists = accounts.some(
    (account) => normalizeAddress(account.address) === normalizedAddress
  );

  if (alreadyExists || accounts.length === 0) {
    return true;
  }
  if (!allowAdditionalAccounts) {
    return false;
  }
  return accounts.length < MAX_CONNECTED_PROFILES;
};

export const setActiveWalletAccount = (address: string): boolean => {
  const accounts = getStoredAccounts();
  const account = accounts.find(
    (account) => normalizeAddress(account.address) === normalizeAddress(address)
  );
  if (!account) return false;

  const previousActiveAddress = getActiveAddressFromStorage();
  persistAccountsWithActive(accounts, account.address);
  emitWalletAccountsUpdated();

  if (
    previousActiveAddress &&
    normalizeAddress(previousActiveAddress) !==
      normalizeAddress(account.address)
  ) {
    emitProfileSwitched();
  }

  return true;
};

export const setAuthJwt = (
  address: string,
  jwt: string,
  refreshToken: string | null,
  role?: string,
  options: {
    readonly authSessionVersion?: AuthSessionVersion | null;
  } = {}
): boolean => {
  const storedAccounts = getStoredAccounts();
  const existingAccount =
    storedAccounts.find(
      (account) =>
        normalizeAddress(account.address) === normalizeAddress(address)
    ) ?? null;

  const nextAccount: ConnectedWalletAccount = {
    address,
    refreshToken: refreshToken ?? existingAccount?.refreshToken ?? null,
    role: role ?? null,
    jwt,
    profileId: existingAccount?.profileId ?? null,
    profileHandle: existingAccount?.profileHandle ?? null,
    authSessionVersion:
      options.authSessionVersion ?? existingAccount?.authSessionVersion ?? null,
  };

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
  return (
    Cookies.get(WALLET_AUTH_COOKIE) ??
    getActiveAccountFromAccounts(getStoredAccounts())?.jwt ??
    null
  );
};

export const hasActiveSessionV2Auth = ({
  address,
}: {
  readonly address: string;
}): boolean => {
  const normalizedAddress = normalizeAddress(address);
  const storedAccount =
    getStoredAccounts().find(
      (account) => normalizeAddress(account.address) === normalizedAddress
    ) ?? null;

  return (
    storedAccount?.authSessionVersion === "v2" &&
    normalizeAddress(storedAccount.address) === normalizedAddress
  );
};

export const getRefreshToken = () => {
  const activeAccount = getActiveAccountFromAccounts(getStoredAccounts());
  if (activeAccount?.refreshToken) return activeAccount.refreshToken;
  if (activeAccount) return null;
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

const getNativeRefreshTokenCleanupAddresses = (
  accounts: readonly ConnectedWalletAccount[]
): string[] => {
  const addresses = accounts.map((account) => account.address);
  const legacyAddress = safeLocalStorage.getItem(WALLET_ADDRESS_STORAGE_KEY);
  if (legacyAddress) {
    addresses.push(legacyAddress);
  }

  const seen = new Set<string>();
  return addresses.filter((address) => {
    const normalizedAddress = normalizeAddress(address);
    if (seen.has(normalizedAddress)) {
      return false;
    }
    seen.add(normalizedAddress);
    return true;
  });
};

export const clearAllWalletAuth = async (): Promise<void> => {
  const accounts = getStoredAccounts();
  await Promise.all(
    getNativeRefreshTokenCleanupAddresses(accounts).map((address) =>
      removeNativeRefreshToken(address)
    )
  );
  persistAccountsWithActive([], null);
  emitWalletAccountsUpdated();
};

export const removeAuthJwt = async (): Promise<void> => {
  const accounts = getStoredAccounts();
  const activeAccount = getActiveAccountFromAccounts(accounts);

  if (!activeAccount) {
    const legacyAddress = safeLocalStorage.getItem(WALLET_ADDRESS_STORAGE_KEY);
    if (legacyAddress) {
      await removeNativeRefreshToken(legacyAddress);
      safeLocalStorage.removeItem(getAddressRoleStorageKey(legacyAddress));
    }
    persistAccountsWithActive([], null);
    emitWalletAccountsUpdated();
    return;
  }

  await removeNativeRefreshToken(activeAccount.address);

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

export const syncConnectedWalletProfile = (
  address: string,
  profileId: string,
  profileHandle: string | null
): void => {
  const normalizedProfileId = profileId.trim();
  if (normalizedProfileId.length === 0) {
    return;
  }

  const normalizedAddress = normalizeAddress(address);
  const normalizedProfileHandle =
    profileHandle && profileHandle.trim().length > 0 ? profileHandle : null;
  const accounts = getStoredAccounts();
  let hasChanges = false;

  const nextAccounts = accounts.map((account) => {
    if (normalizeAddress(account.address) !== normalizedAddress) {
      return account;
    }

    if (
      account.profileId === normalizedProfileId &&
      account.profileHandle === normalizedProfileHandle
    ) {
      return account;
    }

    hasChanges = true;
    return {
      ...account,
      profileId: normalizedProfileId,
      profileHandle: normalizedProfileHandle,
    };
  });

  if (!hasChanges) {
    return;
  }

  const activeAccount = getActiveAccountFromAccounts(nextAccounts);
  persistAccountsWithActive(nextAccounts, activeAccount?.address ?? null);
  emitWalletAccountsUpdated();
};
