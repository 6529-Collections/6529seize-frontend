import { useEffect, useState } from "react";
import {
  CreateWaveDropsRequiredMetadata,
  WaveRequiredMetadataType,
} from "../../../../../types/waves.types";
import CreateWaveDropsMetadataRow from "./CreateWaveDropsMetadataRow";
import CreateWaveDropsMetadataAddRowButton from "./CreateWaveDropsMetadataAddRowButton";

export default function CreateWaveDropsMetadata({
  requiredMetadata,
  onRequiredMetadataChange,
}: {
  readonly requiredMetadata: CreateWaveDropsRequiredMetadata[];
  readonly onRequiredMetadataChange: (
    requiredMetadata: CreateWaveDropsRequiredMetadata[]
  ) => void;
}) {
  const getShowAddMore = () =>
    !requiredMetadata.filter((item) => !item.key.length).length;

  const [showAddMore, setShowAddMore] = useState(getShowAddMore());
  useEffect(() => setShowAddMore(getShowAddMore()), [requiredMetadata]);

  const onItemChange = ({
    index,
    key,
    type,
  }: {
    readonly index: number;
    readonly key: string;
    readonly type: WaveRequiredMetadataType;
  }) => {
    const newItems = [...requiredMetadata];
    newItems[index] = { key, type };
    onRequiredMetadataChange(newItems);
  };

  const onAddNewRow = () => {
    onRequiredMetadataChange([
      ...requiredMetadata,
      { key: "", type: WaveRequiredMetadataType.STRING },
    ]);
  };

  const onRemoveRow = (index: number) => {
    const newItems = [...requiredMetadata];
    newItems.splice(index, 1);
    onRequiredMetadataChange(newItems);
  };

  return (
    <div>
      <p className="tw-mb-0 tw-text-xl tw-font-semibold tw-text-iron-50">
        Required metadata
      </p>
      <div className="tw-mt-2 tw-grid tw-grid-cols-2 tw-gap-x-4 tw-gap-y-4">
        <div className="tw-col-span-full tw-flex tw-flex-col tw-gap-y-4">
          {requiredMetadata.map((item, i) => (
            <CreateWaveDropsMetadataRow
              key={`create-wave-drops-metadata-row-${i}`}
              item={item}
              index={i}
              itemsCount={requiredMetadata.length}
              onItemChange={onItemChange}
              onItemRemove={onRemoveRow}
            />
          ))}
          {showAddMore && (
            <CreateWaveDropsMetadataAddRowButton onAddNewRow={onAddNewRow} />
          )}
        </div>
      </div>
    </div>
  );
}
