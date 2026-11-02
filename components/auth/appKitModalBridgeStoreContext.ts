"use client";

import { createContext, useContext } from "react";
import type { AppKitModalBridgeStore } from "./AppKitModalBridge";

export const AppKitModalBridgeStoreContext =
  createContext<AppKitModalBridgeStore | null>(null);

export function useAppKitModalBridgeStore(): AppKitModalBridgeStore {
  const store = useContext(AppKitModalBridgeStoreContext);
  if (!store) {
    throw new Error("AppKit modal bridge store is unavailable");
  }
  return store;
}
