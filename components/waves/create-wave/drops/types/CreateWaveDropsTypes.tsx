import { WaveParticipationRequirement } from "../../../../../generated/models/WaveParticipationRequirement";
import { assertUnreachable } from "../../../../../helpers/AllowlistToolHelpers";
import CreateWaveDropsType from "./CreateWaveDropsType";

export enum ExtendedWaveParticipationRequirement {
  NONE = "NONE",
  IMAGE = "IMAGE",
  AUDIO = "AUDIO",
  VIDEO = "VIDEO",
}
export default function CreateWaveDropsTypes({
  requiredTypes,
  onRequiredTypeChange,
}: {
  readonly requiredTypes: WaveParticipationRequirement[];
  readonly onRequiredTypeChange: (
    types: WaveParticipationRequirement[]
  ) => void;
}) {
  const checkIsChecked = (
    type: ExtendedWaveParticipationRequirement
  ): boolean => {
    switch (type) {
      case ExtendedWaveParticipationRequirement.NONE:
        return requiredTypes.length === 0;
      case ExtendedWaveParticipationRequirement.IMAGE:
        return requiredTypes.includes(WaveParticipationRequirement.Image);
      case ExtendedWaveParticipationRequirement.AUDIO:
        return requiredTypes.includes(WaveParticipationRequirement.Audio);
      case ExtendedWaveParticipationRequirement.VIDEO:
        return requiredTypes.includes(WaveParticipationRequirement.Video);
      default:
        assertUnreachable(type);
        return false;
    }
  };

  const extendedTypeToWaveParticipationRequirement = (
    type: ExtendedWaveParticipationRequirement
  ): WaveParticipationRequirement | null => {
    switch (type) {
      case ExtendedWaveParticipationRequirement.NONE:
        return null;
      case ExtendedWaveParticipationRequirement.IMAGE:
        return WaveParticipationRequirement.Image;
      case ExtendedWaveParticipationRequirement.AUDIO:
        return WaveParticipationRequirement.Audio;
      case ExtendedWaveParticipationRequirement.VIDEO:
        return WaveParticipationRequirement.Video;
      default:
        assertUnreachable(type);
        return null;
    }
  };

  const onChange = (type: ExtendedWaveParticipationRequirement) => {
    const waveParticipationRequirement =
      extendedTypeToWaveParticipationRequirement(type);
    if (waveParticipationRequirement) {
      onRequiredTypeChange([waveParticipationRequirement]);
    } else {
      onRequiredTypeChange([]);
    }
  };

  return (
    <div>
      <p className="tw-mb-0 tw-text-lg  sm:tw-text-xl tw-font-semibold tw-text-iron-50">
        Required Types
      </p>
      <div className="tw-mt-3 tw-flex tw-flex-wrap sm:tw-flex-row tw-gap-x-4 tw-gap-y-4">
        {Object.values(ExtendedWaveParticipationRequirement).map((type) => (
          <CreateWaveDropsType
            key={type}
            isChecked={checkIsChecked(type)}
            type={type}
            onRequiredTypeChange={onChange}
          />
        ))}
      </div>
    </div>
  );
}
