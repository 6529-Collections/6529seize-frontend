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
            Not ready yet.
          </span>{" "}
          <span>
            Finish the missing group rules before you create this group.
          </span>
        </p>
      )}
      <div className="tw-flex tw-flex-wrap tw-items-center tw-justify-between tw-gap-3">
        <div className="tw-flex tw-min-w-0 tw-flex-col tw-gap-1">
          <p className="tw-m-0 tw-text-sm tw-font-medium tw-text-iron-300">
            Create this new group
          </p>
          <p className="tw-m-0 tw-text-xs tw-font-medium tw-text-iron-500">
            {draftSummary ?? "No criteria selected"}
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
            Discard draft
          </Button>
          <Button
            variant="action"
            size="md"
            disabled={!canCreateDraft}
            loading={isCreating}
            onClick={onCreateAndUse}
          >
            {isCreating ? "Creating group..." : "Create and use new group"}
          </Button>
        </div>
      </div>
    </div>
  );
}
