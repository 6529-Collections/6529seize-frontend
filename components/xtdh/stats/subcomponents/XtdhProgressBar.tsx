export interface XtdhProgressBarProps {
  readonly percentage: number;
  readonly ariaLabel?: string | undefined;
  readonly ariaValueText?: string | undefined;
}

export function XtdhProgressBar({
  percentage,
  ariaLabel,
  ariaValueText,
}: XtdhProgressBarProps) {
  const clampedPercentage = Math.min(Math.max(percentage, 0), 100);

  return (
    <div
      role="progressbar"
      aria-valuenow={clampedPercentage}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={ariaLabel}
      aria-valuetext={ariaValueText}
      className="tw-h-1.5 tw-w-full tw-overflow-hidden tw-rounded-full tw-bg-iron-800"
    >
      <div
        className="tw-h-full tw-rounded-full tw-bg-primary-400"
        style={{ width: `${clampedPercentage}%` }}
      />
    </div>
  );
}
