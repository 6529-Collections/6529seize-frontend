"use client";

import { useState } from "react";
import CommonBorderedRadioButton from "../../../utils/radio/CommonBorderedRadioButton";
import {
  CreateWaveGroupConfigType,
  CreateWaveGroupStatus,
  WaveGroupsConfig,
} from "../../../../types/waves.types";
import {
  CREATE_WAVE_NONE_GROUP_LABELS,
  CREATE_WAVE_SELECT_GROUP_LABELS,
} from "../../../../helpers/waves/waves.constants";
import { ApiGroupFull } from "../../../../generated/models/ApiGroupFull";
import { ApiWaveType } from "../../../../generated/models/ApiWaveType";
import CreateWaveGroupItem from "./CreateWaveGroupItem";
import SelectGroupModalWrapper from "../../../utils/select-group/SelectGroupModalWrapper";
import CreateWaveToggle from "../utils/CreateWaveToggle";

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
    }
  };

  const selectedGroupId = getSelectedGroupId();

  const [selectedGroup, setSelectedGroup] = useState<ApiGroupFull | null>(
    selectedGroupId && groupsCache[selectedGroupId]
      ? groupsCache[selectedGroupId]
      : null
  );

  const [selected, setSelected] = useState<CreateWaveGroupStatus>(
    selectedGroup ? CreateWaveGroupStatus.GROUP : CreateWaveGroupStatus.NONE
  );

  const switchSelected = (selectedType: CreateWaveGroupStatus) => {
    setSelected(selectedType);
    setSelectedGroup(null);
    onGroupSelect(null);
  };

  const setGroup = (group: ApiGroupFull) => {
    onGroupSelect(group);
    setSelectedGroup(group);
    setSelected(CreateWaveGroupStatus.GROUP);
  };

  const onSelectedClick = () => {
    setSelectedGroup(null);
  };

  const isNotChatWave = waveType !== ApiWaveType.Chat;

  return (
    <div>
      <div className="tw-flex tw-items-center">
        <p className="tw-mb-0 tw-text-lg sm:tw-text-xl tw-font-semibold tw-text-iron-50 tw-tracking-tight">
          {CREATE_WAVE_SELECT_GROUP_LABELS[waveType][groupType]}
        </p>
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

      {/* Display description for admin delete permission when enabled */}
      {isNotChatWave &&
        groupType === CreateWaveGroupConfigType.ADMIN &&
        adminCanDeleteDrops && (
          <p className="tw-mt-2 tw-text-sm tw-text-iron-400">
            Admins will be able to delete drops after they've been submitted.
          </p>
        )}

      <div className="tw-mt-2 tw-grid tw-grid-cols-2 tw-gap-x-4 tw-gap-y-4">
        <CommonBorderedRadioButton
          type={CreateWaveGroupStatus.NONE}
          selected={selected}
          disabled={
            isNotChatWave &&
            groupType === CreateWaveGroupConfigType.CAN_CHAT &&
            !chatEnabled
          }
          label={CREATE_WAVE_NONE_GROUP_LABELS[groupType]}
          onChange={switchSelected}
        />

        <CreateWaveGroupItem
          selectedGroup={selectedGroup}
          disabled={
            isNotChatWave &&
            groupType === CreateWaveGroupConfigType.CAN_CHAT &&
            !chatEnabled
          }
          switchSelected={switchSelected}
          onSelectedClick={onSelectedClick}
        />

        <SelectGroupModalWrapper
          isOpen={selected === CreateWaveGroupStatus.GROUP && !selectedGroup}
          onClose={() => switchSelected(CreateWaveGroupStatus.NONE)}
          onGroupSelect={setGroup}
        />
      </div>
    </div>
  );
}
