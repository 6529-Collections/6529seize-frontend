import React, { type JSX } from "react";
import CircleLoader from "@/components/distribution-plan-tool/common/CircleLoader";

interface ClosedButtonProps {
  readonly loading?: boolean | undefined;
  readonly children: React.ReactNode;
  readonly padding?: string | undefined;
  readonly title?: string | undefined;
  readonly className?: string | undefined;
  readonly fullWidth?: boolean | undefined;
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
  fullWidth = true,
}: ClosedButtonProps): JSX.Element {
  const widthClasses = fullWidth ? "tw-w-full" : "tw-w-auto";

  return (
    <button
      disabled
      type="button"
      title={title}
      aria-label={title}
      className={`tw-flex ${widthClasses} tw-items-center tw-justify-center tw-gap-x-1.5 tw-rounded-lg tw-border tw-border-solid tw-border-iron-600 tw-bg-iron-700 tw-text-iron-300 ${padding} tw-text-sm tw-font-medium tw-opacity-75 tw-transition tw-duration-200 tw-ease-out ${className}`}
    >
      {loading && <CircleLoader />}
      {children}
    </button>
  );
}
