"use client";

import { useId, useState } from "react";
import GroupCriteriaEditor, {
  type GroupCriteriaView,
} from "@/components/groups/assignment/GroupCriteriaEditor";
import BodyPortalTooltip from "@/components/utils/tooltip/BodyPortalTooltip";
import { buildTooltipId, TOOLTIP_STYLES } from "@/helpers/tooltip.helpers";
import { InformationCircleIcon } from "@heroicons/react/24/outline";
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
  const readinessTooltipId = buildTooltipId(
    "network-filter-readiness",
    useId()
  );
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

  return (
    <>
      <div
        ref={panelRef}
        className="tw-flex tw-min-h-0 tw-flex-1 tw-flex-col tw-overflow-hidden tw-bg-black/30"
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
        >
          {view === "identities" ? (
            <>
              <h2
                className={`tw-mb-4 tw-mt-0 !tw-text-base !tw-font-semibold !tw-text-iron-100 ${mobileNavigation ? "" : "lg:tw-sr-only"}`}
              >
                {t(locale, "waves.create.groups.identities")}
              </h2>
              <CreateWaveInlineGroupIdentities
                simplifyIncludedCopy
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
            <div className="[&>div]:tw-border-0 [&>div]:tw-bg-transparent [&>div]:tw-p-0 [&>div]:tw-shadow-none">
              <CreateWaveInlineGroupRuleEditor
                scrollResultsWithEditor={mobileNavigation}
                networkPresentation
                draft={displayedBuilder.draft}
                activeRule={view}
                onDraftChange={setDraft}
              />
            </div>
          )}
        </GroupCriteriaEditor>
        <div
          className={`tw-flex tw-shrink-0 tw-flex-col tw-gap-2 tw-border-x-0 tw-border-b-0 tw-border-t tw-border-solid tw-border-white/5 tw-bg-iron-950 tw-px-4 tw-py-3 sm:tw-px-6 ${mobileNavigation ? "[&_ul]:tw-max-h-24" : "lg:tw-flex-row lg:tw-items-center lg:tw-gap-4"}`}
        >
          <div
            className={`tw-flex tw-min-w-0 tw-flex-wrap tw-items-center tw-gap-x-3 tw-gap-y-1 ${mobileNavigation ? "" : "lg:tw-flex-1"} ${isKeyboardVisible ? "tw-sr-only focus-within:tw-not-sr-only [&_ul]:tw-overflow-visible focus-within:[&_ul]:tw-overflow-y-auto" : ""} [[data-mobile-dialog-keyboard-visible=true]_&]:tw-sr-only [[data-mobile-dialog-keyboard-visible=true]_&]:focus-within:tw-not-sr-only [[data-mobile-dialog-keyboard-visible=true]_&]:[&_ul]:tw-overflow-visible [[data-mobile-dialog-keyboard-visible=true]_&]:focus-within:[&_ul]:tw-overflow-y-auto`}
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
              {!isDraftValid && (
                <>
                  <button
                    type="button"
                    data-tooltip-id={readinessTooltipId}
                    aria-label={t(
                      locale,
                      "waves.create.groups.draft.notReadyTitle"
                    )}
                    className="-tw-my-2 tw-flex tw-size-10 tw-shrink-0 tw-items-center tw-justify-center tw-rounded-lg tw-border-0 tw-bg-transparent tw-text-iron-400 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-primary-400"
                  >
                    <InformationCircleIcon
                      aria-hidden="true"
                      className="tw-size-5"
                    />
                  </button>
                  <BodyPortalTooltip
                    id={readinessTooltipId}
                    place="top-end"
                    className="tailwind-scope"
                    opacity={1}
                    clickable
                    style={{ ...TOOLTIP_STYLES, pointerEvents: "auto" }}
                    openEvents={{ mouseenter: true, focus: true, click: true }}
                    closeEvents={{ mouseleave: true, blur: true }}
                    globalCloseEvents={{
                      escape: true,
                      clickOutsideAnchor: true,
                    }}
                  >
                    <div className="tw-w-64 tw-max-w-[calc(100vw-3rem)] tw-space-y-1 tw-p-2 tw-text-left tw-leading-5">
                      <p className="tw-m-0 tw-font-semibold">
                        {t(locale, "waves.create.groups.draft.notReadyTitle")}
                      </p>
                      <p className="tw-m-0 tw-font-normal">
                        {t(
                          locale,
                          "waves.create.groups.draft.notReadyDescription"
                        )}
                      </p>
                    </div>
                  </BodyPortalTooltip>
                </>
              )}
            </div>
          </div>
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
