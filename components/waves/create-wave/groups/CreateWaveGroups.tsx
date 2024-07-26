import { GroupFull } from "../../../../generated/models/GroupFull";
import { WaveType } from "../../../../generated/models/WaveType";
import {
  CreateWaveGroupConfigType,
  WaveGroupsConfig,
} from "../../../../types/waves.types";
import CreateWaveWarning from "../utils/CreateWaveWarning";
import CreateWaveGroup from "./CreateWaveGroup";

export default function CreateWaveGroups({
  waveType,
  groups,
  onGroupSelect,
}: {
  readonly waveType: WaveType;
  readonly groups: WaveGroupsConfig;
  readonly onGroupSelect: (param: {
    group: GroupFull | null;
    groupType: CreateWaveGroupConfigType;
  }) => void;
}) {
  const isRestrictedGroup = !!groups.admin && !!groups.canView;
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
      {isRestrictedGroup && (
        <CreateWaveWarning
          title="Warning: Limited Access"
          description=' This wave is configured with restricted access. It can only be viewed
        and managed by the members of the "Who can view" and
        "Admin" groups. If you are not a member of either of these
        groups, you will not be able to access this wave.'
        />
      )}
    </div>
  );
}
