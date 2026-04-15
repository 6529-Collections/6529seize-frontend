"use client";

import { useMemo, useState } from "react";
import type { CommunityMemberMinimal } from "@/entities/IProfile";
import type { ApiCreateGroup } from "@/generated/models/ApiCreateGroup";
import type { ApiGroupFull } from "@/generated/models/ApiGroupFull";
import { validateGroupPayload } from "@/services/groups/groupMutations";
import {
  createInitialInlineGroupBuilderState,
  dedupeInlineIdentities,
  getInlineGroupConfiguredRules,
  getInlineGroupDraftSummary,
  getInlineIdentityAddresses,
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

const PANEL_ACTIONS: CreateWaveInlineGroupPanel = "actions";
const PANEL_IDENTITY: CreateWaveInlineGroupPanel = "identity";
const PANEL_RULE_LIST: CreateWaveInlineGroupPanel = "rule-list";
const PANEL_RULE_EDITOR: CreateWaveInlineGroupPanel = "rule-editor";
const PANEL_SEARCH: CreateWaveInlineGroupPanel = "search";

export default function CreateWaveGroupInlinePanel({
  suggestedName,
  defaultLabel,
  disabled = false,
  selectedGroup,
  allowGroupClear = true,
  onChange,
  onCreateGroup,
}: {
  readonly suggestedName: string;
  readonly defaultLabel: string;
  readonly disabled?: boolean;
  readonly selectedGroup: ApiGroupFull | null;
  readonly allowGroupClear?: boolean;
  readonly onChange: (group: ApiGroupFull | null) => void | Promise<void>;
  readonly onCreateGroup: (
    payload: ApiCreateGroup
  ) => Promise<ApiGroupFull | null>;
}) {
  const [isCreating, setIsCreating] = useState(false);
  const [builder, setBuilder] = useState<CreateWaveInlineGroupBuilderState>(
    () => createInitialInlineGroupBuilderState()
  );
  const displayedBuilder: CreateWaveInlineGroupBuilderState = disabled
    ? {
        ...builder,
        panel: PANEL_ACTIONS,
        activeRule: null,
      }
    : builder;

  const draftSummary = useMemo(
    () =>
      getInlineGroupDraftSummary({
        draft: builder.draft,
        identityCount: builder.identities.length,
      }),
    [builder.draft, builder.identities.length]
  );
  const configuredRules = useMemo(
    () => getInlineGroupConfiguredRules(builder.draft),
    [builder.draft]
  );
  const validation = validateGroupPayload(builder.draft);
  const canCreateDraft = validation.valid && !disabled && !isCreating;
  const canResetDraft = !!draftSummary && !disabled && !isCreating;
  const currentStateLabel = selectedGroup?.name ?? defaultLabel;
  const identityCount = displayedBuilder.identities.length;
  const identityLabel = identityCount === 1 ? "identity" : "identities";
  const isIdentityPanel = displayedBuilder.panel === PANEL_IDENTITY;
  const isRulePanel =
    displayedBuilder.panel === PANEL_RULE_LIST ||
    displayedBuilder.panel === PANEL_RULE_EDITOR;
  const isSearchPanel = displayedBuilder.panel === PANEL_SEARCH;
  const showModeChips =
    !!draftSummary || displayedBuilder.panel !== PANEL_ACTIONS;
  const identityChipLabel =
    identityCount > 0 ? `${identityCount} ${identityLabel}` : "Add identity";

  const resetBuilder = () => {
    setBuilder(createInitialInlineGroupBuilderState());
  };

  const setPanel = (panel: CreateWaveInlineGroupPanel) => {
    setBuilder((current) => ({
      ...current,
      panel,
    }));
  };

  const setActiveRule = (rule: CreateWaveInlineGroupRuleType | null) => {
    setBuilder((current) => ({
      ...current,
      activeRule: rule,
      panel: rule === null ? current.panel : PANEL_RULE_EDITOR,
    }));
  };

  const setDraft = (draft: ApiCreateGroup) => {
    setBuilder((current) => ({
      ...current,
      draft,
    }));
  };

  const addIdentity = (identity: CommunityMemberMinimal) => {
    setBuilder((current) => {
      const identities = dedupeInlineIdentities([
        ...current.identities,
        identity,
      ]);

      return {
        ...current,
        identities,
        draft: {
          ...current.draft,
          group: {
            ...current.draft.group,
            identity_addresses: getInlineIdentityAddresses(identities),
          },
        },
      };
    });
  };

  const removeIdentity = (wallet: string) => {
    const normalizedWallet = wallet.trim().toLowerCase();

    setBuilder((current) => {
      const identities = current.identities.filter((identity) => {
        const key = identity.wallet.trim().toLowerCase();
        return key !== normalizedWallet;
      });

      return {
        ...current,
        identities,
        draft: {
          ...current.draft,
          group: {
            ...current.draft.group,
            identity_addresses: getInlineIdentityAddresses(identities),
          },
        },
      };
    });
  };

  const openPanel = (panel: CreateWaveInlineGroupPanel) => {
    setActiveRule(null);
    setPanel(panel);
  };

  const togglePanel = (
    panel: CreateWaveInlineGroupPanel,
    isActive: boolean
  ) => {
    openPanel(isActive ? PANEL_ACTIONS : panel);
  };

  const openRule = (rule: CreateWaveInlineGroupRuleType) => {
    setActiveRule(rule);
  };

  const toggleRule = (rule: CreateWaveInlineGroupRuleType) => {
    if (builder.panel === PANEL_RULE_EDITOR && builder.activeRule === rule) {
      setActiveRule(null);
      setPanel(PANEL_RULE_LIST);
      return;
    }

    openRule(rule);
  };

  const createAndUse = async () => {
    if (!canCreateDraft) {
      return;
    }

    setIsCreating(true);
    try {
      const nextPayload: ApiCreateGroup = {
        ...builder.draft,
        name: suggestedName.trim() || "Wave Group",
      };

      const createdGroup = await onCreateGroup(nextPayload);
      if (!createdGroup) {
        return;
      }

      await onChange(createdGroup);
      resetBuilder();
    } finally {
      setIsCreating(false);
    }
  };

  const onCreateAndUse = () => {
    void createAndUse();
  };

  const onStartOver = () => {
    if (!canResetDraft) {
      return;
    }

    resetBuilder();
  };

  const onExistingGroupSelect = async (group: ApiGroupFull | null) => {
    if (!group && !allowGroupClear) {
      return;
    }

    await onChange(group);
    if (group) {
      resetBuilder();
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
          onIdentityToggle={() => togglePanel(PANEL_IDENTITY, isIdentityPanel)}
          onRuleOpen={openRule}
          onRulesToggle={() => togglePanel(PANEL_RULE_LIST, isRulePanel)}
          onSearchToggle={() => togglePanel(PANEL_SEARCH, isSearchPanel)}
        />

        {displayedBuilder.panel === PANEL_ACTIONS && !draftSummary && (
          <CreateWaveInlineGroupActions
            disabled={disabled}
            onAddIdentity={() => openPanel(PANEL_IDENTITY)}
            onAddRule={() => openPanel(PANEL_RULE_LIST)}
            onUseExistingGroup={() => openPanel(PANEL_SEARCH)}
          />
        )}

        {displayedBuilder.panel === PANEL_IDENTITY && (
          <div className="tw-space-y-3">
            <CreateWaveInlineGroupIdentities
              identities={displayedBuilder.identities}
              onIdentitySelect={addIdentity}
              onRemove={removeIdentity}
            />
          </div>
        )}

        {displayedBuilder.panel === PANEL_RULE_LIST && (
          <CreateWaveInlineGroupRuleList
            disabled={disabled}
            onRuleOpen={openRule}
          />
        )}

        {displayedBuilder.panel === PANEL_RULE_EDITOR &&
          displayedBuilder.activeRule !== null && (
            <CreateWaveInlineGroupRuleEditorPanel
              activeRule={displayedBuilder.activeRule}
              disabled={disabled}
              onRuleToggle={toggleRule}
            >
              <CreateWaveInlineGroupRuleEditor
                draft={displayedBuilder.draft}
                activeRule={displayedBuilder.activeRule}
                onDraftChange={setDraft}
              />
            </CreateWaveInlineGroupRuleEditorPanel>
          )}

        {displayedBuilder.panel === PANEL_SEARCH && (
          <CreateWaveInlineGroupSearch
            defaultLabel={defaultLabel}
            disabled={disabled}
            selectedGroup={selectedGroup}
            allowGroupClear={allowGroupClear}
            onSelect={(group) => {
              void onExistingGroupSelect(group);
            }}
          />
        )}

        {displayedBuilder.panel !== PANEL_SEARCH && draftSummary && (
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
