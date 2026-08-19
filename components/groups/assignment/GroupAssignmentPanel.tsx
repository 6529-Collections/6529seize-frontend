"use client";

import {
  ShieldExclamationIcon,
  UserPlusIcon,
} from "@heroicons/react/24/outline";
import type { ReactNode } from "react";
import { useState } from "react";
import type { ApiGroupFull } from "@/generated/models/ApiGroupFull";
import type { CreateWaveGroupSearchResultsLayout } from "@/components/waves/create-wave/groups/CreateWaveGroupSearchResults";
import CreateWaveInlineGroupDraftSummary from "@/components/waves/create-wave/groups/CreateWaveInlineGroupDraftSummary";
import CreateWaveInlineGroupExpandedPanel from "@/components/waves/create-wave/groups/CreateWaveInlineGroupExpandedPanel";
import CreateWaveInlineGroupHeader from "@/components/waves/create-wave/groups/CreateWaveInlineGroupHeader";
import CreateWaveInlineGroupIdentities from "@/components/waves/create-wave/groups/CreateWaveInlineGroupIdentities";
import CreateWaveInlineGroupRuleEditor from "@/components/waves/create-wave/groups/CreateWaveInlineGroupRuleEditor";
import {
  CreateWaveInlineGroupRuleEditorPanel,
  CreateWaveInlineGroupRuleList,
} from "@/components/waves/create-wave/groups/CreateWaveInlineGroupRules";
import CreateWaveInlineGroupSearch from "@/components/waves/create-wave/groups/CreateWaveInlineGroupSearch";
import CreateWaveInlineGroupActions from "@/components/waves/create-wave/groups/CreateWaveInlineGroupActions";
import { getInlineGroupRuleCount } from "@/components/waves/create-wave/groups/createWaveInlineGroupBuilder";
import {
  type CreateWaveGroupInlinePanelProps,
  useCreateWaveGroupInlinePanel,
} from "@/components/waves/create-wave/groups/useCreateWaveGroupInlinePanel";
import GroupMembersPreviewDialog from "@/components/groups/members/GroupMembersPreviewDialog";
import GroupMembersPreviewTrigger from "@/components/groups/members/GroupMembersPreviewTrigger";
import type { GroupMembersPreviewTarget } from "@/services/api/group-members-api";

type GroupAssignmentPanelLayout = "inline" | "dialog";
type GroupAssignmentPanelStartMode = "actions" | "existing";

type GroupAssignmentPanelProps = CreateWaveGroupInlinePanelProps & {
  readonly layout?: GroupAssignmentPanelLayout;
  readonly startMode?: GroupAssignmentPanelStartMode;
};

function DialogActionButton({
  icon,
  label,
  count,
  active,
  disabled,
  onClick,
}: {
  readonly icon: ReactNode;
  readonly label: string;
  readonly count: number;
  readonly active: boolean;
  readonly disabled: boolean;
  readonly onClick: () => void;
}) {
  const stateClasses = active
    ? "tw-border-primary-500/50 tw-bg-primary-500/10 tw-text-primary-300"
    : "tw-border-white/5 tw-bg-iron-900 tw-text-iron-200 desktop-hover:hover:tw-border-white/10 desktop-hover:hover:tw-bg-iron-850 desktop-hover:hover:tw-text-white";

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={active}
      className={`tw-flex tw-min-h-11 tw-w-full tw-items-center tw-justify-center tw-gap-2 tw-rounded-lg tw-border tw-border-solid tw-px-3 tw-py-2.5 tw-text-sm tw-font-semibold tw-transition tw-duration-200 disabled:tw-cursor-not-allowed disabled:tw-opacity-60 ${stateClasses}`}
    >
      {icon}
      <span>{label}</span>
      {count > 0 ? (
        <span
          aria-hidden="true"
          className="tw-rounded-full tw-bg-white/10 tw-px-1.5 tw-py-0.5 tw-text-[0.68rem] tw-font-bold tw-leading-none tw-text-iron-200"
        >
          {count}
        </span>
      ) : null}
    </button>
  );
}

function DialogTabs({
  isExistingActive,
  onExistingClick,
  onNewClick,
}: {
  readonly isExistingActive: boolean;
  readonly onExistingClick: () => void;
  readonly onNewClick: () => void;
}) {
  const getTabClasses = (active: boolean) =>
    active
      ? "tw-bg-iron-800 tw-text-iron-50 tw-shadow-sm"
      : "tw-bg-transparent tw-text-iron-400 desktop-hover:hover:tw-text-iron-100";

  return (
    <div
      role="tablist"
      aria-label="Group source"
      className="tw-grid tw-grid-cols-2 tw-rounded-lg tw-bg-iron-900 tw-p-1"
    >
      <button
        type="button"
        role="tab"
        aria-selected={isExistingActive}
        onClick={onExistingClick}
        className={`tw-rounded-md tw-border-0 tw-px-3 tw-py-2 tw-text-sm tw-font-semibold tw-transition tw-duration-200 ${getTabClasses(
          isExistingActive
        )}`}
      >
        Existing group
      </button>
      <button
        type="button"
        role="tab"
        aria-selected={!isExistingActive}
        onClick={onNewClick}
        className={`tw-rounded-md tw-border-0 tw-px-3 tw-py-2 tw-text-sm tw-font-semibold tw-transition tw-duration-200 ${getTabClasses(
          !isExistingActive
        )}`}
      >
        New group
      </button>
    </div>
  );
}

function DialogGroupSummary({
  currentGroupLabel,
  unsavedGroupDescription,
  unsavedGroupSummary,
  membersPreview,
}: {
  readonly currentGroupLabel: string;
  readonly unsavedGroupDescription: string | null;
  readonly unsavedGroupSummary: string | null;
  readonly membersPreview?: ReactNode | undefined;
}) {
  const summaryGridClasses = unsavedGroupSummary
    ? "tw-grid tw-gap-3 sm:tw-grid-cols-2"
    : "tw-grid tw-gap-3";

  return (
    <div className={summaryGridClasses}>
      <div className="tw-min-w-0 tw-rounded-lg tw-border tw-border-solid tw-border-white/5 tw-bg-iron-900/70 tw-p-3">
        <p className="tw-mb-1 tw-text-xs tw-font-semibold tw-uppercase tw-tracking-wider tw-text-iron-500">
          Current group
        </p>
        {membersPreview === null || membersPreview === undefined ? (
          <p className="tw-mb-0 tw-truncate tw-text-sm tw-font-semibold tw-text-iron-100">
            {currentGroupLabel}
          </p>
        ) : null}
        {membersPreview !== null && membersPreview !== undefined ? (
          <div className="tw-mt-1.5">{membersPreview}</div>
        ) : null}
      </div>

      {unsavedGroupSummary ? (
        <div className="tw-min-w-0 tw-rounded-lg tw-border tw-border-solid tw-border-primary-500/20 tw-bg-primary-500/5 tw-p-3">
          <p className="tw-mb-1 tw-text-xs tw-font-semibold tw-uppercase tw-tracking-wider tw-text-primary-300">
            Unsaved group
          </p>
          <p className="tw-mb-0 tw-truncate tw-text-sm tw-font-semibold tw-text-iron-100">
            {unsavedGroupSummary}
          </p>
          {unsavedGroupDescription ? (
            <p className="tw-mb-0 tw-mt-1 tw-text-xs tw-font-medium tw-text-iron-400">
              {unsavedGroupDescription}
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function DialogNewGroupActions({
  disabled,
  identityCount,
  identityActive,
  ruleCount,
  ruleActive,
  onAddIdentity,
  onAddRule,
}: {
  readonly disabled: boolean;
  readonly identityCount: number;
  readonly identityActive: boolean;
  readonly ruleCount: number;
  readonly ruleActive: boolean;
  readonly onAddIdentity: () => void;
  readonly onAddRule: () => void;
}) {
  return (
    <div className="tw-grid tw-gap-2 sm:tw-grid-cols-2">
      <DialogActionButton
        icon={
          <UserPlusIcon
            aria-hidden="true"
            className="tw-size-4 tw-flex-shrink-0"
          />
        }
        label="Add identity"
        count={identityCount}
        disabled={disabled}
        active={identityActive}
        onClick={onAddIdentity}
      />
      <DialogActionButton
        icon={
          <ShieldExclamationIcon
            aria-hidden="true"
            className="tw-size-4 tw-flex-shrink-0"
          />
        }
        label="Add rule"
        count={ruleCount}
        disabled={disabled}
        active={ruleActive}
        onClick={onAddRule}
      />
    </div>
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
  readonly membersDialog: ReactNode;
  readonly onPreviewDraft: () => void;
  readonly panelProps: GroupAssignmentPanelProps;
  readonly panelState: GroupAssignmentPanelState;
  readonly savedMembersPreview: ReactNode;
}

function DialogGroupAssignmentPanel({
  membersDialog,
  onPreviewDraft,
  panelProps,
  panelState,
  savedMembersPreview,
}: GroupAssignmentPanelViewProps) {
  const {
    allowGroupClear = true,
    defaultLabel,
    disabled = false,
    selectedGroup,
    membersRoleLabel,
  } = panelProps;
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
  } = panelState;

  const openExistingTab = () => {
    if (!isSearchPanel) {
      togglePanel("search", false);
    }
  };
  const openNewGroupTab = () => {
    if (isSearchPanel) {
      togglePanel("actions", false);
    }
  };
  const identityCount = displayedBuilder.identities.length;
  const ruleCount = getInlineGroupRuleCount(displayedBuilder.draft);

  return (
    <>
      <div ref={panelRef} className="tw-flex tw-flex-col tw-gap-4">
        <DialogGroupSummary
          currentGroupLabel={currentGroupLabel}
          unsavedGroupDescription={unsavedGroupDescription}
          unsavedGroupSummary={unsavedGroupSummary}
          membersPreview={savedMembersPreview}
        />

        <DialogTabs
          isExistingActive={isSearchPanel}
          onExistingClick={openExistingTab}
          onNewClick={openNewGroupTab}
        />

        {isSearchPanel ? (
          <div className="tw-rounded-lg tw-border tw-border-solid tw-border-white/5 tw-bg-iron-900/40 tw-p-3">
            <SearchPanel
              allowGroupClear={allowGroupClear}
              defaultLabel={defaultLabel}
              disabled={disabled}
              hasUnsavedGroup={hasUnsavedGroup}
              onExistingGroupSelect={onExistingGroupSelect}
              resultsLayout="inline"
              selectedGroup={selectedGroup}
            />
          </div>
        ) : (
          <div className="tw-flex tw-flex-col tw-gap-4 tw-rounded-lg tw-border tw-border-solid tw-border-white/5 tw-bg-iron-900/40 tw-p-3">
            <DialogNewGroupActions
              disabled={disabled}
              identityCount={identityCount}
              identityActive={isIdentityPanel}
              ruleCount={ruleCount}
              ruleActive={isRulePanel}
              onAddIdentity={() => togglePanel("identity", isIdentityPanel)}
              onAddRule={() =>
                togglePanel("rule-list", displayedBuilder.panel === "rule-list")
              }
            />

            {displayedBuilder.panel === "identity" ? (
              <CreateWaveInlineGroupExpandedPanel
                onCancel={onCancelPanel}
                cancelClassName="tw-mt-3"
                cancelLabel="Done"
              >
                <CreateWaveInlineGroupIdentities
                  identities={displayedBuilder.identities}
                  onIdentitySelect={addIdentity}
                  onRemove={removeIdentity}
                  resultsLayout="inline"
                />
              </CreateWaveInlineGroupExpandedPanel>
            ) : null}

            {displayedBuilder.panel === "rule-list" ? (
              <CreateWaveInlineGroupExpandedPanel
                onCancel={onCancelPanel}
                cancelLabel="Done"
              >
                <CreateWaveInlineGroupRuleList
                  disabled={disabled}
                  onRuleOpen={openRule}
                />
              </CreateWaveInlineGroupExpandedPanel>
            ) : null}

            {displayedBuilder.panel === "rule-editor" &&
            displayedBuilder.activeRule !== null ? (
              <CreateWaveInlineGroupExpandedPanel
                onCancel={onCancelPanel}
                cancelLabel="Done"
              >
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
            ) : null}

            {showDraftFooter ? (
              <CreateWaveInlineGroupDraftSummary
                draftSummary={draftSummary}
                isValid={isDraftValid}
                canResetDraft={canResetDraft}
                canCreateDraft={canCreateDraft}
                isCreating={isCreating}
                canPreviewDraft={isDraftValid && !disabled && !isCreating}
                onClearAll={onClearAll}
                onCreateAndUse={onCreateAndUse}
                onPreviewDraft={membersRoleLabel ? onPreviewDraft : undefined}
              />
            ) : null}
          </div>
        )}
      </div>
      {membersDialog}
    </>
  );
}

function InlineGroupAssignmentPanel({
  membersDialog,
  onPreviewDraft,
  panelProps,
  panelState,
  savedMembersPreview,
}: GroupAssignmentPanelViewProps) {
  const {
    allowGroupClear = true,
    defaultLabel,
    disabled = false,
    selectedGroup,
    membersRoleLabel,
  } = panelProps;
  const {
    addIdentity,
    canCreateDraft,
    canResetDraft,
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
    returnToCriteria,
    setDraft,
    showDraftFooter,
    togglePanel,
    toggleRule,
    unsavedGroupDescription,
    unsavedGroupSummary,
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
              unsavedGroupDescription={unsavedGroupDescription}
              unsavedGroupSummary={unsavedGroupSummary}
              membersPreview={savedMembersPreview}
            />
            <CreateWaveInlineGroupActions
              disabled={disabled}
              criteriaActive={isCriteriaReplacementActive}
              searchActive={isSearchPanel}
              onReplaceCriteria={onReplaceCriteria}
              onUseExistingGroup={() => togglePanel("search", isSearchPanel)}
            />
          </div>

          {displayedBuilder.panel === "identity" ? (
            <CreateWaveInlineGroupExpandedPanel
              onCancel={returnToCriteria}
              showCancel={false}
            >
              <CreateWaveInlineGroupIdentities
                identities={displayedBuilder.identities}
                onIdentitySelect={addIdentity}
                onRemove={removeIdentity}
                onCancel={returnToCriteria}
              />
            </CreateWaveInlineGroupExpandedPanel>
          ) : null}

          {displayedBuilder.panel === "rule-list" ? (
            <CreateWaveInlineGroupExpandedPanel
              onCancel={onClearAll}
              showCancel={false}
            >
              <CreateWaveInlineGroupRuleList
                disabled={disabled}
                onIdentityOpen={() => togglePanel("identity", false)}
                onRuleOpen={openRule}
              />
            </CreateWaveInlineGroupExpandedPanel>
          ) : null}

          {displayedBuilder.panel === "rule-editor" &&
          displayedBuilder.activeRule !== null ? (
            <CreateWaveInlineGroupExpandedPanel onCancel={returnToCriteria}>
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
              canResetDraft={canResetDraft}
              canCreateDraft={canCreateDraft}
              isCreating={isCreating}
              canPreviewDraft={isDraftValid && !disabled && !isCreating}
              forceVisible={isCriteriaReplacementActive}
              onClearAll={onClearAll}
              onCreateAndUse={onCreateAndUse}
              onPreviewDraft={membersRoleLabel ? onPreviewDraft : undefined}
            />
          ) : null}
        </div>
      </div>
      {membersDialog}
    </>
  );
}

export default function GroupAssignmentPanel({
  layout = "inline",
  ...props
}: GroupAssignmentPanelProps) {
  const {
    defaultMembersPreviewTarget,
    disabled = false,
    selectedGroup,
    membersRoleLabel,
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
        onOpen={() => setPreviewTarget(currentMembersTarget)}
      />
    ) : null;
  const openDraftPreview = () => {
    if (draftSummary === null || !isDraftValid) {
      return;
    }
    setPreviewTarget({
      kind: "draft",
      group: displayedBuilder.draft.group,
      name: props.suggestedName.trim() || "Wave Group",
      summary: draftSummary,
    });
  };
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
    membersDialog,
    onPreviewDraft: openDraftPreview,
    panelProps: props,
    panelState,
    savedMembersPreview,
  };

  return layout === "dialog" ? (
    <DialogGroupAssignmentPanel {...viewProps} />
  ) : (
    <InlineGroupAssignmentPanel {...viewProps} />
  );
}
