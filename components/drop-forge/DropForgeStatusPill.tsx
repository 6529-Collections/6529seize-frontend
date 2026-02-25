import CircleLoader, {
  CircleLoaderSize,
} from "@/components/distribution-plan-tool/common/CircleLoader";
import clsx from "clsx";
import { useId } from "react";
import { Tooltip } from "react-tooltip";

export default function DropForgeStatusPill({
  className,
  label,
  showLoader = false,
  tooltipText,
}: Readonly<{
  className: string;
  label: string;
  showLoader?: boolean;
  tooltipText?: string;
}>) {
  const tooltipId = useId();

  return (
    <>
      <span
        {...(tooltipText
          ? {
              "data-tooltip-id": tooltipId,
              "data-tooltip-content": tooltipText,
            }
          : {})}
        className={clsx(
          "tw-inline-flex tw-max-w-full tw-items-center tw-gap-2 tw-rounded-full tw-px-3 tw-py-2 tw-text-sm tw-font-medium tw-leading-tight tw-ring-1 tw-ring-inset",
          tooltipText && "tw-cursor-help",
          className
        )}
      >
        {showLoader ? (
          <CircleLoader size={CircleLoaderSize.SMALL} />
        ) : (
          <span className="tw-inline-block tw-h-1.5 tw-w-1.5 tw-rounded-full tw-bg-current" />
        )}
        <span>{label}</span>
      </span>
      {tooltipText && (
        <Tooltip
          id={tooltipId}
          place="top-start"
          border="1px solid rgba(255, 255, 255, 0.15)"
          opacity={1}
          style={{
            backgroundColor: "#26272B",
            color: "#F4F4F5",
            padding: "8px 10px",
            maxWidth: "260px",
            fontSize: "12px",
            lineHeight: "1.35",
            borderRadius: "8px",
          }}
        />
      )}
    </>
  );
}
