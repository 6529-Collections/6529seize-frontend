import CustomTooltip from "@/components/utils/tooltip/CustomTooltip";
import { useId } from "react";

interface XtdhStatCardProps {
  readonly label: string;
  readonly value: string;
  readonly subtext?: string | undefined;
  readonly tooltip?: string | undefined;
  readonly onClick?: (() => void) | undefined;
  readonly variant?: "default" | "network" | undefined;
}

export function XtdhStatCard({
  label,
  value,
  subtext,
  tooltip,
  onClick,
  variant = "default",
}: XtdhStatCardProps) {
  const tooltipDescriptionId = useId();
  const isNetworkVariant = variant === "network";

  const LabelContent = (
    <span
      className={`tw-block tw-font-medium tw-uppercase tw-tracking-wider ${
        isNetworkVariant
          ? "tw-mb-3 tw-text-[11px] tw-text-iron-500"
          : "tw-mb-1 tw-text-[10px] tw-text-iron-400"
      }`}
    >
      {label}
    </span>
  );

  return (
    <div
      className={
        isNetworkVariant
          ? "tw-relative tw-h-full tw-overflow-hidden tw-rounded-xl tw-bg-iron-950 tw-p-6 tw-shadow-lg tw-ring-1 tw-ring-white/[0.03]"
          : "tw-relative tw-rounded-xl tw-border tw-border-solid tw-border-iron-900 tw-bg-iron-950 tw-p-4"
      }
    >
      {onClick && (
        <button
          onClick={onClick}
          className="tw-absolute tw-right-3 tw-top-3 tw-flex tw-h-6 tw-w-6 tw-cursor-pointer tw-items-center tw-justify-center tw-rounded-full tw-border-none tw-bg-primary-500 tw-text-white tw-transition-colors hover:tw-bg-primary-400"
          title="Action"
          type="button"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
            className="tw-h-4 tw-w-4"
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

        <div
          className={`tw-flex tw-items-baseline ${
            isNetworkVariant ? "tw-flex-wrap tw-gap-x-2 tw-gap-y-1" : "tw-gap-1"
          }`}
        >
          <span
            className={`tw-tabular-nums ${
              isNetworkVariant
                ? "tw-text-2xl tw-font-medium tw-leading-none tw-tracking-tight tw-text-iron-100 sm:tw-text-3xl"
                : "tw-text-xl tw-font-semibold tw-text-iron-50"
            }`}
          >
            {value}
          </span>
          {subtext && (
            <span
              className={`tw-text-iron-500 ${
                isNetworkVariant ? "tw-text-sm" : "tw-text-xs"
              }`}
            >
              {subtext}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
