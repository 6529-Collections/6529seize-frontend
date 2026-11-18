import type { ApiE2eeDevice } from "../api-types";

/**
 * How many KeyPackage claims each device may make for self groups in any
 * rolling hour (P60 §2 rule 6, "Claim budget").
 *
 * The server allows 120 claims per profile per clock hour, shared by all of
 * the profile's devices and by starting chats. Self groups keep to 24 of
 * them, so at least 96 always stay for the user's own chats. Devices do not
 * see each other's spending, so the shares below keep the profile's total
 * at 24 or less in every rolling hour on their own, whatever devices are
 * added or removed meanwhile; P60 has the argument. Every device works
 * from the profile's device listing (GET /e2ee/me), which shows every
 * device of the last 90 days with when it was added, revoked and expires.
 *
 * - No claim without a listing from the last 15 minutes.
 * - "Recent" devices: those active at any time in the last 75 minutes.
 * - A settled device (added, or its grant issued, 75 minutes ago or more)
 *   may make 2, or 22 divided by the recent devices if smaller.
 * - The settled device with the lowest key among the recent devices may
 *   instead make 24 - 2 x the recent devices (20 with two of them). A
 *   device that becomes lowest by a removal waits until the removed one is
 *   75 minutes gone; one that becomes lowest by being added is new for 75
 *   minutes first.
 * - A new device may make 2 only if no other device was added in the 150
 *   minutes before it, else none. It joins its siblings' self group either
 *   way: they claim its KeyPackages.
 */

export const SELF_GROUP_CLAIMS_PER_HOUR = 24;
/** A settled device's share; the lowest key's share leaves room for these. */
const SMALL_SHARE = 2;
/** Room kept for one new device's share. */
const NEW_DEVICE_ROOM = SMALL_SHARE;
const MINUTE = 60_000;
/** Claims need a device listing at most this old. */
export const LISTING_FRESH_MS = 15 * MINUTE;
/** A device is new for this long after it is added or its grant issued. */
const SETTLE_MS = 75 * MINUTE;
/** A new device claims only if no other device was added this shortly before. */
const NEW_DEVICE_SPACING_MS = 2 * SETTLE_MS;

/** A device as the profile's listing shows it (times in ms). */
export interface BudgetDevice {
  key: string;
  addedAt: number;
  /** When its current grant was issued. */
  issuedAt: number;
  revokedAt: number | null;
  expiresAt: number;
}

export const budgetDevice = (device: ApiE2eeDevice): BudgetDevice => ({
  key: device.device_key.toLowerCase(),
  addedAt: device.created_at,
  issuedAt: device.grant.issued_at * 1000,
  revokedAt: device.revoked_at,
  expiresAt: device.grant.expires_at * 1000,
});

/** Added (or its grant issued) at this time: new until SETTLE_MS later. */
const since = (device: BudgetDevice): number =>
  Math.max(device.addedAt, device.issuedAt);

const activeDuring = (device: BudgetDevice, from: number, to: number) =>
  device.addedAt <= to &&
  (device.revokedAt === null || device.revokedAt > from) &&
  device.expiresAt > from;

/**
 * This device's self-group claims allowed in any rolling hour, from the
 * profile's device listing made at `listedAt`.
 */
export function selfGroupClaimShare(input: {
  own: string;
  devices: readonly BudgetDevice[];
  now: number;
  listedAt: number;
}): number {
  const { now } = input;
  const own = input.own.toLowerCase();
  const me = input.devices.find((device) => device.key === own);
  if (
    !me ||
    now - input.listedAt > LISTING_FRESH_MS ||
    !activeDuring(me, now, now)
  ) {
    return 0;
  }
  const recent = input.devices.filter((device) =>
    activeDuring(device, now - SETTLE_MS, now)
  );
  const settledShare = Math.min(
    SMALL_SHARE,
    Math.floor(
      (SELF_GROUP_CLAIMS_PER_HOUR - NEW_DEVICE_ROOM) /
        Math.max(1, recent.length)
    )
  );
  if (now - since(me) < SETTLE_MS) {
    const crowded = input.devices.some(
      (device) =>
        device.key !== own &&
        since(me) - since(device) < NEW_DEVICE_SPACING_MS &&
        (since(device) < since(me) ||
          (since(device) === since(me) && device.key < own))
    );
    return crowded ? 0 : settledShare;
  }
  const lowest = recent.every((device) => device.key >= own);
  const lowestShare = SELF_GROUP_CLAIMS_PER_HOUR - SMALL_SHARE * recent.length;
  return lowest && lowestShare > settledShare ? lowestShare : settledShare;
}
