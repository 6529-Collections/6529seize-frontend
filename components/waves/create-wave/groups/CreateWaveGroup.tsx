"use client";

import type { WaveGroupsConfig } from "@/types/waves.types";
import { CreateWaveGroupConfigType } from "@/types/waves.types";
import {
  CREATE_WAVE_NONE_GROUP_LABELS,
  CREATE_WAVE_SELECT_GROUP_LABELS,
} from "@/helpers/waves/waves.constants";
import type { ApiCreateGroup } from "@/generated/models/ApiCreateGroup";
import type { ApiGroupFull } from "@/generated/models/ApiGroupFull";
import { ApiWaveType } from "@/generated/models/ApiWaveType";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";
import CreateWaveToggle from "../utils/CreateWaveToggle";
import { buildInlineGroupName } from "./createWaveInlineGroupBuilder";
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
  setDropsAdminCanDelete,
  errorMessage,
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
  readonly setDropsAdminCanDelete: (adminCanDeleteDrops: boolean) => void;
  readonly errorMessage: string | null;
}) {
  const locale = useBrowserLocale();
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
  const defaultLabel = selectedGroupId
    ? t(locale, "waves.create.groups.selectedGroup")
    : CREATE_WAVE_NONE_GROUP_LABELS[groupType];
  const groupLabel = CREATE_WAVE_SELECT_GROUP_LABELS[waveType][groupType];
  const suggestedName = buildInlineGroupName({ waveName, groupLabel });
  const labelId = `wave-group-${groupType.toLowerCase()}-label`;
  const errorId = `wave-group-${groupType.toLowerCase()}-error`;

  return (
    <div
      className={`tw-flex tw-flex-col tw-gap-y-3 tw-rounded-lg ${
        errorMessage
          ? "tw-scroll-mb-32 tw-border tw-border-solid tw-border-error/70 tw-p-3"
          : ""
      }`}
      role="group"
      aria-labelledby={labelId}
      aria-describedby={errorMessage ? errorId : undefined}
      data-wave-group-invalid={errorMessage ? true : undefined}
      tabIndex={errorMessage ? -1 : undefined}
    >
      <div className="tw-flex tw-flex-wrap tw-items-center tw-justify-between tw-gap-3">
        <h3
          id={labelId}
          className="tw-m-0 tw-text-base tw-font-semibold tw-text-iron-100"
        >
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
        suggestedName={suggestedName}
        defaultLabel={defaultLabel}
        disabled={inputDisabled}
        selectedGroup={selectedGroup}
        onChange={onGroupSelect}
        onCreateGroup={onInlineGroupCreate}
      />
      {errorMessage && (
        <p
          id={errorId}
          className="tw-m-0 tw-text-sm tw-text-error"
          role="alert"
        >
          {errorMessage}
        </p>
      )}
    </div>
  );
}
