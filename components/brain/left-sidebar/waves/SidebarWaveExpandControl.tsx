import type { MouseEvent } from "react";
import { ChevronRightIcon } from "@heroicons/react/24/outline";

interface SidebarWaveExpandControlProps {
  readonly formattedWaveName: string;
  readonly isExpanded: boolean;
  readonly onBlur: () => void;
  readonly onClick: (event: MouseEvent<HTMLButtonElement>) => void;
  readonly onFocus: () => void;
  readonly shouldShowButton: boolean;
}

export function SidebarWaveExpandControl({
  formattedWaveName,
  isExpanded,
  onBlur,
  onClick,
  onFocus,
  shouldShowButton,
}: SidebarWaveExpandControlProps) {
  if (!shouldShowButton) {
    return null;
  }

  const buttonStateClasses = isExpanded
    ? "tw-bg-iron-700/60 tw-text-iron-200 tw-opacity-100"
    : "tw-bg-transparent tw-text-iron-500 tw-opacity-80";

  return (
    <button
      type="button"
      aria-label={`${isExpanded ? "Collapse" : "Expand"} ${formattedWaveName} subwaves`}
      aria-expanded={isExpanded}
      onClick={onClick}
      onFocus={onFocus}
      onBlur={onBlur}
      className={`tw-relative tw-inline-flex tw-size-5 tw-flex-shrink-0 tw-items-center tw-justify-center tw-rounded-full tw-border-0 tw-p-0 tw-transition-all tw-duration-200 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-primary-400 desktop-hover:hover:tw-bg-iron-700/70 desktop-hover:hover:tw-text-iron-200 desktop-hover:hover:tw-opacity-100 ${buttonStateClasses}`}
    >
      <ChevronRightIcon
        className={`tw-size-3.5 tw-transition-transform tw-duration-200 tw-ease-out ${
          isExpanded ? "tw-rotate-90" : ""
        }`}
        strokeWidth={2.75}
        aria-hidden="true"
      />
    </button>
  );
}
