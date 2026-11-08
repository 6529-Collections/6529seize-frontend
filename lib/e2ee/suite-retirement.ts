import { E2EE_CIPHERSUITE, grantCoversSuite } from "./grant";
import type { StoredDevice, StoredGroup, StoredGroupStatus } from "./records";
import type { E2eeStorage } from "./storage";

/**
 * Moving to a new MLS ciphersuite keeps history (D172). A device whose grant
 * does not cover the current suite is retired: its MLS state and outbox are
 * dropped, its groups become read-only ("superseded") with their decrypted
 * messages kept, and its device record stays only as a retired marker that
 * carries the trust pins into the next device. The next enrolment (one
 * signature, or a combined sign-in) creates a fresh key on the current suite.
 */

/** Statuses that stay as they are: already read-only. */
const KEEP_STATUS: ReadonlySet<StoredGroupStatus> = new Set([
  "left",
  "removed",
  "superseded",
]);

/** Whether a stored device belongs to an earlier suite (or is retired). */
export const isOldSuiteDevice = (device: StoredDevice | null): boolean =>
  device !== null &&
  (device.retired === true ||
    !grantCoversSuite(device.grant, E2EE_CIPHERSUITE));

/** The read-only conversations kept from earlier suites. */
export const countSuperseded = (groups: readonly StoredGroup[]): number =>
  groups.filter((group) => group.status === "superseded").length;

/**
 * Retires the profile's old-suite device in one atomic write and returns how
 * many conversations are now read-only. `expectedVersion` is the caller's
 * state version (the write bumps it, so a tab still running the old device
 * stops instead of writing it back).
 */
export async function retireOldSuiteDevice(
  storage: E2eeStorage,
  profileId: string,
  device: StoredDevice,
  expectedVersion: number
): Promise<number> {
  const groups = await storage.listGroups(profileId);
  const outbox = await storage.listOutbox(profileId);
  // Every group the device was in: its MLS state goes with the device.
  const superseded: StoredGroup[] = groups
    .filter((group) => !KEEP_STATUS.has(group.status))
    .map((group) => ({
      ...group,
      status: "superseded",
      pendingCommit: null,
      delayed: false,
    }));
  const { loginGrantId: _loginGrantId, ...rest } = device;
  const retired: StoredDevice = {
    ...rest,
    retired: true,
    registered: false,
    provisioned: false,
  };
  await storage.writeBatch(profileId, {
    expectedVersion,
    device: retired,
    dropWasmState: true,
    groups: superseded,
    deleteOutbox: outbox.map((item) => item.id),
  });
  return countSuperseded(groups) + superseded.length;
}
