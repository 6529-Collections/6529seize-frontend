"use client";

import { createContext, useContext, type PropsWithChildren } from "react";

const WaveViewerModeContext = createContext(false);

interface WaveViewerModeProviderProps extends PropsWithChildren {
  readonly isPublicReadOnly?: boolean | undefined;
}

export function WaveViewerModeProvider({
  children,
  isPublicReadOnly = false,
}: WaveViewerModeProviderProps) {
  return (
    <WaveViewerModeContext.Provider value={isPublicReadOnly}>
      {children}
    </WaveViewerModeContext.Provider>
  );
}

export function useWaveViewerMode() {
  return {
    isPublicReadOnly: useContext(WaveViewerModeContext),
  };
}
