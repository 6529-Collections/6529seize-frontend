import type { ApiDeviceGrant } from "@/generated/models/ApiDeviceGrant";

const DAY_MS = 24 * 60 * 60 * 1000;
/** Ended permissions stay listed this long, collapsed. */
export const DEVICE_HISTORY_WINDOW_MS = 30 * DAY_MS;

export type DevicePlatform = "web" | "desktop" | "phone";

export type PermissionStatus = "active" | "expired" | "revoked";

/** An encrypted-DMs device, from the engine or from `e2ee/me`. */
export interface EncryptedDeviceInput {
  readonly deviceKey: string;
  readonly label: string;
  readonly platform: DevicePlatform;
  readonly createdAt: number;
  readonly lastSeenAt: number | null;
  readonly expiresAt: number;
  readonly revokedAt: number | null;
  readonly isThisDevice: boolean;
  readonly verified: boolean;
  /** The signed-posts grant this device shares (a combined grant), if any. */
  readonly grantId: string | null;
}

export interface DevicePermission {
  readonly status: PermissionStatus;
  readonly expiresAt: number;
  readonly endedAt: number | null;
}

/** One device key: a browser or app, with each permission it holds. */
export interface SecurityDevice {
  /** The signed-posts grant id, else the encrypted-DMs device key. */
  readonly id: string;
  readonly label: string;
  readonly platform: DevicePlatform;
  readonly isThisDevice: boolean;
  readonly signedPosts: DevicePermission | null;
  readonly encryptedDms: DevicePermission | null;
  readonly grant: ApiDeviceGrant | null;
  readonly encryptedDevice: EncryptedDeviceInput | null;
  readonly createdAt: number;
  /** Later of the grant's last use and the device's last-seen time. */
  readonly lastActiveAt: number | null;
  /** The earliest expiry among its active permissions. */
  readonly expiresAt: number | null;
  /** When its last permission ended; null while one is active. */
  readonly endedAt: number | null;
  readonly wallet: string | null;
  /** The wallet signature of its encrypted-DMs device couldn't be checked. */
  readonly unverified: boolean;
}

export interface ClassifiedDevices {
  readonly thisDevice: SecurityDevice | null;
  readonly otherDevices: readonly SecurityDevice[];
  /**
   * Same name as this device, not this device, and no activity since this
   * device was set up: usually this browser before it lost its saved keys.
   */
  readonly earlierSetups: readonly SecurityDevice[];
  /** Ended in the last 30 days, newest first. */
  readonly history: readonly SecurityDevice[];
  /** Ended earlier than that; counted, not listed. */
  readonly olderHistoryCount: number;
}

export interface ClassifyDevicesInput {
  readonly grants: readonly ApiDeviceGrant[];
  readonly encryptedDevices: readonly EncryptedDeviceInput[];
  /** Lowercase public keys this browser holds for signed posts. */
  readonly ownSigningKeys: readonly string[];
  readonly now: number;
}

const permissionOf = (
  expiresAt: number,
  revokedAt: number | null,
  now: number
): DevicePermission => {
  if (revokedAt !== null) {
    return { status: "revoked", expiresAt, endedAt: revokedAt };
  }
  return expiresAt > now
    ? { status: "active", expiresAt, endedAt: null }
    : { status: "expired", expiresAt, endedAt: expiresAt };
};

const latest = (...values: readonly (number | null | undefined)[]) => {
  const present = values.filter(
    (value): value is number => typeof value === "number"
  );
  return present.length > 0 ? Math.max(...present) : null;
};

const isActive = (device: SecurityDevice) =>
  device.signedPosts?.status === "active" ||
  device.encryptedDms?.status === "active";

function buildDevice(
  grant: ApiDeviceGrant | null,
  encrypted: EncryptedDeviceInput | null,
  ownSigningKeys: ReadonlySet<string>,
  now: number
): SecurityDevice {
  const signedPosts = grant
    ? permissionOf(grant.expires_at, grant.revoked_at, now)
    : null;
  const encryptedDms = encrypted
    ? permissionOf(encrypted.expiresAt, encrypted.revokedAt, now)
    : null;
  const permissions = [signedPosts, encryptedDms].filter(
    (permission): permission is DevicePermission => permission !== null
  );
  const active = permissions.filter(({ status }) => status === "active");
  return {
    id: grant?.id ?? encrypted?.deviceKey ?? "",
    // The encrypted-DMs name is the one the owner can rename.
    label: encrypted?.label ?? grant?.device_label ?? "",
    platform: encrypted?.platform ?? "web",
    isThisDevice:
      encrypted?.isThisDevice === true ||
      (grant !== null && ownSigningKeys.has(grant.device_key.toLowerCase())),
    signedPosts,
    encryptedDms,
    grant,
    encryptedDevice: encrypted,
    createdAt: Math.min(
      grant?.created_at ?? Number.POSITIVE_INFINITY,
      encrypted?.createdAt ?? Number.POSITIVE_INFINITY
    ),
    lastActiveAt: latest(grant?.last_used_at, encrypted?.lastSeenAt),
    expiresAt:
      active.length > 0
        ? Math.min(...active.map(({ expiresAt }) => expiresAt))
        : null,
    endedAt:
      active.length > 0 ? null : latest(...permissions.map((p) => p.endedAt)),
    wallet: grant?.wallet ?? null,
    unverified: encrypted !== null && !encrypted.verified,
  };
}

/** Merges each grant with the encrypted-DMs device that shares it. */
function mergeDevices({
  grants,
  encryptedDevices,
  ownSigningKeys,
  now,
}: ClassifyDevicesInput): SecurityDevice[] {
  const ownKeys = new Set(ownSigningKeys.map((key) => key.toLowerCase()));
  const byGrant = new Map(
    encryptedDevices
      .filter((device) => device.grantId !== null)
      .map((device) => [device.grantId, device] as const)
  );
  const merged = grants.map((grant) =>
    buildDevice(grant, byGrant.get(grant.id) ?? null, ownKeys, now)
  );
  const grantIds = new Set(grants.map((grant) => grant.id));
  const unmatched = encryptedDevices
    .filter((device) => device.grantId === null || !grantIds.has(device.grantId))
    .map((device) => buildDevice(null, device, ownKeys, now));
  return [...merged, ...unmatched];
}

const byNewest = (a: SecurityDevice, b: SecurityDevice) =>
  (b.lastActiveAt ?? b.createdAt) - (a.lastActiveAt ?? a.createdAt);

/**
 * Sorts every device key of the profile into the groups of the Devices &
 * security tab. Pure: the same input always gives the same groups.
 */
export function classifyDevices(input: ClassifyDevicesInput): ClassifiedDevices {
  const devices = mergeDevices(input);
  const active = devices.filter(isActive);
  // The newest active match wins if this browser holds more than one key.
  const thisDevice =
    active
      .filter((device) => device.isThisDevice)
      .toSorted((a, b) => b.createdAt - a.createdAt)[0] ?? null;
  const rest = active.filter((device) => device !== thisDevice);
  const isEarlierSetup = (device: SecurityDevice) =>
    thisDevice !== null &&
    device.label === thisDevice.label &&
    device.createdAt < thisDevice.createdAt &&
    (device.lastActiveAt === null ||
      device.lastActiveAt <= thisDevice.createdAt);
  const ended = devices
    .filter((device) => !isActive(device))
    .toSorted((a, b) => (b.endedAt ?? 0) - (a.endedAt ?? 0));
  const recent = ended.filter(
    (device) =>
      device.endedAt !== null &&
      input.now - device.endedAt <= DEVICE_HISTORY_WINDOW_MS
  );
  return {
    thisDevice,
    otherDevices: rest
      .filter((device) => !isEarlierSetup(device))
      .toSorted(byNewest),
    earlierSetups: rest.filter(isEarlierSetup).toSorted(byNewest),
    history: recent,
    olderHistoryCount: ended.length - recent.length,
  };
}
