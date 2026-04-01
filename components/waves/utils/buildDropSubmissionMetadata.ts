import type { DropMetadata } from "@/entities/IDrop";
import {
  IDENTITY_SUBMISSION_METADATA_KEY,
  normalizeMetadataKey,
} from "@/helpers/waves/identity-submission-metadata";
import type { CreateDropMetadataType } from "../CreateDropContent";
import { convertMetadataToDropMetadata } from "./convertMetadataToDropMetadata";

export const buildDropSubmissionMetadata = ({
  metadata,
  identity,
}: {
  readonly metadata: CreateDropMetadataType[];
  readonly identity?: string | null | undefined;
}): DropMetadata[] => {
  if (!identity) {
    return convertMetadataToDropMetadata(metadata);
  }

  const baseMetadata = convertMetadataToDropMetadata(metadata).filter(
    (item) =>
      normalizeMetadataKey(item.data_key) !== IDENTITY_SUBMISSION_METADATA_KEY
  );

  return [
    ...baseMetadata,
    {
      data_key: IDENTITY_SUBMISSION_METADATA_KEY,
      data_value: identity,
    },
  ];
};
