import type { ReactNode } from "react";
import type { XtdhProgressBarProps } from "./XtdhProgressBar";
import { XtdhProgressBar } from "./XtdhProgressBar";

interface XtdhLabeledProgressBarProps extends XtdhProgressBarProps {
  readonly label: string;
  readonly value: ReactNode;
}

export function XtdhLabeledProgressBar({
  label,
  value,
  percentage,
  ariaLabel,
  ariaValueText,
}: XtdhLabeledProgressBarProps) {
  return (
    <div className="tw-space-y-2">
      <div className="tw-flex tw-justify-between tw-text-xs tw-font-semibold tw-uppercase tw-tracking-widest tw-text-iron-500">
        <span>{label}</span>
        <span className="tw-tabular-nums">{value}</span>
      </div>
      <XtdhProgressBar
        percentage={percentage}
        ariaLabel={ariaLabel ?? label}
        ariaValueText={ariaValueText}
      />
    </div>
  );
}
