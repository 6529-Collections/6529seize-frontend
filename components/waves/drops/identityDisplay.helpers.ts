import type { ApiDropMetadataResponse } from "@/generated/models/ApiDropMetadataResponse";
import type { ApiDropResolvedIdentityProfile } from "@/generated/models/ApiDropResolvedIdentityProfile";
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

const getIdentityMetadata = (
  metadata: readonly ApiDropMetadataResponse[] | null | undefined
): ApiDropMetadataResponse | null => {
  if (metadata === null || metadata === undefined || metadata.length === 0) {
    return null;
  }

  return metadata.find(isIdentityMetadata) ?? null;
};

export const getDropIdentityProfile = ({
  wave,
  metadata,
}: {
  readonly wave: Pick<ApiWaveMin, "submission_type"> | null | undefined;
  readonly metadata: readonly ApiDropMetadataResponse[] | null | undefined;
}): ApiDropResolvedIdentityProfile | null => {
  if (!isIdentitySubmissionWave(wave)) {
    return null;
  }

  return getIdentityMetadata(metadata)?.resolved_profile ?? null;
};

export const getDropIdentityFallbackValue = ({
  wave,
  metadata,
}: {
  readonly wave: Pick<ApiWaveMin, "submission_type"> | null | undefined;
  readonly metadata: readonly ApiDropMetadataResponse[] | null | undefined;
}): string | null => {
  if (!isIdentitySubmissionWave(wave)) {
    return null;
  }

  const value = getIdentityMetadata(metadata)?.data_value.trim();
  if (value === undefined || value.length === 0) {
    return null;
  }

  return value;
};

export const getDropVisibleMetadata = ({
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
