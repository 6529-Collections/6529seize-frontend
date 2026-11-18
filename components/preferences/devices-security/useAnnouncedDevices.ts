"use client";

import { useMemo } from "react";
import { useE2eeNewDevices } from "@/components/e2ee/devices/useE2eeNewDevices";
import { useDeviceSecurityNotices } from "@/hooks/device-signing/useDeviceSecurityNotices";
import { useE2ee } from "@/hooks/e2ee/useE2ee";
import type { SecurityDevice } from "./classifyDevices";

const NONE: ReadonlySet<string> = new Set();

/**
 * The devices the new-device alert announces, so Devices & security can
 * mark the same devices "New" until the alert is answered: the server's
 * pending device security notices, or, where the server has none, this
 * browser's own list of devices set up since it (the alert's fallback).
 */
export function useAnnouncedDevices(): (device: SecurityDevice) => boolean {
  const { devices, profileId, status, localDeviceKey } = useE2ee();
  const { notices } = useDeviceSecurityNotices(true);
  const { newDevices } = useE2eeNewDevices(
    profileId,
    devices,
    (status === "ready" || status === "device-limit") && notices === null
  );
  const own = localDeviceKey?.toLowerCase() ?? null;
  const { deviceKeys, grantIds } = useMemo(() => {
    if (!notices) {
      return {
        deviceKeys: new Set(newDevices.map((device) => device.deviceKey)),
        grantIds: NONE,
      };
    }
    const keys = new Set<string>();
    const grants = new Set<string>();
    for (const notice of notices) {
      const key = notice.encrypted_dm_device_key?.toLowerCase() ?? null;
      if (key !== null && key !== own) {
        keys.add(key);
      }
      if (notice.signing_grant_id !== null) {
        grants.add(notice.signing_grant_id);
      }
    }
    return { deviceKeys: keys, grantIds: grants };
  }, [newDevices, notices, own]);
  return (device) =>
    (device.encryptedDevice !== null &&
      deviceKeys.has(device.encryptedDevice.deviceKey.toLowerCase())) ||
    (device.grant !== null && grantIds.has(device.grant.id));
}
