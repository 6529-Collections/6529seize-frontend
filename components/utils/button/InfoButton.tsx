import React from "react";
import CircleLoader from "@/components/distribution-plan-tool/common/CircleLoader";

interface InfoButtonProps {
  readonly loading?: boolean | undefined;
  readonly disabled?: boolean | undefined;
  readonly onClicked?: (() => void) | undefined;
  readonly children: React.ReactNode;
  readonly padding?: string | undefined;
  readonly title?: string | undefined;
  readonly variant?: "primary" | "info" | "muted" | undefined;
  readonly fullWidth?: boolean | undefined;
  readonly className?: string | undefined;
}

/**
 * Info-styled button for informational states like "coming soon"
 */
export default function InfoButton({
  loading = false,
  disabled = false,
  onClicked,
  children,
  padding = "tw-px-2.5 tw-py-2",
  title,
  variant = "info",
  fullWidth = true,
  className = "",
}: InfoButtonProps) {
  // Class mappings for variants
  const variantClasses = {
    primary:
      "tw-bg-green-600/20 tw-text-green-400 tw-border tw-border-solid tw-border-green-700 hover:tw-bg-green-600/30",
    info: "tw-bg-blue-600/20 tw-text-blue-400 tw-border tw-border-solid tw-border-blue-700 hover:tw-bg-blue-600/30",
    muted:
      "tw-bg-iron-800 tw-text-iron-400 tw-border tw-border-solid tw-border-iron-700 tw-cursor-not-allowed",
  };

  const widthClasses = fullWidth ? "tw-w-full" : "tw-w-auto";
  const baseClasses = `tw-flex ${widthClasses} tw-gap-x-1.5 tw-items-center tw-justify-center tw-rounded-lg ${padding} tw-text-sm tw-font-semibold tw-transition tw-duration-200 tw-ease-out`;

  const disabledClasses = disabled || loading ? "tw-opacity-50" : "";

  return (
    <button
      onClick={onClicked}
      disabled={disabled || loading}
      type="button"
      title={title}
      className={`${baseClasses} ${variantClasses[variant]} ${disabledClasses} ${className}`}
    >
      {loading && <CircleLoader />}
      {children}
    </button>
  );
}
