"use client";

import CreateWaveInlineGroupActions from "./CreateWaveInlineGroupActions";
import CreateWaveInlineGroupDraftSummary from "./CreateWaveInlineGroupDraftSummary";
import CreateWaveInlineGroupExpandedPanel from "./CreateWaveInlineGroupExpandedPanel";
import CreateWaveInlineGroupHeader from "./CreateWaveInlineGroupHeader";
import CreateWaveInlineGroupIdentities from "./CreateWaveInlineGroupIdentities";
import CreateWaveInlineGroupRuleEditor from "./CreateWaveInlineGroupRuleEditor";
import {
  CreateWaveInlineGroupRuleEditorPanel,
  CreateWaveInlineGroupRuleList,
} from "./CreateWaveInlineGroupRules";
import CreateWaveInlineGroupSearch from "./CreateWaveInlineGroupSearch";
import {
  type CreateWaveGroupInlinePanelProps,
  useCreateWaveGroupInlinePanel,
} from "./useCreateWaveGroupInlinePanel";

export default function CreateWaveGroupInlinePanel(
  props: CreateWaveGroupInlinePanelProps
) {
  const {
    allowGroupClear = true,
    defaultLabel,
    disabled = false,
    selectedGroup,
  } = props;
  const {
    addIdentity,
    canCreateDraft,
    canResetDraft,
    currentGroupLabel,
    displayedBuilder,
    draftSummary,
    hasUnsavedGroup,
    isCreating,
    isDraftValid,
    isExpandedPanel,
    isIdentityPanel,
    isRulePanel,
    isSearchPanel,
    onCancelPanel,
    onClearAll,
    onCreateAndUse,
    onExistingGroupSelect,
    openRule,
    panelRef,
    removeIdentity,
    setDraft,
    showDraftFooter,
    togglePanel,
    toggleRule,
    unsavedGroupDescription,
    unsavedGroupSummary,
  } = useCreateWaveGroupInlinePanel(props);

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
        <CreateWaveInlineGroupHeader
          currentGroupLabel={currentGroupLabel}
          unsavedGroupDescription={unsavedGroupDescription}
          unsavedGroupSummary={unsavedGroupSummary}
        />
        <CreateWaveInlineGroupActions
          disabled={disabled}
          identityActive={isIdentityPanel}
          ruleActive={isRulePanel}
          searchActive={isSearchPanel}
          onAddIdentity={() => togglePanel("identity", isIdentityPanel)}
          onAddRule={() => togglePanel("rule-list", isRulePanel)}
          onUseExistingGroup={() => togglePanel("search", isSearchPanel)}
        />

        {displayedBuilder.panel === "identity" && (
          <CreateWaveInlineGroupExpandedPanel
            onCancel={onCancelPanel}
            cancelClassName="tw-mt-3"
          >
            <CreateWaveInlineGroupIdentities
              identities={displayedBuilder.identities}
              onIdentitySelect={addIdentity}
              onRemove={removeIdentity}
            />
          </CreateWaveInlineGroupExpandedPanel>
        )}

        {displayedBuilder.panel === "rule-list" && (
          <CreateWaveInlineGroupExpandedPanel onCancel={onCancelPanel}>
            <CreateWaveInlineGroupRuleList
              disabled={disabled}
              onRuleOpen={openRule}
            />
          </CreateWaveInlineGroupExpandedPanel>
        )}

        {displayedBuilder.panel === "rule-editor" &&
          displayedBuilder.activeRule !== null && (
            <CreateWaveInlineGroupExpandedPanel onCancel={onCancelPanel}>
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
            </CreateWaveInlineGroupExpandedPanel>
          )}

        {displayedBuilder.panel === "search" && (
          <CreateWaveInlineGroupExpandedPanel
            onCancel={onCancelPanel}
            cancelClassName="tw-mt-3"
          >
            <CreateWaveInlineGroupSearch
              defaultLabel={defaultLabel}
              disabled={disabled}
              hasUnsavedGroup={hasUnsavedGroup}
              selectedGroup={selectedGroup}
              allowGroupClear={allowGroupClear}
              onSelect={onExistingGroupSelect}
            />
          </CreateWaveInlineGroupExpandedPanel>
        )}

        {showDraftFooter && (
          <CreateWaveInlineGroupDraftSummary
            draftSummary={draftSummary}
            isValid={isDraftValid}
            canResetDraft={canResetDraft}
            canCreateDraft={canCreateDraft}
            isCreating={isCreating}
            onClearAll={onClearAll}
            onCreateAndUse={onCreateAndUse}
          />
        )}
      </div>
    </div>
  );
}
