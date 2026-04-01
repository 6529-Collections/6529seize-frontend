export const IDENTITY_SUBMISSION_METADATA_KEY = "identity";

export const IDENTITY_SUBMISSION_RESERVED_METADATA_ERROR =
  "Metadata name is reserved for identity nominations";

export const normalizeMetadataKey = (key: string) => key.trim().toLowerCase();

export const isReservedIdentitySubmissionMetadataKey = (key: string) =>
  normalizeMetadataKey(key) === IDENTITY_SUBMISSION_METADATA_KEY;
