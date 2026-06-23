"use client";

import { useMemo } from "react";
import GroupAssignmentDialog from "@/components/groups/assignment/GroupAssignmentDialog";
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
import { ApiProfileClassification } from "@/generated/models/ApiProfileClassification";
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
  classification: ApiProfileClassification.Pseudonym,
  sub_classification: null,
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

  return (
    <GroupAssignmentDialog
      title={title}
      description={description}
      suggestedName={suggestedName}
      defaultLabel={defaultLabel}
      selectedGroup={selectedGroup}
      allowGroupClear={false}
      onClose={onClose}
      onChange={onGroupChange}
      onCreateGroup={onCreateGroup}
    />
  );
}
