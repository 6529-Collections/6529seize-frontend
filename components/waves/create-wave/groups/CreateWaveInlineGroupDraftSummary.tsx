import type { ReactNode } from "react";
import GroupCriteriaReadinessHint from "@/components/groups/assignment/GroupCriteriaReadinessHint";
import Button from "@/components/utils/button/Button";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";

export default function CreateWaveInlineGroupDraftSummary({
  draftSummary,
  isValid,
  canCreateDraft,
  isCreating,
  forceVisible = false,
  saveChangesLabel = false,
  simplifyCriteriaCopy = false,
  mobilePresentation = false,
  privacyControl,
  draftMembersPreview,
  onCreateAndUse,
  quiet = false,
}: {
  readonly draftSummary: string | null;
  readonly isValid: boolean;
  readonly canCreateDraft: boolean;
  readonly isCreating: boolean;
  readonly forceVisible?: boolean | undefined;
  readonly saveChangesLabel?: boolean | undefined;
  readonly simplifyCriteriaCopy?: boolean;
  readonly mobilePresentation?: boolean;
  readonly privacyControl?: ReactNode | undefined;
  readonly draftMembersPreview?: ReactNode | undefined;
  readonly onCreateAndUse: () => void;
  readonly quiet?: boolean;
}) {
  const locale = useBrowserLocale();
  const showDraftActions = forceVisible || draftSummary !== null;
  const hasDraftMembersPreview =
    draftMembersPreview !== undefined && draftMembersPreview !== null;
  let submitLabel = t(locale, "waves.create.groups.draft.createAndUse");
  if (saveChangesLabel) {
    submitLabel = t(locale, "waves.create.groups.draft.saveChanges");
  }
  if (isCreating) {
    submitLabel = t(locale, "waves.create.groups.draft.creating");
  }

  if (!showDraftActions) {
    return null;
  }

  let summaryClassName =
    "tw-flex tw-w-fit tw-max-w-full tw-flex-col tw-items-start tw-gap-0.5 tw-rounded-lg tw-border tw-border-solid tw-border-white/5 tw-bg-white/[0.04] tw-px-3 tw-py-2 md:tw-max-w-sm";
  if (quiet) {
    summaryClassName =
      "tw-flex tw-w-full tw-min-w-0 tw-flex-col tw-items-start tw-gap-0.5 tw-rounded-lg tw-border tw-border-solid tw-border-white/10 tw-bg-iron-900/40 tw-p-3";
  }
  if (saveChangesLabel) {
    summaryClassName =
      "tw-flex tw-min-w-0 tw-flex-col tw-items-start tw-gap-0.5 sm:tw-col-span-full";
  }

  if (mobilePresentation) {
    summaryClassName =
      "tw-flex tw-w-full tw-min-w-0 tw-flex-col tw-items-start tw-gap-0.5 tw-rounded-xl tw-bg-iron-900 tw-p-4 sm:tw-col-span-full [&_ul]:tw-max-h-none [&_ul]:tw-overflow-visible";
  }

  const dividerClassName = quiet ? "tw-border-iron-800" : "tw-border-white/5";
  return (
    <div
      className={
        mobilePresentation
          ? ""
          : `tw-border-x-0 tw-border-b-0 tw-border-t tw-border-solid tw-pt-5 ${dividerClassName}`
      }
    >
      {!isValid && !simplifyCriteriaCopy && (
        <p className="tw-m-0 tw-mb-3 tw-text-xs tw-text-iron-400">
          <span className="tw-font-semibold tw-text-iron-300">
            {t(locale, "waves.create.groups.draft.notReadyTitle")}
          </span>{" "}
          <span>
            {t(locale, "waves.create.groups.draft.notReadyDescription")}
          </span>
        </p>
      )}
      <div
        className={`tw-flex tw-flex-col tw-gap-4 ${saveChangesLabel ? "sm:tw-grid sm:tw-grid-cols-[minmax(0,1fr)_auto] sm:tw-items-end" : ""}`}
      >
        <div data-group-criteria-summary className={summaryClassName}>
          {!simplifyCriteriaCopy && (
            <p
              className={
                quiet
                  ? "tw-m-0 tw-text-xs tw-font-medium tw-leading-4 tw-text-iron-400"
                  : "tw-m-0 tw-flex-shrink-0 tw-text-[0.6875rem] tw-font-semibold tw-uppercase tw-tracking-wider tw-text-iron-500"
              }
            >
              {t(locale, "waves.create.groups.draft.afterEditing")}
            </p>
          )}
          <div className="tw-flex tw-min-w-0 tw-items-center">
            {hasDraftMembersPreview ? (
              <div className={quiet ? "tw-w-full" : "tw-mt-1.5"}>
                {draftMembersPreview}
              </div>
            ) : (
              <p className="tw-m-0 tw-max-w-full tw-text-left tw-text-sm tw-font-semibold tw-text-iron-100">
                {draftSummary ??
                  t(locale, "waves.create.groups.members.noCriteria")}
              </p>
            )}
            {simplifyCriteriaCopy && !isValid && <GroupCriteriaReadinessHint />}
          </div>
        </div>
        {privacyControl}
        <div
          className={`tw-flex tw-flex-wrap tw-items-center tw-justify-end tw-gap-2 ${saveChangesLabel ? "tw-self-end sm:tw-col-start-2 sm:tw-justify-self-end" : "tw-self-start"}`}
        >
          <Button
            variant="action"
            size="md"
            disabled={!canCreateDraft}
            loading={isCreating}
            onClick={onCreateAndUse}
          >
            {submitLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
