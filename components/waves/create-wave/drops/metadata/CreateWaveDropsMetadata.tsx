"use client";

import type { CreateWaveDropsRequiredMetadata } from "@/types/waves.types";
import CreateWaveDropsMetadataRow from "./CreateWaveDropsMetadataRow";
import CreateWaveDropsMetadataAddRowButton from "./CreateWaveDropsMetadataAddRowButton";
import { ApiWaveMetadataType } from "@/generated/models/ApiWaveMetadataType";
import { CREATE_WAVE_VALIDATION_ERROR } from "@/helpers/waves/create-wave.validation";
import {
  IDENTITY_SUBMISSION_RESERVED_METADATA_ERROR,
  isReservedIdentitySubmissionMetadataKey,
} from "@/helpers/waves/identity-submission-metadata";

const NON_UNIQUE_METADATA_ERROR = "Metadata name must be unique";

export default function CreateWaveDropsMetadata({
  requiredMetadata,
  errors,
  onRequiredMetadataChange,
}: {
  readonly requiredMetadata: CreateWaveDropsRequiredMetadata[];
  readonly errors: CREATE_WAVE_VALIDATION_ERROR[];
  readonly onRequiredMetadataChange: (
    requiredMetadata: CreateWaveDropsRequiredMetadata[]
  ) => void;
}) {
  const onItemChange = ({
    index,
    key,
    type,
  }: {
    readonly index: number;
    readonly key: string;
    readonly type: ApiWaveMetadataType;
  }) => {
    const newItems = [...requiredMetadata];
    newItems[index] = { key, type };
    onRequiredMetadataChange(newItems);
  };

  const onAddNewRow = () => {
    onRequiredMetadataChange([
      ...requiredMetadata,
      { key: "", type: ApiWaveMetadataType.String },
    ]);
  };

  const onRemoveRow = (index: number) => {
    const newItems = [...requiredMetadata];
    newItems.splice(index, 1);
    onRequiredMetadataChange(newItems);
  };

  const haveNonUniqueMetadata = errors.includes(
    CREATE_WAVE_VALIDATION_ERROR.DROPS_REQUIRED_METADATA_NON_UNIQUE
  );
  const haveReservedIdentityMetadata = errors.includes(
    CREATE_WAVE_VALIDATION_ERROR.DROPS_REQUIRED_METADATA_RESERVED_IDENTITY_KEY
  );

  const keyOccurrences = requiredMetadata.reduce<Record<string, number[]>>(
    (acc, item, index) => {
      const indices = acc[item.key];

      if (indices) {
        indices.push(index);
      } else {
        acc[item.key] = [index];
      }

      return acc;
    },
    {}
  );

  const nonUniqueMetadataIdxs = new Set(
    Object.values(keyOccurrences).flatMap((indices) =>
      indices.length > 1 ? indices : []
    )
  );
  const reservedIdentityMetadataIdxs = requiredMetadata.reduce<number[]>(
    (acc, item, index) => {
      if (isReservedIdentitySubmissionMetadataKey(item.key)) {
        acc.push(index);
      }
      return acc;
    },
    []
  );

  const getRowErrorMessage = (index: number) => {
    if (
      reservedIdentityMetadataIdxs.includes(index) &&
      haveReservedIdentityMetadata
    ) {
      return IDENTITY_SUBMISSION_RESERVED_METADATA_ERROR;
    }

    if (nonUniqueMetadataIdxs.has(index) && haveNonUniqueMetadata) {
      return NON_UNIQUE_METADATA_ERROR;
    }

    return null;
  };

  return (
    <div>
      <p className="tw-mb-0 tw-text-lg tw-font-semibold tw-text-iron-50 sm:tw-text-xl">
        Required metadata
      </p>
      <div className="tw-mt-3 tw-grid tw-grid-cols-2 tw-gap-x-4 tw-gap-y-4">
        <div className="tw-col-span-full tw-flex tw-flex-col tw-gap-y-2">
          <div className="tw-flex tw-flex-col tw-gap-y-4">
            {requiredMetadata.map((item, i) => (
              <CreateWaveDropsMetadataRow
                key={`create-wave-drops-metadata-row-${i}`}
                item={item}
                index={i}
                errorMessage={getRowErrorMessage(i)}
                onItemChange={onItemChange}
                onItemRemove={onRemoveRow}
              />
            ))}
            {requiredMetadata.length === 0 && (
              <div className="tw-py-2 tw-text-sm tw-font-medium tw-italic tw-text-iron-400">
                No required metadata added
              </div>
            )}
          </div>
          <CreateWaveDropsMetadataAddRowButton
            itemsCount={requiredMetadata.length}
            onAddNewRow={onAddNewRow}
          />
        </div>
      </div>
    </div>
  );
}
