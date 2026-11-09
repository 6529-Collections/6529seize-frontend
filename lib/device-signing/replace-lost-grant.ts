import { getStructuredApiErrorStatus } from "@/services/api/common-api";
import {
  fetchDeviceGrants,
  revokeDeviceGrant,
} from "@/services/api/device-grants-api";
import { listLocalDevicePublicKeys, readDeviceKey } from "./device-key-store";
import {
  clearDeviceKeyLoss,
  noteLostGrantRevokeFailure,
  readDeviceKeyLoss,
  type DeviceKeyLoss,
} from "./key-loss";

/** Attempts before a lost grant that keeps failing is left to expire. */
export const MAX_LOST_GRANT_REVOKE_ATTEMPTS = 3;

/** Whether the lost grant was revoked now, the attempt failed, or there was nothing to do. */
type LostGrantRevokeResult = "revoked" | "failed" | "none";

/** Failures worth another attempt later; any other 4xx never succeeds. */
const isTransient = (status: number | undefined): boolean =>
  status === undefined ||
  status >= 500 ||
  status === 401 ||
  status === 408 ||
  status === 429;

/** Runs queued per wallet in this tab when Web Locks are unavailable. */
const inTabQueues = new Map<string, Promise<unknown>>();

/**
 * One holder at a time per wallet, so two tabs never revoke the same grant.
 * Web Locks serialize across tabs. Without them, calls still run one at a
 * time within this tab; across tabs an overlap could at worst repeat the
 * revoke, which is idempotent, and any later attempt re-reads the server
 * list and finds the grant already revoked.
 */
async function withLossLock<T>(
  address: string,
  task: () => Promise<T>
): Promise<T> {
  const locks = (globalThis.navigator as Partial<Navigator> | undefined)?.locks;
  if (locks) {
    return await locks.request(`6529-device-key-loss:${address}`, task);
  }
  const previous = inTabQueues.get(address) ?? Promise.resolve();
  const run = previous.catch(() => undefined).then(task);
  inTabQueues.set(address, run);
  try {
    return await run;
  } finally {
    if (inTabQueues.get(address) === run) {
      inTabQueues.delete(address);
    }
  }
}

/**
 * Whether the lost grant may be revoked: the server still lists it as
 * active, for exactly the public key this browser's note recorded, and that
 * key is not held in this browser any more.
 */
async function isRevocable(loss: DeviceKeyLoss): Promise<boolean> {
  const noteKey = loss.deviceKey?.toLowerCase();
  if (!noteKey) {
    return false;
  }
  const serverGrant = (await fetchDeviceGrants()).find(
    (grant) => grant.id === loss.grantId
  );
  const activeForNoteKey =
    serverGrant?.revoked_at === null &&
    serverGrant.device_key.toLowerCase() === noteKey;
  if (!activeForNoteKey) {
    return false;
  }
  const localKeys = await listLocalDevicePublicKeys();
  return !localKeys.some((key) => key.toLowerCase() === noteKey);
}

/** Counts a failed attempt, or gives up after a permanent one or the cap. */
function recordFailure(
  address: string,
  loss: DeviceKeyLoss,
  error: unknown
): LostGrantRevokeResult {
  const attempts = (loss.revokeAttempts ?? 0) + 1;
  if (
    !isTransient(getStructuredApiErrorStatus(error)) ||
    attempts >= MAX_LOST_GRANT_REVOKE_ATTEMPTS
  ) {
    // Kept until it expires; the user can still revoke it in Devices.
    clearDeviceKeyLoss(address);
  } else {
    noteLostGrantRevokeFailure(address);
  }
  return "failed";
}

/**
 * Once this browser holds a new grant after losing its key store, revokes the
 * grant it held before: the one named in its own note. Only when the server
 * lists that grant as active for the key the note recorded and the key is not
 * held here; otherwise the loss is dropped without revoking. The loss record
 * is cleared only after a successful revoke; a transient failure keeps it for
 * a later attempt (at most MAX_LOST_GRANT_REVOKE_ATTEMPTS), and a permanent
 * one clears it. Never throws.
 */
export async function revokeLostDeviceGrant(
  address: string
): Promise<LostGrantRevokeResult> {
  const normalized = address.toLowerCase();
  try {
    return await withLossLock(normalized, async () => {
      // Read inside the lock: another tab may have finished already.
      const loss = readDeviceKeyLoss(normalized);
      if (!loss) {
        return "none";
      }
      const current = (await readDeviceKey(normalized))?.grant ?? null;
      if (!current || current.id === loss.grantId) {
        return "none";
      }
      let revocable: boolean;
      try {
        revocable = await isRevocable(loss);
      } catch (error) {
        return recordFailure(normalized, loss, error);
      }
      if (!revocable) {
        clearDeviceKeyLoss(normalized);
        return "none";
      }
      try {
        await revokeDeviceGrant(loss.grantId);
      } catch (error) {
        return recordFailure(normalized, loss, error);
      }
      clearDeviceKeyLoss(normalized);
      return "revoked";
    });
  } catch {
    return "failed";
  }
}
