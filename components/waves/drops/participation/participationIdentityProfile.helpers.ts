import type { ApiDropMetadataResponse } from "@/generated/models/ApiDropMetadataResponse";
import type { ApiProfileMin } from "@/generated/models/ApiProfileMin";
import type { ApiWaveMin } from "@/generated/models/ApiWaveMin";
import { ApiWaveParticipationSubmissionStrategyType } from "@/generated/models/ApiWaveParticipationSubmissionStrategyType";
import {
  IDENTITY_SUBMISSION_METADATA_KEY,
  normalizeMetadataKey,
} from "@/helpers/waves/identity-submission-metadata";

const isIdentitySubmissionWave = (
  wave: Pick<ApiWaveMin, "submission_type"> | null | undefined
) =>
  wave?.submission_type === ApiWaveParticipationSubmissionStrategyType.Identity;

const isIdentityMetadata = (
  metadata: Pick<ApiDropMetadataResponse, "data_key">
) =>
  normalizeMetadataKey(metadata.data_key) === IDENTITY_SUBMISSION_METADATA_KEY;

export const getParticipationIdentityProfile = ({
  wave,
  metadata,
}: {
  readonly wave: Pick<ApiWaveMin, "submission_type"> | null | undefined;
  readonly metadata: readonly ApiDropMetadataResponse[] | null | undefined;
}): ApiProfileMin | null => {
  if (
    !isIdentitySubmissionWave(wave) ||
    metadata === null ||
    metadata === undefined ||
    metadata.length === 0
  ) {
    return null;
  }

  return metadata.find(isIdentityMetadata)?.resolved_profile ?? null;
};

export const getParticipationVisibleMetadata = ({
  wave,
  metadata,
}: {
  readonly wave: Pick<ApiWaveMin, "submission_type"> | null | undefined;
  readonly metadata: readonly ApiDropMetadataResponse[] | null | undefined;
}): ApiDropMetadataResponse[] => {
  if (metadata === null || metadata === undefined || metadata.length === 0) {
    return [];
  }

  if (!isIdentitySubmissionWave(wave)) {
    return [...metadata];
  }

  return metadata.filter((item) => !isIdentityMetadata(item));
};
