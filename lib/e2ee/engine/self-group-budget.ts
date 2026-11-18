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
 * device of the last 90 days with when it was added (server time), its
 * grant's issue and expiry, and when it was revoked (server time).
 *
 * Time: the server's API gives no time of its own that a page can read, so
 * each device reads its own clock once per listing and counts monotonic
 * time from there. The argument assumes that clock is within SKEW_MS of
 * the server's; a listing that shows a server time later than that is
 * refused. Listing staleness is measured on the monotonic clock.
 *
 * - No claim without a listing at most LISTING_FRESH_MS old.
 * - "Recent" devices: those active at any time in the last RECENT_MS
 *   (widened by SKEW_MS on both sides).
 * - A device is new until SETTLE_MS (plus SKEW_MS) after the server added
 *   it. A new device may make 2 only if no other device was added (by the
 *   server's times) in the SPACING_MS before it, else none. It joins its
 *   siblings' self group either way: they claim its KeyPackages.
 * - Any other device may make 2, or 22 divided by the recent devices if
 *   smaller.
 * - The device with the lowest key among the recent devices may instead
 *   make 24 - 2 x the recent devices (20 with two of them), once SETTLE_MS
 *   (plus SKEW_MS) have passed since the later of its addition and its
 *   grant's issue.
 */

export const SELF_GROUP_CLAIMS_PER_HOUR = 24;
/** A settled device's share; the lowest key's share leaves room for these. */
const SMALL_SHARE = 2;
/** Room kept for one new device's share. */
const NEW_DEVICE_ROOM = SMALL_SHARE;
const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
/** Assumed bound on any device clock's offset from the server's. */
export const SKEW_MS = 5 * MINUTE;
/** Claims need a device listing at most this old (monotonic). */
export const LISTING_FRESH_MS = 15 * MINUTE;
/** At least an hour plus the listing staleness plus the skew margin. */
const SETTLE_MS = 90 * MINUTE;
/** Devices active this recently count; a removed lowest key keeps counting. */
const RECENT_MS = 90 * MINUTE;
/** At least the settle period plus an hour plus two skew margins. */
const SPACING_MS = 3 * HOUR;
/**
 * The window a device counts its own claims over: an hour, plus room for
 * its clock reading at two listings to differ by twice the skew bound.
 */
export const CLAIM_LOG_WINDOW_MS = HOUR + 2 * SKEW_MS;

/** A device as the profile's listing shows it (times in ms). */
export interface BudgetDevice {
  key: string;
  /** Server time. */
  addedAt: number;
  /** When its current grant was issued (by its own clock). */
  issuedAt: number;
  /** Server time. */
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

/** Not the lowest key's share until SETTLE_MS after the later of these. */
const since = (device: BudgetDevice): number =>
  Math.max(device.addedAt, device.issuedAt);

const activeDuring = (device: BudgetDevice, from: number, to: number) =>
  device.addedAt <= to &&
  (device.revokedAt === null || device.revokedAt > from) &&
  device.expiresAt > from;

/**
 * This device's self-group claims allowed in any window of
 * CLAIM_LOG_WINDOW_MS, by its clock as read at its last listing plus the
 * monotonic time since (`now`), `listingAge` after that listing.
 */
export function selfGroupClaimShare(input: {
  own: string;
  devices: readonly BudgetDevice[];
  now: number;
  listingAge: number;
}): number {
  const { now, listingAge } = input;
  const own = input.own.toLowerCase();
  const me = input.devices.find((device) => device.key === own);
  const listedAt = now - listingAge;
  const clockBehind = input.devices.some(
    (device) =>
      device.addedAt > listedAt + SKEW_MS ||
      (device.revokedAt !== null && device.revokedAt > listedAt + SKEW_MS)
  );
  if (
    !me ||
    listingAge < 0 ||
    listingAge > LISTING_FRESH_MS ||
    clockBehind ||
    !activeDuring(me, now, now)
  ) {
    return 0;
  }
  const recent = input.devices.filter((device) =>
    activeDuring(device, now - RECENT_MS - SKEW_MS, now + SKEW_MS)
  );
  const settledShare = Math.min(
    SMALL_SHARE,
    Math.floor(
      (SELF_GROUP_CLAIMS_PER_HOUR - NEW_DEVICE_ROOM) /
        Math.max(1, recent.length)
    )
  );
  if (now - me.addedAt < SETTLE_MS + SKEW_MS) {
    // A new device, unseen by listings made before it was added: one share
    // at most per SPACING_MS of additions, ordered by the server's times.
    const crowded = input.devices.some(
      (device) =>
        device.key !== own &&
        me.addedAt - device.addedAt < SPACING_MS &&
        (device.addedAt < me.addedAt ||
          (device.addedAt === me.addedAt && device.key < own))
    );
    return crowded ? 0 : settledShare;
  }
  if (now - since(me) < SETTLE_MS + SKEW_MS) {
    // A renewed grant: listed all along, so a settled share, but not yet
    // the lowest key's.
    return settledShare;
  }
  const lowest = recent.every((device) => device.key >= own);
  const lowestShare = SELF_GROUP_CLAIMS_PER_HOUR - SMALL_SHARE * recent.length;
  return lowest && lowestShare > settledShare ? lowestShare : settledShare;
}
