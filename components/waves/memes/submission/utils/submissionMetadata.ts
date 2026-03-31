import type { ApiDropMetadata } from "@/generated/models/ApiDropMetadata";
import type { OperationalData } from "../types/OperationalData";
import type { TraitsData } from "../types/TraitsData";
import { validateStrictAddress } from "./addressValidation";
import { objectEntries } from "./objectEntries";

export const METADATA_VALUE_MAX_LENGTH = 5000;
const METADATA_VALUE_WARNING_THRESHOLD = 4500;

export interface MetadataValueLengthStatus {
  readonly dataKey: string;
  readonly length: number;
  readonly maxLength: number;
  readonly warningThreshold: number;
  readonly remaining: number;
  readonly isWarning: boolean;
  readonly isError: boolean;
}

interface MetadataLengthValidationResult {
  readonly statusesByKey: Partial<Record<string, MetadataValueLengthStatus>>;
  readonly warnings: MetadataValueLengthStatus[];
  readonly errors: MetadataValueLengthStatus[];
  readonly hasWarnings: boolean;
  readonly hasErrors: boolean;
}

const buildOperationalMetadata = (
  operationalData?: OperationalData
): ApiDropMetadata[] => {
  if (!operationalData) {
    return [];
  }

  const operationalMetadata: ApiDropMetadata[] = [
    {
      data_key: "payment_info",
      data_value: JSON.stringify(operationalData.payment_info),
    },
    {
      data_key: "commentary",
      data_value: operationalData.commentary,
    },
    {
      data_key: "about_artist",
      data_value: operationalData.about_artist,
    },
  ];

  if (operationalData.airdrop_config.length > 0) {
    const validEntries = operationalData.airdrop_config.filter((entry) => {
      const trimmedAddress = entry.address.trim();
      return validateStrictAddress(trimmedAddress) && entry.count > 0;
    });

    if (validEntries.length > 0) {
      operationalMetadata.push({
        data_key: "airdrop_config",
        data_value: JSON.stringify(validEntries),
      });
    }
  }

  if (operationalData.allowlist_batches.length > 0) {
    operationalMetadata.push({
      data_key: "allowlist_batches",
      data_value: JSON.stringify(
        operationalData.allowlist_batches.map((batch) => ({
          contract: batch.contract,
          token_ids: batch.token_ids_raw || "",
        }))
      ),
    });
  }

  operationalMetadata.push({
    data_key: "additional_media",
    data_value: JSON.stringify(operationalData.additional_media),
  });

  return operationalMetadata;
};

export const buildSubmissionMetadata = ({
  traits,
  operationalData,
}: {
  readonly traits: TraitsData;
  readonly operationalData?: OperationalData | undefined;
}): ApiDropMetadata[] => {
  const traitMetadata: ApiDropMetadata[] = objectEntries(traits)
    .map(([key, value]) => ({
      data_key: String(key),
      data_value: value.toString(),
    }))
    .filter((metadata) => metadata.data_value.length > 0);

  return [...traitMetadata, ...buildOperationalMetadata(operationalData)];
};

const getMetadataValueLengthStatus = (
  metadata: ApiDropMetadata
): MetadataValueLengthStatus => {
  const length = metadata.data_value.length;
  const remaining = METADATA_VALUE_MAX_LENGTH - length;
  const isWarning = length >= METADATA_VALUE_WARNING_THRESHOLD;
  const isError = length > METADATA_VALUE_MAX_LENGTH;

  return {
    dataKey: metadata.data_key,
    length,
    maxLength: METADATA_VALUE_MAX_LENGTH,
    warningThreshold: METADATA_VALUE_WARNING_THRESHOLD,
    remaining,
    isWarning,
    isError,
  };
};

const validateMetadataValueLengths = (
  metadata: ApiDropMetadata[]
): MetadataLengthValidationResult => {
  const statusesByKey: Partial<Record<string, MetadataValueLengthStatus>> = {};
  const warnings: MetadataValueLengthStatus[] = [];
  const errors: MetadataValueLengthStatus[] = [];

  metadata.forEach((item) => {
    const status = getMetadataValueLengthStatus(item);
    statusesByKey[item.data_key] = status;

    if (status.isWarning) {
      warnings.push(status);
    }
    if (status.isError) {
      errors.push(status);
    }
  });

  return {
    statusesByKey,
    warnings,
    errors,
    hasWarnings: warnings.length > 0,
    hasErrors: errors.length > 0,
  };
};

export const getSubmissionMetadataLengthValidation = ({
  traits,
  operationalData,
}: {
  readonly traits: TraitsData;
  readonly operationalData?: OperationalData | undefined;
}): MetadataLengthValidationResult =>
  validateMetadataValueLengths(
    buildSubmissionMetadata({
      traits,
      operationalData,
    })
  );
