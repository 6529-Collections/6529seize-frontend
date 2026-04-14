"use client";

import { useMemo, useState } from "react";
import type { CommunityMemberMinimal } from "@/entities/IProfile";
import type { ApiCreateGroup } from "@/generated/models/ApiCreateGroup";
import type { ApiGroupFull } from "@/generated/models/ApiGroupFull";
import { validateGroupPayload } from "@/services/groups/groupMutations";
import {
  buildInlineGroupName,
  getInlineGroupConfiguredRules,
  getInlineGroupDraftSummary,
} from "./createWaveInlineGroupBuilder";
import type {
  CreateWaveInlineGroupBuilderState,
  CreateWaveInlineGroupPanel,
  CreateWaveInlineGroupRuleType,
} from "./createWaveInlineGroupBuilder";
import CreateWaveInlineGroupActions from "./CreateWaveInlineGroupActions";
import CreateWaveInlineGroupDraftSummary from "./CreateWaveInlineGroupDraftSummary";
import CreateWaveInlineGroupHeader from "./CreateWaveInlineGroupHeader";
import CreateWaveInlineGroupIdentities from "./CreateWaveInlineGroupIdentities";
import CreateWaveInlineGroupRuleEditor from "./CreateWaveInlineGroupRuleEditor";
import {
  CreateWaveInlineGroupRuleEditorPanel,
  CreateWaveInlineGroupRuleList,
} from "./CreateWaveInlineGroupRules";
import CreateWaveInlineGroupSearch from "./CreateWaveInlineGroupSearch";

export default function CreateWaveGroupInlinePanel({
  waveName,
  groupLabel,
  defaultLabel,
  disabled,
  selectedGroup,
  groupBuilder,
  onGroupSelect,
  onInlineGroupCreate,
  setGroupBuilderPanel,
  setGroupBuilderRule,
  setGroupBuilderDraft,
  addGroupBuilderIdentity,
  removeGroupBuilderIdentity,
  resetGroupBuilder,
}: {
  readonly waveName: string;
  readonly groupLabel: string;
  readonly defaultLabel: string;
  readonly disabled: boolean;
  readonly selectedGroup: ApiGroupFull | null;
  readonly groupBuilder: CreateWaveInlineGroupBuilderState;
  readonly onGroupSelect: (group: ApiGroupFull | null) => void;
  readonly onInlineGroupCreate: (
    payload: ApiCreateGroup
  ) => Promise<ApiGroupFull | null>;
  readonly setGroupBuilderPanel: (panel: CreateWaveInlineGroupPanel) => void;
  readonly setGroupBuilderRule: (
    rule: CreateWaveInlineGroupRuleType | null
  ) => void;
  readonly setGroupBuilderDraft: (draft: ApiCreateGroup) => void;
  readonly addGroupBuilderIdentity: (identity: CommunityMemberMinimal) => void;
  readonly removeGroupBuilderIdentity: (wallet: string) => void;
  readonly resetGroupBuilder: () => void;
}) {
  const [isCreating, setIsCreating] = useState(false);

  const draftSummary = useMemo(
    () =>
      getInlineGroupDraftSummary({
        draft: groupBuilder.draft,
        identityCount: groupBuilder.identities.length,
      }),
    [groupBuilder.draft, groupBuilder.identities.length]
  );
  const configuredRules = useMemo(
    () => getInlineGroupConfiguredRules(groupBuilder.draft),
    [groupBuilder.draft]
  );
  const validation = validateGroupPayload(groupBuilder.draft);
  const canCreateDraft = validation.valid && !disabled && !isCreating;
  const canResetDraft = !!draftSummary && !disabled && !isCreating;
  const currentStateLabel = selectedGroup?.name ?? defaultLabel;
  const identityCount = groupBuilder.identities.length;
  const identityLabel = identityCount === 1 ? "identity" : "identities";
  const isIdentityPanel = groupBuilder.panel === "identity";
  const isRulePanel =
    groupBuilder.panel === "rule-list" || groupBuilder.panel === "rule-editor";
  const isSearchPanel = groupBuilder.panel === "search";
  const showModeChips = !!draftSummary || groupBuilder.panel !== "actions";
  const identityChipLabel =
    identityCount > 0 ? `${identityCount} ${identityLabel}` : "Add identity";

  const openPanel = (panel: CreateWaveInlineGroupPanel) => {
    setGroupBuilderRule(null);
    setGroupBuilderPanel(panel);
  };

  const togglePanel = (
    panel: CreateWaveInlineGroupPanel,
    isActive: boolean
  ) => {
    openPanel(isActive ? "actions" : panel);
  };

  const openRule = (rule: CreateWaveInlineGroupRuleType) => {
    setGroupBuilderRule(rule);
  };

  const toggleRule = (rule: CreateWaveInlineGroupRuleType) => {
    if (
      groupBuilder.panel === "rule-editor" &&
      groupBuilder.activeRule === rule
    ) {
      setGroupBuilderRule(null);
      setGroupBuilderPanel("rule-list");
      return;
    }

    openRule(rule);
  };

  const onCreateAndUse = async () => {
    if (!canCreateDraft) {
      return;
    }

    setIsCreating(true);
    try {
      const nextPayload: ApiCreateGroup = {
        ...groupBuilder.draft,
        name: buildInlineGroupName({
          waveName,
          groupLabel,
        }),
      };

      const createdGroup = await onInlineGroupCreate(nextPayload);
      if (!createdGroup) {
        return;
      }

      onGroupSelect(createdGroup);
      resetGroupBuilder();
      setGroupBuilderRule(null);
      setGroupBuilderPanel("actions");
    } finally {
      setIsCreating(false);
    }
  };

  const onStartOver = () => {
    if (!canResetDraft) {
      return;
    }

    resetGroupBuilder();
  };

  const onExistingGroupSelect = (group: ApiGroupFull | null) => {
    onGroupSelect(group);
    if (group) {
      resetGroupBuilder();
      setGroupBuilderRule(null);
      setGroupBuilderPanel("actions");
    }
  };

  return (
    <div className="tw-rounded-xl tw-border tw-border-solid tw-border-iron-800 tw-bg-iron-950 tw-p-4">
      <div className="tw-space-y-3">
        <CreateWaveInlineGroupHeader
          currentStateLabel={currentStateLabel}
          showModeChips={showModeChips}
          identityChipLabel={identityChipLabel}
          disabled={disabled}
          isIdentityPanel={isIdentityPanel}
          isRulePanel={isRulePanel}
          isSearchPanel={isSearchPanel}
          configuredRules={configuredRules}
          onIdentityToggle={() => togglePanel("identity", isIdentityPanel)}
          onRuleOpen={openRule}
          onRulesToggle={() => togglePanel("rule-list", isRulePanel)}
          onSearchToggle={() => togglePanel("search", isSearchPanel)}
        />

        {groupBuilder.panel === "actions" && !draftSummary && (
          <CreateWaveInlineGroupActions
            disabled={disabled}
            onAddIdentity={() => openPanel("identity")}
            onAddRule={() => openPanel("rule-list")}
            onUseExistingGroup={() => openPanel("search")}
          />
        )}

        {groupBuilder.panel === "identity" && (
          <div className="tw-space-y-3">
            <CreateWaveInlineGroupIdentities
              identities={groupBuilder.identities}
              onIdentitySelect={addGroupBuilderIdentity}
              onRemove={removeGroupBuilderIdentity}
            />
          </div>
        )}

        {groupBuilder.panel === "rule-list" && (
          <CreateWaveInlineGroupRuleList
            disabled={disabled}
            onRuleOpen={openRule}
          />
        )}

        {groupBuilder.panel === "rule-editor" &&
          groupBuilder.activeRule !== null && (
            <CreateWaveInlineGroupRuleEditorPanel
              activeRule={groupBuilder.activeRule}
              disabled={disabled}
              onRuleToggle={toggleRule}
            >
              <CreateWaveInlineGroupRuleEditor
                draft={groupBuilder.draft}
                activeRule={groupBuilder.activeRule}
                onDraftChange={setGroupBuilderDraft}
              />
            </CreateWaveInlineGroupRuleEditorPanel>
          )}

        {groupBuilder.panel === "search" && (
          <CreateWaveInlineGroupSearch
            defaultLabel={defaultLabel}
            disabled={disabled}
            selectedGroup={selectedGroup}
            onSelect={onExistingGroupSelect}
          />
        )}

        {groupBuilder.panel !== "search" && draftSummary && (
          <CreateWaveInlineGroupDraftSummary
            draftSummary={draftSummary}
            isValid={validation.valid}
            canResetDraft={canResetDraft}
            canCreateDraft={canCreateDraft}
            isCreating={isCreating}
            onStartOver={onStartOver}
            onCreateAndUse={onCreateAndUse}
          />
        )}
      </div>
    </div>
  );
}
