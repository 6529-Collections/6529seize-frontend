import { ArrowDownLeftIcon, ArrowUpRightIcon } from "@heroicons/react/24/solid";
import type { RepDirection } from "./UserPageRep.helpers";

export default function RepDirectionToggle({
  repDirection,
  onRepDirectionChange,
  compact,
}: {
  readonly repDirection: RepDirection;
  readonly onRepDirectionChange: (direction: RepDirection) => void;
  readonly compact?: boolean;
}) {
  const iconClass = compact
    ? "tw-h-3 tw-w-3 tw-flex-shrink-0"
    : "tw-h-3.5 tw-w-3.5 tw-flex-shrink-0";
  const textClass = compact ? "tw-text-xs" : "tw-text-[13px]";
  const activeExtra = compact ? "tw-font-semibold" : "";

  return (
    <div className="tw-flex tw-items-center tw-gap-4">
      <button
        type="button"
        aria-pressed={repDirection === "received"}
        onClick={() => onRepDirectionChange("received")}
        className={`tw-inline-flex tw-cursor-pointer tw-items-center tw-gap-1.5 tw-border-0 tw-bg-transparent tw-p-0 ${textClass} tw-font-medium tw-transition-colors tw-duration-200 ${
          repDirection === "received"
            ? `tw-text-iron-100 ${activeExtra}`
            : "tw-text-iron-500 hover:tw-text-iron-300"
        }`}
      >
        <ArrowDownLeftIcon className={iconClass} aria-hidden="true" />
        Received
      </button>
      <button
        type="button"
        aria-pressed={repDirection === "given"}
        onClick={() => onRepDirectionChange("given")}
        className={`tw-inline-flex tw-cursor-pointer tw-items-center tw-gap-1.5 tw-border-0 tw-bg-transparent tw-p-0 ${textClass} tw-font-medium tw-transition-colors tw-duration-200 ${
          repDirection === "given"
            ? `tw-text-iron-100 ${activeExtra}`
            : "tw-text-iron-500 hover:tw-text-iron-300"
        }`}
      >
        <ArrowUpRightIcon className={iconClass} aria-hidden="true" />
        Given
      </button>
    </div>
  );
}
