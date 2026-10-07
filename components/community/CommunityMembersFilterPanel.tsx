"use client";

import { useRef, useState } from "react";
import useKeyboardFocusScroll from "@/components/waves/create-wave/hooks/useKeyboardFocusScroll";
import {
  CheckIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  InformationCircleIcon,
} from "@heroicons/react/24/outline";
import GroupMembersPreviewDialog from "@/components/groups/members/GroupMembersPreviewDialog";
import GroupCriteriaTags from "@/components/groups/members/GroupCriteriaTags";
import GroupMembersPreviewTrigger from "@/components/groups/members/GroupMembersPreviewTrigger";
import Button from "@/components/utils/button/Button";
import CreateWaveInlineGroupIdentities from "@/components/waves/create-wave/groups/CreateWaveInlineGroupIdentities";
import CreateWaveInlineGroupRuleEditor from "@/components/waves/create-wave/groups/CreateWaveInlineGroupRuleEditor";
import {
  CREATE_WAVE_INLINE_GROUP_QUICK_RULES,
  CREATE_WAVE_INLINE_GROUP_MORE_RULES,
  CreateWaveInlineGroupRuleType,
  getInlineGroupConfiguredRules,
} from "@/components/waves/create-wave/groups/createWaveInlineGroupBuilder";
import {
  useCreateWaveGroupInlinePanel,
  type CreateWaveGroupInlinePanelProps,
} from "@/components/waves/create-wave/groups/useCreateWaveGroupInlinePanel";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { useNativeKeyboard } from "@/hooks/useNativeKeyboard";
import { t, type MessageKey } from "@/i18n/messages";
import type { GroupMembersPreviewTarget } from "@/services/api/group-members-api";

const RULE_LABELS: Record<CreateWaveInlineGroupRuleType, MessageKey> = {
  [CreateWaveInlineGroupRuleType.LEVEL]: "network.groupFilter.level",
  [CreateWaveInlineGroupRuleType.TDH]: "network.groupFilter.tdh",
  [CreateWaveInlineGroupRuleType.CIC]: "network.groupFilter.nic",
  [CreateWaveInlineGroupRuleType.REP]: "network.groupFilter.rep",
  [CreateWaveInlineGroupRuleType.NFTS]: "network.groupFilter.nfts",
  [CreateWaveInlineGroupRuleType.COLLECTIONS]:
    "network.groupFilter.collections",
  [CreateWaveInlineGroupRuleType.XTDH_GRANT]: "network.groupFilter.xtdhGrant",
};

type FilterView = CreateWaveInlineGroupRuleType | "identities";
const FILTER_VIEWS: readonly FilterView[] = [
  "identities",
  ...CREATE_WAVE_INLINE_GROUP_QUICK_RULES,
  ...CREATE_WAVE_INLINE_GROUP_MORE_RULES,
];

// Keep shared controls intact and retain the dialog's 16px touch-input sizing.
const FILTER_INPUT_PRESENTATION_CLASS_NAME = [
  "[&_input]:tw-text-base/6 [&_textarea]:tw-text-base/6 [&_select]:tw-text-base/6 [&_input~label]:tw-text-base/6",
  "[&_input]:tw-font-normal [&_textarea]:tw-font-normal [&_select]:tw-font-normal [&_input~label]:tw-font-normal",
  "[@media(min-width:1024px)_and_(pointer:fine)_and_(hover:hover)]:[&_input]:tw-text-sm/6",
  "[@media(min-width:1024px)_and_(pointer:fine)_and_(hover:hover)]:[&_textarea]:tw-text-sm/6",
  "[@media(min-width:1024px)_and_(pointer:fine)_and_(hover:hover)]:[&_select]:tw-text-sm/6",
  "[@media(min-width:1024px)_and_(pointer:fine)_and_(hover:hover)]:[&_input~label]:tw-text-sm/6",
  "[&_input.tw-form-input]:tw-bg-iron-900 [&_input.tw-form-input:focus]:tw-bg-iron-900",
  "desktop-hover:[&_input.tw-form-input:enabled:hover]:tw-bg-iron-800/80",
  // Keep invalid outlines and disabled controls owned by the shared input.
  "[&_input.tw-form-input:not([aria-invalid=true]):not(:focus)]:tw-ring-iron-700",
  "desktop-hover:[&_input.tw-form-input:not([aria-invalid=true]):not(:focus):enabled:hover]:tw-ring-iron-650",
  "[&_input.tw-form-input:not([aria-invalid=true]):focus]:tw-ring-1 [&_input.tw-form-input:not([aria-invalid=true]):focus]:tw-ring-primary-400",
  "[&_input.tw-form-input::placeholder]:tw-text-iron-500 [&_input:not(:focus)~label]:tw-text-iron-500",
  "[&_input:not([aria-invalid=true]):focus~label]:tw-text-primary-400",
  "[&_input:placeholder-shown:not(:focus)~label]:tw-bg-transparent",
  // Each editor places its decorative search icon immediately after the input.
  "[&_input+svg]:tw-size-4 [&_input+svg]:tw-top-1/2 [&_input+svg]:-tw-translate-y-1/2 [&_input+svg]:tw-text-iron-400",
].join(" ");

export default function CommunityMembersFilterPanel(
  props: CreateWaveGroupInlinePanelProps
) {
  const locale = useBrowserLocale();
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
  const [view, setView] = useState<FilterView>("identities");
  const [showEditor, setShowEditor] = useState(false);
  const [previewTarget, setPreviewTarget] =
    useState<GroupMembersPreviewTarget | null>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<HTMLDivElement>(null);
  useKeyboardFocusScroll(editorRef);
  const configuredRules = new Set(
    getInlineGroupConfiguredRules(displayedBuilder.draft)
  );
  const identitiesConfigured =
    (displayedBuilder.draft.group.identity_addresses?.length ?? 0) > 0 ||
    (displayedBuilder.draft.group.excluded_identity_addresses?.length ?? 0) > 0;
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

  const changeView = (next: FilterView, focusEditor: boolean) => {
    setView(next);
    setShowEditor(true);
    editorRef.current?.scrollTo({ top: 0 });
    if (focusEditor) {
      requestAnimationFrame(() => editorRef.current?.focus());
    }
  };

  const showFilterList = () => {
    setShowEditor(false);
    requestAnimationFrame(() => {
      listRef.current
        ?.querySelector<HTMLButtonElement>("[aria-current='true']")
        ?.focus();
    });
  };

  const configuredMark = (
    <>
      <CheckIcon
        className="tw-size-3.5 tw-shrink-0 tw-text-success"
        aria-hidden="true"
      />
      <span className="tw-sr-only">
        {t(locale, "waves.create.groups.rules.configured")}
      </span>
    </>
  );

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
        className="tw-flex tw-min-h-0 tw-flex-1 tw-flex-col tw-overflow-hidden"
      >
        <div className="tw-flex tw-shrink-0 tw-flex-wrap tw-items-center tw-gap-x-3 tw-gap-y-1 tw-border-x-0 tw-border-b tw-border-t-0 tw-border-solid tw-border-white/5 tw-px-4 tw-py-3 sm:tw-px-6">
          <span className="tw-text-xs tw-text-iron-400">
            {t(locale, "waves.create.groups.currentGroup")}
          </span>
          <span className="tw-break-words tw-text-xs tw-font-medium tw-text-iron-200">
            {currentGroupLabel}
          </span>
          {savedTarget && (
            <div className={isKeyboardVisible ? "tw-hidden" : "tw-contents"}>
              <GroupMembersPreviewTrigger
                target={savedTarget}
                appearance="inline"
                disabled={props.disabled ?? false}
                onOpen={() => setPreviewTarget(savedTarget)}
              />
            </div>
          )}
        </div>
        <fieldset
          disabled={props.disabled ?? false}
          className={`tw-m-0 tw-flex tw-min-h-0 tw-min-w-0 tw-flex-1 tw-flex-col tw-border-0 tw-p-0 lg:tw-flex-row ${FILTER_INPUT_PRESENTATION_CLASS_NAME}`}
        >
          <div
            ref={listRef}
            role="group"
            aria-label={t(locale, "network.groupFilter.title")}
            className={`${showEditor ? "tw-hidden" : "tw-block"} tw-min-h-0 tw-flex-1 tw-overflow-y-auto tw-overscroll-contain tw-px-4 tw-py-0 sm:tw-px-6 lg:tw-block lg:tw-w-52 lg:tw-flex-none lg:tw-space-y-1 lg:tw-border-x-0 lg:tw-border-b-0 lg:tw-border-l-0 lg:tw-border-r lg:tw-border-t-0 lg:tw-border-solid lg:tw-border-white/5 lg:tw-px-3 lg:tw-py-6`}
          >
            {FILTER_VIEWS.map((rule) => (
              <button
                key={rule}
                type="button"
                aria-current={view === rule ? "true" : undefined}
                onClick={(event) => changeView(rule, event.detail === 0)}
                className={`tw-flex tw-min-h-10 tw-w-full tw-items-center tw-justify-between tw-gap-2 tw-border-x-0 tw-border-b tw-border-t-0 tw-border-solid tw-border-white/5 tw-bg-transparent tw-px-2 tw-py-1 tw-text-left tw-text-sm tw-transition-colors focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-primary-400 lg:tw-rounded-lg lg:tw-border-0 lg:tw-px-3 ${view === rule ? "tw-font-normal tw-text-iron-400 max-lg:desktop-hover:hover:tw-bg-white/[0.03] max-lg:desktop-hover:hover:tw-text-iron-100 lg:tw-bg-white/5 lg:tw-font-medium lg:tw-text-iron-50" : "tw-font-normal tw-text-iron-400 desktop-hover:hover:tw-bg-white/[0.03] desktop-hover:hover:tw-text-iron-100"}`}
              >
                <span className="tw-flex tw-items-center tw-gap-2">
                  {t(
                    locale,
                    rule === "identities"
                      ? "waves.create.groups.identities"
                      : RULE_LABELS[rule]
                  )}
                  {(rule === "identities"
                    ? identitiesConfigured
                    : configuredRules.has(rule)) && configuredMark}
                </span>
                <ChevronRightIcon
                  className="tw-size-4 tw-shrink-0 tw-text-iron-500 lg:tw-hidden"
                  aria-hidden="true"
                />
              </button>
            ))}
          </div>
          <div
            ref={editorRef}
            tabIndex={-1}
            className={`${showEditor ? "tw-block" : "tw-hidden"} tw-min-h-0 tw-flex-1 tw-overflow-y-auto tw-overscroll-contain tw-p-4 sm:tw-p-6 lg:tw-block lg:tw-px-8 lg:tw-py-6`}
          >
            <button
              type="button"
              onClick={showFilterList}
              className="tw-mb-5 tw-flex tw-min-h-10 tw-items-center tw-gap-1 tw-border-0 tw-bg-transparent tw-p-0 tw-text-sm tw-font-medium tw-text-iron-300 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-primary-400 lg:tw-hidden"
            >
              <ChevronLeftIcon className="tw-size-4" aria-hidden="true" />
              {t(locale, "network.groupFilter.all")}
            </button>
            <section
              aria-label={t(
                locale,
                view === "identities"
                  ? "waves.create.groups.identities"
                  : RULE_LABELS[view]
              )}
            >
              {view === "identities" ? (
                <>
                  <h2 className="tw-mb-4 tw-mt-0 !tw-text-base !tw-font-semibold !tw-text-iron-100 lg:tw-sr-only">
                    {t(locale, "waves.create.groups.identities")}
                  </h2>
                  <CreateWaveInlineGroupIdentities
                    quiet
                    networkPresentation
                    includedIdentities={displayedBuilder.identities}
                    excludedIdentities={displayedBuilder.excludedIdentities}
                    includedWalletSources={
                      displayedBuilder.includedWalletSources
                    }
                    excludedWalletSources={
                      displayedBuilder.excludedWalletSources
                    }
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
                    networkPresentation
                    draft={displayedBuilder.draft}
                    activeRule={view}
                    onDraftChange={setDraft}
                  />
                </div>
              )}
            </section>
          </div>
        </fieldset>
        <div className="tw-flex tw-shrink-0 tw-flex-col tw-gap-2 tw-border-x-0 tw-border-b-0 tw-border-t tw-border-solid tw-border-white/5 tw-bg-iron-950 tw-px-4 tw-py-2 sm:tw-flex-row sm:tw-items-center sm:tw-gap-4 sm:tw-px-6">
          <div
            className={`${isKeyboardVisible ? "tw-hidden" : "tw-flex"} tw-min-w-0 tw-flex-wrap tw-items-center tw-gap-x-3 tw-gap-y-2 sm:tw-flex-1`}
          >
            <span
              className={`tw-shrink-0 tw-text-xs tw-font-medium tw-text-iron-400 ${draftSummaryParts.length ? "tw-basis-full" : ""}`}
            >
              {t(locale, "waves.create.groups.draft.afterEditing")}
            </span>
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
            {!isDraftValid && (
              <p className="tw-m-0 tw-flex tw-basis-full tw-items-start tw-gap-2 tw-text-xs tw-leading-5 tw-text-iron-400">
                <InformationCircleIcon
                  aria-hidden="true"
                  className="tw-mt-0.5 tw-size-4 tw-shrink-0 tw-text-amber-500"
                />
                <span>
                  <span className="tw-font-medium">
                    {t(locale, "waves.create.groups.draft.notReadyTitle")}
                  </span>{" "}
                  <span>
                    {t(locale, "waves.create.groups.draft.notReadyDescription")}
                  </span>
                </span>
              </p>
            )}
          </div>
          <Button
            variant="action"
            size="md"
            className="tw-min-h-11 tw-max-w-full tw-self-end !tw-whitespace-normal sm:tw-self-auto"
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
