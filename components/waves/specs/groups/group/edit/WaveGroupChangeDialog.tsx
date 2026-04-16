"use client";

import { faXmark } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { FocusTrap } from "focus-trap-react";
import { useId, useMemo, useRef } from "react";
import { createPortal } from "react-dom";
import { useClickAway, useKeyPressEvent } from "react-use";
import CreateWaveGroupInlinePanel from "@/components/waves/create-wave/groups/CreateWaveGroupInlinePanel";
import { buildInlineGroupName } from "@/components/waves/create-wave/groups/createWaveInlineGroupBuilder";
import {
  CREATE_WAVE_NONE_GROUP_LABELS,
  CREATE_WAVE_SELECT_GROUP_LABELS,
} from "@/helpers/waves/waves.constants";
import type { ApiCreateGroup } from "@/generated/models/ApiCreateGroup";
import type { ApiGroup } from "@/generated/models/ApiGroup";
import { ApiGroupFilterDirection } from "@/generated/models/ApiGroupFilterDirection";
import type { ApiGroupFull } from "@/generated/models/ApiGroupFull";
import { ApiGroupTdhInclusionStrategy } from "@/generated/models/ApiGroupTdhInclusionStrategy";
import type { ApiProfileMin } from "@/generated/models/ApiProfileMin";
import type { ApiWave } from "@/generated/models/ApiWave";
import { CreateWaveGroupConfigType } from "@/types/waves.types";
import { WaveGroupType } from "../WaveGroup.types";

const WAVE_GROUP_TO_CREATE_GROUP_TYPE = {
  [WaveGroupType.VIEW]: CreateWaveGroupConfigType.CAN_VIEW,
  [WaveGroupType.DROP]: CreateWaveGroupConfigType.CAN_DROP,
  [WaveGroupType.VOTE]: CreateWaveGroupConfigType.CAN_VOTE,
  [WaveGroupType.CHAT]: CreateWaveGroupConfigType.CAN_CHAT,
  [WaveGroupType.ADMIN]: CreateWaveGroupConfigType.ADMIN,
} satisfies Record<WaveGroupType, CreateWaveGroupConfigType>;

const createEmptyGroupDescription = (): ApiGroupFull["group"] => ({
  tdh: {
    min: null,
    max: null,
    inclusion_strategy: ApiGroupTdhInclusionStrategy.Both,
  },
  rep: {
    min: null,
    max: null,
    direction: ApiGroupFilterDirection.Received,
    user_identity: null,
    category: null,
  },
  cic: {
    min: null,
    max: null,
    direction: ApiGroupFilterDirection.Received,
    user_identity: null,
  },
  level: { min: null, max: null },
  owns_nfts: [],
  identity_group_id: null,
  identity_group_identities_count: 0,
  excluded_identity_group_id: null,
  excluded_identity_group_identities_count: 0,
  is_beneficiary_of_grant_id: null,
  is_beneficiary_of_grant: null,
});

const createUnknownGroupAuthor = (): ApiProfileMin => ({
  id: "unknown",
  handle: null,
  pfp: null,
  banner1_color: null,
  banner2_color: null,
  cic: 0,
  rep: 0,
  tdh: 0,
  tdh_rate: 0,
  xtdh: 0,
  xtdh_rate: 0,
  level: 0,
  primary_address: "",
  subscribed_actions: [],
  archived: false,
  active_main_stage_submission_ids: [],
  winner_main_stage_drop_ids: [],
  artist_of_prevote_cards: [],
  profile_wave_id: null,
  is_wave_creator: false,
});

const getSelectedGroup = (group: ApiGroup | null): ApiGroupFull | null => {
  if (!group?.id || !group.name) {
    return null;
  }

  return {
    id: group.id,
    name: group.name,
    group: createEmptyGroupDescription(),
    created_at: group.created_at ?? 0,
    created_by: group.author ?? createUnknownGroupAuthor(),
    visible: !group.is_hidden,
    is_private: false,
    is_direct_message: group.is_direct_message ?? false,
  };
};

export default function WaveGroupChangeDialog({
  wave,
  type,
  currentGroup,
  onClose,
  onGroupChange,
  onCreateGroup,
}: {
  readonly wave: ApiWave;
  readonly type: WaveGroupType;
  readonly currentGroup: ApiGroup | null;
  readonly onClose: () => void;
  readonly onGroupChange: (group: ApiGroupFull | null) => void | Promise<void>;
  readonly onCreateGroup: (
    payload: ApiCreateGroup
  ) => Promise<ApiGroupFull | null>;
}) {
  const modalRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const descriptionId = useId();
  const selectedGroup = useMemo(
    () => getSelectedGroup(currentGroup),
    [currentGroup]
  );
  const groupConfigType = WAVE_GROUP_TO_CREATE_GROUP_TYPE[type];
  const groupLabel =
    CREATE_WAVE_SELECT_GROUP_LABELS[wave.wave.type][groupConfigType];
  const defaultLabel = CREATE_WAVE_NONE_GROUP_LABELS[groupConfigType];
  const suggestedName = buildInlineGroupName({
    waveName: wave.name,
    groupLabel,
  });
  const title = selectedGroup ? "Change group" : "Add group";
  const description = selectedGroup
    ? "Create a new group or choose a different existing group."
    : "Create a new group or choose an existing group.";

  useClickAway(modalRef, onClose);
  useKeyPressEvent("Escape", (event: KeyboardEvent) => {
    if (event.defaultPrevented) {
      return;
    }

    const activeElement = document.activeElement as HTMLElement | null;
    if (
      activeElement &&
      modalRef.current?.contains(activeElement) &&
      (activeElement.tagName === "INPUT" ||
        activeElement.tagName === "TEXTAREA" ||
        activeElement.tagName === "SELECT" ||
        activeElement.isContentEditable ||
        activeElement.getAttribute("role") === "combobox")
    ) {
      return;
    }

    onClose();
  });

  return createPortal(
    <FocusTrap
      focusTrapOptions={{
        allowOutsideClick: true,
        fallbackFocus: () => modalRef.current ?? document.body,
      }}
    >
      <div className="tw-relative tw-z-50 tw-cursor-default">
        <div className="tw-fixed tw-inset-0 tw-bg-gray-500 tw-bg-opacity-75"></div>
        <div className="tw-fixed tw-inset-0 tw-z-10 tw-overflow-y-auto">
          <div className="tw-flex tw-min-h-full tw-items-end tw-justify-center tw-p-4 tw-text-center sm:tw-items-center sm:tw-p-0">
            <dialog
              ref={modalRef}
              aria-modal="true"
              aria-labelledby={titleId}
              aria-describedby={descriptionId}
              tabIndex={-1}
              open
              className="tw-relative tw-w-full tw-transform tw-rounded-xl tw-bg-iron-950 tw-p-6 tw-text-left tw-shadow-xl tw-transition-all tw-duration-500 sm:tw-w-full sm:tw-max-w-2xl"
            >
              <div className="tw-flex tw-items-start tw-justify-between tw-gap-x-4">
                <div className="tw-flex tw-flex-col tw-gap-y-2">
                  <p
                    id={titleId}
                    className="tw-mb-0 tw-text-lg tw-font-semibold tw-text-iron-50"
                  >
                    {title}
                  </p>
                  <p
                    id={descriptionId}
                    className="tw-mb-0 tw-text-sm tw-text-iron-400"
                  >
                    {description}
                  </p>
                </div>
                <button
                  onClick={onClose}
                  type="button"
                  aria-label="Close dialog"
                  className="tw-flex tw-items-center tw-justify-center tw-rounded-lg tw-border-0 tw-bg-iron-900 tw-p-2 tw-text-iron-400 tw-transition tw-duration-300 tw-ease-out hover:tw-text-iron-50"
                >
                  <span className="tw-sr-only">Close</span>
                  <FontAwesomeIcon icon={faXmark} className="tw-h-5 tw-w-5" />
                </button>
              </div>
              <div className="tw-mt-6">
                <CreateWaveGroupInlinePanel
                  suggestedName={suggestedName}
                  defaultLabel={defaultLabel}
                  selectedGroup={selectedGroup}
                  allowGroupClear={false}
                  onChange={onGroupChange}
                  onCreateGroup={onCreateGroup}
                />
              </div>
            </dialog>
          </div>
        </div>
      </div>
    </FocusTrap>,
    document.body
  );
}
