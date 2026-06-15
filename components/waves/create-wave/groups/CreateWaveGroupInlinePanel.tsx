"use client";

import { useMemo, useRef, useState, type ReactNode } from "react";
import { useClickAway } from "react-use";
import type { CommunityMemberMinimal } from "@/entities/IProfile";
import type { ApiCreateGroup } from "@/generated/models/ApiCreateGroup";
import type { ApiGroupFull } from "@/generated/models/ApiGroupFull";
import { validateGroupPayload } from "@/services/groups/groupMutations";
import {
  createInitialInlineGroupBuilderState,
  dedupeInlineIdentities,
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
  const panelRef = useRef<HTMLDivElement>(null);
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
  const validation = validateGroupPayload(builder.draft);
  const canCreateDraft = validation.valid && !disabled && !isCreating;
  const canResetDraft = !!draftSummary && !disabled && !isCreating;
  const isIdentityPanel = displayedBuilder.panel === PANEL_IDENTITY;
  const isRulePanel =
    displayedBuilder.panel === PANEL_RULE_LIST ||
    displayedBuilder.panel === PANEL_RULE_EDITOR;
  const isSearchPanel = displayedBuilder.panel === PANEL_SEARCH;
  const isCustomDraft = !!draftSummary || isIdentityPanel || isRulePanel;
  const isExpandedPanel = displayedBuilder.panel !== PANEL_ACTIONS;
  const currentStateLabel =
    selectedGroup?.name ?? (isCustomDraft ? "Custom" : defaultLabel);

  const resetBuilder = () => {
    setBuilder(createInitialInlineGroupBuilderState());
  };

  useClickAway(panelRef, () => {
    if (builder.panel !== PANEL_ACTIONS && !draftSummary) {
      resetBuilder();
    }
  });

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

  const onClearAll = () => {
    if (!canResetDraft) {
      return;
    }

    setBuilder((current) => {
      const next = createInitialInlineGroupBuilderState();

      return {
        ...next,
        panel:
          current.panel === PANEL_SEARCH || current.panel === PANEL_ACTIONS
            ? PANEL_ACTIONS
            : current.panel,
        activeRule:
          current.panel === PANEL_RULE_EDITOR ? current.activeRule : null,
      };
    });
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

  const onCancelPanel = () => {
    resetBuilder();
  };

  const renderExpandedPanel = (children: ReactNode, cancelClassName = "") => (
    <div className="tw-relative tw-border-x-0 tw-border-b-0 tw-border-t tw-border-solid tw-border-white/5 tw-pt-5">
      <div className="tw-flex tw-items-start tw-gap-3">
        <div className="tw-min-w-0 tw-flex-1">{children}</div>
        <button
          type="button"
          onClick={onCancelPanel}
          aria-label="Cancel inline group setup"
          className={`tw-flex-shrink-0 tw-rounded-lg tw-border tw-border-solid tw-border-transparent tw-bg-transparent tw-px-2.5 tw-py-1 tw-text-xs tw-font-medium tw-text-iron-500 tw-transition tw-duration-200 desktop-hover:hover:tw-text-iron-100 ${cancelClassName}`}
        >
          Cancel
        </button>
      </div>
    </div>
  );

  return (
    <div
      ref={panelRef}
      className={`tw-relative tw-flex tw-flex-col tw-gap-5 tw-rounded-xl tw-border tw-border-solid tw-p-5 tw-transition-all tw-duration-300 ${
        isExpandedPanel
          ? "tw-border-white/10 tw-bg-iron-900 tw-shadow-2xl"
          : "tw-border-white/5 tw-bg-iron-900/60 tw-shadow-inner"
      }`}
    >
      <div className="tw-relative tw-flex tw-flex-col tw-gap-5">
        <CreateWaveInlineGroupHeader currentStateLabel={currentStateLabel} />
        <CreateWaveInlineGroupActions
          disabled={disabled}
          identityActive={isIdentityPanel}
          ruleActive={isRulePanel}
          searchActive={isSearchPanel}
          onAddIdentity={() => togglePanel(PANEL_IDENTITY, isIdentityPanel)}
          onAddRule={() => togglePanel(PANEL_RULE_LIST, isRulePanel)}
          onUseExistingGroup={() => togglePanel(PANEL_SEARCH, isSearchPanel)}
        />

        {displayedBuilder.panel === PANEL_IDENTITY &&
          renderExpandedPanel(
            <CreateWaveInlineGroupIdentities
              identities={displayedBuilder.identities}
              onIdentitySelect={addIdentity}
              onRemove={removeIdentity}
            />,
            "tw-mt-3"
          )}

        {displayedBuilder.panel === PANEL_RULE_LIST &&
          renderExpandedPanel(
            <CreateWaveInlineGroupRuleList
              disabled={disabled}
              onRuleOpen={openRule}
            />
          )}

        {displayedBuilder.panel === PANEL_RULE_EDITOR &&
          displayedBuilder.activeRule !== null &&
          renderExpandedPanel(
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

        {displayedBuilder.panel === PANEL_SEARCH &&
          renderExpandedPanel(
            <CreateWaveInlineGroupSearch
              defaultLabel={defaultLabel}
              disabled={disabled}
              selectedGroup={selectedGroup}
              allowGroupClear={allowGroupClear}
              onSelect={(group) => {
                void onExistingGroupSelect(group);
              }}
            />,
            "tw-mt-3"
          )}

        {displayedBuilder.panel !== PANEL_ACTIONS && (
          <CreateWaveInlineGroupDraftSummary
            draftSummary={
              displayedBuilder.panel === PANEL_SEARCH ? null : draftSummary
            }
            isValid={validation.valid}
            canResetDraft={
              displayedBuilder.panel !== PANEL_SEARCH && canResetDraft
            }
            canCreateDraft={
              displayedBuilder.panel !== PANEL_SEARCH && canCreateDraft
            }
            isCreating={isCreating}
            onClearAll={onClearAll}
            onCreateAndUse={onCreateAndUse}
          />
        )}
      </div>
    </div>
  );
}
