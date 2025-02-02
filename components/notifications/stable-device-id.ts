import { SecureStoragePlugin } from "capacitor-secure-storage-plugin";
import { v4 as uuidv4 } from "uuid";

const DEVICE_ID_KEY = "stable_device_id";

/**
 * Retrieves a stable device ID from secure storage if it exists,
 * otherwise generates a new one, stores it, and returns it.
 */
export async function getStableDeviceId(): Promise<string> {
  const keysResult = await SecureStoragePlugin.keys();
  if (keysResult.value.includes(DEVICE_ID_KEY)) {
    const result = await SecureStoragePlugin.get({ key: DEVICE_ID_KEY });
    return result.value;
  }

  // Otherwise, generate a new UUID
  const newId = uuidv4();

  // Store it in secure storage
  await SecureStoragePlugin.set({
    key: DEVICE_ID_KEY,
    value: newId,
  });

  return newId;
}
