import { WaveRequiredType } from "../../../../../types/waves.types";
import CreateWaveDropsType from "./CreateWaveDropsType";

export default function CreateWaveDropsTypes({
  requiredTypes,
  onRequiredTypeChange,
}: {
  readonly requiredTypes: WaveRequiredType[];
  readonly onRequiredTypeChange: (type: WaveRequiredType) => void;
}) {
  return (
    <div>
      <p className="tw-mb-0 tw-text-2xl tw-font-semibold tw-text-iron-50">
        Required Types
      </p>
      <div className="tw-mt-4 tw-flex tw-gap-x-4 tw-gap-y-4">
        {Object.values(WaveRequiredType).map((type) => (
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
