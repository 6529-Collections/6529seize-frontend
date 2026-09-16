"use client";

import { useSyncExternalStore } from "react";

const subscribe = () => () => undefined;
const getSnapshot = () => true;
const getServerSnapshot = () => false;

/** False only for server HTML and its matching hydration render. */
export function useHasHydrated(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
