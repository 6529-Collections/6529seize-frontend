import type { LeafActivity } from "../records";

/** Contract 8.2 required changes and 8.4 maintenance, as pure functions. */

export const T_IDLE_MS = 60 * 86_400_000;
export const T_PCS_MS = 14 * 86_400_000;
/** Tolerance when judging someone else's idle removal (clock skew). */
const IDLE_SKEW_MS = 86_400_000;

export interface MemberRef {
  deviceKey: string;
  profileId: string | null;
}

export interface DeviceStatus {
  /** Revocation with a verified signature (2.4). */
  revoked: boolean;
  /** Grant expiry (ms); null when unknown. */
  expiresAt: number | null;
  /** Grant verification failed when last checked. */
  badGrant: boolean;
}

export interface RequiredChangesInput {
  now: number;
  ownDeviceKey: string;
  ownProfileId: string;
  members: readonly MemberRef[];
  leaving: ReadonlySet<string>;
  badGrants: ReadonlySet<string>;
  deviceStatus: ReadonlyMap<string, DeviceStatus>;
  activity: Readonly<Record<string, LeafActivity>>;
  lastSelfUpdateAt: number;
  selfUpdateRequested: boolean;
  /** Active, grant-verified devices per member principal (when known). */
  activeDevices: ReadonlyMap<string, readonly string[]>;
}

export interface RequiredChanges {
  /** Revoked, expired, leaving or bad-grant leaves: overdue at once. */
  strictRemovals: string[];
  /** Idle > T_IDLE: overdue at discovery. */
  idleRemovals: string[];
  /** Active devices of this device's own principal that are not leaves. */
  ownAdds: string[];
  /** Active devices of other member principals that are not leaves. */
  otherAdds: { profileId: string; deviceKey: string }[];
  selfUpdateDue: boolean;
}

export function isStrictRemoval(
  deviceKey: string,
  input: Pick<
    RequiredChangesInput,
    "now" | "leaving" | "badGrants" | "deviceStatus"
  >
): boolean {
  if (input.leaving.has(deviceKey) || input.badGrants.has(deviceKey)) {
    return true;
  }
  const status = input.deviceStatus.get(deviceKey);
  if (!status) {
    return false;
  }
  const expired = status.expiresAt !== null && status.expiresAt <= input.now;
  return status.revoked || status.badGrant || expired;
}

function isIdle(
  activity: LeafActivity | undefined,
  now: number
): boolean {
  return activity !== undefined && now - activity.at > T_IDLE_MS;
}

/**
 * Lenient reading for validating another member's idle removal: history
 * before our join is unknown, so only positive evidence of activity within
 * T_IDLE rejects it.
 */
export function mayBeIdle(
  activity: LeafActivity | undefined,
  atMs: number
): boolean {
  if (activity?.known !== true) {
    return true;
  }
  return atMs - activity.at >= T_IDLE_MS - IDLE_SKEW_MS;
}

function memberPrincipals(
  input: RequiredChangesInput
): Map<string, Set<string>> {
  const principals = new Map<string, Set<string>>();
  for (const member of input.members) {
    if (member.profileId === null) {
      continue;
    }
    let leaves = principals.get(member.profileId);
    if (!leaves) {
      leaves = new Set();
      principals.set(member.profileId, leaves);
    }
    leaves.add(member.deviceKey);
  }
  // A principal whose every leaf is leaving has left: never re-add it.
  for (const [profileId, leaves] of principals) {
    if ([...leaves].every((key) => input.leaving.has(key))) {
      principals.delete(profileId);
    }
  }
  return principals;
}

function missingDevices(
  input: RequiredChangesInput,
  removed: ReadonlySet<string>
): RequiredChanges["otherAdds"] {
  const leafKeys = new Set(input.members.map((member) => member.deviceKey));
  const out: RequiredChanges["otherAdds"] = [];
  for (const profileId of memberPrincipals(input).keys()) {
    for (const deviceKey of input.activeDevices.get(profileId) ?? []) {
      const blocked =
        leafKeys.has(deviceKey) ||
        removed.has(deviceKey) ||
        isStrictRemoval(deviceKey, input);
      if (!blocked) {
        out.push({ profileId, deviceKey });
      }
    }
  }
  return out;
}

export function computeRequiredChanges(
  input: RequiredChangesInput
): RequiredChanges {
  const strictRemovals: string[] = [];
  const idleRemovals: string[] = [];
  for (const member of input.members) {
    if (member.deviceKey === input.ownDeviceKey) {
      continue;
    }
    if (isStrictRemoval(member.deviceKey, input)) {
      strictRemovals.push(member.deviceKey);
    } else if (isIdle(input.activity[member.deviceKey], input.now)) {
      idleRemovals.push(member.deviceKey);
    }
  }
  const removed = new Set([...strictRemovals, ...idleRemovals]);
  const adds = missingDevices(input, removed);
  return {
    strictRemovals,
    idleRemovals,
    ownAdds: adds
      .filter((add) => add.profileId === input.ownProfileId)
      .map((add) => add.deviceKey),
    otherAdds: adds.filter((add) => add.profileId !== input.ownProfileId),
    selfUpdateDue:
      input.selfUpdateRequested ||
      input.now - input.lastSelfUpdateAt >= T_PCS_MS,
  };
}

export const hasOverdueChanges = (changes: RequiredChanges): boolean =>
  changes.strictRemovals.length > 0 ||
  changes.idleRemovals.length > 0 ||
  changes.ownAdds.length > 0;
