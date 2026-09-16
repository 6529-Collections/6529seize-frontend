"use client";

import { fullScreenSupported } from "@/helpers/Helpers";
import { useSyncExternalStore } from "react";

const subscribe = () => () => undefined;
const getServerSnapshot = () => false;

/** Keep capability-dependent controls identical in SSR and initial hydration. */
export function useFullScreenSupported(): boolean {
  return useSyncExternalStore(
    subscribe,
    fullScreenSupported,
    getServerSnapshot
  );
}
