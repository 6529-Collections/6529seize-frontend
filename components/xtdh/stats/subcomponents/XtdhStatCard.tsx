import CustomTooltip from "@/components/utils/tooltip/CustomTooltip";
import { useId } from "react";

export function XtdhStatCard({
  label,
  tooltip,
  value,
  suffix,
}: Readonly<{
  label: string;
  tooltip: string;
  value: string;
  suffix?: string;
}>) {
  const tooltipDescriptionId = useId();
  const labelWithTooltip = (
    <span
      className="tw-text-[11px] tw-font-semibold tw-uppercase tw-text-iron-300"
      aria-describedby={tooltipDescriptionId}
    >
      {label}
      <span id={tooltipDescriptionId} className="tw-sr-only">
        {tooltip}
      </span>
    </span>
  );

  return (
    <div className="tw-flex tw-flex-col tw-gap-1 tw-rounded-xl tw-bg-iron-900 tw-p-4">
      <CustomTooltip content={<span aria-hidden="true">{tooltip}</span>} placement="top">
        {labelWithTooltip}
      </CustomTooltip>
      <span className="tw-text-lg tw-font-semibold tw-text-iron-50">
        {value}
        {suffix ? <span className="tw-text-sm tw-text-iron-300"> {suffix}</span> : null}
      </span>
    </div>
  );
}
