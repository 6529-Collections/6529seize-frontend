import {
  isReservedIdentitySubmissionMetadataKey,
  IDENTITY_SUBMISSION_RESERVED_METADATA_ERROR,
} from "@/helpers/waves/identity-submission-metadata";

type MetadataWithId = {
  readonly id: string;
  readonly key: string | null | undefined;
};

export const getIdentitySubmissionMetadataErrors = ({
  isIdentitySubmissionExperience,
  metadata,
}: {
  readonly isIdentitySubmissionExperience: boolean;
  readonly metadata: readonly MetadataWithId[];
}): Record<string, string> => {
  if (!isIdentitySubmissionExperience) {
    return {};
  }

  return metadata.reduce<Record<string, string>>((acc, item) => {
    if (
      typeof item.key === "string" &&
      isReservedIdentitySubmissionMetadataKey(item.key)
    ) {
      acc[item.id] = IDENTITY_SUBMISSION_RESERVED_METADATA_ERROR;
    }

    return acc;
  }, {});
};
