import { ApiGroupFull } from "../../../../generated/models/ApiGroupFull";
import { ApiWaveType } from "../../../../generated/models/ApiWaveType";
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
  readonly waveType: ApiWaveType;
  readonly groups: WaveGroupsConfig;
  readonly onGroupSelect: (param: {
    group: ApiGroupFull | null;
    groupType: CreateWaveGroupConfigType;
  }) => void;
}) {
  const isRestrictedGroup = !!groups.admin && !!groups.canView;

  const groupTypes =
    waveType === ApiWaveType.Chat
      ? Object.values(CreateWaveGroupConfigType).filter(
          (groupType) =>
            ![
              CreateWaveGroupConfigType.CAN_DROP,
              CreateWaveGroupConfigType.CAN_VOTE,
            ].includes(groupType)
        )
      : Object.values(CreateWaveGroupConfigType);

  return (
    <div className="tw-flex tw-flex-col tw-gap-y-6">
      {groupTypes.map((groupType) => (
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
