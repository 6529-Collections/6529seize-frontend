import { WaveParticipationRequirement } from "../../../../generated/models/WaveParticipationRequirement";
import { CREATE_WAVE_VALIDATION_ERROR } from "../../../../helpers/waves/create-wave.helpers";
import {
  CreateWaveDropsConfig,
  CreateWaveDropsRequiredMetadata,
} from "../../../../types/waves.types";
import CreateWaveDropsMetadata from "./metadata/CreateWaveDropsMetadata";
import CreateWaveDropsTypes from "./types/CreateWaveDropsTypes";

export default function CreateWaveDrops({
  drops,
  errors,
  setDrops,
}: {
  readonly drops: CreateWaveDropsConfig;
  readonly errors: CREATE_WAVE_VALIDATION_ERROR[];
  readonly setDrops: (drops: CreateWaveDropsConfig) => void;
}) {
  const onRequiredTypeChange = (type: WaveParticipationRequirement) => {
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
      <div className="tw-flex tw-items-center tw-gap-x-3">
        <div className="tw-flex tw-h-6 tw-items-center">
          <input
            type="checkbox"
            className="tw-form-checkbox tw-w-5 tw-h-5 tw-rounded tw-bg-iron-800 tw-border-iron-600 tw-border tw-border-solid focus:tw-ring-2 tw-ring-offset-iron-800 tw-text-primary-400 focus:tw-ring-primary-400 tw-cursor-pointer"
          />
        </div>
        <span className="tw-text-sm tw-font-medium tw-text-iron-300">
          Allow discussion drops
        </span>
      </div>
      <CreateWaveDropsTypes
        requiredTypes={drops.requiredTypes}
        onRequiredTypeChange={onRequiredTypeChange}
      />
      <CreateWaveDropsMetadata
        requiredMetadata={drops.requiredMetadata}
        errors={errors}
        onRequiredMetadataChange={onRequiredMetadataChange}
      />
    </div>
  );
}
