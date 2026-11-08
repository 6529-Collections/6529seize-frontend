import { E2EE_CIPHERSUITE, grantCoversSuite } from "./grant";
import type {
  StoredDevice,
  StoredGroup,
  StoredGroupStatus,
  StoredMessage,
} from "./records";
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
 * Own messages still queued when their conversation is superseded can no
 * longer be sent from it: they become "unsent" (kept, not pending) so the
 * user can resend them in the successor or delete them.
 */
async function unsentEchoes(
  storage: E2eeStorage,
  profileId: string,
  outbox: readonly { id: string; g: string; payload: { t: string } }[],
  nowMs: number
): Promise<StoredMessage[]> {
  // Independent reads; the marked echoes are written in the caller's one
  // atomic batch with the rest of the retirement.
  const echoes = await Promise.all(
    outbox
      .filter((item) => item.payload.t === "msg")
      .map((item) => storage.getMessage(profileId, item.g, item.id))
  );
  return echoes
    .filter(
      (echo): echo is StoredMessage => echo?.pending === true && !echo.unsent
    )
    .map((echo) => ({
      ...echo,
      pending: false,
      unsent: { reason: "suite_upgrade" as const, at: nowMs },
    }));
}

/**
 * Retires the profile's old-suite device in one atomic write and returns how
 * many conversations are now read-only. `expectedVersion` is the caller's
 * state version (the write bumps it, so a tab still running the old device
 * stops instead of writing it back). Queued messages become "unsent", never
 * sent and never lost. Running it again changes nothing: the outbox is
 * empty, the groups are superseded and the device is retired.
 */
export async function retireOldSuiteDevice(
  storage: E2eeStorage,
  profileId: string,
  device: StoredDevice,
  expectedVersion: number,
  nowMs: number
): Promise<number> {
  const groups = await storage.listGroups(profileId);
  const outbox = await storage.listOutbox(profileId);
  const unsent = await unsentEchoes(storage, profileId, outbox, nowMs);
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
    messages: unsent,
    deleteOutbox: outbox.map((item) => item.id),
  });
  return countSuperseded(groups) + superseded.length;
}
