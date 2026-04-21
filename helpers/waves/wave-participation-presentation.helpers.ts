import { normalizeOptionalWaveId } from "./wave.helpers";

export type WaveParticipationVariant = "default" | "memes" | "quorum";

const DEFAULT_WAVE_PARTICIPATION_VARIANT_OVERRIDES: Readonly<
  Partial<Record<string, WaveParticipationVariant>>
> = {};

export const resolveWaveParticipationVariant = ({
  waveId,
  overrides = DEFAULT_WAVE_PARTICIPATION_VARIANT_OVERRIDES,
  isMemesWave,
  isQuorumWave,
}: {
  readonly waveId: string | null | undefined;
  readonly overrides?:
    | Readonly<Partial<Record<string, WaveParticipationVariant>>>
    | undefined;
  readonly isMemesWave: (waveId: string | undefined | null) => boolean;
  readonly isQuorumWave: (waveId: string | undefined | null) => boolean;
}): WaveParticipationVariant => {
  const normalizedWaveId = normalizeOptionalWaveId(waveId);

  if (!normalizedWaveId) {
    return "default";
  }

  const overrideVariant = overrides[normalizedWaveId];
  if (overrideVariant) {
    return overrideVariant;
  }

  if (isMemesWave(normalizedWaveId)) {
    return "memes";
  }

  if (isQuorumWave(normalizedWaveId)) {
    return "quorum";
  }

  return "default";
};
