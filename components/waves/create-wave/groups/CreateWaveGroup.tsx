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

export default function CreateWaveGroup({
  waveType,
  groupType,
  chatEnabled,
  setChatEnabled,
  onGroupSelect,
  groupsCache,
  groups,
}: {
  readonly waveType: ApiWaveType;
  readonly groupType: CreateWaveGroupConfigType;
  readonly chatEnabled: boolean;
  readonly setChatEnabled: (enabled: boolean) => void;
  readonly onGroupSelect: (group: ApiGroupFull | null) => void;
  readonly groupsCache: Record<string, ApiGroupFull>;
  readonly groups: WaveGroupsConfig;
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
          <div className="tw-pl-4">
            <label className="tw-flex tw-cursor-pointer">
              <span className="tw-sr-only">Enable chat</span>
              <div className="tw-flex tw-items-center tw-gap-x-2 sm:tw-gap-x-3">
                <div
                  className={`tw-rounded-full tw-bg-gradient-to-b tw-p-[1px] ${
                    chatEnabled ? "tw-from-primary-300" : "tw-from-iron-600"
                  }`}
                >
                  <input
                    type="checkbox"
                    className="tw-sr-only"
                    checked={chatEnabled}
                    onChange={(e) => setChatEnabled(e.target.checked)}
                  />
                  <span
                    className={`tw-p-0 tw-relative tw-flex tw-items-center tw-h-5 tw-w-9 tw-flex-shrink-0 tw-cursor-pointer tw-rounded-full tw-border-2 tw-border-transparent tw-transition-colors tw-duration-200 tw-ease-in-out  
                      ${
                        chatEnabled
                          ? "tw-bg-primary-500 focus:tw-ring-2 focus-visible:tw-ring-primary-500 focus-visible:tw-ring-offset-2"
                          : "tw-bg-iron-700 focus:tw-outline-none"
                      }`}
                    role="switch"
                    aria-checked="false"
                  >
                    <span
                      aria-hidden="true"
                      className={`tw-pointer-events-none tw-inline-block tw-size-4 tw-transform tw-rounded-full tw-bg-iron-50 tw-shadow tw-ring-0 tw-transition tw-duration-200 tw-ease-in-out  ${
                        chatEnabled ? "tw-translate-x-[18px]" : "tw-translate-x-0"
                      }`}
                    ></span>
                  </span>
                </div>
              </div>
            </label>
          </div>
        )}
      </div>
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
