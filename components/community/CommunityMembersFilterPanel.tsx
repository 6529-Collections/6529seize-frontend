"use client";

import { useRef, useState } from "react";
import { CheckIcon, ChevronRightIcon } from "@heroicons/react/24/outline";
import GroupMembersPreviewDialog from "@/components/groups/members/GroupMembersPreviewDialog";
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

const NAV_BUTTON_CLASSES =
  "tw-flex tw-min-h-11 tw-items-center tw-justify-center tw-gap-1.5 tw-rounded-lg tw-border-0 tw-px-2 tw-py-2 tw-text-sm tw-font-semibold focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-primary-400 disabled:tw-opacity-50";

export default function CommunityMembersFilterPanel(
  props: CreateWaveGroupInlinePanelProps
) {
  const locale = useBrowserLocale();
  const {
    displayedBuilder,
    draftSummary,
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
  const [view, setView] = useState<FilterView>(
    CreateWaveInlineGroupRuleType.LEVEL
  );
  const [previewTarget, setPreviewTarget] =
    useState<GroupMembersPreviewTarget | null>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<HTMLDivElement>(null);
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
    requestAnimationFrame(() => {
      if (focusEditor) {
        editorRef.current?.focus({ preventScroll: true });
      }
      editorRef.current?.scrollIntoView({ block: "start" });
    });
  };

  const configuredMark = (
    <>
      <CheckIcon
        className="tw-size-3.5 tw-shrink-0 tw-text-primary-300"
        aria-hidden="true"
      />
      <span className="tw-sr-only">
        {t(locale, "waves.create.groups.rules.configured")}
      </span>
    </>
  );

  return (
    <>
      <div
        ref={panelRef}
        className="tw-flex tw-min-h-0 tw-flex-1 tw-flex-col tw-overflow-hidden"
      >
        <div className="tw-shrink-0 tw-border-x-0 tw-border-b tw-border-t-0 tw-border-solid tw-border-iron-800 tw-px-4 tw-py-2 sm:tw-px-6">
          {savedTarget ? (
            <details className="tw-text-xs tw-text-iron-400">
              <summary className="tw-cursor-pointer tw-rounded-lg tw-py-2 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-primary-400">
                {t(locale, "waves.create.groups.currentGroup")}{" "}
                <span className="tw-ml-2 tw-break-words tw-font-medium tw-text-iron-200">
                  {currentGroupLabel}
                </span>
              </summary>
              <div className="tw-max-h-32 tw-overflow-y-auto tw-pb-2">
                <GroupMembersPreviewTrigger
                  target={savedTarget}
                  quiet
                  disabled={isCreating}
                  onOpen={() => setPreviewTarget(savedTarget)}
                />
              </div>
            </details>
          ) : (
            <p className="tw-m-0 tw-py-2 tw-text-xs tw-text-iron-400">
              {t(locale, "waves.create.groups.currentGroup")}{" "}
              <span className="tw-ml-2 tw-font-medium tw-text-iron-200">
                {currentGroupLabel}
              </span>
            </p>
          )}
        </div>
        <div
          ref={contentRef}
          className="tw-min-h-0 tw-flex-1 tw-overflow-y-auto tw-overscroll-contain tw-p-4 sm:tw-p-6"
        >
          <fieldset
            disabled={isCreating}
            className="tw-m-0 tw-min-w-0 tw-border-0 tw-p-0"
          >
            <div
              role="group"
              aria-label={t(locale, "network.groupFilter.title")}
              className="tw-mb-4 tw-grid tw-grid-cols-4 tw-gap-1 tw-rounded-xl tw-bg-iron-900 tw-p-1"
            >
              {CREATE_WAVE_INLINE_GROUP_QUICK_RULES.map((rule) => (
                <button
                  key={rule}
                  type="button"
                  aria-pressed={view === rule}
                  onClick={(event) => changeView(rule, event.detail === 0)}
                  className={`${NAV_BUTTON_CLASSES} ${view === rule ? "tw-bg-iron-700 tw-text-iron-50" : "tw-bg-transparent tw-text-iron-300 desktop-hover:hover:tw-bg-iron-800 desktop-hover:hover:tw-text-iron-50"}`}
                >
                  {t(locale, RULE_LABELS[rule])}
                  {configuredRules.has(rule) && configuredMark}
                </button>
              ))}
            </div>
            <div className="tw-mb-4">
              <h2 className="tw-mb-2 tw-mt-0 !tw-text-sm !tw-font-semibold !tw-text-iron-300">
                {t(locale, "network.groupFilter.more")}
              </h2>
              <div
                role="group"
                aria-label={t(locale, "network.groupFilter.more")}
                className="tw-divide-y tw-divide-solid tw-divide-iron-800 tw-rounded-xl tw-bg-iron-900/50 tw-px-2"
              >
                {(
                  [
                    "identities",
                    ...CREATE_WAVE_INLINE_GROUP_MORE_RULES,
                  ] as const
                ).map((rule) => (
                  <button
                    key={rule}
                    type="button"
                    aria-pressed={view === rule}
                    onClick={(event) => changeView(rule, event.detail === 0)}
                    className={`tw-flex tw-min-h-11 tw-w-full tw-items-center tw-justify-between tw-gap-2 tw-border-0 tw-bg-transparent tw-px-2 tw-py-2 tw-text-left tw-text-sm tw-font-medium focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-primary-400 ${view === rule ? "tw-text-iron-50" : "tw-text-iron-300 desktop-hover:hover:tw-text-iron-50"}`}
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
                      className="tw-size-4 tw-shrink-0 tw-text-iron-500"
                      aria-hidden="true"
                    />
                  </button>
                ))}
              </div>
            </div>
            <div
              ref={editorRef}
              role="region"
              aria-label={t(
                locale,
                view === "identities"
                  ? "waves.create.groups.identities"
                  : RULE_LABELS[view]
              )}
              tabIndex={-1}
            >
              {view === "identities" ? (
                <CreateWaveInlineGroupIdentities
                  quiet
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
                <CreateWaveInlineGroupRuleEditor
                  draft={displayedBuilder.draft}
                  activeRule={view}
                  onDraftChange={setDraft}
                />
              )}
            </div>
          </fieldset>
        </div>
        <div className="tw-shrink-0 tw-border-x-0 tw-border-b-0 tw-border-t tw-border-solid tw-border-iron-800 tw-bg-iron-950 tw-p-4 sm:tw-px-6">
          <div className="tw-max-h-32 tw-overflow-y-auto tw-overscroll-contain">
            <p className="tw-m-0 tw-mb-1 tw-text-xs tw-font-medium tw-text-iron-400">
              {t(locale, "waves.create.groups.draft.afterEditing")}
            </p>
            {draftTarget ? (
              <GroupMembersPreviewTrigger
                target={draftTarget}
                quiet
                disabled={isCreating}
                actionLabel={t(
                  locale,
                  "waves.create.groups.members.previewDraft"
                )}
                onOpen={() => setPreviewTarget(draftTarget)}
              />
            ) : (
              <p
                className="tw-m-0 tw-text-sm tw-font-medium tw-text-iron-100"
                aria-live="polite"
              >
                {draftSummary ??
                  t(locale, "waves.create.groups.members.noCriteria")}
              </p>
            )}
            {!isDraftValid && (
              <details className="tw-mt-1 tw-text-xs tw-leading-5 tw-text-iron-400">
                <summary className="tw-w-fit tw-cursor-pointer tw-rounded tw-py-1 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-primary-400">
                  {t(locale, "waves.create.groups.draft.notReadyTitle")}
                </summary>
                <p className="tw-mb-0 tw-mt-1">
                  {t(locale, "waves.create.groups.draft.notReadyDescription")}
                </p>
              </details>
            )}
          </div>
          <Button
            variant="action"
            size="md"
            fullWidth
            className="tw-mt-3 tw-min-h-11"
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
