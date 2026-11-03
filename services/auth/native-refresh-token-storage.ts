import { TokenRefreshCancelledError } from "@/errors/authentication";
import { Capacitor } from "@capacitor/core";
import { SecureStoragePlugin } from "capacitor-secure-storage-plugin";

const NATIVE_REFRESH_TOKEN_KEY_PREFIX = "6529-native-refresh-token";

const inMemoryNativeRefreshTokens = new Map<string, string | null>();
const storageOperations = new Map<string, Promise<unknown>>();

function serializeStorage<T>(
  address: string,
  task: () => Promise<T>
): Promise<T> {
  const key = address.toLowerCase();
  const previous = storageOperations.get(key) ?? Promise.resolve();
  const pending = previous.catch(() => undefined).then(task);
  storageOperations.set(key, pending);
  void pending
    .finally(() => {
      if (storageOperations.get(key) === pending) storageOperations.delete(key);
    })
    .catch(() => undefined);
  return pending;
}

function isMissingKey(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  return message === "Item with given key does not exist";
}

async function readStoredValue(key: string): Promise<string | null> {
  try {
    const result = await SecureStoragePlugin.get({ key });
    return typeof result.value === "string" && result.value.trim()
      ? result.value
      : null;
  } catch (error) {
    if (isMissingKey(error)) return null;
    throw error;
  }
}

export function isNativeSecureStorageAvailable(): boolean {
  return Capacitor.isNativePlatform();
}

async function writeNativeRefreshToken({
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

async function readNativeRefreshToken(address: string): Promise<string | null> {
  if (!isNativeSecureStorageAvailable()) {
    return null;
  }
  const key = getNativeRefreshTokenKey(address);
  const cached = inMemoryNativeRefreshTokens.get(key);
  if (cached !== undefined) {
    return cached;
  }
  const value = await readStoredValue(key);
  if (value) inMemoryNativeRefreshTokens.set(key, value);
  return value;
}

export function setNativeRefreshToken(params: {
  readonly address: string;
  readonly refreshToken: string;
}): Promise<void> {
  return serializeStorage(params.address, () =>
    writeNativeRefreshToken(params)
  );
}

export function getNativeRefreshToken(address: string): Promise<string | null> {
  return serializeStorage(address, () => readNativeRefreshToken(address));
}

export function getNativeRefreshRequestId(
  address: string,
  refreshToken: string
): Promise<string> {
  return serializeStorage(address, async () => {
    if ((await readNativeRefreshToken(address)) !== refreshToken) {
      throw new TokenRefreshCancelledError();
    }
    const key = `${getNativeRefreshTokenKey(address)}:pending-refresh`;
    const stored = await readStoredValue(key);
    if (stored) {
      let attempt: unknown;
      try {
        attempt = JSON.parse(stored) as unknown;
      } catch {
        // A damaged journal must not permanently prevent fresh attempts.
        attempt = null;
      }
      if (
        typeof attempt === "object" &&
        attempt !== null &&
        "token" in attempt &&
        attempt.token === refreshToken &&
        "id" in attempt &&
        typeof attempt.id === "string" &&
        /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
          attempt.id
        )
      )
        return attempt.id;
    }
    const id = crypto.randomUUID();
    // Persist before sending: app termination must not lose the retry proof.
    await SecureStoragePlugin.set({
      key,
      value: JSON.stringify({ token: refreshToken, id }),
    });
    return id;
  });
}

export function persistRotatedNativeRefreshToken(
  address: string,
  previousToken: string,
  refreshToken: string
): Promise<void> {
  return serializeStorage(address, async () => {
    if ((await readNativeRefreshToken(address)) !== previousToken) {
      throw new TokenRefreshCancelledError();
    }
    await writeNativeRefreshToken({ address, refreshToken });
  });
}

export function removeNativeRefreshToken(address: string): Promise<void> {
  return serializeStorage(address, async () => {
    const key = getNativeRefreshTokenKey(address);
    // Keep this logout tombstone even if durable deletion fails: a late refresh
    // must never restore credentials after an explicit logout in this process.
    inMemoryNativeRefreshTokens.set(key, null);
    if (!isNativeSecureStorageAvailable()) return;
    // Delete the credential before its recovery proof.
    await removeStoredValue(key);
    await removeStoredValue(`${key}:pending-refresh`);
  });
}

async function removeStoredValue(key: string): Promise<void> {
  try {
    await SecureStoragePlugin.remove({ key });
  } catch (error) {
    if (!isMissingKey(error)) throw error;
  }
}

function getNativeRefreshTokenKey(address: string): string {
  return `${NATIVE_REFRESH_TOKEN_KEY_PREFIX}:${address.toLowerCase()}`;
}
