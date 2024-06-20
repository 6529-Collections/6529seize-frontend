import { GroupFull } from "../../../../generated/models/GroupFull";
import { WaveType } from "../../../../generated/models/WaveType";
import { CreateWaveGroupConfigType } from "../../../../types/waves.types";
import CreateWaveBackStep from "../utils/CreateWaveBackStep";
import CreateWaveNextStep from "../utils/CreateWaveNextStep";
import CreateWaveGroup from "./CreateWaveGroup";

export default function CreateWaveGroups({
  waveType,
  onGroupSelect,
}: {
  readonly waveType: WaveType;
  readonly onGroupSelect: ({}: {
    group: GroupFull | null;
    groupType: CreateWaveGroupConfigType;
  }) => void;
}) {
  return (
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
  );
}
