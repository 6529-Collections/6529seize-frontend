import * as Sentry from "@sentry/nextjs";
import { SecureStoragePlugin } from "capacitor-secure-storage-plugin";
import { v4 as uuidv4 } from "uuid";

const DEVICE_ID_KEY = "stable_device_id";
const RECOVERABLE_SECURE_STORAGE_ERROR_PATTERNS = [
  "item with given key does not exist",
  "illegalblocksizeexception",
  "keystoreexception",
];
let inFlightStableDeviceIdPromise: Promise<string> | null = null;

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return String(error);
}

function isRecoverableSecureStorageError(error: unknown): boolean {
  const message = getErrorMessage(error).toLowerCase();
  return RECOVERABLE_SECURE_STORAGE_ERROR_PATTERNS.some((pattern) =>
    message.includes(pattern)
  );
}

async function createAndPersistDeviceId(): Promise<string> {
  const newId = uuidv4();
  await SecureStoragePlugin.set({
    key: DEVICE_ID_KEY,
    value: newId,
  });
  return newId;
}

async function resolveStableDeviceId(): Promise<string> {
  try {
    const result = await SecureStoragePlugin.get({ key: DEVICE_ID_KEY });
    if (typeof result.value === "string" && result.value.trim().length > 0) {
      return result.value;
    }

    Sentry.addBreadcrumb({
      category: "notifications",
      level: "warning",
      message: "Recovered empty stable_device_id value from secure storage",
      data: { key: DEVICE_ID_KEY },
    });

    return await createAndPersistDeviceId();
  } catch (error) {
    if (!isRecoverableSecureStorageError(error)) {
      throw error;
    }

    Sentry.addBreadcrumb({
      category: "notifications",
      level: "warning",
      message: "Recovered stable_device_id secure-storage read failure",
      data: {
        key: DEVICE_ID_KEY,
        error: getErrorMessage(error),
      },
    });

    return await createAndPersistDeviceId();
  }
}

/**
 * Retrieves a stable device ID from secure storage if it exists,
 * otherwise generates a new one, stores it, and returns it.
 */
export async function getStableDeviceId(): Promise<string> {
  if (!inFlightStableDeviceIdPromise) {
    inFlightStableDeviceIdPromise = resolveStableDeviceId().finally(() => {
      inFlightStableDeviceIdPromise = null;
    });
  }
  return await inFlightStableDeviceIdPromise;
}
