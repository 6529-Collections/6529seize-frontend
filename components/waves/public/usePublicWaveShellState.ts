"use client";

import { useWaveById } from "@/hooks/useWaveById";

type PublicWaveShellState =
  | { readonly status: "loading" }
  | { readonly status: "unavailable" }
  | { readonly status: "ready" };

interface UsePublicWaveShellStateOptions {
  readonly enabled?: boolean;
}

export function usePublicWaveShellState(
  waveId: string | null,
  { enabled = true }: UsePublicWaveShellStateOptions = {}
): PublicWaveShellState {
  const shouldResolve = enabled && waveId !== null;
  const { wave, isError } = useWaveById(waveId, { enabled: shouldResolve });

  if (!shouldResolve) {
    return { status: "loading" };
  }

  if (wave?.id === waveId) {
    return { status: "ready" };
  }

  if (isError) {
    return { status: "unavailable" };
  }

  return { status: "loading" };
}
