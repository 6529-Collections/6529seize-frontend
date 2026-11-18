"use client";

import { useQuery } from "@tanstack/react-query";
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
import { readStoredE2eeDeviceKey } from "@/lib/e2ee/storage";
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

interface RevokeContext {
  readonly engine: E2eeEngine | null;
  readonly engineCanAct: boolean;
  readonly revokeGrant: (grant: ApiDeviceGrant) => Promise<boolean>;
  /**
   * This browser's own encrypted-DMs device key (lowercase), if any: the
   * engine's, or without it the stored device record's.
   */
  readonly localDeviceKey: () => Promise<string | null>;
  readonly removeLocal: (() => Promise<void>) | null;
  readonly refetchGrants: () => void;
  /** After a revoke the server made unsigned: refresh what's shown. */
  readonly afterUnsignedRevoke: () => void;
}

/**
 * Revokes one device. With encrypted messages running here the engine
 * signs the encrypted device's revocation (a combined grant ends with it).
 * Otherwise the grant is revoked and the server revokes its encrypted
 * device unsigned; if that device is this browser's own, nothing here would
 * clear it, so its local data is removed.
 */
async function revokeSecurityDevice(
  ctx: RevokeContext,
  device: SecurityDevice
): Promise<void> {
  const encrypted = device.encryptedDevice;
  const dmsActive = device.encryptedDms?.status === "active";
  if (encrypted && dmsActive && ctx.engine && ctx.engineCanAct) {
    await ctx.engine.revokeDevice(encrypted.deviceKey);
    ctx.refetchGrants();
    return;
  }
  if (!device.grant || device.signedPosts?.status !== "active") {
    throw new DeviceActionUnavailableError();
  }
  if (!(await ctx.revokeGrant(device.grant))) {
    throw new Error("Device grant revoke failed");
  }
  // Only this browser's own encrypted device, not any device whose grant
  // used an old signing key of this browser: that one may be another
  // browser's (or an earlier setup's), and its data isn't here.
  if (
    dmsActive &&
    encrypted !== null &&
    encrypted.deviceKey.toLowerCase() === (await ctx.localDeviceKey())
  ) {
    await ctx.removeLocal?.();
  }
  ctx.afterUnsignedRevoke();
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
  readonly revoke: (device: SecurityDevice) => Promise<void>;
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
  // The engine list as of an unsigned revoke it can't reload after (the
  // device limit): fresh API data stands in until the engine's list moves.
  const [staleEngineList, setStaleEngineList] = useState<
    readonly E2eeDeviceInfo[] | null
  >(null);
  const engineListed =
    engineReady &&
    engineDevices.length > 0 &&
    engineDevices !== staleEngineList;
  const encryptionEnabled = isE2eeEnabled() && profileId !== null;
  const apiDevicesQuery = useQuery({
    queryKey: [QueryKey.E2EE_PROFILE_DEVICES, profileId, listAddress],
    enabled: encryptionEnabled && listAddress !== null && !engineListed,
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
  const local = useLocalDeviceKeys(listAddress);
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
        now,
      }),
    [apiDevices, engineListed, grants, labels.engineInputs, local.publicKeys, now]
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

  const revoke = (device: SecurityDevice) =>
    revokeSecurityDevice(
      {
        engine,
        engineCanAct,
        revokeGrant,
        localDeviceKey: async () =>
          e2ee.localDeviceKey?.toLowerCase() ??
          (profileId === null ? null : readStoredE2eeDeviceKey(profileId)),
        removeLocal,
        refetchGrants: () => void grantsQuery.refetch(),
        afterUnsignedRevoke: () => {
          if (engineListed) {
            // The engine can't reload its list: the API list stands in.
            setStaleEngineList(engineDevices);
          }
          if (encryptionEnabled) {
            // Fetch now: a cached list (still fresh by staleTime) would
            // show the revoked device as on.
            void apiDevicesQuery.refetch();
          }
        },
      },
      device
    );

  const rename = async (device: SecurityDevice, name: string) => {
    const encrypted = device.encryptedDevice;
    if (encrypted && engineCanAct) {
      // The engine renames and reloads its list, so the row updates at once.
      await engine.renameDevice(encrypted.deviceKey, name);
      return;
    }
    if (encrypted) {
      await commonApiPost<{ label: string }, ApiE2eeDevice>({
        endpoint: `e2ee/devices/${encodeURIComponent(encrypted.deviceKey)}/label`,
        body: { label: name },
      });
      if (engineListed) {
        // The engine's list is shown but can't reload now: show the new
        // name until its next sync brings it.
        labels.remember(encrypted.deviceKey, name);
      } else {
        await apiDevicesQuery.refetch();
      }
      return;
    }
    if (device.grant) {
      await commonApiPost<{ label: string }, ApiDeviceGrant>({
        endpoint: `device-grants/${encodeURIComponent(device.grant.id)}/label`,
        body: { label: name },
      });
      await grantsQuery.refetch();
    }
  };

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
    canRename,
    rename,
    signsRevocations: engineCanAct,
    approvalFor: (device) =>
      engineListed ? findApproval(engineDevices, device) : null,
    engine,
  };
}
