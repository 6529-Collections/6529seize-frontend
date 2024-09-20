import { useEffect, useState } from "react";
import { CreateWaveDropsRequiredMetadata } from "../../../../../types/waves.types";
import CreateWaveDropsMetadataRow from "./CreateWaveDropsMetadataRow";
import CreateWaveDropsMetadataAddRowButton from "./CreateWaveDropsMetadataAddRowButton";
import { CREATE_WAVE_VALIDATION_ERROR } from "../../../../../helpers/waves/create-wave.helpers";
import { WaveMetadataType } from "../../../../../generated/models/WaveMetadataType";

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
    readonly type: WaveMetadataType;
  }) => {
    const newItems = [...requiredMetadata];
    newItems[index] = { key, type };
    onRequiredMetadataChange(newItems);
  };

  const onAddNewRow = () => {
    onRequiredMetadataChange([
      ...requiredMetadata,
      { key: "", type: WaveMetadataType.String },
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

  const getNonUniqueMetadataIdxs = () => {
    const keys = requiredMetadata.map((item) => item.key);
    const keyOccurrences = keys.reduce((acc, key, index) => {
      if (!acc[key]) {
        acc[key] = [];
      }
      acc[key].push(index);
      return acc;
    }, {} as Record<string, number[]>);

    const nonUniqueIndices: number[] = [];
    Object.values(keyOccurrences).forEach((indices) => {
      if (indices.length > 1) {
        nonUniqueIndices.push(...indices);
      }
    });

    return nonUniqueIndices;
  };

  const [nonUniqueMetadataIdxs, setNonUniqueMetadataIdxs] = useState<number[]>(
    getNonUniqueMetadataIdxs()
  );

  useEffect(
    () => setNonUniqueMetadataIdxs(getNonUniqueMetadataIdxs()),
    [requiredMetadata]
  );

  return (
    <div>
      <p className="tw-mb-0 tw-text-lg  sm:tw-text-xl tw-font-semibold tw-text-iron-50">
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
                isNotUnique={
                  nonUniqueMetadataIdxs.includes(i) && haveNonUniqueMetadata
                }
                onItemChange={onItemChange}
                onItemRemove={onRemoveRow}
              />
            ))}
            {requiredMetadata.length === 0 && (
              <div className="tw-text-iron-400 tw-text-sm tw-font-medium tw-py-2 tw-italic">
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
