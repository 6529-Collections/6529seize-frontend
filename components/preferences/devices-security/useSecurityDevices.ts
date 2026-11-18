"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { useAuth } from "@/components/auth/Auth";
import { useSeizeConnectContext } from "@/components/auth/SeizeConnectContext";
import { isE2eeEnabled } from "@/config/e2eeEnv";
import type { ApiDeviceGrant } from "@/generated/models/ApiDeviceGrant";
import {
  useDeviceGrants,
  useRevokeDeviceGrant,
} from "@/hooks/device-signing/useDeviceGrants";
import { useLocalDeviceKeys } from "@/hooks/device-signing/useLocalDeviceKeys";
import { useMinuteClock } from "@/hooks/device-signing/useMinuteClock";
import { type UseE2eeResult, useE2ee } from "@/hooks/e2ee/useE2ee";
import type { ApiE2eeDevice } from "@/lib/e2ee/api-types";
import type { E2eeDeviceInfo, E2eeEngine } from "@/lib/e2ee/types";
import { useRemoveE2eeLocalData } from "@/components/e2ee/useRemoveE2eeLocalData";
import { readStoredE2eeDeviceKey } from "@/lib/e2ee/stored-device-key";
import {
  storedE2eeDeviceKeyQueryKey,
  useStoredE2eeDeviceKey,
} from "./useStoredE2eeDeviceKey";
import { commonApiPost } from "@/services/api/common-api";
import {
  classifyDevices,
  type ClassifiedDevices,
  type DevicePlatform,
  type EncryptedDeviceInput,
  type SecurityDevice,
} from "./classifyDevices";
import {
  fetchOwnE2eeDevices,
  ownE2eeDevicesQueryKey,
} from "./ownE2eeDevicesQuery";

const fromEngine = (device: E2eeDeviceInfo): EncryptedDeviceInput => ({
  deviceKey: device.deviceKey,
  label: device.label,
  platform: device.platform,
  createdAt: device.createdAt,
  lastSeenAt: device.lastSeenAt,
  expiresAt: device.expiresAt,
  revokedAt: device.revokedAt,
  isThisDevice: device.isThisDevice,
  verified: device.verified,
  grantId: device.authorProofGrantId ?? null,
});

/** The engine's record of `device` when it still waits for "Add device". */
const findApproval = (
  engineDevices: readonly E2eeDeviceInfo[],
  device: SecurityDevice
): E2eeDeviceInfo | null => {
  const key = device.encryptedDevice?.deviceKey;
  return (
    engineDevices.find(
      (info) =>
        key !== undefined &&
        info.deviceKey === key &&
        info.needsApproval === true &&
        info.revokedAt === null
    ) ?? null
  );
};

const toPlatform = (platform: string): DevicePlatform =>
  platform === "desktop" || platform === "phone" ? platform : "web";

/**
 * A server record, used while the engine can't run here. It can't tell
 * which device is this browser or check signatures, so it claims neither.
 */
const fromApi = (device: ApiE2eeDevice): EncryptedDeviceInput => ({
  deviceKey: device.device_key.toLowerCase(),
  label: device.label,
  platform: toPlatform(device.platform),
  createdAt: device.created_at,
  lastSeenAt: device.last_seen_at,
  expiresAt: device.grant.expires_at * 1000,
  revokedAt: device.revoked_at,
  isThisDevice: false,
  verified: true,
  grantId:
    device.grant_message === null || device.grant_message === undefined
      ? null
      : device.grant_id,
});

const EMPTY_GRANTS: readonly ApiDeviceGrant[] = [];
const EMPTY_API_DEVICES: readonly ApiE2eeDevice[] = [];

const NO_KEYS: ReadonlySet<string> = new Set();

/** Whether the engine's list shows every device revoked unsigned here ended. */
const engineShowsRevoked = (
  devices: readonly E2eeDeviceInfo[],
  revoked: ReadonlySet<string>
): boolean =>
  [...revoked].every((key) => {
    const listed = devices.find(
      (device) => device.deviceKey.toLowerCase() === key
    );
    return listed?.revokedAt !== null;
  });

/**
 * Devices revoked unsigned here. The API list stays authoritative until the
 * engine's own list shows each of them inactive: it may have read its list
 * before the revoke, or can't reload at the device limit.
 */
function useRevokedUnsigned(engineDevices: readonly E2eeDeviceInfo[]) {
  const [revoked, setRevoked] = useState<ReadonlySet<string>>(NO_KEYS);
  return {
    showsRevoked: engineShowsRevoked(engineDevices, revoked),
    markRevoked: (key: string) =>
      setRevoked((keys) => new Set([...keys, key])),
  };
}

/** The profile's encrypted-DMs devices from `e2ee/me`, while the engine's list isn't shown. */
function useApiDevices(
  profileId: string | null,
  listAddress: string | null,
  enabled: boolean
) {
  return useQuery({
    queryKey: ownE2eeDevicesQueryKey(profileId, listAddress),
    enabled,
    queryFn: ({ signal }) => fetchOwnE2eeDevices(profileId, signal),
  });
}

/** Thrown when a revoke needs the encrypted-messages engine and it isn't ready. */
export class DeviceActionUnavailableError extends Error {
  constructor() {
    super("E2EE_NOT_READY");
    this.name = "DeviceActionUnavailableError";
  }
}

/** The device changed (or left the list) after its revoke was opened. */
export class DeviceChangedError extends Error {
  constructor() {
    super("DEVICE_CHANGED");
    this.name = "DeviceChangedError";
  }
}

/**
 * How a revoke ended for this browser's own data: nothing to remove here;
 * removed; or the revoke went through but removing this browser's
 * encrypted data failed (retried with retryLocalCleanup, without revoking
 * again).
 */
export type LocalCleanup =
  | { readonly kind: "none" }
  | { readonly kind: "removed" }
  | { readonly kind: "failed"; readonly deviceKey: string };

interface RevokeContext {
  readonly engine: E2eeEngine | null;
  readonly engineCanAct: boolean;
  readonly revokeGrant: (grant: ApiDeviceGrant) => Promise<boolean>;
  /** This browser's encrypted device key from its storage (lowercase). */
  readonly storedDeviceKey: () => Promise<string | null>;
  /** Removes local data only while that device is still stored here. */
  readonly removeLocal: (deviceKey: string) => Promise<boolean>;
  /** After any successful revoke: refresh the lists. */
  readonly afterRevoke: (unsignedDeviceKey: string | null) => void;
}

/**
 * Revokes one device. With encrypted messages running here the engine
 * signs the encrypted device's revocation (a combined grant ends with it;
 * the engine clears this browser itself). Otherwise the grant is revoked
 * and the server revokes its encrypted device unsigned; if that device is
 * this browser's stored one, its local data is removed (checked again under
 * the engine lock). The revoke and the local removal are reported apart: a
 * failed removal doesn't fail the revoke.
 */
async function revokeSecurityDevice(
  ctx: RevokeContext,
  device: SecurityDevice
): Promise<LocalCleanup> {
  const encrypted = device.encryptedDevice;
  const dmsActive = device.encryptedDms?.status === "active";
  if (encrypted && dmsActive && ctx.engine && ctx.engineCanAct) {
    await ctx.engine.revokeDevice(encrypted.deviceKey);
    ctx.afterRevoke(null);
    return { kind: "none" };
  }
  if (!device.grant || device.signedPosts?.status !== "active") {
    throw new DeviceActionUnavailableError();
  }
  if (!(await ctx.revokeGrant(device.grant))) {
    throw new Error("Device grant revoke failed");
  }
  const unsignedKey =
    dmsActive && encrypted ? encrypted.deviceKey.toLowerCase() : null;
  ctx.afterRevoke(unsignedKey);
  // Only this browser's own encrypted device, not any device whose grant
  // used an old signing key of this browser: its data isn't here.
  if (unsignedKey === null || unsignedKey !== (await ctx.storedDeviceKey())) {
    return { kind: "none" };
  }
  try {
    return (await ctx.removeLocal(unsignedKey))
      ? { kind: "removed" }
      : { kind: "none" };
  } catch {
    return { kind: "failed", deviceKey: unsignedKey };
  }
}

interface RenameContext {
  /** The engine when it can act (it renames and reloads its list). */
  readonly engine: E2eeEngine | null;
  readonly afterEncryptedRename: (key: string, label: string) => Promise<void>;
  readonly afterGrantRename: () => Promise<void>;
}

/** Renames one device: through the engine, or the encrypted device or grant's API. */
async function renameSecurityDevice(
  ctx: RenameContext,
  device: SecurityDevice,
  name: string
): Promise<void> {
  const encrypted = device.encryptedDevice;
  if (encrypted && ctx.engine) {
    await ctx.engine.renameDevice(encrypted.deviceKey, name);
    return;
  }
  if (encrypted) {
    await commonApiPost<{ label: string }, ApiE2eeDevice>({
      endpoint: `e2ee/devices/${encodeURIComponent(encrypted.deviceKey)}/label`,
      body: { label: name },
    });
    await ctx.afterEncryptedRename(encrypted.deviceKey, name);
    return;
  }
  if (device.grant) {
    await commonApiPost<{ label: string }, ApiDeviceGrant>({
      endpoint: `device-grants/${encodeURIComponent(device.grant.id)}/label`,
      body: { label: name },
    });
    await ctx.afterGrantRename();
  }
}

/**
 * Why Revoke isn't offered for a device that holds encrypted DMs, from the
 * state of encrypted messages in this browser; each has one next step.
 */
export type RevokeBlocker =
  | "loading"
  | "elsewhere"
  | "failed"
  | "needs-dms"
  | "device-limit"
  | "unsupported"
  | "no-wallet";

const BLOCKERS: Partial<Record<UseE2eeResult["status"], RevokeBlocker>> = {
  idle: "loading",
  loading: "loading",
  elsewhere: "elsewhere",
  "load-failed": "failed",
  error: "failed",
  "needs-enrollment": "needs-dms",
  enrolling: "needs-dms",
  "device-limit": "device-limit",
  unsupported: "unsupported",
  unavailable: "no-wallet",
};

/** A rename made through the API, shown until the engine's list catches up. */
interface LabelOverride {
  readonly label: string;
  /** The engine's label when it was renamed; a change means it caught up. */
  readonly previous: string;
}

/**
 * The engine's devices as classify input, with names renamed through the
 * API shown until the engine's own list has a new name.
 */
function useLabelOverrides(engineDevices: readonly E2eeDeviceInfo[]) {
  const [overrides, setOverrides] = useState<
    ReadonlyMap<string, LabelOverride>
  >(new Map());
  const engineInputs = useMemo(
    () =>
      engineDevices.map((device): EncryptedDeviceInput => {
        const input = fromEngine(device);
        const override = overrides.get(device.deviceKey);
        return override?.previous === device.label
          ? { ...input, label: override.label }
          : input;
      }),
    [engineDevices, overrides]
  );
  const remember = (deviceKey: string, label: string) => {
    const previous =
      engineDevices.find((device) => device.deviceKey === deviceKey)?.label ??
      "";
    setOverrides((current) =>
      new Map(current).set(deviceKey, { label, previous })
    );
  };
  return { engineInputs, remember };
}

export interface SecurityDevicesState extends ClassifiedDevices {
  /** Acting as a proxy: devices belong to the profile's own sessions. */
  readonly proxy: boolean;
  readonly loading: boolean;
  readonly failed: boolean;
  readonly retry: () => void;
  /** This browser couldn't read its own keys, so "this device" is unknown. */
  readonly localKeysUnreadable: boolean;
  /** Whether a device can be revoked from here right now. */
  readonly canRevoke: (device: SecurityDevice) => boolean;
  /** Why an active device can't be revoked here yet, if that's the reason. */
  readonly revokeBlocker: (device: SecurityDevice) => RevokeBlocker | null;
  readonly revoke: (device: SecurityDevice) => Promise<LocalCleanup>;
  /** Removes this browser's data after a revoke whose removal failed. */
  readonly retryLocalCleanup: (deviceKey: string) => Promise<boolean>;
  /** Whether a device can be renamed from here right now. */
  readonly canRename: (device: SecurityDevice) => boolean;
  readonly rename: (device: SecurityDevice, name: string) => Promise<void>;
  /**
   * Whether a revoke from here is signed by this browser's encrypted-DMs
   * device, so the revoked device can verify it and delete its history.
   * Unsigned (encrypted messages not running here), a combined grant's
   * device keeps its history until it's removed there.
   */
  readonly signsRevocations: boolean;
  /**
   * This profile's own device that this browser doesn't add to encrypted
   * chats yet (signed by a wallet not added here), for "Add device".
   */
  readonly approvalFor: (device: SecurityDevice) => E2eeDeviceInfo | null;
  readonly engine: E2eeEngine | null;
}

/**
 * Every device of the signed-in profile, from both permissions: signed-posts
 * grants from the API, and encrypted-DMs devices from the engine (or from
 * the API while the engine can't run in this browser).
 */
export function useSecurityDevices(): SecurityDevicesState {
  const { activeProfileProxy, isAuthenticated, connectedProfile } = useAuth();
  const { address } = useSeizeConnectContext();
  const listAddress =
    !activeProfileProxy && isAuthenticated && address
      ? address.toLowerCase()
      : null;
  const profileId = connectedProfile?.id ?? null;
  const grantsQuery = useDeviceGrants(listAddress);
  const { revoke: revokeGrant } = useRevokeDeviceGrant();
  const e2ee = useE2ee();
  const removeLocal = useRemoveE2eeLocalData();
  const engine = e2ee.engine;
  const engineReady =
    engine !== null &&
    (e2ee.status === "ready" || e2ee.status === "device-limit");
  // At the device limit the engine lists devices but this browser has no
  // registered device to sign a revocation or rename with.
  const engineCanAct = engine !== null && e2ee.status === "ready";
  // A running engine lists at least this device (all ten at the limit). An
  // empty list hasn't loaded yet: the API list stands in until it has, so a
  // combined device never shows as signed posts only.
  const engineDevices = e2ee.devices;
  const { showsRevoked, markRevoked } = useRevokedUnsigned(engineDevices);
  const engineListed =
    engineReady && engineDevices.length > 0 && showsRevoked;
  const encryptionEnabled = isE2eeEnabled() && profileId !== null;
  const apiDevicesQuery = useApiDevices(
    profileId,
    listAddress,
    encryptionEnabled && listAddress !== null && !engineListed
  );
  const local = useLocalDeviceKeys(listAddress);
  const storedDeviceKey = useStoredE2eeDeviceKey(profileId, encryptionEnabled);
  const queryClient = useQueryClient();
  const now = useMinuteClock();
  const labels = useLabelOverrides(engineDevices);

  const grants = grantsQuery.data ?? EMPTY_GRANTS;
  const apiDevices = apiDevicesQuery.data ?? EMPTY_API_DEVICES;
  const classified = useMemo(
    () =>
      classifyDevices({
        grants,
        encryptedDevices: engineListed
          ? labels.engineInputs
          : apiDevices.map(fromApi),
        ownSigningKeys: local.publicKeys,
        ownEncryptedDeviceKey: storedDeviceKey,
        now,
      }),
    [
      apiDevices,
      engineListed,
      grants,
      labels.engineInputs,
      local.publicKeys,
      now,
      storedDeviceKey,
    ]
  );

  // Without the encrypted-DMs list a grant can't be told apart from a
  // combined one, so nothing is revocable until it is known.
  const encryptedKnown =
    !encryptionEnabled || engineListed || apiDevicesQuery.isSuccess;
  const canRevoke = (device: SecurityDevice) =>
    encryptedKnown &&
    ((device.encryptedDms?.status === "active" && engineCanAct) ||
      device.signedPosts?.status === "active");
  const revokeBlocker = (device: SecurityDevice): RevokeBlocker | null =>
    encryptedKnown &&
    !canRevoke(device) &&
    device.encryptedDms?.status === "active"
      ? (BLOCKERS[e2ee.status] ?? null)
      : null;
  const canRename = (device: SecurityDevice) =>
    encryptedKnown &&
    (device.signedPosts?.status === "active" ||
      device.encryptedDms?.status === "active");

  const removeLocalFor = async (deviceKey: string) =>
    (await removeLocal?.(deviceKey)) === true;
  const revoke = (device: SecurityDevice) =>
    revokeSecurityDevice(
      {
        engine,
        engineCanAct,
        revokeGrant,
        storedDeviceKey: () =>
          profileId === null
            ? Promise.resolve(null)
            : readStoredE2eeDeviceKey(profileId),
        removeLocal: removeLocalFor,
        afterRevoke: (unsignedDeviceKey) => {
          void grantsQuery.refetch();
          if (unsignedDeviceKey !== null) {
            markRevoked(unsignedDeviceKey);
          }
          if (encryptionEnabled) {
            // Fetch now: a cached list still fresh by staleTime would show
            // the revoked device as on.
            void apiDevicesQuery.refetch();
            void queryClient.invalidateQueries({
              queryKey: storedE2eeDeviceKeyQueryKey(profileId),
            });
          }
        },
      },
      device
    );

  const rename = (device: SecurityDevice, name: string) =>
    renameSecurityDevice(
      {
        engine: engineCanAct ? engine : null,
        // The engine's list is shown but can't reload now: show the new
        // name until its next sync brings it.
        afterEncryptedRename: engineListed
          ? (key, label) => {
              labels.remember(key, label);
              return Promise.resolve();
            }
          : async () => {
              await apiDevicesQuery.refetch();
            },
        afterGrantRename: async () => {
          await grantsQuery.refetch();
        },
      },
      device,
      name
    );

  return {
    ...classified,
    proxy: activeProfileProxy !== null,
    loading:
      grantsQuery.isLoading ||
      (apiDevicesQuery.isLoading && apiDevicesQuery.fetchStatus !== "idle"),
    failed: grantsQuery.isError || apiDevicesQuery.isError,
    retry: () => {
      void grantsQuery.refetch();
      if (encryptionEnabled && !engineListed) {
        void apiDevicesQuery.refetch();
      }
    },
    localKeysUnreadable: local.failed,
    canRevoke,
    revokeBlocker,
    revoke,
    retryLocalCleanup: removeLocalFor,
    canRename,
    rename,
    signsRevocations: engineCanAct,
    approvalFor: (device) =>
      engineListed ? findApproval(engineDevices, device) : null,
    engine,
  };
}
