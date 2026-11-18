import { getDefaultE2eeStorage, isIndexedDbAvailable } from "./storage";

/**
 * This browser's stored encrypted-messages device key for the profile
 * (lowercase), read without the engine (for example while another tab
 * runs it); null when there is none or storage can't be read.
 */
export async function readStoredE2eeDeviceKey(
  profileId: string
): Promise<string | null> {
  if (!isIndexedDbAvailable()) {
    return null;
  }
  try {
    const device = await getDefaultE2eeStorage().getDevice(profileId);
    return device?.deviceKey.toLowerCase() ?? null;
  } catch {
    return null;
  }
}
