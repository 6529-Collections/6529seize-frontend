"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { useAuth } from "@/components/auth/Auth";
import { useSeizeConnectContext } from "@/components/auth/SeizeConnectContext";
import { QueryKey } from "@/components/react-query-wrapper/query-keys";
import { isE2eeEnabled } from "@/config/e2eeEnv";
import type { ApiDeviceGrant } from "@/generated/models/ApiDeviceGrant";
import {
  useDeviceGrants,
  useRevokeDeviceGrant,
} from "@/hooks/device-signing/useDeviceGrants";
import { useLocalDeviceKeys } from "@/hooks/device-signing/useLocalDeviceKeys";
import { useMinuteClock } from "@/hooks/device-signing/useMinuteClock";
import { type UseE2eeResult, useE2ee } from "@/hooks/e2ee/useE2ee";
import type { ApiE2eeDevice, ApiE2eeMe } from "@/lib/e2ee/api-types";
import type { E2eeDeviceInfo, E2eeEngine } from "@/lib/e2ee/types";
import { useRemoveE2eeLocalData } from "@/components/e2ee/useRemoveE2eeLocalData";
import {
  storedE2eeDeviceKeyQueryKey,
  useStoredE2eeDeviceKey,
} from "./useStoredE2eeDeviceKey";
import { commonApiFetch, commonApiPost } from "@/services/api/common-api";
import {
  classifyDevices,
  type ClassifiedDevices,
  type DevicePlatform,
  type EncryptedDeviceInput,
  type SecurityDevice,
} from "./classifyDevices";

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
    markRevoked: (key: string) => setRevoked((keys) => new Set([...keys, key])),
  };
}

/** The profile's encrypted-DMs devices from `e2ee/me`, while the engine's list isn't shown. */
function useApiDevices(
  profileId: string | null,
  listAddress: string | null,
  enabled: boolean
) {
  return useQuery({
    queryKey: [QueryKey.E2EE_PROFILE_DEVICES, profileId, listAddress],
    enabled,
    queryFn: async ({ signal }) => {
      const data = await commonApiFetch<ApiE2eeMe>({
        endpoint: "e2ee/me",
        signal,
      });
      if (data.profile_id !== profileId) {
        throw new Error("Device profile changed");
      }
      return data.devices;
    },
  });
}

/** Thrown when a revoke needs the encrypted-messages engine and it isn't ready. */
export class DeviceActionUnavailableError extends Error {
  constructor() {
    super("E2EE_NOT_READY");
    this.name = "DeviceActionUnavailableError";
  }
}

/** The device's row doesn't offer Revoke now (for example its list reloads). */
export class DeviceNotRevocableError extends Error {
  constructor() {
    super("DEVICE_NOT_REVOCABLE");
    this.name = "DeviceNotRevocableError";
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
 * This browser's stored encrypted device after it was revoked: an unsigned
 * revoke leaves its chats saved here until the user removes them.
 */
export interface LeftoverLocalData {
  readonly deviceKey: string;
  readonly label: string;
}

/** This browser's stored encrypted device, when the list shows it revoked. */
function findLeftover(
  devices: readonly EncryptedDeviceInput[],
  storedKey: string | null | undefined
): LeftoverLocalData | null {
  if (!storedKey) {
    return null;
  }
  const device = devices.find(
    (item) => item.deviceKey.toLowerCase() === storedKey
  );
  const revokedAt = device?.revokedAt ?? null;
  if (device === undefined || revokedAt === null) {
    return null;
  }
  return { deviceKey: storedKey, label: device.label };
}

interface RevokeContext {
  readonly engine: E2eeEngine | null;
  readonly engineCanAct: boolean;
  readonly revokeGrant: (grant: ApiDeviceGrant) => Promise<boolean>;
  /** After any successful revoke: refresh the lists. */
  readonly afterRevoke: (unsignedDeviceKey: string | null) => void;
}

/**
 * Revokes one device. With encrypted messages running here the engine
 * signs the encrypted device's revocation (a combined grant ends with it;
 * the device verifies it and deletes its own chats, this browser included).
 * Otherwise the grant is revoked and the server revokes its encrypted
 * device unsigned; nothing is deleted anywhere, this browser included (it
 * then offers its own removal, with a confirmation).
 */
async function revokeSecurityDevice(
  ctx: RevokeContext,
  device: SecurityDevice
): Promise<void> {
  const encrypted = device.encryptedDevice;
  const dmsActive = device.encryptedDms?.status === "active";
  if (encrypted && dmsActive && ctx.engine && ctx.engineCanAct) {
    await ctx.engine.revokeDevice(encrypted.deviceKey);
    ctx.afterRevoke(null);
    return;
  }
  if (!device.grant || device.signedPosts?.status !== "active") {
    throw new DeviceActionUnavailableError();
  }
  if (!(await ctx.revokeGrant(device.grant))) {
    throw new Error("Device grant revoke failed");
  }
  ctx.afterRevoke(
    dmsActive && encrypted ? encrypted.deviceKey.toLowerCase() : null
  );
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
  /**
   * This browser's own encrypted device is known, or there can't be one, so
   * earlier setups can't include it. False while its stored key is read, and
   * when reading it failed.
   */
  readonly ownDeviceKnown: boolean;
  /**
   * This browser's stored encrypted device couldn't be read, so clean-up and
   * removing this browser's encrypted data wait; retry reads it again.
   */
  readonly ownDeviceUnreadable: boolean;
  /** Whether a device can be revoked from here right now. */
  readonly canRevoke: (device: SecurityDevice) => boolean;
  /** Why an active device can't be revoked here yet, if that's the reason. */
  readonly revokeBlocker: (device: SecurityDevice) => RevokeBlocker | null;
  readonly revoke: (device: SecurityDevice) => Promise<void>;
  /** This browser's revoked encrypted device, whose chats are still here. */
  readonly leftoverLocalData: LeftoverLocalData | null;
  /**
   * Removes this browser's encrypted data while that device is still the
   * one stored here (after the user confirms).
   */
  readonly removeLeftoverLocalData: (deviceKey: string) => Promise<boolean>;
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
  const engineListed = engineReady && engineDevices.length > 0 && showsRevoked;
  const encryptionEnabled = isE2eeEnabled() && profileId !== null;
  const apiDevicesQuery = useApiDevices(
    profileId,
    listAddress,
    encryptionEnabled && listAddress !== null && !engineListed
  );
  const local = useLocalDeviceKeys(listAddress);
  const stored = useStoredE2eeDeviceKey(profileId, encryptionEnabled);
  const storedDeviceKey = stored.status === "known" ? stored.key : undefined;
  const queryClient = useQueryClient();
  const now = useMinuteClock();
  const labels = useLabelOverrides(engineDevices);

  const grants = grantsQuery.data ?? EMPTY_GRANTS;
  const apiDevices = apiDevicesQuery.data ?? EMPTY_API_DEVICES;
  const encryptedInputs = useMemo(
    () => (engineListed ? labels.engineInputs : apiDevices.map(fromApi)),
    [apiDevices, engineListed, labels.engineInputs]
  );
  const classified = useMemo(
    () =>
      classifyDevices({
        grants,
        encryptedDevices: encryptedInputs,
        ownSigningKeys: local.publicKeys,
        ownEncryptedDeviceKey: storedDeviceKey,
        now,
      }),
    [encryptedInputs, grants, local.publicKeys, now, storedDeviceKey]
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

  const refreshStoredKey = () =>
    queryClient.invalidateQueries({
      queryKey: storedE2eeDeviceKeyQueryKey(profileId),
    });
  const removeLeftoverLocalData = async (deviceKey: string) => {
    const removed = (await removeLocal?.(deviceKey)) === true;
    await refreshStoredKey();
    return removed;
  };
  const revoke = (device: SecurityDevice) =>
    revokeSecurityDevice(
      {
        engine,
        engineCanAct,
        revokeGrant,
        afterRevoke: (unsignedDeviceKey) => {
          void grantsQuery.refetch();
          if (unsignedDeviceKey !== null) {
            markRevoked(unsignedDeviceKey);
          }
          if (encryptionEnabled) {
            // Fetch now: a cached list still fresh by staleTime would show
            // the revoked device as on.
            void apiDevicesQuery.refetch();
            void refreshStoredKey();
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
      if (encryptionEnabled) {
        void refreshStoredKey();
      }
    },
    localKeysUnreadable: local.failed,
    ownDeviceKnown:
      !encryptionEnabled || engineListed || stored.status === "known",
    ownDeviceUnreadable: encryptionEnabled && stored.status === "failed",
    canRevoke,
    revokeBlocker,
    revoke,
    leftoverLocalData: findLeftover(encryptedInputs, storedDeviceKey),
    removeLeftoverLocalData,
    canRename,
    rename,
    signsRevocations: engineCanAct,
    approvalFor: (device) =>
      engineListed ? findApproval(engineDevices, device) : null,
    engine,
  };
}
