import type { ApiWaveParticipationSubmissionStrategy } from "@/generated/models/ApiWaveParticipationSubmissionStrategy";

export enum WaveSubmissionExperience {
  DEFAULT = "DEFAULT",
  IDENTITY = "IDENTITY",
  CURATION_LEGACY = "CURATION_LEGACY",
  MEMES_LEGACY = "MEMES_LEGACY",
}

export const resolveWaveSubmissionExperience = ({
  isMemesWave,
  isCurationWave,
  submissionStrategy,
}: {
  readonly isMemesWave: boolean;
  readonly isCurationWave: boolean;
  readonly submissionStrategy:
    | ApiWaveParticipationSubmissionStrategy
    | null
    | undefined;
}): WaveSubmissionExperience => {
  if (isMemesWave) {
    return WaveSubmissionExperience.MEMES_LEGACY;
  }

  if (isCurationWave) {
    return WaveSubmissionExperience.CURATION_LEGACY;
  }

  if (submissionStrategy) {
    return WaveSubmissionExperience.IDENTITY;
  }

  return WaveSubmissionExperience.DEFAULT;
};
