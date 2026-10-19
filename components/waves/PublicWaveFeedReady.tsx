"use client";

import { createContext, useContext, useEffect } from "react";

export const PublicWaveFeedReadyContext = createContext<(() => void) | null>(
  null
);

// Signal from the rendered chat, rather than treating a populated data cache
// as evidence that its consuming UI has mounted.
export function usePublicWaveFeedReady(ready: boolean) {
  const markReady = useContext(PublicWaveFeedReadyContext);
  useEffect(() => {
    if (ready) markReady?.();
  }, [markReady, ready]);
}
