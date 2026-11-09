"use client";

import { createContext, useContext, useLayoutEffect } from "react";

/** Registration changes only when the displayed Chat panel changes. */
export const WaveChatReadContext = createContext<
  ((waveId: string) => () => void) | null
>(null);

export function useWaveChatReadRegistration(
  waveId: string | undefined,
  active: boolean
) {
  const register = useContext(WaveChatReadContext);
  useLayoutEffect(() => {
    if (active && waveId) return register?.(waveId);
    return undefined;
  }, [active, register, waveId]);
}
