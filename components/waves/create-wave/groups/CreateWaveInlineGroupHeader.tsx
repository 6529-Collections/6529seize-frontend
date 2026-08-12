export default function CreateWaveInlineGroupHeader({
  currentGroupLabel,
  unsavedGroupDescription,
  unsavedGroupSummary,
}: {
  readonly currentGroupLabel: string;
  readonly unsavedGroupDescription: string | null;
  readonly unsavedGroupSummary: string | null;
}) {
  return (
    <div className="tw-flex tw-min-w-0 tw-flex-col tw-gap-3 md:tw-pr-[31rem]">
      <div className="tw-min-w-0 tw-rounded-lg tw-border tw-border-solid tw-border-white/5 tw-bg-iron-950/40 tw-p-3">
        <p className="tw-mb-1 tw-text-xs tw-font-semibold tw-uppercase tw-tracking-wider tw-text-iron-500">
          Current group
        </p>
        <p className="tw-mb-0 tw-text-sm tw-font-semibold tw-text-iron-100">
          {currentGroupLabel}
        </p>
      </div>

      {unsavedGroupSummary && (
        <div className="tw-min-w-0 tw-rounded-lg tw-border tw-border-solid tw-border-white/5 tw-bg-iron-950/40 tw-p-3">
          <p className="tw-mb-1 tw-text-xs tw-font-semibold tw-uppercase tw-tracking-wider tw-text-iron-500">
            Unsaved group
          </p>
          <p className="tw-mb-0 tw-text-sm tw-font-semibold tw-text-iron-100">
            {unsavedGroupSummary}
          </p>
          {unsavedGroupDescription && (
            <p className="tw-mb-0 tw-mt-1 tw-text-xs tw-font-medium tw-text-iron-400">
              {unsavedGroupDescription}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
