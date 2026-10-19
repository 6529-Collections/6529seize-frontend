"use client";

import { createContext, useContext, useLayoutEffect } from "react";

export const PublicWaveFeedReadyContext = createContext<
  (() => (() => void) | undefined) | null
>(null);

// Signal from the rendered chat, rather than treating a populated data cache
// as evidence that its consuming UI has mounted.
export function usePublicWaveFeedReady(ready: boolean) {
  const markReady = useContext(PublicWaveFeedReadyContext);
  useLayoutEffect(() => {
    return ready ? markReady?.() : undefined;
  }, [markReady, ready]);
}
