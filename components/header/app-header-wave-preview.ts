import { useMemo } from "react";
import type { useMyStreamOptional } from "@/contexts/wave/MyStreamContext";
import type { MinimalWave } from "@/contexts/wave/hooks/useEnhancedWavesListCore";
import type { ApiWave } from "@/generated/models/ApiWave";
import { useWaveById } from "@/hooks/useWaveById";

const EMPTY_MINIMAL_WAVES: readonly MinimalWave[] = [];

export interface HeaderWavePreview {
  readonly id: string;
  readonly name: string;
  readonly picture: string | null;
  readonly contributors: readonly {
    readonly pfp: string;
    readonly identity?: string | null;
  }[];
}

const getHeaderWavePreviewFromApiWave = (wave: ApiWave): HeaderWavePreview => ({
  id: wave.id,
  name: wave.name,
  picture: wave.picture ?? null,
  contributors: wave.contributors_overview.map((c) => ({
    pfp: c.contributor_pfp,
    identity: c.contributor_identity,
  })),
});

const getHeaderWavePreviewFromMinimalWave = (
  wave: MinimalWave
): HeaderWavePreview => ({
  id: wave.id,
  name: wave.name,
  picture: wave.picture,
  contributors: wave.contributors,
});

const getActiveHeaderWavePreviewFromList = ({
  waveId,
  waves,
  directMessages,
}: {
  readonly waveId: string | null;
  readonly waves: readonly MinimalWave[];
  readonly directMessages: readonly MinimalWave[];
}): HeaderWavePreview | null => {
  if (!waveId) {
    return null;
  }

  const previewWave =
    waves.find((candidate) => candidate.id === waveId) ??
    directMessages.find((candidate) => candidate.id === waveId);

  return previewWave ? getHeaderWavePreviewFromMinimalWave(previewWave) : null;
};

const getActiveApiWave = (
  waveId: string | null,
  wave: ApiWave | undefined
): ApiWave | null => (waveId && wave?.id === waveId ? wave : null);

const getIsWaveResolving = ({
  waveId,
  wave,
  isLoading,
  isFetching,
  headerWavePreview,
}: {
  readonly waveId: string | null;
  readonly wave: ApiWave | undefined;
  readonly isLoading: boolean;
  readonly isFetching: boolean;
  readonly headerWavePreview: HeaderWavePreview | null;
}): boolean =>
  !!waveId &&
  !headerWavePreview &&
  (isLoading || isFetching || wave?.id !== waveId);

export const useHeaderActiveWave = (
  myStream: ReturnType<typeof useMyStreamOptional>
) => {
  const waveId = myStream?.activeWave.id ?? null;
  const { wave, isLoading, isFetching } = useWaveById(waveId);
  const activeWave = getActiveApiWave(waveId, wave);
  const streamWaves = myStream?.waves.list ?? EMPTY_MINIMAL_WAVES;
  const streamDirectMessages =
    myStream?.directMessages.list ?? EMPTY_MINIMAL_WAVES;
  const fullWaveHeaderPreview = useMemo(
    () => (activeWave ? getHeaderWavePreviewFromApiWave(activeWave) : null),
    [activeWave]
  );
  const listWaveHeaderPreview = useMemo(
    () =>
      getActiveHeaderWavePreviewFromList({
        waveId,
        waves: streamWaves,
        directMessages: streamDirectMessages,
      }),
    [streamDirectMessages, streamWaves, waveId]
  );
  const headerWavePreview = fullWaveHeaderPreview ?? listWaveHeaderPreview;
  // A list preview is enough to avoid the title spinner; full-wave-only
  // controls still stay gated on activeWave.
  const isWaveResolving = getIsWaveResolving({
    waveId,
    wave,
    isLoading,
    isFetching,
    headerWavePreview,
  });

  return {
    activeWave,
    headerWavePreview,
    isWaveResolving,
    waveId,
  };
};
