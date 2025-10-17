import React from "react";
import CircleLoader from "@/components/distribution-plan-tool/common/CircleLoader";

interface InfoButtonProps {
  readonly loading?: boolean;
  readonly disabled?: boolean;
  readonly onClicked?: () => void;
  readonly children: React.ReactNode;
  readonly padding?: string;
  readonly title?: string;
  readonly variant?: "primary" | "info" | "muted";
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
}: InfoButtonProps) {
  // Class mappings for variants
  const variantClasses = {
    primary: "tw-bg-green-600/20 tw-text-green-400 tw-border tw-border-solid tw-border-green-700 hover:tw-bg-green-600/30",
    info: "tw-bg-blue-600/20 tw-text-blue-400 tw-border tw-border-solid tw-border-blue-700 hover:tw-bg-blue-600/30", 
    muted: "tw-bg-iron-800 tw-text-iron-400 tw-border tw-border-solid tw-border-iron-700 tw-cursor-not-allowed"
  };

  const baseClasses = `tw-flex tw-w-full tw-gap-x-1.5 tw-items-center tw-justify-center tw-rounded-lg ${padding} tw-text-sm tw-font-semibold tw-transition tw-duration-200 tw-ease-out`;
  
  const disabledClasses = disabled || loading ? "tw-opacity-50" : "";
  
  return (
    <button
      onClick={onClicked}
      disabled={disabled || loading}
      type="button"
      title={title}
      className={`${baseClasses} ${variantClasses[variant]} ${disabledClasses}`}
    >
      {loading && <CircleLoader />}
      {children}
    </button>
  );
}