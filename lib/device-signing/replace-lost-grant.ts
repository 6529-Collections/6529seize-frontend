import type { ApiE2eeMe } from "@/generated/models/ApiE2eeMe";
import {
  commonApiFetch,
  getStructuredApiErrorStatus,
} from "@/services/api/common-api";
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

/**
 * The account signed in on this page: its own wallet (not a proxy) and that
 * wallet's profile. A loss is processed or discarded only for this account,
 * since the server answers with the signed-in profile's grants and devices.
 */
interface SignedInAccount {
  readonly wallet: string;
  readonly profileId: string;
}

/** The server answered for another profile than the signed-in account's. */
class AccountChangedError extends Error {}

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
 * list and finds the grant already revoked. Keyed by wallet, like the loss
 * record and the key store.
 */
async function withLossLock<T>(
  wallet: string,
  task: () => Promise<T>
): Promise<T> {
  const locks = (globalThis.navigator as Partial<Navigator> | undefined)?.locks;
  if (locks) {
    return await locks.request(`6529-device-key-loss:${wallet}`, task);
  }
  const previous = inTabQueues.get(wallet) ?? Promise.resolve();
  const run = previous.catch(() => undefined).then(task);
  inTabQueues.set(wallet, run);
  try {
    return await run;
  } finally {
    if (inTabQueues.get(wallet) === run) {
      inTabQueues.delete(wallet);
    }
  }
}

/**
 * Whether one of the signed-in profile's encrypted-messages devices was
 * enrolled by this grant (a combined grant). Revoking such a grant also
 * revokes that device, which may still be in use.
 */
async function enrolledEncryptedDevice(
  grantId: string,
  profileId: string
): Promise<boolean> {
  const me = await commonApiFetch<ApiE2eeMe>({
    endpoint: "e2ee/me",
    errorMode: "structured",
  });
  if (me.profile_id !== profileId) {
    throw new AccountChangedError("Signed-in profile changed");
  }
  return me.devices.some(
    (device) =>
      device.grant_id === grantId &&
      device.grant_message !== null &&
      device.grant_message !== undefined
  );
}

/**
 * Whether the lost grant may be revoked: the server still lists it as
 * active, for exactly the public key this browser's note recorded; that key
 * is not held in this browser any more; and the grant only enabled Signed
 * Posts. A combined grant also enrolled an encrypted-messages device that
 * its revocation would revoke too, so it is left for the user to manage in
 * Devices.
 */
async function isRevocable(
  loss: DeviceKeyLoss,
  account: SignedInAccount
): Promise<boolean> {
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
  if (localKeys.some((key) => key.toLowerCase() === noteKey)) {
    return false;
  }
  return !(await enrolledEncryptedDevice(loss.grantId, account.profileId));
}

/** Counts a failed attempt, or gives up after a permanent one or the cap. */
function recordFailure(
  wallet: string,
  loss: DeviceKeyLoss,
  error: unknown
): void {
  if (error instanceof AccountChangedError) {
    // The session moved to another profile mid-check: leave it pending.
    return;
  }
  const attempts = (loss.revokeAttempts ?? 0) + 1;
  if (
    !isTransient(getStructuredApiErrorStatus(error)) ||
    attempts >= MAX_LOST_GRANT_REVOKE_ATTEMPTS
  ) {
    // Kept until it expires; the user can still revoke it in Devices.
    clearDeviceKeyLoss(wallet);
  } else {
    noteLostGrantRevokeFailure(wallet);
  }
}

/**
 * Once this browser holds a new grant after losing its key store, revokes the
 * grant it held before for the signed-in account's wallet: the one named in
 * its own note. Only when the server lists that grant as active for the key
 * the note recorded, the key is not held here and the grant only enabled
 * Signed Posts; otherwise the loss is dropped without revoking.
 *
 * A loss recorded for another wallet or profile is left untouched, pending
 * until that account signs in again. The record (keyed by wallet, like the
 * key store and the lock, and carrying the wallet's own profile) is cleared
 * only after a successful revoke; a transient failure keeps it for a later
 * attempt (at most MAX_LOST_GRANT_REVOKE_ATTEMPTS), and a permanent one
 * clears it. Never throws.
 */
export async function revokeLostDeviceGrant(
  account: SignedInAccount
): Promise<LostGrantRevokeResult> {
  const wallet = account.wallet.toLowerCase();
  try {
    return await withLossLock(wallet, async () => {
      // Read inside the lock: another tab may have finished already.
      const loss = readDeviceKeyLoss(wallet);
      if (
        !loss ||
        (loss.ownProfileId !== null && loss.ownProfileId !== account.profileId)
      ) {
        return "none";
      }
      const current = (await readDeviceKey(wallet))?.grant ?? null;
      if (!current || current.id === loss.grantId) {
        return "none";
      }
      let revocable: boolean;
      try {
        revocable = await isRevocable(loss, account);
      } catch (error) {
        recordFailure(wallet, loss, error);
        return "failed";
      }
      if (!revocable) {
        clearDeviceKeyLoss(wallet);
        return "none";
      }
      try {
        await revokeDeviceGrant(loss.grantId);
      } catch (error) {
        recordFailure(wallet, loss, error);
        return "failed";
      }
      clearDeviceKeyLoss(wallet);
      return "revoked";
    });
  } catch {
    return "failed";
  }
}
