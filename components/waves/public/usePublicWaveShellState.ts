"use client";

import type { ApiWave } from "@/generated/models/ApiWave";
import { getWaveDescriptionPreviewText } from "@/helpers/waves/waveDescriptionPreview";
import { useWaveById } from "@/hooks/useWaveById";

export interface PublicWaveShellData {
  readonly id: string;
  readonly name: string;
  readonly picture: string | null;
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
    picture: wave.picture ?? null,
    descriptionPreview: getWaveDescriptionPreviewText(wave),
    membersCount: wave.metrics.subscribers_count,
    postsCount: wave.metrics.drops_count,
  };
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
