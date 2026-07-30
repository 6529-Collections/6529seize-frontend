import Button from "@/components/utils/button/Button";

export default function CreateWaveInlineGroupDraftSummary({
  draftSummary,
  isValid,
  canResetDraft,
  canCreateDraft,
  isCreating,
  onClearAll,
  onCreateAndUse,
}: {
  readonly draftSummary: string | null;
  readonly isValid: boolean;
  readonly canResetDraft: boolean;
  readonly canCreateDraft: boolean;
  readonly isCreating: boolean;
  readonly onClearAll: () => void;
  readonly onCreateAndUse: () => void;
}) {
  const showDraftActions = draftSummary !== null;

  if (!showDraftActions) {
    return null;
  }

  return (
    <div className="tw-border-x-0 tw-border-b-0 tw-border-t tw-border-solid tw-border-white/5 tw-pt-5">
      {!isValid && (
        <p className="tw-mb-3 tw-text-xs tw-text-iron-400">
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
          <p className="tw-mb-0 tw-text-sm tw-font-medium tw-text-iron-500">
            Create this new group
          </p>
          <p className="tw-mb-0 tw-text-xs tw-font-medium tw-text-iron-400">
            {draftSummary}
          </p>
        </div>
        <div className="tw-flex tw-flex-wrap tw-items-center tw-justify-end tw-gap-2">
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
