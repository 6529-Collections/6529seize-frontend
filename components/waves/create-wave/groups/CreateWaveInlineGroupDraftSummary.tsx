import type { ReactNode } from "react";
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
  privacyControl,
  draftMembersPreview,
  onCreateAndUse,
}: {
  readonly draftSummary: string | null;
  readonly isValid: boolean;
  readonly canCreateDraft: boolean;
  readonly isCreating: boolean;
  readonly forceVisible?: boolean | undefined;
  readonly saveChangesLabel?: boolean | undefined;
  readonly privacyControl?: ReactNode | undefined;
  readonly draftMembersPreview?: ReactNode | undefined;
  readonly onCreateAndUse: () => void;
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

  return (
    <div className="tw-border-x-0 tw-border-b-0 tw-border-t tw-border-solid tw-border-white/5 tw-pt-5">
      {!isValid && (
        <p className="tw-m-0 tw-mb-3 tw-text-xs tw-text-iron-400">
          <span className="tw-font-semibold tw-text-iron-300">
            {t(locale, "waves.create.groups.draft.notReadyTitle")}
          </span>{" "}
          <span>
            {t(locale, "waves.create.groups.draft.notReadyDescription")}
          </span>
        </p>
      )}
      <div className="tw-flex tw-flex-col tw-gap-4">
        <div className="tw-flex tw-w-fit tw-max-w-full tw-flex-col tw-items-start tw-gap-0.5 tw-rounded-lg tw-border tw-border-solid tw-border-white/5 tw-bg-white/[0.04] tw-px-3 tw-py-2 md:tw-max-w-sm">
          <p className="tw-m-0 tw-flex-shrink-0 tw-text-[0.6875rem] tw-font-semibold tw-uppercase tw-tracking-wider tw-text-iron-500">
            {t(locale, "waves.create.groups.draft.afterEditing")}
          </p>
          {hasDraftMembersPreview ? (
            <div className="tw-mt-1.5">{draftMembersPreview}</div>
          ) : (
            <p className="tw-m-0 tw-max-w-full tw-text-left tw-text-sm tw-font-semibold tw-text-iron-100">
              {draftSummary ??
                t(locale, "waves.create.groups.members.noCriteria")}
            </p>
          )}
        </div>
        {privacyControl}
        <div className="tw-flex tw-flex-wrap tw-items-center tw-justify-end tw-gap-2 tw-self-start">
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
