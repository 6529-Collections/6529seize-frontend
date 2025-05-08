import React from "react";

interface SecondaryButtonProps {
  readonly onClicked: () => void;
  readonly children: React.ReactNode;
  readonly size?: "default" | "sm";
  readonly disabled?: boolean;
  readonly className?: string;
}

export default function SecondaryButton({
  onClicked,
  children,
  size = "default",
  disabled = false,
  className = "",
}: SecondaryButtonProps) {
  const sizeClasses =
    size === "sm"
      ? "tw-px-2.5 tw-py-1.5 tw-text-xs"
      : "tw-px-3.5 tw-py-2.5 tw-text-sm";

  return (
    <button
      type="button"
      disabled={disabled}
      className={`tw-border tw-border-solid ${
        disabled
          ? "tw-border-iron-900 tw-cursor-not-allowed"
          : "tw-border-iron-800 hover:tw-ring-iron-650 hover:tw-bg-iron-700 hover:tw-border-iron-700"
      } tw-ring-1 tw-ring-iron-700 tw-rounded-lg tw-bg-iron-800 ${sizeClasses} tw-font-semibold ${
        disabled ? "tw-text-iron-600" : "tw-text-iron-300"
      } tw-flex tw-items-center tw-justify-center tw-gap-x-2 tw-shadow-sm focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-iron-700 tw-transition tw-duration-300 tw-ease-out ${className}`}
      onClick={disabled ? undefined : onClicked}
    >
      {children}
    </button>
  );
}
