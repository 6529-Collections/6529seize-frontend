"use client";

import type { ApiWaveMetadata } from "@/generated/models/ApiWaveMetadata";
import { createContext, useContext } from "react";

// Reused wave controls can render a competition's appearance without replacing
// the parent wave's metadata cache or affecting the surrounding wave shell.
export const WaveDisplayMetadataContext = createContext<{
  readonly waveId: string;
  readonly metadata: ApiWaveMetadata[];
} | null>(null);

export function useWaveDisplayMetadataOverride(
  waveId: string | null | undefined
) {
  const context = useContext(WaveDisplayMetadataContext);
  return context && context.waveId === waveId ? context.metadata : undefined;
}
