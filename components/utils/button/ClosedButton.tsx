import React, { type JSX } from "react";
import CircleLoader from "../../distribution-plan-tool/common/CircleLoader";

interface ClosedButtonProps {
  readonly loading?: boolean;
  readonly children: React.ReactNode;
  readonly padding?: string;
  readonly title?: string;
  readonly className?: string;
}

/**
 * Gray button component for closed/ended states
 * Follows the same pattern as other button components
 */
export default function ClosedButton({
  loading = false,
  children,
  padding = "tw-px-2.5 tw-py-2",
  title,
  className = "",
}: ClosedButtonProps): JSX.Element {
  return (
    <div className="tw-from-iron-200 tw-to-iron-300 tw-p-[1px] tw-w-full sm:tw-w-auto tw-flex tw-rounded-lg tw-bg-gradient-to-b">
      <button
        disabled
        type="button"
        title={title}
        aria-label={title}
        className={`tw-opacity-90 tw-text-iron-600 tw-flex tw-w-full tw-gap-x-1.5 tw-items-center tw-justify-center tw-border tw-border-solid tw-border-iron-300 tw-rounded-lg tw-bg-iron-100 ${padding} tw-text-sm tw-font-semibold tw-shadow-sm focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-iron-400 tw-transition tw-duration-300 tw-ease-out ${className}`}
      >
        {loading && <CircleLoader />}
        {children}
      </button>
    </div>
  );
}