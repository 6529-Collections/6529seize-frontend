import type { ApiGroupFull } from "@/generated/models/ApiGroupFull";
import type { ApiWaveType } from "@/generated/models/ApiWaveType";
import { CREATE_WAVE_GROUPS } from "@/helpers/waves/waves.constants";
import type {
  CreateWaveGroupConfigType,
  WaveGroupsConfig,
} from "@/types/waves.types";
import CreateWaveWarning from "../utils/CreateWaveWarning";
import CreateWaveGroup from "./CreateWaveGroup";
import type { CommunityMemberMinimal } from "@/entities/IProfile";
import type { ApiCreateGroup } from "@/generated/models/ApiCreateGroup";
import type {
  CreateWaveInlineGroupBuilderState,
  CreateWaveInlineGroupPanel,
  CreateWaveInlineGroupRuleType,
} from "./createWaveInlineGroupBuilder";

export default function CreateWaveGroups({
  waveName,
  waveType,
  groups,
  onGroupSelect,
  onInlineGroupCreate,
  chatEnabled,
  adminCanDeleteDrops,
  groupsCache,
  groupBuilders,
  setChatEnabled,
  setGroupBuilderPanel,
  setGroupBuilderRule,
  setGroupBuilderDraft,
  addGroupBuilderIdentity,
  removeGroupBuilderIdentity,
  resetGroupBuilder,
  setDropsAdminCanDelete,
}: {
  readonly waveName: string;
  readonly waveType: ApiWaveType;
  readonly groups: WaveGroupsConfig;
  readonly onGroupSelect: (param: {
    group: ApiGroupFull | null;
    groupType: CreateWaveGroupConfigType;
  }) => void;
  readonly onInlineGroupCreate: (
    payload: ApiCreateGroup
  ) => Promise<ApiGroupFull | null>;
  readonly chatEnabled: boolean;
  readonly adminCanDeleteDrops: boolean;
  readonly groupsCache: Record<string, ApiGroupFull>;
  readonly groupBuilders: Record<
    CreateWaveGroupConfigType,
    CreateWaveInlineGroupBuilderState
  >;
  readonly setChatEnabled: (enabled: boolean) => void;
  readonly setGroupBuilderPanel: (
    groupType: CreateWaveGroupConfigType,
    panel: CreateWaveInlineGroupPanel
  ) => void;
  readonly setGroupBuilderRule: (
    groupType: CreateWaveGroupConfigType,
    rule: CreateWaveInlineGroupRuleType | null
  ) => void;
  readonly setGroupBuilderDraft: (
    groupType: CreateWaveGroupConfigType,
    draft: ApiCreateGroup
  ) => void;
  readonly addGroupBuilderIdentity: (
    groupType: CreateWaveGroupConfigType,
    identity: CommunityMemberMinimal
  ) => void;
  readonly removeGroupBuilderIdentity: (
    groupType: CreateWaveGroupConfigType,
    wallet: string
  ) => void;
  readonly resetGroupBuilder: (groupType: CreateWaveGroupConfigType) => void;
  readonly setDropsAdminCanDelete: (adminCanDeleteDrops: boolean) => void;
}) {
  const isRestrictedGroup = !!groups.admin && !!groups.canView;

  return (
    <div className="tw-flex tw-flex-col tw-gap-y-6">
      {CREATE_WAVE_GROUPS[waveType].map((groupType) => (
        <CreateWaveGroup
          key={groupType}
          waveName={waveName}
          groupType={groupType}
          waveType={waveType}
          chatEnabled={chatEnabled}
          groupsCache={groupsCache}
          groups={groups}
          groupBuilder={groupBuilders[groupType]}
          adminCanDeleteDrops={adminCanDeleteDrops}
          setChatEnabled={setChatEnabled}
          onGroupSelect={(group) => onGroupSelect({ group, groupType })}
          onInlineGroupCreate={onInlineGroupCreate}
          setGroupBuilderPanel={(panel) =>
            setGroupBuilderPanel(groupType, panel)
          }
          setGroupBuilderRule={(rule) => setGroupBuilderRule(groupType, rule)}
          setGroupBuilderDraft={(draft) =>
            setGroupBuilderDraft(groupType, draft)
          }
          addGroupBuilderIdentity={(identity) =>
            addGroupBuilderIdentity(groupType, identity)
          }
          removeGroupBuilderIdentity={(wallet) =>
            removeGroupBuilderIdentity(groupType, wallet)
          }
          resetGroupBuilder={() => resetGroupBuilder(groupType)}
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
