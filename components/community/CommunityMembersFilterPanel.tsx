"use client";

import { useState } from "react";
import GroupCriteriaRulePanel from "@/components/groups/assignment/GroupCriteriaRulePanel";
import GroupCriteriaEditor, {
  type GroupCriteriaView,
} from "@/components/groups/assignment/GroupCriteriaEditor";
import GroupCriteriaReadinessHint from "@/components/groups/assignment/GroupCriteriaReadinessHint";
import GroupMembersPreviewDialog from "@/components/groups/members/GroupMembersPreviewDialog";
import GroupCriteriaTags from "@/components/groups/members/GroupCriteriaTags";
import GroupMembersPreviewTrigger from "@/components/groups/members/GroupMembersPreviewTrigger";
import Button from "@/components/utils/button/Button";
import CreateWaveInlineGroupIdentities from "@/components/waves/create-wave/groups/CreateWaveInlineGroupIdentities";
import CreateWaveInlineGroupRuleEditor from "@/components/waves/create-wave/groups/CreateWaveInlineGroupRuleEditor";
import {
  useCreateWaveGroupInlinePanel,
  type CreateWaveGroupInlinePanelProps,
} from "@/components/waves/create-wave/groups/useCreateWaveGroupInlinePanel";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { useNativeKeyboard } from "@/hooks/useNativeKeyboard";
import { t } from "@/i18n/messages";
import type { GroupMembersPreviewTarget } from "@/services/api/group-members-api";

export interface CommunityMembersFilterNavigation {
  readonly view: GroupCriteriaView | null;
  readonly onViewChange: (view: GroupCriteriaView) => void;
  readonly mobileNavigation: boolean;
}

export default function CommunityMembersFilterPanel(
  props: CreateWaveGroupInlinePanelProps & CommunityMembersFilterNavigation
) {
  const locale = useBrowserLocale();
  const { view, onViewChange, mobileNavigation } = props;
  const { isVisible: isKeyboardVisible } = useNativeKeyboard();
  const {
    displayedBuilder,
    draftSummary,
    draftSummaryParts,
    isDraftValid,
    isCreating,
    panelRef,
    currentGroupLabel,
    canCreateDraft,
    onCreateAndUse,
    setDraft,
    addIdentity,
    removeIdentity,
    addExcludedIdentity,
    removeExcludedIdentity,
    updateIncludedWalletSources,
    updateExcludedWalletSources,
  } = useCreateWaveGroupInlinePanel(props);
  const [previewTarget, setPreviewTarget] =
    useState<GroupMembersPreviewTarget | null>(null);
  const savedTarget: GroupMembersPreviewTarget | null = props.selectedGroup
    ? { kind: "saved", group: props.selectedGroup }
    : null;
  const draftTarget: GroupMembersPreviewTarget | null =
    draftSummary && isDraftValid
      ? {
          kind: "draft",
          group: displayedBuilder.draft.group,
          name: props.suggestedName,
          summary: draftSummary,
        }
      : null;

  const draftCriteriaContent = draftSummaryParts.length ? (
    <GroupCriteriaTags items={draftSummaryParts} />
  ) : (
    <p
      className="tw-m-0 tw-min-w-0 tw-break-words tw-text-sm tw-font-medium tw-text-iron-100"
      aria-live="polite"
    >
      {draftSummary ?? t(locale, "waves.create.groups.members.noCriteria")}
    </p>
  );

  const keyboardSummaryClassName = isKeyboardVisible
    ? "tw-sr-only focus-within:tw-not-sr-only [&_ul]:tw-overflow-visible focus-within:[&_ul]:tw-overflow-y-auto"
    : "";
  const draftCriteriaSummary = (
    <div
      data-group-criteria-summary
      className={
        mobileNavigation
          ? "tw-min-w-0 tw-rounded-xl tw-bg-iron-900 tw-p-4 [&_ul]:tw-max-h-none [&_ul]:tw-overflow-visible"
          : `tw-flex tw-min-w-0 tw-flex-wrap tw-items-center tw-gap-x-3 tw-gap-y-1 lg:tw-flex-1 ${keyboardSummaryClassName} [[data-mobile-dialog-keyboard-visible=true]_&]:tw-sr-only [[data-mobile-dialog-keyboard-visible=true]_&]:focus-within:tw-not-sr-only [[data-mobile-dialog-keyboard-visible=true]_&]:[&_ul]:tw-overflow-visible [[data-mobile-dialog-keyboard-visible=true]_&]:focus-within:[&_ul]:tw-overflow-y-auto`
      }
    >
      <div className="tw-flex tw-w-full tw-items-center">
        <div className={`tw-min-w-0 ${draftTarget ? "tw-flex-1" : ""}`}>
          {draftTarget ? (
            <GroupMembersPreviewTrigger
              target={draftTarget}
              appearance="inline"
              inlineCriteriaItems={draftSummaryParts}
              disabled={(props.disabled ?? false) || isCreating}
              onOpen={() => setPreviewTarget(draftTarget)}
            />
          ) : (
            draftCriteriaContent
          )}
        </div>
        {!isDraftValid && <GroupCriteriaReadinessHint />}
      </div>
    </div>
  );

  return (
    <>
      <div
        ref={panelRef}
        className={`tw-flex tw-min-h-0 tw-flex-1 tw-flex-col tw-overflow-hidden ${mobileNavigation ? "" : "tw-bg-black/30"}`}
      >
        {savedTarget && (
          <div
            hidden={mobileNavigation && view !== null}
            className={`tw-shrink-0 ${isKeyboardVisible ? "tw-sr-only focus-within:tw-not-sr-only" : ""} [[data-mobile-dialog-keyboard-visible=true]_&]:tw-sr-only [[data-mobile-dialog-keyboard-visible=true]_&]:focus-within:tw-not-sr-only`}
          >
            <div className="tw-flex tw-flex-wrap tw-items-center tw-gap-x-3 tw-gap-y-1 tw-border-x-0 tw-border-b tw-border-t-0 tw-border-solid tw-border-white/5 tw-px-4 tw-py-3 sm:tw-px-6">
              <span className="tw-break-words tw-text-xs tw-font-medium tw-text-iron-200">
                {currentGroupLabel}
              </span>
              <div className="tw-flex">
                <GroupMembersPreviewTrigger
                  target={savedTarget}
                  appearance="inline"
                  disabled={props.disabled ?? false}
                  onOpen={() => setPreviewTarget(savedTarget)}
                />
              </div>
            </div>
          </div>
        )}
        <GroupCriteriaEditor
          label={t(locale, "network.groupFilter.title")}
          draft={displayedBuilder.draft}
          view={view}
          onViewChange={onViewChange}
          mobileNavigation={mobileNavigation}
          disabled={props.disabled ?? false}
          scrollWithin
          mobileSummary={mobileNavigation ? draftCriteriaSummary : undefined}
        >
          {view === "identities" ? (
            <>
              <h2
                className={`tw-mb-4 tw-mt-0 !tw-text-base !tw-font-semibold !tw-text-iron-100 ${mobileNavigation ? "" : "lg:tw-sr-only"}`}
              >
                {t(locale, "waves.create.groups.identities")}
              </h2>
              <CreateWaveInlineGroupIdentities
                mobilePresentation={mobileNavigation}
                simplifyIncludedCopy
                showIdentityTotal={false}
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
                scrollResultsWithEditor={mobileNavigation}
                networkPresentation
                draft={displayedBuilder.draft}
                activeRule={view}
                onDraftChange={setDraft}
              />
            </GroupCriteriaRulePanel>
          )}
        </GroupCriteriaEditor>
        <div
          className={`tw-flex tw-shrink-0 tw-flex-col tw-gap-2 tw-border-x-0 tw-border-b-0 tw-border-t tw-border-solid tw-border-white/5 tw-bg-iron-950 tw-px-4 tw-py-3 sm:tw-px-6 ${mobileNavigation ? "" : "lg:tw-flex-row lg:tw-items-center lg:tw-gap-4"}`}
        >
          {!mobileNavigation && draftCriteriaSummary}
          <Button
            variant="action"
            size="md"
            className={`tw-min-h-12 tw-w-full tw-max-w-full !tw-whitespace-normal ${mobileNavigation ? "" : "lg:tw-w-auto lg:tw-self-auto"}`}
            disabled={!canCreateDraft}
            loading={isCreating}
            onClick={onCreateAndUse}
          >
            {t(
              locale,
              isCreating
                ? "waves.create.groups.draft.creating"
                : "waves.create.groups.draft.createAndUse"
            )}
          </Button>
        </div>
      </div>
      {previewTarget && (
        <GroupMembersPreviewDialog
          target={previewTarget}
          roleLabel={props.membersRoleLabel ?? props.defaultLabel}
          onClose={() => setPreviewTarget(null)}
        />
      )}
    </>
  );
}
