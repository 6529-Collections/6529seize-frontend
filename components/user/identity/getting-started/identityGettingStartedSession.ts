import { safeSessionStorage } from "@/helpers/safeSessionStorage";

const PROFILE_CREATED_SESSION_PREFIX =
  "identity-getting-started-created-profile";

const normalizeProfileHandle = (
  handle: string | null | undefined
): string | null => {
  const normalized = handle?.trim().toLowerCase();
  if (!normalized) {
    return null;
  }
  return normalized;
};

const getProfileCreatedSessionKey = (
  handle: string | null | undefined
): string | null => {
  const normalizedHandle = normalizeProfileHandle(handle);
  return normalizedHandle
    ? `${PROFILE_CREATED_SESSION_PREFIX}:${normalizedHandle}`
    : null;
};

export const hasIdentityGettingStartedSession = (
  handle: string | null | undefined
): boolean => {
  const key = getProfileCreatedSessionKey(handle);
  return key ? safeSessionStorage.getItem(key) === "true" : false;
};

export const markIdentityGettingStartedSession = (
  handle: string | null | undefined
) => {
  const key = getProfileCreatedSessionKey(handle);
  if (key) {
    safeSessionStorage.setItem(key, "true");
  }
};

export const clearIdentityGettingStartedSession = (
  handle: string | null | undefined
) => {
  const key = getProfileCreatedSessionKey(handle);
  if (key) {
    safeSessionStorage.removeItem(key);
  }
};
