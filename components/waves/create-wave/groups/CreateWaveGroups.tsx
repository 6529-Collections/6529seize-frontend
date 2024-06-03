import { CurationFilterResponse } from "../../../../helpers/filters/Filters.types";
import {
  CreateWaveGroupConfigType,
  WaveType,
} from "../../../../types/waves.types";
import CreateWaveNextStep from "../utils/CreateWaveNextStep";
import CreateWaveGroup from "./CreateWaveGroup";

export default function CreateWaveGroups({
  waveType,
  onGroupSelect,
  onNextStep,
}: {
  readonly waveType: WaveType;
  readonly onGroupSelect: ({}: {
    group: CurationFilterResponse | null;
    groupType: CreateWaveGroupConfigType;
  }) => void;
  readonly onNextStep: () => void;
}) {
  return (
    <div className="tw-max-w-xl tw-mx-auto tw-w-full">
      <div className="tw-flex tw-flex-col tw-gap-y-6">
        {Object.values(CreateWaveGroupConfigType).map((groupType) => (
          <CreateWaveGroup
            key={groupType}
            groupType={groupType}
            waveType={waveType}
            onGroupSelect={(group) => onGroupSelect({ group, groupType })}
          />
        ))}
      </div>
      <div className="tw-mt-6 tw-text-right">
        <CreateWaveNextStep onClick={onNextStep} disabled={false} />
      </div>
    </div>
  );
}
