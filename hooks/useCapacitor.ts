"use client";

import { useSyncExternalStore } from "react";
import {
  getCapacitorSnapshot,
  getServerCapacitorSnapshot,
  subscribeToCapacitorStore,
} from "./nativeDeviceStore";

const useCapacitor = () => {
  return useSyncExternalStore(
    subscribeToCapacitorStore,
    getCapacitorSnapshot,
    getServerCapacitorSnapshot
  );
};

export default useCapacitor;
