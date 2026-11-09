import { revokeDeviceGrant } from "@/services/api/device-grants-api";
import { readDeviceKey } from "./device-key-store";
import { clearDeviceKeyLoss, readDeviceKeyLoss } from "./key-loss";

/**
 * Once this browser holds a new grant after losing its key store, revokes the
 * grant it held before: the one named in its own note, whose key is gone, so
 * it can never sign again. Never another browser's grant. Resolves true when
 * that grant was revoked. Never throws.
 */
export async function revokeLostDeviceGrant(address: string): Promise<boolean> {
  try {
    const loss = readDeviceKeyLoss(address);
    if (!loss) {
      return false;
    }
    const current = (await readDeviceKey(address))?.grant ?? null;
    if (!current || current.id === loss.grantId) {
      return false;
    }
    // Cleared first, so a second saved grant never revokes again.
    clearDeviceKeyLoss(address);
    await revokeDeviceGrant(loss.grantId);
    return true;
  } catch {
    // Kept until it expires; the user can still revoke it in Devices.
    return false;
  }
}
