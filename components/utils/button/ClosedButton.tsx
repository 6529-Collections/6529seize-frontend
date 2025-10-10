import React, { type JSX } from "react";
import CircleLoader from "@/components/distribution-plan-tool/common/CircleLoader";

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
    <button
      disabled
      type="button"
      title={title}
      aria-label={title}
      className={`tw-flex tw-w-full tw-gap-x-1.5 tw-items-center tw-justify-center tw-border tw-border-solid tw-border-iron-600 tw-rounded-lg tw-bg-iron-700 tw-text-iron-300 ${padding} tw-text-sm tw-font-medium tw-transition tw-duration-200 tw-ease-out tw-opacity-75 ${className}`}
    >
      {loading && <CircleLoader />}
      {children}
    </button>
  );
}