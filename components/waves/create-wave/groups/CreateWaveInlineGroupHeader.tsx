export default function CreateWaveInlineGroupHeader({
  currentStateLabel,
}: {
  readonly currentStateLabel: string;
}) {
  return (
    <div className="tw-min-w-0">
      <p className="tw-mb-1 tw-text-xs tw-font-semibold tw-uppercase tw-tracking-wider tw-text-iron-500">
        Current state
      </p>
      <p className="tw-mb-0 tw-text-sm tw-font-semibold tw-text-iron-100">
        {currentStateLabel}
      </p>
    </div>
  );
}
