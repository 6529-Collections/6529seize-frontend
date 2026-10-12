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
import GroupCriteriaEditor from "./GroupCriteriaEditor";
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
  readonly presentation?: "default" | "quiet" | "embedded";
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

function GroupAssignmentActivePanel({
  allowGroupClear,
  defaultLabel,
  disabled,
  isWaveAccessEditor,
  panelState,
  quiet,
  selectedGroup,
}: {
  readonly allowGroupClear: boolean;
  readonly defaultLabel: string;
  readonly disabled: boolean;
  readonly isWaveAccessEditor: boolean;
  readonly panelState: GroupAssignmentPanelState;
  readonly quiet: boolean;
  readonly selectedGroup: ApiGroupFull | null;
}) {
  const {
    addExcludedIdentity,
    addIdentity,
    displayedBuilder,
    hasUnsavedGroup,
    onCancelPanel,
    onExistingGroupSelect,
    openRule,
    removeExcludedIdentity,
    removeIdentity,
    setDraft,
    togglePanel,
    updateExcludedWalletSources,
    updateIncludedWalletSources,
  } = panelState;
  if (
    ["identity", "rule-list", "rule-editor"].includes(displayedBuilder.panel)
  ) {
    const identityView =
      displayedBuilder.panel === "identity" ? "identities" : null;
    const view =
      displayedBuilder.panel === "rule-editor"
        ? (displayedBuilder.activeRule ?? "identities")
        : identityView;
    return (
      <GroupCriteriaEditor
        draft={displayedBuilder.draft}
        view={view}
        disabled={disabled}
        onClose={isWaveAccessEditor ? undefined : panelState.returnToCriteria}
        onViewChange={(next) =>
          next === "identities"
            ? togglePanel("identity", false)
            : openRule(next)
        }
      >
        {view !== null &&
          (view === "identities" ? (
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
          ) : (
            <div className="[&>div]:tw-border-0 [&>div]:tw-bg-transparent [&>div]:tw-p-0 [&>div]:tw-shadow-none">
              <CreateWaveInlineGroupRuleEditor
                networkPresentation
                draft={displayedBuilder.draft}
                activeRule={view}
                onDraftChange={setDraft}
              />
            </div>
          ))}
      </GroupCriteriaEditor>
    );
  }

  if (displayedBuilder.panel === "search") {
    return (
      <CreateWaveInlineGroupExpandedPanel
        onCancel={onCancelPanel}
        cancelSize="md"
        quiet={quiet}
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
    );
  }

  return null;
}

function GroupAssignmentDraftFooter({
  disabled,
  draftMembersPreview,
  isWaveAccessEditor,
  panelState,
  quiet,
  showPrivacyControl,
}: {
  readonly disabled: boolean;
  readonly draftMembersPreview: ReactNode;
  readonly isWaveAccessEditor: boolean;
  readonly panelState: GroupAssignmentPanelState;
  readonly quiet: boolean;
  readonly showPrivacyControl: boolean;
}) {
  const {
    canCreateDraft,
    displayedBuilder,
    draftSummary,
    isCreating,
    isCriteriaReplacementActive,
    isDraftValid,
    isSearchPanel,
    onCreateAndUse,
    setDraft,
    showDraftFooter,
  } = panelState;
  if (!showDraftFooter) {
    return null;
  }

  const privacyControl =
    showPrivacyControl && isCriteriaReplacementActive && !isSearchPanel ? (
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
    ) : undefined;

  return (
    <CreateWaveInlineGroupDraftSummary
      draftSummary={draftSummary}
      quiet={quiet}
      isValid={isDraftValid}
      canCreateDraft={canCreateDraft}
      isCreating={isCreating}
      forceVisible={isCriteriaReplacementActive}
      saveChangesLabel={isWaveAccessEditor}
      draftMembersPreview={draftMembersPreview}
      privacyControl={privacyControl}
      onCreateAndUse={onCreateAndUse}
    />
  );
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
    presentation = "default",
  } = panelProps;
  const quiet = presentation === "quiet";
  const {
    canReplaceCriteria,
    currentGroupLabel,
    isCriteriaReplacementActive,
    isSearchPanel,
    onClearAll,
    onReplaceCriteria,
    panelRef,
    togglePanel,
    unsavedGroupDescription,
    unsavedGroupSummary,
  } = panelState;

  const isEditingWaveAccess = isWaveAccessEditor && isCriteriaReplacementActive;

  return (
    <>
      <div
        ref={panelRef}
        className={
          quiet || presentation === "embedded"
            ? "tw-relative tw-flex tw-min-w-0 tw-flex-col tw-gap-4"
            : "tw-relative tw-flex tw-flex-col tw-gap-4 tw-rounded-xl tw-border tw-border-solid tw-border-white/10 tw-bg-black/30 tw-p-4 tw-shadow-none sm:tw-p-5"
        }
      >
        <div className="tw-relative tw-flex tw-flex-col tw-gap-4">
          <div
            className={`tw-flex tw-min-w-0 tw-flex-col tw-gap-3 ${isEditingWaveAccess ? "tw-border-x-0 tw-border-b tw-border-t-0 tw-border-solid tw-border-white/5 tw-pb-4" : "lg:tw-flex-row lg:tw-items-start lg:tw-justify-between"}`}
          >
            <CreateWaveInlineGroupHeader
              currentGroupLabel={currentGroupLabel}
              showCurrentGroupTitle={isCriteriaReplacementActive}
              quiet={quiet}
              flat={isWaveAccessEditor}
              onCancel={isEditingWaveAccess ? onClearAll : undefined}
              disabled={disabled || !canReplaceCriteria}
              unsavedGroupDescription={
                showChooseGroup ? unsavedGroupDescription : null
              }
              unsavedGroupSummary={showChooseGroup ? unsavedGroupSummary : null}
              membersPreview={savedMembersPreview}
            />
            <CreateWaveInlineGroupActions
              disabled={disabled}
              quiet={quiet}
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

          <GroupAssignmentActivePanel
            allowGroupClear={allowGroupClear}
            defaultLabel={defaultLabel}
            disabled={disabled}
            isWaveAccessEditor={isWaveAccessEditor}
            panelState={panelState}
            quiet={quiet}
            selectedGroup={selectedGroup}
          />
          <GroupAssignmentDraftFooter
            disabled={disabled}
            draftMembersPreview={draftMembersPreview}
            isWaveAccessEditor={isWaveAccessEditor}
            panelState={panelState}
            quiet={quiet}
            showPrivacyControl={showPrivacyControl}
          />
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
        quiet={props.presentation === "quiet"}
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
        quiet={props.presentation === "quiet"}
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
