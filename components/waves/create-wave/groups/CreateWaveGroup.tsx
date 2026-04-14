"use client";

import type { WaveGroupsConfig } from "@/types/waves.types";
import { CreateWaveGroupConfigType } from "@/types/waves.types";
import {
  CREATE_WAVE_NONE_GROUP_LABELS,
  CREATE_WAVE_SELECT_GROUP_LABELS,
} from "@/helpers/waves/waves.constants";
import type { CommunityMemberMinimal } from "@/entities/IProfile";
import type { ApiCreateGroup } from "@/generated/models/ApiCreateGroup";
import type { ApiGroupFull } from "@/generated/models/ApiGroupFull";
import { ApiWaveType } from "@/generated/models/ApiWaveType";
import CreateWaveToggle from "../utils/CreateWaveToggle";
import type {
  CreateWaveInlineGroupBuilderState,
  CreateWaveInlineGroupPanel,
  CreateWaveInlineGroupRuleType,
} from "./createWaveInlineGroupBuilder";
import CreateWaveGroupInlinePanel from "./CreateWaveGroupInlinePanel";

export default function CreateWaveGroup({
  waveName,
  waveType,
  groupType,
  chatEnabled,
  adminCanDeleteDrops,
  setChatEnabled,
  onGroupSelect,
  onInlineGroupCreate,
  groupsCache,
  groups,
  groupBuilder,
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
  readonly groupType: CreateWaveGroupConfigType;
  readonly chatEnabled: boolean;
  readonly adminCanDeleteDrops: boolean;
  readonly setChatEnabled: (enabled: boolean) => void;
  readonly onGroupSelect: (group: ApiGroupFull | null) => void;
  readonly onInlineGroupCreate: (
    payload: ApiCreateGroup
  ) => Promise<ApiGroupFull | null>;
  readonly groupsCache: Record<string, ApiGroupFull>;
  readonly groups: WaveGroupsConfig;
  readonly groupBuilder: CreateWaveInlineGroupBuilderState;
  readonly setGroupBuilderPanel: (panel: CreateWaveInlineGroupPanel) => void;
  readonly setGroupBuilderRule: (
    rule: CreateWaveInlineGroupRuleType | null
  ) => void;
  readonly setGroupBuilderDraft: (draft: ApiCreateGroup) => void;
  readonly addGroupBuilderIdentity: (identity: CommunityMemberMinimal) => void;
  readonly removeGroupBuilderIdentity: (wallet: string) => void;
  readonly resetGroupBuilder: () => void;
  readonly setDropsAdminCanDelete: (adminCanDeleteDrops: boolean) => void;
}) {
  const getSelectedGroupId = () => {
    switch (groupType) {
      case CreateWaveGroupConfigType.ADMIN:
        return groups.admin;
      case CreateWaveGroupConfigType.CAN_VIEW:
        return groups.canView;
      case CreateWaveGroupConfigType.CAN_DROP:
        return groups.canDrop;
      case CreateWaveGroupConfigType.CAN_VOTE:
        return groups.canVote;
      case CreateWaveGroupConfigType.CAN_CHAT:
        return groups.canChat;
      default:
        return null;
    }
  };

  const selectedGroupId = getSelectedGroupId();
  const selectedGroup: ApiGroupFull | null =
    selectedGroupId && groupsCache[selectedGroupId]
      ? groupsCache[selectedGroupId]
      : null;

  const isNotChatWave = waveType !== ApiWaveType.Chat;
  const inputDisabled =
    isNotChatWave &&
    groupType === CreateWaveGroupConfigType.CAN_CHAT &&
    !chatEnabled;
  const defaultLabel = CREATE_WAVE_NONE_GROUP_LABELS[groupType];
  const groupLabel = CREATE_WAVE_SELECT_GROUP_LABELS[waveType][groupType];
  const resolvedGroupBuilder = inputDisabled
    ? {
        ...groupBuilder,
        panel: "actions" as const,
        activeRule: null,
      }
    : groupBuilder;

  return (
    <div className="tw-flex tw-flex-col tw-gap-y-4">
      <div className="tw-flex tw-flex-wrap tw-items-center tw-gap-3">
        <h3 className="tw-mb-0 tw-text-lg tw-font-semibold tw-tracking-tight tw-text-iron-50 sm:tw-text-xl">
          {groupLabel}
        </h3>
        {isNotChatWave && groupType === CreateWaveGroupConfigType.CAN_CHAT && (
          <CreateWaveToggle
            enabled={chatEnabled}
            onChange={setChatEnabled}
            label="Enable chat"
            displayLabel={true}
          />
        )}
        {groupType === CreateWaveGroupConfigType.ADMIN && (
          <CreateWaveToggle
            enabled={adminCanDeleteDrops}
            onChange={setDropsAdminCanDelete}
            label="Allow admins to delete posts"
            displayLabel={true}
          />
        )}
      </div>

      <CreateWaveGroupInlinePanel
        waveName={waveName}
        groupLabel={groupLabel}
        defaultLabel={defaultLabel}
        disabled={inputDisabled}
        selectedGroup={selectedGroup}
        groupBuilder={resolvedGroupBuilder}
        onGroupSelect={onGroupSelect}
        onInlineGroupCreate={onInlineGroupCreate}
        setGroupBuilderPanel={setGroupBuilderPanel}
        setGroupBuilderRule={setGroupBuilderRule}
        setGroupBuilderDraft={setGroupBuilderDraft}
        addGroupBuilderIdentity={addGroupBuilderIdentity}
        removeGroupBuilderIdentity={removeGroupBuilderIdentity}
        resetGroupBuilder={resetGroupBuilder}
      />
    </div>
  );
}
