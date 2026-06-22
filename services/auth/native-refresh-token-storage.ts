import { Capacitor } from "@capacitor/core";
import { SecureStoragePlugin } from "capacitor-secure-storage-plugin";

const NATIVE_REFRESH_TOKEN_KEY_PREFIX = "6529-native-refresh-token";

const inMemoryNativeRefreshTokens = new Map<string, string>();

export function isNativeSecureStorageAvailable(): boolean {
  return Capacitor.isNativePlatform();
}

export async function setNativeRefreshToken({
  address,
  refreshToken,
}: {
  readonly address: string;
  readonly refreshToken: string;
}): Promise<void> {
  if (!isNativeSecureStorageAvailable()) {
    return;
  }
  const key = getNativeRefreshTokenKey(address);
  await SecureStoragePlugin.set({ key, value: refreshToken });
  inMemoryNativeRefreshTokens.set(key, refreshToken);
}

export async function getNativeRefreshToken(
  address: string
): Promise<string | null> {
  if (!isNativeSecureStorageAvailable()) {
    return null;
  }
  const key = getNativeRefreshTokenKey(address);
  const cached = inMemoryNativeRefreshTokens.get(key);
  if (cached) {
    return cached;
  }
  try {
    const result = await SecureStoragePlugin.get({ key });
    if (typeof result.value !== "string" || result.value.trim().length === 0) {
      return null;
    }
    inMemoryNativeRefreshTokens.set(key, result.value);
    return result.value;
  } catch {
    return null;
  }
}

export async function removeNativeRefreshToken(address: string): Promise<void> {
  const key = getNativeRefreshTokenKey(address);
  inMemoryNativeRefreshTokens.delete(key);
  if (!isNativeSecureStorageAvailable()) {
    return;
  }
  try {
    await SecureStoragePlugin.remove({ key });
  } catch {
    // Missing secure-storage keys are treated as already removed.
  }
}

function getNativeRefreshTokenKey(address: string): string {
  return `${NATIVE_REFRESH_TOKEN_KEY_PREFIX}:${address.toLowerCase()}`;
}
