import {
  CreateWaveDropsConfig,
  CreateWaveDropsRequiredMetadata,
  WaveRequiredType,
} from "../../../../types/waves.types";
import CreateWaveDropsMetadata from "./metadata/CreateWaveDropsMetadata";
import CreateWaveDropsTypes from "./types/CreateWaveDropsTypes";

export default function CreateWaveDrops({
  drops,
  setDrops,
}: {
  readonly drops: CreateWaveDropsConfig;
  readonly setDrops: (drops: CreateWaveDropsConfig) => void;
}) {
  const onRequiredTypeChange = (type: WaveRequiredType) => {
    const requiredTypes = drops.requiredTypes.includes(type)
      ? drops.requiredTypes.filter((t) => t !== type)
      : [...drops.requiredTypes, type];

    setDrops({
      ...drops,
      requiredTypes,
    });
  };

  const onRequiredMetadataChange = (
    requiredMetadata: CreateWaveDropsRequiredMetadata[]
  ) => {
    setDrops({
      ...drops,
      requiredMetadata,
    });
  };







  return (
    <div className="tw-flex tw-flex-col tw-gap-y-6">
      <CreateWaveDropsTypes
        requiredTypes={drops.requiredTypes}
        onRequiredTypeChange={onRequiredTypeChange}
      />
      <CreateWaveDropsMetadata
        requiredMetadata={drops.requiredMetadata}
        onRequiredMetadataChange={onRequiredMetadataChange}
      />
    </div>
  );
}
