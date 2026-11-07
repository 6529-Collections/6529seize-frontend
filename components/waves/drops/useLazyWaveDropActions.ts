"use client";

import { useCallback, useState } from "react";
import type { WaveDropActionsInitialFocus } from "./WaveDropActionsSentinel";

/**
 * The row's hover toolbar is about sixteen components. It mounts the first
 * time the row is hovered or takes focus, and then stays; until then
 * `WaveDropActionsSentinel` keeps it reachable from the keyboard.
 */
export function useLazyWaveDropActions() {
  const [isMounted, setIsMounted] = useState(false);
  const [initialFocus, setInitialFocus] =
    useState<WaveDropActionsInitialFocus | null>(null);
  const mount = useCallback(() => {
    setIsMounted(true);
  }, []);
  const mountWithFocus = useCallback((focus: WaveDropActionsInitialFocus) => {
    setInitialFocus(focus);
    setIsMounted(true);
  }, []);
  const clearInitialFocus = useCallback(() => {
    setInitialFocus(null);
  }, []);
  return { isMounted, initialFocus, mount, mountWithFocus, clearInitialFocus };
}
