import React from "react";
import CircleLoader from "../../distribution-plan-tool/common/CircleLoader";

interface WarningButtonProps {
  readonly loading: boolean;
  readonly disabled: boolean;
  readonly onClicked: () => void;
  readonly children: React.ReactNode;
  readonly padding?: string;
  readonly title?: string;
}

/**
 * Warning-styled button for limited submissions state
 * Uses amber/yellow colors to indicate urgency
 * Follows the same pattern as PrimaryButton
 */
export default function WarningButton({
  loading,
  disabled,
  onClicked,
  children,
  padding = "tw-px-2.5 tw-py-2",
  title,
}: WarningButtonProps) {
  return (
    <div
      className={`${
        disabled || loading
          ? "tw-from-amber-400/50 tw-to-amber-500/50"
          : "tw-from-amber-400 tw-to-amber-500"
      } tw-p-[1px] tw-w-full sm:tw-w-auto tw-flex tw-rounded-lg tw-bg-gradient-to-b`}
    >
      <button
        onClick={onClicked}
        disabled={disabled || loading}
        type="button"
        title={title}
        className={`${
          disabled || loading
            ? "tw-opacity-30 tw-text-iron-300"
            : "tw-text-amber-950 desktop-hover:hover:tw-bg-amber-600 desktop-hover:hover:tw-border-amber-600"
        } tw-flex tw-w-full tw-gap-x-1.5 tw-items-center tw-justify-center tw-border tw-border-solid tw-border-amber-500 tw-rounded-lg tw-bg-amber-500 ${padding} tw-text-sm tw-font-semibold tw-shadow-sm focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-amber-600 tw-transition tw-duration-300 tw-ease-out`}
      >
        {loading && <CircleLoader />}
        {children}
      </button>
    </div>
  );
}