import {
  CreateWaveDropsConfig,
  CreateWaveDropsRequiredMetadata,
  WaveRequiredType,
} from "../../../../types/waves.types";
import CreateWaveNextStep from "../utils/CreateWaveNextStep";
import CreateWaveDropsMetadata from "./metadata/CreateWaveDropsMetadata";
import CreateWaveDropsTypes from "./types/CreateWaveDropsTypes";

export default function CreateWaveDrops({
  drops,
  setDrops,
  onNextStep,
}: {
  readonly drops: CreateWaveDropsConfig;
  readonly setDrops: (drops: CreateWaveDropsConfig) => void;
  readonly onNextStep: () => void;
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

  const onRequiredMetadataChange = ({
    key,
    type,
  }: CreateWaveDropsRequiredMetadata) => {
    const requiredMetadataIndex = drops.requiredMetadata.findIndex(
      (metadata) => metadata.key === key
    );
    // if requiredmetada exists, overwrite it
    if (requiredMetadataIndex !== -1) {
      const requiredMetadata = [...drops.requiredMetadata];
      requiredMetadata[requiredMetadataIndex] = { key, type };
      setDrops({
        ...drops,
        requiredMetadata,
      });
      return;
    }
    // if requiredmetadata does not exist, add it
    const requiredMetadata = [...drops.requiredMetadata, { key, type }];

    setDrops({
      ...drops,
      requiredMetadata,
    });
  };

  const onRequiredMetadataRemove = (key: string) => {
    const requiredMetadata = drops.requiredMetadata.filter(
      (metadata) => metadata.key !== key
    );

    setDrops({
      ...drops,
      requiredMetadata,
    });
  };

  return (
    <div className="tw-max-w-xl tw-mx-auto tw-w-full">
      <div className="tw-flex tw-flex-col tw-gap-y-8">
        <CreateWaveDropsTypes
          requiredTypes={drops.requiredTypes}
          onRequiredTypeChange={onRequiredTypeChange}
        />
        <CreateWaveDropsMetadata
          requiredMetadata={drops.requiredMetadata}
          onRequiredMetadataChange={onRequiredMetadataChange}
          onRequiredMetadataRemove={onRequiredMetadataRemove}
        />
      </div>
      <div className="tw-mt-6 tw-text-right">
        <CreateWaveNextStep disabled={false} onClick={onNextStep} />
      </div>
    </div>
  );
}
