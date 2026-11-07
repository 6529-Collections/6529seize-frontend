"use client";

import { createContext, useContext } from "react";
import type { ActiveWaveContextData } from "./MyStreamContext.types";

/**
 * The open wave, separate from the stream context: it changes only when the
 * user opens another wave, not when wave lists refresh or messages arrive.
 * Components that need only the open wave read it here.
 */
const ActiveWaveContext = createContext<ActiveWaveContextData | null>(null);

export const ActiveWaveProvider = ActiveWaveContext.Provider;

export const useActiveWave = (): ActiveWaveContextData => {
  const context = useContext(ActiveWaveContext);
  if (!context) {
    throw new Error("useActiveWave must be used within a MyStreamProvider");
  }
  return context;
};

export const useActiveWaveOptional = (): ActiveWaveContextData | null =>
  useContext(ActiveWaveContext);
