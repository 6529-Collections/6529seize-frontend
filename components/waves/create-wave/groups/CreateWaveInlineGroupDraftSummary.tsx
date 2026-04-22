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
          <span className="tw-font-semibold tw-text-iron-300">Not ready.</span>{" "}
          <span>
            Draft is incomplete. Check the selected rules before creating it.
          </span>
        </p>
      )}
      <div className="tw-flex tw-flex-wrap tw-items-center tw-justify-between tw-gap-3">
        <p className="tw-mb-0 tw-text-sm tw-font-medium tw-text-iron-500">
          Ready to create this inline group
        </p>
        <div className="tw-flex tw-flex-wrap tw-items-center tw-justify-end tw-gap-2">
          <button
            type="button"
            disabled={!canResetDraft}
            onClick={onClearAll}
            className="tw-rounded-lg tw-border tw-border-solid tw-border-transparent tw-bg-transparent tw-px-3 tw-py-2 tw-text-sm tw-font-medium tw-text-iron-400 tw-transition tw-duration-200 disabled:tw-cursor-not-allowed disabled:tw-opacity-60 desktop-hover:hover:tw-text-iron-100"
          >
            Clear all
          </button>
          <button
            type="button"
            disabled={!canCreateDraft}
            onClick={onCreateAndUse}
            className="tw-rounded-lg tw-border tw-border-solid tw-border-primary-500 tw-bg-primary-500 tw-px-5 tw-py-2.5 tw-text-sm tw-font-semibold tw-text-white tw-transition tw-duration-200 disabled:tw-cursor-not-allowed disabled:tw-opacity-60 desktop-hover:hover:tw-border-primary-400 desktop-hover:hover:tw-bg-primary-400"
          >
            {isCreating ? "Creating..." : "Create + use"}
          </button>
        </div>
      </div>
    </div>
  );
}
