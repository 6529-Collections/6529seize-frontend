import React from "react";
import CircleLoader from "@/components/distribution-plan-tool/common/CircleLoader";

interface InfoButtonProps {
  readonly loading?: boolean;
  readonly disabled?: boolean;
  readonly onClicked?: () => void;
  readonly children: React.ReactNode;
  readonly padding?: string;
  readonly title?: string;
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
}: InfoButtonProps) {
  return (
    <div
      className={`${
        disabled || loading
          ? "tw-from-blue-200/70 tw-to-blue-300/70"
          : "tw-from-blue-200 tw-to-blue-300"
      } tw-p-[1px] tw-w-full sm:tw-w-auto tw-flex tw-rounded-lg tw-bg-gradient-to-b`}
    >
      <button
        onClick={onClicked}
        disabled={disabled || loading}
        type="button"
        title={title}
        className={`${
          disabled || loading
            ? "tw-opacity-70 tw-text-blue-600"
            : "tw-text-blue-800 desktop-hover:hover:tw-bg-blue-200 desktop-hover:hover:tw-border-blue-300"
        } tw-flex tw-w-full tw-gap-x-1.5 tw-items-center tw-justify-center tw-border tw-border-solid tw-border-blue-300 tw-rounded-lg tw-bg-blue-100 ${padding} tw-text-sm tw-font-semibold tw-shadow-sm focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-blue-400 tw-transition tw-duration-300 tw-ease-out`}
      >
        {loading && <CircleLoader />}
        {children}
      </button>
    </div>
  );
}