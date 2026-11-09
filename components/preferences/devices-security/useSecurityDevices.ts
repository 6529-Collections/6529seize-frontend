"use client";

import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
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
import { useE2ee } from "@/hooks/e2ee/useE2ee";
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
  readonly revoke: (device: SecurityDevice) => Promise<void>;
  readonly renameThisDevice: (name: string) => Promise<void>;
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

  const grants = grantsQuery.data ?? EMPTY_GRANTS;
  const engineDevices = e2ee.devices;
  const apiDevices = apiDevicesQuery.data ?? EMPTY_API_DEVICES;
  const classified = useMemo(
    () =>
      classifyDevices({
        grants,
        encryptedDevices: engineReady
          ? engineDevices.map(fromEngine)
          : apiDevices.map(fromApi),
        ownSigningKeys: local.publicKeys,
        now,
      }),
    [apiDevices, engineDevices, engineReady, grants, local.publicKeys, now]
  );

  // Without the encrypted-DMs list a grant can't be told apart from a
  // combined one, so nothing is revocable until it is known.
  const encryptedKnown =
    !encryptionEnabled || engineReady || apiDevicesQuery.isSuccess;
  const canRevoke = (device: SecurityDevice) =>
    encryptedKnown &&
    ((device.encryptedDms?.status === "active" && engineReady) ||
      device.signedPosts?.status === "active");

  const revoke = async (device: SecurityDevice) => {
    const encrypted = device.encryptedDevice;
    if (
      encrypted &&
      device.encryptedDms?.status === "active" &&
      engineReady
    ) {
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

  const renameThisDevice = async (name: string) => {
    const device = classified.thisDevice;
    if (!device) {
      return;
    }
    if (device.encryptedDevice && engineReady) {
      await engine.renameThisDevice(name);
      return;
    }
    if (device.encryptedDevice) {
      await commonApiPost<{ label: string }, ApiE2eeDevice>({
        endpoint: `e2ee/devices/${encodeURIComponent(device.encryptedDevice.deviceKey)}/label`,
        body: { label: name },
      });
      await apiDevicesQuery.refetch();
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
    revoke,
    renameThisDevice,
  };
}
