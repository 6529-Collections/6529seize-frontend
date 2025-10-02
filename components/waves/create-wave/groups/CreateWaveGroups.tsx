import { ApiGroupFull } from "@/generated/models/ApiGroupFull";
import { ApiWaveType } from "@/generated/models/ApiWaveType";
import { CREATE_WAVE_GROUPS } from "@/helpers/waves/waves.constants";
import {
  CreateWaveGroupConfigType,
  WaveGroupsConfig,
} from "@/types/waves.types";
import CreateWaveWarning from "../utils/CreateWaveWarning";
import CreateWaveGroup from "./CreateWaveGroup";

export default function CreateWaveGroups({
  waveType,
  groups,
  onGroupSelect,
  chatEnabled,
  adminCanDeleteDrops,
  groupsCache,
  setChatEnabled,
  setDropsAdminCanDelete,
}: {
  readonly waveType: ApiWaveType;
  readonly groups: WaveGroupsConfig;
  readonly onGroupSelect: (param: {
    group: ApiGroupFull | null;
    groupType: CreateWaveGroupConfigType;
  }) => void;
  readonly chatEnabled: boolean;
  readonly adminCanDeleteDrops: boolean;
  readonly groupsCache: Record<string, ApiGroupFull>;
  readonly setChatEnabled: (enabled: boolean) => void;
  readonly setDropsAdminCanDelete: (adminCanDeleteDrops: boolean) => void;
}) {
  const isRestrictedGroup = !!groups.admin && !!groups.canView;


  return (
    <div className="tw-flex tw-flex-col tw-gap-y-6">
      {CREATE_WAVE_GROUPS[waveType].map((groupType) => (
        <CreateWaveGroup
          key={groupType}
          groupType={groupType}
          waveType={waveType}
          chatEnabled={chatEnabled}
          groupsCache={groupsCache}
          groups={groups}
          adminCanDeleteDrops={adminCanDeleteDrops}
          setChatEnabled={setChatEnabled}
          onGroupSelect={(group) => onGroupSelect({ group, groupType })}
          setDropsAdminCanDelete={setDropsAdminCanDelete}
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
