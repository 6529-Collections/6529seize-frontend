"use client";

import type { ReactNode } from "react";
import { useState } from "react";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";
import type { ApiGroupFull } from "@/generated/models/ApiGroupFull";
import type { CreateWaveGroupSearchResultsLayout } from "@/components/waves/create-wave/groups/CreateWaveGroupSearchResults";
import CreateWaveInlineGroupDraftSummary from "@/components/waves/create-wave/groups/CreateWaveInlineGroupDraftSummary";
import CreateWaveInlineGroupExpandedPanel from "@/components/waves/create-wave/groups/CreateWaveInlineGroupExpandedPanel";
import CreateWaveInlineGroupHeader from "@/components/waves/create-wave/groups/CreateWaveInlineGroupHeader";
import CreateWaveInlineGroupIdentities from "@/components/waves/create-wave/groups/CreateWaveInlineGroupIdentities";
import CreateWaveInlineGroupPrivacy from "@/components/waves/create-wave/groups/CreateWaveInlineGroupPrivacy";
import CreateWaveInlineGroupRuleEditor from "@/components/waves/create-wave/groups/CreateWaveInlineGroupRuleEditor";
import {
  CreateWaveInlineGroupIdentityEditorPanel,
  CreateWaveInlineGroupRuleEditorPanel,
  CreateWaveInlineGroupRuleList,
} from "@/components/waves/create-wave/groups/CreateWaveInlineGroupRules";
import CreateWaveInlineGroupSearch from "@/components/waves/create-wave/groups/CreateWaveInlineGroupSearch";
import CreateWaveInlineGroupActions from "@/components/waves/create-wave/groups/CreateWaveInlineGroupActions";
import {
  type CreateWaveGroupInlinePanelProps,
  useCreateWaveGroupInlinePanel,
} from "@/components/waves/create-wave/groups/useCreateWaveGroupInlinePanel";
import GroupMembersPreviewDialog from "@/components/groups/members/GroupMembersPreviewDialog";
import GroupMembersPreviewTrigger from "@/components/groups/members/GroupMembersPreviewTrigger";
import type { GroupMembersPreviewTarget } from "@/services/api/group-members-api";

type GroupAssignmentPanelStartMode = "actions" | "existing" | "criteria";

type GroupAssignmentPanelProps = CreateWaveGroupInlinePanelProps & {
  readonly startMode?: GroupAssignmentPanelStartMode;
  readonly showChooseGroup?: boolean;
  readonly showPrivacyControl?: boolean;
  readonly isWaveAccessEditor?: boolean;
  readonly showMakeWavePublic?: boolean;
  readonly onMakeWavePublic?: (() => void) | undefined;
  readonly showMatchWaveAccess?: boolean;
  readonly onMatchWaveAccess?: (() => void) | undefined;
};

function DraftPrivacyControl({
  disabled,
  isPrivate,
  onChange,
}: {
  readonly disabled: boolean;
  readonly isPrivate: boolean | undefined;
  readonly onChange: (isPrivate: boolean) => void;
}) {
  return (
    <CreateWaveInlineGroupPrivacy
      disabled={disabled}
      isPrivate={isPrivate ?? false}
      onChange={onChange}
    />
  );
}

function SearchPanel({
  allowGroupClear,
  defaultLabel,
  disabled,
  hasUnsavedGroup,
  onExistingGroupSelect,
  resultsLayout = "popover",
  selectedGroup,
}: {
  readonly allowGroupClear: boolean;
  readonly defaultLabel: string;
  readonly disabled: boolean;
  readonly hasUnsavedGroup: boolean;
  readonly onExistingGroupSelect: (group: ApiGroupFull | null) => void;
  readonly resultsLayout?: CreateWaveGroupSearchResultsLayout;
  readonly selectedGroup: ApiGroupFull | null;
}) {
  return (
    <CreateWaveInlineGroupSearch
      defaultLabel={defaultLabel}
      disabled={disabled}
      hasUnsavedGroup={hasUnsavedGroup}
      selectedGroup={selectedGroup}
      allowGroupClear={allowGroupClear}
      resultsLayout={resultsLayout}
      onSelect={onExistingGroupSelect}
    />
  );
}

type GroupAssignmentPanelState = ReturnType<
  typeof useCreateWaveGroupInlinePanel
>;

interface GroupAssignmentPanelViewProps {
  readonly draftMembersPreview: ReactNode;
  readonly membersDialog: ReactNode;
  readonly panelProps: GroupAssignmentPanelProps;
  readonly panelState: GroupAssignmentPanelState;
  readonly savedMembersPreview: ReactNode;
}

function SharedGroupAssignmentPanel({
  draftMembersPreview,
  membersDialog,
  panelProps,
  panelState,
  savedMembersPreview,
}: GroupAssignmentPanelViewProps) {
  const {
    allowGroupClear = true,
    defaultLabel,
    disabled = false,
    selectedGroup,
    showChooseGroup = true,
    showPrivacyControl = true,
    isWaveAccessEditor = false,
    showMakeWavePublic = false,
    onMakeWavePublic,
    showMatchWaveAccess = false,
    onMatchWaveAccess,
  } = panelProps;
  const {
    addExcludedIdentity,
    addIdentity,
    canCreateDraft,
    canReplaceCriteria,
    currentGroupLabel,
    displayedBuilder,
    draftSummary,
    hasUnsavedGroup,
    isCreating,
    isCriteriaReplacementActive,
    isDraftValid,
    isSearchPanel,
    onCancelPanel,
    onClearAll,
    onCreateAndUse,
    onExistingGroupSelect,
    onReplaceCriteria,
    openRule,
    panelRef,
    removeIdentity,
    removeExcludedIdentity,
    returnToCriteria,
    setDraft,
    showDraftFooter,
    togglePanel,
    toggleRule,
    unsavedGroupDescription,
    unsavedGroupSummary,
    updateExcludedWalletSources,
    updateIncludedWalletSources,
  } = panelState;

  return (
    <>
      <div
        ref={panelRef}
        className="tw-relative tw-flex tw-flex-col tw-gap-4 tw-rounded-xl tw-border tw-border-solid tw-border-white/5 tw-bg-iron-900/60 tw-p-4 tw-shadow-none tw-transition-all tw-duration-300"
      >
        <div className="tw-relative tw-flex tw-flex-col tw-gap-4">
          <div className="tw-flex tw-min-w-0 tw-flex-col tw-gap-4 lg:tw-flex-row lg:tw-items-start lg:tw-justify-between">
            <CreateWaveInlineGroupHeader
              currentGroupLabel={currentGroupLabel}
              showCurrentGroupTitle={isCriteriaReplacementActive}
              unsavedGroupDescription={
                showChooseGroup ? unsavedGroupDescription : null
              }
              unsavedGroupSummary={showChooseGroup ? unsavedGroupSummary : null}
              membersPreview={savedMembersPreview}
            />
            <CreateWaveInlineGroupActions
              disabled={disabled}
              criteriaDisabled={!canReplaceCriteria}
              criteriaActive={isCriteriaReplacementActive}
              searchActive={isSearchPanel}
              showChooseGroup={showChooseGroup}
              isWaveAccessEditor={isWaveAccessEditor}
              showMakeWavePublic={showMakeWavePublic}
              onMakeWavePublic={onMakeWavePublic}
              showMatchWaveAccess={showMatchWaveAccess}
              onMatchWaveAccess={onMatchWaveAccess}
              onReplaceCriteria={
                isCriteriaReplacementActive && isWaveAccessEditor
                  ? onClearAll
                  : onReplaceCriteria
              }
              onUseExistingGroup={() => togglePanel("search", isSearchPanel)}
            />
          </div>

          {displayedBuilder.panel === "identity" ? (
            <CreateWaveInlineGroupExpandedPanel
              onCancel={returnToCriteria}
              showCancel={!isWaveAccessEditor}
            >
              <CreateWaveInlineGroupIdentityEditorPanel
                draft={displayedBuilder.draft}
                disabled={disabled}
                onIdentityToggle={returnToCriteria}
                onRuleToggle={toggleRule}
              >
                <CreateWaveInlineGroupIdentities
                  includedIdentities={displayedBuilder.identities}
                  excludedIdentities={displayedBuilder.excludedIdentities}
                  includedWalletSources={displayedBuilder.includedWalletSources}
                  excludedWalletSources={displayedBuilder.excludedWalletSources}
                  onIncludedIdentitySelect={addIdentity}
                  onIncludedIdentityRemove={removeIdentity}
                  onExcludedIdentitySelect={addExcludedIdentity}
                  onExcludedIdentityRemove={removeExcludedIdentity}
                  onIncludedWalletSourcesChange={updateIncludedWalletSources}
                  onExcludedWalletSourcesChange={updateExcludedWalletSources}
                />
              </CreateWaveInlineGroupIdentityEditorPanel>
            </CreateWaveInlineGroupExpandedPanel>
          ) : null}

          {displayedBuilder.panel === "rule-list" ? (
            <CreateWaveInlineGroupExpandedPanel
              onCancel={onClearAll}
              showCancel={false}
            >
              <CreateWaveInlineGroupRuleList
                draft={displayedBuilder.draft}
                disabled={disabled}
                onIdentityOpen={() => togglePanel("identity", false)}
                onRuleOpen={openRule}
              />
            </CreateWaveInlineGroupExpandedPanel>
          ) : null}

          {displayedBuilder.panel === "rule-editor" &&
          displayedBuilder.activeRule !== null ? (
            <CreateWaveInlineGroupExpandedPanel
              onCancel={returnToCriteria}
              showCancel={!isWaveAccessEditor}
            >
              <CreateWaveInlineGroupRuleEditorPanel
                activeRule={displayedBuilder.activeRule}
                draft={displayedBuilder.draft}
                disabled={disabled}
                onIdentityToggle={() => togglePanel("identity", false)}
                onRuleToggle={toggleRule}
              >
                <CreateWaveInlineGroupRuleEditor
                  draft={displayedBuilder.draft}
                  activeRule={displayedBuilder.activeRule}
                  onDraftChange={setDraft}
                />
              </CreateWaveInlineGroupRuleEditorPanel>
            </CreateWaveInlineGroupExpandedPanel>
          ) : null}

          {displayedBuilder.panel === "search" ? (
            <CreateWaveInlineGroupExpandedPanel
              onCancel={onCancelPanel}
              cancelSize="md"
            >
              <SearchPanel
                allowGroupClear={allowGroupClear}
                defaultLabel={defaultLabel}
                disabled={disabled}
                hasUnsavedGroup={hasUnsavedGroup}
                onExistingGroupSelect={onExistingGroupSelect}
                selectedGroup={selectedGroup}
              />
            </CreateWaveInlineGroupExpandedPanel>
          ) : null}

          {showDraftFooter ? (
            <CreateWaveInlineGroupDraftSummary
              draftSummary={draftSummary}
              isValid={isDraftValid}
              canCreateDraft={canCreateDraft}
              isCreating={isCreating}
              forceVisible={isCriteriaReplacementActive}
              saveChangesLabel={isWaveAccessEditor}
              draftMembersPreview={draftMembersPreview}
              privacyControl={
                showPrivacyControl &&
                isCriteriaReplacementActive &&
                !isSearchPanel ? (
                  <DraftPrivacyControl
                    disabled={disabled}
                    isPrivate={displayedBuilder.draft.is_private}
                    onChange={(isPrivate) =>
                      setDraft({
                        ...displayedBuilder.draft,
                        is_private: isPrivate,
                      })
                    }
                  />
                ) : undefined
              }
              onCreateAndUse={onCreateAndUse}
            />
          ) : null}
        </div>
      </div>
      {membersDialog}
    </>
  );
}

export default function GroupAssignmentPanel(props: GroupAssignmentPanelProps) {
  const locale = useBrowserLocale();
  const {
    defaultMembersPreviewTarget,
    disabled = false,
    selectedGroup,
    membersRoleLabel,
    selectedGroupCriteriaStatus,
  } = props;
  const [previewTarget, setPreviewTarget] =
    useState<GroupMembersPreviewTarget | null>(null);
  const panelState = useCreateWaveGroupInlinePanel(props);
  const { displayedBuilder, draftSummary, isDraftValid } = panelState;

  const currentMembersTarget: GroupMembersPreviewTarget | null = selectedGroup
    ? { kind: "saved", group: selectedGroup }
    : (defaultMembersPreviewTarget ?? null);
  const savedMembersPreview =
    membersRoleLabel && currentMembersTarget ? (
      <GroupMembersPreviewTrigger
        target={currentMembersTarget}
        disabled={disabled}
        criteriaStatus={selectedGroupCriteriaStatus}
        onOpen={() => setPreviewTarget(currentMembersTarget)}
      />
    ) : null;
  const draftMembersTarget: GroupMembersPreviewTarget | null =
    draftSummary !== null && isDraftValid
      ? {
          kind: "draft",
          group: displayedBuilder.draft.group,
          name:
            props.suggestedName.trim() ||
            t(locale, "waves.create.groups.defaultGroupName"),
          summary: draftSummary,
        }
      : null;
  const draftMembersPreview =
    membersRoleLabel && draftMembersTarget ? (
      <GroupMembersPreviewTrigger
        target={draftMembersTarget}
        disabled={disabled || panelState.isCreating}
        onOpen={() => setPreviewTarget(draftMembersTarget)}
      />
    ) : null;
  const membersDialog =
    membersRoleLabel && previewTarget ? (
      <GroupMembersPreviewDialog
        key={previewTarget.kind}
        target={previewTarget}
        roleLabel={membersRoleLabel}
        onClose={() => setPreviewTarget(null)}
      />
    ) : null;
  const viewProps: GroupAssignmentPanelViewProps = {
    draftMembersPreview,
    membersDialog,
    panelProps: props,
    panelState,
    savedMembersPreview,
  };

  return <SharedGroupAssignmentPanel {...viewProps} />;
}
