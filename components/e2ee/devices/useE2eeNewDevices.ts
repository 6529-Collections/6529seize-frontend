"use client";

import { useCallback, useEffect, useMemo, useSyncExternalStore } from "react";
import type { E2eeDeviceInfo } from "@/lib/e2ee/types";
import { readKnownE2eeDevices, writeKnownE2eeDevices } from "../e2eeLocalState";
import { useE2eeNow } from "../useE2eeNow";

const listeners = new Set<() => void>();
const notify = () => {
  for (const listener of [...listeners]) {
    listener();
  }
};
const subscribe = (listener: () => void) => {
  listeners.add(listener);
  globalThis.addEventListener("storage", listener);
  return () => {
    listeners.delete(listener);
    globalThis.removeEventListener("storage", listener);
  };
};

const serializeKnown = (profileId: string | null): string | null => {
  if (!profileId) {
    return null;
  }
  const known = readKnownE2eeDevices(profileId);
  return known ? [...known].sort((a, b) => a.localeCompare(b)).join(",") : null;
};

const isActiveOtherDevice = (device: E2eeDeviceInfo, now: number) =>
  !device.isThisDevice && device.revokedAt === null && device.expiresAt > now;

/** First sighting: record every current device without announcing any. */
function recordInitialDevices(
  profileId: string,
  devices: readonly E2eeDeviceInfo[]
): void {
  if (readKnownE2eeDevices(profileId) !== null) {
    return;
  }
  writeKnownE2eeDevices(
    profileId,
    devices.map((device) => device.deviceKey)
  );
  notify();
}

function findNewDevices(
  devices: readonly E2eeDeviceInfo[],
  knownSerialized: string,
  now: number
): E2eeDeviceInfo[] {
  const known = new Set(knownSerialized.split(",").filter(Boolean));
  return devices.filter(
    (device) => isActiveOtherDevice(device, now) && !known.has(device.deviceKey)
  );
}

interface E2eeNewDevices {
  /** Active devices of this profile the user has not been told about. */
  readonly newDevices: readonly E2eeDeviceInfo[];
  readonly acknowledge: (deviceKey: string) => void;
}

/**
 * Tracks which of the profile's devices this browser has already announced.
 * The first time it sees the list it records everything silently; later
 * additions surface as "{label} can now read your encrypted messages".
 */
export function useE2eeNewDevices(
  profileId: string | null,
  devices: readonly E2eeDeviceInfo[],
  enabled: boolean
): E2eeNewDevices {
  const now = useE2eeNow();
  const knownSerialized = useSyncExternalStore(
    subscribe,
    () => serializeKnown(profileId),
    () => null
  );
  const hasDevices = devices.length > 0;

  useEffect(() => {
    if (enabled && profileId && hasDevices) {
      recordInitialDevices(profileId, devices);
    }
  }, [enabled, profileId, hasDevices, devices]);

  const newDevices = useMemo(
    () =>
      enabled && knownSerialized !== null
        ? findNewDevices(devices, knownSerialized, now)
        : [],
    [devices, enabled, knownSerialized, now]
  );

  const acknowledge = useCallback(
    (deviceKey: string) => {
      if (!profileId) {
        return;
      }
      const known = readKnownE2eeDevices(profileId) ?? new Set<string>();
      known.add(deviceKey);
      writeKnownE2eeDevices(profileId, known);
      notify();
    },
    [profileId]
  );

  return { newDevices, acknowledge };
}
