"use client";

import type { ReactNode } from "react";
import GroupCriteriaRulePanel from "@/components/groups/assignment/GroupCriteriaRulePanel";
import { useState } from "react";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { ActionButton } from "@/components/waves/create-wave/groups/CreateWaveInlineGroupButtons";
import { useMediaQuery } from "@/hooks/useMediaQuery";
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
  readonly mobileCriteriaNavigation?: boolean;
  readonly simplifyCriteriaCopy?: boolean;
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

function GroupAssignmentCriteriaPanel({
  disabled,
  isWaveAccessEditor,
  mobileNavigation,
  simplifyCriteriaCopy,
  panelState,
}: {
  readonly disabled: boolean;
  readonly isWaveAccessEditor: boolean;
  readonly mobileNavigation: boolean;
  readonly simplifyCriteriaCopy: boolean;
  readonly panelState: GroupAssignmentPanelState;
}) {
  const locale = useBrowserLocale();
  // This view belongs to the current edit session, not the criteria draft.
  const [showMobileCategories, setShowMobileCategories] = useState(true);
  const {
    addExcludedIdentity,
    addIdentity,
    displayedBuilder,
    openRule,
    removeExcludedIdentity,
    removeIdentity,
    setDraft,
    togglePanel,
    updateExcludedWalletSources,
    updateIncludedWalletSources,
  } = panelState;
  const identityView =
    displayedBuilder.panel === "identity" ? "identities" : null;
  const desktopView =
    displayedBuilder.panel === "rule-editor"
      ? (displayedBuilder.activeRule ?? "identities")
      : identityView;
  const view = mobileNavigation && showMobileCategories ? null : desktopView;

  return (
    <GroupCriteriaEditor
      draft={displayedBuilder.draft}
      view={view}
      mobileNavigation={mobileNavigation}
      mobileActions={
        mobileNavigation && isWaveAccessEditor ? (
          <ActionButton
            icon={
              <XMarkIcon
                aria-hidden="true"
                className="tw-size-3.5 tw-flex-shrink-0"
              />
            }
            label={t(locale, "waves.create.actions.cancel")}
            disabled={disabled || !panelState.canReplaceCriteria}
            active
            onClick={panelState.onClearAll}
          />
        ) : undefined
      }
      onBack={
        mobileNavigation ? () => setShowMobileCategories(true) : undefined
      }
      disabled={disabled}
      onClose={isWaveAccessEditor ? undefined : panelState.returnToCriteria}
      onViewChange={(next) => {
        setShowMobileCategories(false);
        if (next === "identities") togglePanel("identity", false);
        else openRule(next);
      }}
    >
      {view !== null &&
        (view === "identities" ? (
          <>
            {mobileNavigation && (
              <h3 className="tw-mb-4 tw-mt-0 tw-text-base tw-font-semibold tw-text-iron-100">
                {t(locale, "waves.create.groups.identities")}
              </h3>
            )}
            <CreateWaveInlineGroupIdentities
              mobilePresentation={mobileNavigation}
              simplifyIncludedCopy={simplifyCriteriaCopy}
              showIdentityTotal={!simplifyCriteriaCopy}
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
          </>
        ) : (
          <GroupCriteriaRulePanel mobilePresentation={mobileNavigation}>
            <CreateWaveInlineGroupRuleEditor
              networkPresentation
              scrollResultsWithEditor={mobileNavigation}
              draft={displayedBuilder.draft}
              activeRule={view}
              onDraftChange={setDraft}
            />
          </GroupCriteriaRulePanel>
        ))}
    </GroupCriteriaEditor>
  );
}

function GroupAssignmentActivePanel({
  allowGroupClear,
  defaultLabel,
  disabled,
  isWaveAccessEditor,
  mobileNavigation,
  simplifyCriteriaCopy,
  panelState,
  quiet,
  selectedGroup,
}: {
  readonly allowGroupClear: boolean;
  readonly defaultLabel: string;
  readonly disabled: boolean;
  readonly isWaveAccessEditor: boolean;
  readonly mobileNavigation: boolean;
  readonly simplifyCriteriaCopy: boolean;
  readonly panelState: GroupAssignmentPanelState;
  readonly quiet: boolean;
  readonly selectedGroup: ApiGroupFull | null;
}) {
  const {
    displayedBuilder,
    hasUnsavedGroup,
    onCancelPanel,
    onExistingGroupSelect,
  } = panelState;
  if (
    ["identity", "rule-list", "rule-editor"].includes(displayedBuilder.panel)
  ) {
    return (
      <GroupAssignmentCriteriaPanel
        disabled={disabled}
        isWaveAccessEditor={isWaveAccessEditor}
        mobileNavigation={mobileNavigation}
        simplifyCriteriaCopy={simplifyCriteriaCopy}
        panelState={panelState}
      />
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
  mobileNavigation,
  panelState,
  quiet,
  showPrivacyControl,
  simplifyCriteriaCopy,
}: {
  readonly disabled: boolean;
  readonly draftMembersPreview: ReactNode;
  readonly isWaveAccessEditor: boolean;
  readonly mobileNavigation: boolean;
  readonly panelState: GroupAssignmentPanelState;
  readonly quiet: boolean;
  readonly showPrivacyControl: boolean;
  readonly simplifyCriteriaCopy: boolean;
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
      simplifyCriteriaCopy={simplifyCriteriaCopy}
      mobilePresentation={mobileNavigation}
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
    mobileCriteriaNavigation = false,
    simplifyCriteriaCopy = false,
    showMakeWavePublic = false,
    onMakeWavePublic,
    showMatchWaveAccess = false,
    onMatchWaveAccess,
    presentation = "default",
  } = panelProps;
  const quiet = presentation === "quiet";
  const isDesktopViewport = useMediaQuery("(min-width: 1024px)");
  const hasTouchPointer = useMediaQuery("(any-pointer: coarse)");
  const mobileNavigation =
    mobileCriteriaNavigation && (!isDesktopViewport || hasTouchPointer);
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
  const showSummary =
    !simplifyCriteriaCopy ||
    !isCriteriaReplacementActive ||
    selectedGroup !== null ||
    savedMembersPreview !== null;
  const showHeader =
    showSummary ||
    !isEditingWaveAccess ||
    !mobileNavigation ||
    showChooseGroup ||
    (showMakeWavePublic && Boolean(onMakeWavePublic)) ||
    (showMatchWaveAccess && Boolean(onMatchWaveAccess));

  return (
    <>
      <div
        ref={panelRef}
        data-mobile-group-editor={
          mobileNavigation && isEditingWaveAccess ? true : undefined
        }
        className={
          quiet || presentation === "embedded"
            ? "tw-relative tw-flex tw-min-w-0 tw-flex-col tw-gap-4"
            : "tw-relative tw-flex tw-flex-col tw-gap-4 tw-rounded-xl tw-border tw-border-solid tw-border-white/10 tw-bg-black/30 tw-p-4 tw-shadow-none sm:tw-p-5"
        }
      >
        <div className="tw-relative tw-flex tw-flex-col tw-gap-4">
          {showHeader && (
            <div
              className={`tw-flex tw-min-w-0 tw-flex-col tw-gap-3 ${isEditingWaveAccess ? "tw-border-x-0 tw-border-b tw-border-t-0 tw-border-solid tw-border-white/5 tw-pb-4" : "lg:tw-flex-row lg:tw-items-start lg:tw-justify-between"}`}
            >
              <CreateWaveInlineGroupHeader
                currentGroupLabel={currentGroupLabel}
                showCurrentGroupTitle={
                  isCriteriaReplacementActive && !simplifyCriteriaCopy
                }
                showSummary={showSummary}
                quiet={quiet}
                flat={isWaveAccessEditor}
                onCancel={
                  isEditingWaveAccess && !mobileNavigation
                    ? onClearAll
                    : undefined
                }
                disabled={disabled || !canReplaceCriteria}
                unsavedGroupDescription={
                  showChooseGroup ? unsavedGroupDescription : null
                }
                unsavedGroupSummary={
                  showChooseGroup ? unsavedGroupSummary : null
                }
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
          )}

          <GroupAssignmentActivePanel
            mobileNavigation={mobileNavigation}
            simplifyCriteriaCopy={simplifyCriteriaCopy}
            allowGroupClear={allowGroupClear}
            defaultLabel={defaultLabel}
            disabled={disabled}
            isWaveAccessEditor={isWaveAccessEditor}
            panelState={panelState}
            quiet={quiet}
            selectedGroup={selectedGroup}
          />
          <GroupAssignmentDraftFooter
            mobileNavigation={mobileNavigation}
            disabled={disabled}
            draftMembersPreview={draftMembersPreview}
            isWaveAccessEditor={isWaveAccessEditor}
            panelState={panelState}
            quiet={quiet}
            showPrivacyControl={showPrivacyControl}
            simplifyCriteriaCopy={simplifyCriteriaCopy}
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
