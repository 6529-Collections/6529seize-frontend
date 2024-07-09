import { WaveParticipationRequirement } from "../../../../../generated/models/WaveParticipationRequirement";
import CreateWaveDropsType from "./CreateWaveDropsType";

export default function CreateWaveDropsTypes({
  requiredTypes,
  onRequiredTypeChange,
}: {
  readonly requiredTypes: WaveParticipationRequirement[];
  readonly onRequiredTypeChange: (type: WaveParticipationRequirement) => void;
}) {
  return (
    <div>
      <p className="tw-mb-0 tw-text-lg  sm:tw-text-xl tw-font-semibold tw-text-iron-50">
        Required Types
      </p>
      <div className="tw-mt-3 tw-flex tw-flex-wrap sm:tw-flex-row tw-gap-x-4 tw-gap-y-4">
        {Object.values(WaveParticipationRequirement).map((type) => (
          <CreateWaveDropsType
            key={type}
            requiredTypes={requiredTypes}
            type={type}
            onRequiredTypeChange={onRequiredTypeChange}
          />
        ))}
      </div>
    </div>
  );
}
