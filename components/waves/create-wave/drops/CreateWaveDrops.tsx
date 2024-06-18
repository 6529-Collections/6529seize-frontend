import { useEffect, useState } from "react";
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

  const onRequiredMetadataChange = (
    requiredMetadata: CreateWaveDropsRequiredMetadata[]
  ) => {
    setDrops({
      ...drops,
      requiredMetadata,
    });
  };

  const getHaveNonUniqueRequiredMetadataRow = (): boolean => {
    const keys = drops.requiredMetadata.map((item) => item.key);
    return new Set(keys).size !== keys.length;
  };

  const getIsNextStepDisabled = (): boolean => {
    if (!drops.requiredMetadata.length) {
      return false;
    }

    if (getHaveNonUniqueRequiredMetadataRow()) {
      return true;
    }

    return false;
  };

  const [nextStepDisabled, setNextStepDisabled] = useState(
    getIsNextStepDisabled()
  );

  useEffect(() => setNextStepDisabled(getIsNextStepDisabled()), [drops]);

  const cleanUpRequiredMetadataAndSetNextStep = () => {
    const requiredMetadata = drops.requiredMetadata.filter(
      (item) => item.key && item.type
    );

    setDrops({
      ...drops,
      requiredMetadata,
    });

    onNextStep();
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
        />
        <div className="tw-text-right">
          <CreateWaveNextStep
            disabled={nextStepDisabled}
            onClick={cleanUpRequiredMetadataAndSetNextStep}
          />
        </div>
      </div>
    </div>
  );
}
