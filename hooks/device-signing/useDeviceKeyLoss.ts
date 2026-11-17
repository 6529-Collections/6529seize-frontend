"use client";

import {
  parseDeviceKeyLoss,
  readDeviceKeyLossRaw,
  subscribeToDeviceKeyLoss,
  type DeviceKeyLoss,
} from "@/lib/device-signing/key-loss";
import { useMemo, useSyncExternalStore } from "react";

const getServerSnapshot = (): string | null => null;

/** The recorded loss of this browser's key store for the wallet, if any. */
export function useDeviceKeyLoss(address: string | null): DeviceKeyLoss | null {
  const raw = useSyncExternalStore(
    subscribeToDeviceKeyLoss,
    () => (address ? readDeviceKeyLossRaw(address) : null),
    getServerSnapshot
  );
  return useMemo(() => parseDeviceKeyLoss(raw), [raw]);
}
