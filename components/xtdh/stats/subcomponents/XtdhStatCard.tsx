import CustomTooltip from "@/components/utils/tooltip/CustomTooltip";
import { useId } from "react";

interface XtdhStatCardProps {
  readonly label: string;
  readonly value: string;
  readonly subtext?: string | undefined;
  readonly tooltip?: string | undefined;
  readonly onClick?: (() => void) | undefined;
}

export function XtdhStatCard({
  label,
  value,
  subtext,
  tooltip,
  onClick,
}: XtdhStatCardProps) {
  const tooltipDescriptionId = useId();

  const LabelContent = (
    <div className="tw-text-[10px] tw-font-medium tw-uppercase tw-tracking-wider tw-text-iron-400 tw-mb-1">
      {label}
    </div>
  );

  return (
    <div className="tw-relative tw-rounded-xl tw-border tw-border-solid tw-border-iron-900 tw-bg-iron-950 tw-p-4">
      {onClick && (
        <button
          onClick={onClick}
          className="tw-absolute tw-top-3 tw-right-3 tw-flex tw-h-6 tw-w-6 tw-items-center tw-justify-center tw-rounded-full tw-bg-primary-500 tw-text-white hover:tw-bg-primary-400 tw-transition-colors tw-border-none tw-cursor-pointer"
          title="Action"
          type="button"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
            className="tw-w-4 tw-h-4"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 4.5v15m7.5-7.5h-15"
            />
          </svg>
        </button>
      )}

      <div className="tw-flex tw-flex-col">
        {tooltip ? (
          <CustomTooltip
            content={<span aria-hidden="true">{tooltip}</span>}
            placement="top"
          >
            <span aria-describedby={tooltipDescriptionId}>
              {LabelContent}
              <span id={tooltipDescriptionId} className="tw-sr-only">
                {tooltip}
              </span>
            </span>
          </CustomTooltip>
        ) : (
          LabelContent
        )}

        <div className="tw-flex tw-items-baseline tw-gap-1">
          <span className="tw-text-xl tw-font-semibold tw-text-iron-50 tw-tabular-nums">
            {value}
          </span>
          {subtext && (
            <span className="tw-text-xs tw-text-iron-500">{subtext}</span>
          )}
        </div>
      </div>
    </div>
  );
}
