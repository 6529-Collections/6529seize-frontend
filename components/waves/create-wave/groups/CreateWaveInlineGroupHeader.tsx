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
    <div className="tw-flex tw-min-w-0 tw-flex-col tw-gap-3 md:tw-pr-[19rem]">
      <div className="tw-flex tw-min-h-9 tw-w-fit tw-max-w-full tw-items-center tw-gap-2 tw-rounded-lg tw-border tw-border-solid tw-border-white/5 tw-bg-iron-950/60 tw-px-3 tw-py-2 md:tw-max-w-72">
        <p className="tw-m-0 tw-flex-shrink-0 tw-text-[0.6875rem] tw-font-semibold tw-uppercase tw-tracking-wider tw-text-iron-500">
          Current group
        </p>
        <p className="tw-m-0 tw-truncate tw-text-sm tw-font-semibold tw-text-iron-100">
          {currentGroupLabel}
        </p>
      </div>

      {unsavedGroupSummary && (
        <div className="tw-w-fit tw-max-w-full tw-rounded-lg tw-border tw-border-solid tw-border-white/5 tw-bg-iron-950/40 tw-p-3 md:tw-max-w-72">
          <p className="tw-m-0 tw-mb-1 tw-text-[0.6875rem] tw-font-semibold tw-uppercase tw-tracking-wider tw-text-iron-500">
            Unsaved group
          </p>
          <p className="tw-m-0 tw-text-sm tw-font-semibold tw-text-iron-100">
            {unsavedGroupSummary}
          </p>
          {unsavedGroupDescription && (
            <p className="tw-m-0 tw-mt-1 tw-text-xs tw-font-medium tw-text-iron-400">
              {unsavedGroupDescription}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
