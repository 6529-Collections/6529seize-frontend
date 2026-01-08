"use client";

import type {
  WaveGroupsConfig} from "@/types/waves.types";
import {
  CreateWaveGroupConfigType
} from "@/types/waves.types";
import {
  CREATE_WAVE_NONE_GROUP_LABELS,
  CREATE_WAVE_SELECT_GROUP_LABELS,
} from "@/helpers/waves/waves.constants";
import type { ApiGroupFull } from "@/generated/models/ApiGroupFull";
import { ApiWaveType } from "@/generated/models/ApiWaveType";
import CreateWaveToggle from "../utils/CreateWaveToggle";
import CreateWaveGroupSearchField from "./CreateWaveGroupSearchField";

export default function CreateWaveGroup({
  waveType,
  groupType,
  chatEnabled,
  adminCanDeleteDrops,
  setChatEnabled,
  onGroupSelect,
  groupsCache,
  groups,
  setDropsAdminCanDelete,
}: {
  readonly waveType: ApiWaveType;
  readonly groupType: CreateWaveGroupConfigType;
  readonly chatEnabled: boolean;
  readonly adminCanDeleteDrops: boolean;
  readonly setChatEnabled: (enabled: boolean) => void;
  readonly onGroupSelect: (group: ApiGroupFull | null) => void;
  readonly groupsCache: Record<string, ApiGroupFull>;
  readonly groups: WaveGroupsConfig;
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

  return (
    <div className="tw-flex tw-flex-col tw-gap-y-4">
      <div className="tw-flex tw-flex-wrap tw-items-center tw-gap-3">
        <h3 className="tw-text-lg sm:tw-text-xl tw-font-semibold tw-text-iron-50 tw-tracking-tight tw-mb-0">
          {CREATE_WAVE_SELECT_GROUP_LABELS[waveType][groupType]}
        </h3>
        {isNotChatWave && groupType === CreateWaveGroupConfigType.CAN_CHAT && (
          <CreateWaveToggle
            enabled={chatEnabled}
            onChange={setChatEnabled}
            label="Enable chat"
          />
        )}
        {isNotChatWave && groupType === CreateWaveGroupConfigType.ADMIN && (
          <CreateWaveToggle
            enabled={adminCanDeleteDrops}
            onChange={setDropsAdminCanDelete}
            label="Allow admins to delete drops"
            displayLabel={true}
          />
        )}
      </div>

      {isNotChatWave &&
        groupType === CreateWaveGroupConfigType.ADMIN &&
        adminCanDeleteDrops && (
          <p className="tw-mt-2 tw-text-sm tw-text-iron-400">
            Admins will be able to delete drops after they've been submitted.
          </p>
        )}

      <CreateWaveGroupSearchField
        label="Search groups…"
        defaultLabel={defaultLabel}
        disabled={inputDisabled}
        selectedGroup={selectedGroup}
        onSelect={onGroupSelect}
      />
    </div>
  );
}
