import Button from "@/components/utils/button/Button";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";

export default function CreateWaveInlineGroupDraftSummary({
  draftSummary,
  isValid,
  canResetDraft,
  canCreateDraft,
  isCreating,
  canPreviewDraft = false,
  forceVisible = false,
  onClearAll,
  onCreateAndUse,
  onPreviewDraft,
}: {
  readonly draftSummary: string | null;
  readonly isValid: boolean;
  readonly canResetDraft: boolean;
  readonly canCreateDraft: boolean;
  readonly isCreating: boolean;
  readonly canPreviewDraft?: boolean | undefined;
  readonly forceVisible?: boolean | undefined;
  readonly onClearAll: () => void;
  readonly onCreateAndUse: () => void;
  readonly onPreviewDraft?: (() => void) | undefined;
}) {
  const locale = useBrowserLocale();
  const showDraftActions = forceVisible || draftSummary !== null;

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
      <div className="tw-flex tw-flex-wrap tw-items-center tw-justify-between tw-gap-3">
        <div className="tw-flex tw-min-w-0 tw-flex-col tw-gap-1">
          <p className="tw-m-0 tw-text-sm tw-font-medium tw-text-iron-300">
            {t(locale, "waves.create.groups.draft.createTitle")}
          </p>
          <p className="tw-m-0 tw-text-xs tw-font-medium tw-text-iron-500">
            {draftSummary ??
              t(locale, "waves.create.groups.members.noCriteria")}
          </p>
        </div>
        <div className="tw-flex tw-flex-wrap tw-items-center tw-justify-end tw-gap-2">
          {onPreviewDraft ? (
            <Button
              variant="tertiary"
              size="md"
              disabled={!canPreviewDraft}
              onClick={onPreviewDraft}
            >
              {t(locale, "waves.create.groups.members.previewDraft")}
            </Button>
          ) : null}
          <Button
            variant="secondary"
            size="md"
            disabled={!canResetDraft}
            onClick={onClearAll}
          >
            {t(locale, "waves.create.groups.draft.discard")}
          </Button>
          <Button
            variant="action"
            size="md"
            disabled={!canCreateDraft}
            loading={isCreating}
            onClick={onCreateAndUse}
          >
            {isCreating
              ? t(locale, "waves.create.groups.draft.creating")
              : t(locale, "waves.create.groups.draft.createAndUse")}
          </Button>
        </div>
      </div>
    </div>
  );
}
