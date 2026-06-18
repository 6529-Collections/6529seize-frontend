import type { MouseEvent } from "react";
import { ChevronRightIcon } from "@heroicons/react/24/outline";

interface SidebarWaveExpandControlProps {
  readonly formattedWaveName: string;
  readonly isExpanded: boolean;
  readonly onBlur: () => void;
  readonly onClick: (event: MouseEvent<HTMLButtonElement>) => void;
  readonly onFocus: () => void;
  readonly shouldReserveSpace: boolean;
  readonly shouldShowButton: boolean;
}

export function SidebarWaveExpandControl({
  formattedWaveName,
  isExpanded,
  onBlur,
  onClick,
  onFocus,
  shouldReserveSpace,
  shouldShowButton,
}: SidebarWaveExpandControlProps) {
  if (!shouldReserveSpace) {
    return null;
  }

  const buttonStateClasses = isExpanded
    ? "tw-bg-iron-700/60 tw-text-iron-300 tw-opacity-100"
    : "tw-bg-transparent tw-text-iron-500 tw-opacity-70";

  return (
    <div className="tw-flex tw-h-10 tw-w-6 tw-flex-shrink-0 tw-items-center tw-justify-center md:tw-w-5">
      {shouldShowButton && (
        <button
          type="button"
          aria-label={`${isExpanded ? "Collapse" : "Expand"} ${formattedWaveName} subwaves`}
          aria-expanded={isExpanded}
          onClick={onClick}
          onFocus={onFocus}
          onBlur={onBlur}
          className={`tw-relative tw-flex tw-size-6 tw-items-center tw-justify-center tw-rounded-full tw-border-0 tw-p-0 tw-transition-all tw-duration-200 desktop-hover:hover:tw-bg-iron-700/70 desktop-hover:hover:tw-text-iron-300 desktop-hover:hover:tw-opacity-100 md:tw-size-5 ${buttonStateClasses}`}
        >
          <ChevronRightIcon
            className={`tw-size-3.5 tw-transition-transform tw-duration-200 tw-ease-out ${
              isExpanded ? "tw-rotate-90" : ""
            }`}
            aria-hidden="true"
          />
        </button>
      )}
    </div>
  );
}
