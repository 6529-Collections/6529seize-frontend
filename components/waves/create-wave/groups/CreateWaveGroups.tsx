import { GroupFull } from "../../../../generated/models/GroupFull";
import { WaveType } from "../../../../generated/models/WaveType";
import { CreateWaveGroupConfigType } from "../../../../types/waves.types";
import CreateWaveNextStep from "../utils/CreateWaveNextStep";
import CreateWaveGroup from "./CreateWaveGroup";

export default function CreateWaveGroups({
  waveType,
  onGroupSelect,
  onNextStep,
}: {
  readonly waveType: WaveType;
  readonly onGroupSelect: ({}: {
    group: GroupFull | null;
    groupType: CreateWaveGroupConfigType;
  }) => void;
  readonly onNextStep: () => void;
}) {
  return (
    <div className="tw-max-w-2xl tw-mx-auto tw-w-full">
      <div className="tw-flex tw-flex-col tw-gap-y-8">
        {Object.values(CreateWaveGroupConfigType).map((groupType) => (
          <CreateWaveGroup
            key={groupType}
            groupType={groupType}
            waveType={waveType}
            onGroupSelect={(group) => onGroupSelect({ group, groupType })}
          />
        ))}
      </div>
      <div className="tw-mt-8 tw-text-right">
        <CreateWaveNextStep onClick={onNextStep} disabled={false} />
      </div>
    </div>
  );
}
