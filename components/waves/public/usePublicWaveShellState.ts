"use client";

import type { MinimalWave } from "@/contexts/wave/hooks/useEnhancedWavesListCore";
import { useMyStreamOptional } from "@/contexts/wave/MyStreamContext";
import type { ApiWave } from "@/generated/models/ApiWave";
import { getWaveDescriptionPreviewText } from "@/helpers/waves/waveDescriptionPreview";
import { useWaveById } from "@/hooks/useWaveById";

export interface PublicWaveShellData {
  readonly id: string;
  readonly name: string;
  readonly descriptionPreview: string | null;
  readonly membersCount: number;
  readonly postsCount: number;
}

export type PublicWaveShellState =
  | { readonly status: "loading" }
  | { readonly status: "unavailable" }
  | { readonly status: "ready"; readonly wave: PublicWaveShellData };

interface UsePublicWaveShellStateOptions {
  readonly enabled?: boolean;
}

function getPublicWaveShellDataFromApiWave(wave: ApiWave): PublicWaveShellData {
  return {
    id: wave.id,
    name: wave.name,
    descriptionPreview: getWaveDescriptionPreviewText(wave),
    membersCount: wave.metrics.subscribers_count,
    postsCount: wave.metrics.drops_count,
  };
}

function getPublicWaveShellDataFromMinimalWave(
  wave: MinimalWave
): PublicWaveShellData {
  return {
    id: wave.id,
    name: wave.name,
    descriptionPreview: wave.descriptionPreview,
    membersCount: wave.membersCount,
    postsCount: wave.postsCount,
  };
}

export function usePublicWaveShellState(
  waveId: string | null,
  { enabled = true }: UsePublicWaveShellStateOptions = {}
): PublicWaveShellState {
  const myStream = useMyStreamOptional();
  const shouldResolve = enabled && waveId !== null;
  const listWave = shouldResolve
    ? (myStream?.waves.list.find((wave) => wave.id === waveId) ?? null)
    : null;

  const { wave, isError } = useWaveById(waveId, {
    enabled: shouldResolve && !listWave,
  });

  if (!shouldResolve) {
    return { status: "loading" };
  }

  if (listWave) {
    return {
      status: "ready",
      wave: getPublicWaveShellDataFromMinimalWave(listWave),
    };
  }

  if (wave?.id === waveId) {
    return {
      status: "ready",
      wave: getPublicWaveShellDataFromApiWave(wave),
    };
  }

  if (isError) {
    return { status: "unavailable" };
  }

  return { status: "loading" };
}
