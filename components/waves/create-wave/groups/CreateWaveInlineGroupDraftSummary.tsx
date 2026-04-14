export default function CreateWaveInlineGroupDraftSummary({
  draftSummary,
  isValid,
  canResetDraft,
  canCreateDraft,
  isCreating,
  onStartOver,
  onCreateAndUse,
}: {
  readonly draftSummary: string;
  readonly isValid: boolean;
  readonly canResetDraft: boolean;
  readonly canCreateDraft: boolean;
  readonly isCreating: boolean;
  readonly onStartOver: () => void;
  readonly onCreateAndUse: () => void;
}) {
  return (
    <div className="tw-flex tw-flex-wrap tw-items-center tw-justify-between tw-gap-3 tw-rounded-lg tw-border tw-border-solid tw-border-iron-800 tw-bg-iron-900/60 tw-p-3">
      <div className="tw-min-w-0">
        <p className="tw-mb-0 tw-text-sm tw-font-medium tw-text-iron-50">
          Ready to create this inline group
        </p>
        <p className="tw-mb-0 tw-mt-1 tw-text-xs tw-text-iron-400">
          {isValid
            ? draftSummary
            : "Draft is incomplete. Check the selected rules before creating it."}
        </p>
      </div>
      <div className="tw-flex tw-items-center tw-gap-2">
        <button
          type="button"
          disabled={!canResetDraft}
          onClick={onStartOver}
          className="tw-rounded-lg tw-border tw-border-solid tw-border-iron-700 tw-bg-iron-900 tw-px-3 tw-py-2 tw-text-sm tw-font-semibold tw-text-iron-300 tw-transition tw-duration-200 disabled:tw-cursor-not-allowed disabled:tw-opacity-60 desktop-hover:hover:tw-bg-iron-800"
        >
          Start over
        </button>
        <button
          type="button"
          disabled={!canCreateDraft}
          onClick={onCreateAndUse}
          className="tw-rounded-lg tw-border tw-border-solid tw-border-primary-500 tw-bg-primary-500 tw-px-3 tw-py-2 tw-text-sm tw-font-semibold tw-text-white tw-transition tw-duration-200 disabled:tw-cursor-not-allowed disabled:tw-opacity-60 desktop-hover:hover:tw-bg-primary-600"
        >
          {isCreating ? "Creating..." : "Create + use"}
        </button>
      </div>
    </div>
  );
}
