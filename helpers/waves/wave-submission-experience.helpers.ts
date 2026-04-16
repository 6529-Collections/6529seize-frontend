import type { ApiWaveParticipationSubmissionStrategy } from "@/generated/models/ApiWaveParticipationSubmissionStrategy";

export enum WaveSubmissionExperience {
  DEFAULT = "DEFAULT",
  IDENTITY = "IDENTITY",
  CURATION_LEGACY = "CURATION_LEGACY",
  MEMES_LEGACY = "MEMES_LEGACY",
  QUORUM_PROPOSAL = "QUORUM_PROPOSAL",
}

export const resolveWaveSubmissionExperience = ({
  isMemesWave,
  isCurationWave,
  isQuorumWave,
  submissionStrategy,
}: {
  readonly isMemesWave: boolean;
  readonly isCurationWave: boolean;
  readonly isQuorumWave: boolean;
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

  if (isQuorumWave) {
    return WaveSubmissionExperience.QUORUM_PROPOSAL;
  }

  if (submissionStrategy) {
    return WaveSubmissionExperience.IDENTITY;
  }

  return WaveSubmissionExperience.DEFAULT;
};
