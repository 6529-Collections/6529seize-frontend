interface WaveDetailsLike {
  readonly chat?:
    | {
        readonly scope?:
          | {
              readonly group?:
                | {
                    readonly is_direct_message?: boolean | undefined;
                  }
                | undefined;
            }
          | undefined;
      }
    | undefined;
}

interface MinimalWaveLike {
  readonly id: string;
}

export const normalizeOptionalWaveId = (
  waveId: string | null | undefined
): string | null => {
  const normalizedWaveId = waveId?.trim() ?? null;
  return normalizedWaveId === "" ? null : normalizedWaveId;
};

export const isWaveDirectMessage = (
  waveId: string,
  waveDetails?: WaveDetailsLike,
  directMessageWaves: ReadonlyArray<MinimalWaveLike> = []
): boolean => {
  if (directMessageWaves.some((wave) => wave.id === waveId)) {
    return true;
  }

  return waveDetails?.chat?.scope?.group?.is_direct_message ?? false;
};
