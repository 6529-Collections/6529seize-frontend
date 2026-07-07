"use client";

import { useSyncExternalStore } from "react";
import {
  getDeviceInfoSnapshot,
  getServerDeviceInfoSnapshot,
  subscribeToDeviceInfoStore,
  type DeviceInfo,
} from "./nativeDeviceStore";

export default function useDeviceInfo(): DeviceInfo {
  return useSyncExternalStore(
    subscribeToDeviceInfoStore,
    getDeviceInfoSnapshot,
    getServerDeviceInfoSnapshot
  );
}
