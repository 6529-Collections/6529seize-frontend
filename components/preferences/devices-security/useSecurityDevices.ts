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
import type { E2eeDeviceInfo } from "@/lib/e2ee/types";
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
  const engine = e2ee.engine;
  const engineReady =
    engine !== null &&
    (e2ee.status === "ready" || e2ee.status === "device-limit");
  // At the device limit the engine lists devices but this browser has no
  // registered device to sign a revocation or rename with.
  const engineCanAct = engine !== null && e2ee.status === "ready";
  const encryptionEnabled = isE2eeEnabled() && profileId !== null;
  const apiDevicesQuery = useQuery({
    queryKey: [QueryKey.E2EE_PROFILE_DEVICES, profileId, listAddress],
    enabled: encryptionEnabled && listAddress !== null && !engineReady,
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
  const engineDevices = e2ee.devices;
  const labels = useLabelOverrides(engineDevices);

  const grants = grantsQuery.data ?? EMPTY_GRANTS;
  const apiDevices = apiDevicesQuery.data ?? EMPTY_API_DEVICES;
  const classified = useMemo(
    () =>
      classifyDevices({
        grants,
        encryptedDevices: engineReady
          ? labels.engineInputs
          : apiDevices.map(fromApi),
        ownSigningKeys: local.publicKeys,
        now,
      }),
    [apiDevices, engineReady, grants, labels.engineInputs, local.publicKeys, now]
  );

  // Without the encrypted-DMs list a grant can't be told apart from a
  // combined one, so nothing is revocable until it is known.
  const encryptedKnown =
    !encryptionEnabled || engineReady || apiDevicesQuery.isSuccess;
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

  const revoke = async (device: SecurityDevice) => {
    const encrypted = device.encryptedDevice;
    if (encrypted && device.encryptedDms?.status === "active" && engineCanAct) {
      // A combined grant ends with its device.
      await engine.revokeDevice(encrypted.deviceKey);
      void grantsQuery.refetch();
      return;
    }
    if (device.grant && device.signedPosts?.status === "active") {
      if (!(await revokeGrant(device.grant))) {
        throw new Error("Device grant revoke failed");
      }
      if (encryptionEnabled && !engineReady) {
        void apiDevicesQuery.refetch();
      }
      return;
    }
    throw new DeviceActionUnavailableError();
  };

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
      if (engineReady) {
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
      if (encryptionEnabled && !engineReady) {
        void apiDevicesQuery.refetch();
      }
    },
    localKeysUnreadable: local.failed,
    canRevoke,
    revokeBlocker,
    revoke,
    canRename,
    rename,
  };
}
