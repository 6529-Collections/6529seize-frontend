import type { MouseEvent } from "react";
import {
  ArrowPathIcon,
  ChevronRightIcon,
} from "@heroicons/react/24/outline";
import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t, type MessageKey } from "@/i18n/messages";

const SIDEBAR_LOCALE = DEFAULT_LOCALE;

interface SidebarWaveExpandControlProps {
  readonly formattedWaveName: string;
  readonly isExpanded: boolean;
  readonly isLoading?: boolean | undefined;
  readonly onBlur: () => void;
  readonly onClick: (event: MouseEvent<HTMLButtonElement>) => void;
  readonly onFocus: () => void;
  readonly shouldShowButton: boolean;
}

export function SidebarWaveExpandControl({
  formattedWaveName,
  isExpanded,
  isLoading = false,
  onBlur,
  onClick,
  onFocus,
  shouldShowButton,
}: SidebarWaveExpandControlProps) {
  if (!shouldShowButton) {
    return null;
  }

  const buttonStateClasses = isExpanded || isLoading
    ? "tw-bg-iron-700/60 tw-text-iron-200 tw-opacity-100"
    : "tw-bg-transparent tw-text-iron-500 tw-opacity-80";
  const ariaLabelKey: MessageKey = isLoading
    ? "waves.sidebar.expandControlLoadingAriaLabel"
    : isExpanded
      ? "waves.sidebar.expandControlCollapseAriaLabel"
      : "waves.sidebar.expandControlExpandAriaLabel";
  const ariaLabel = t(SIDEBAR_LOCALE, ariaLabelKey, {
    waveName: formattedWaveName,
  });

  return (
    <button
      type="button"
      aria-label={ariaLabel}
      aria-expanded={isExpanded}
      aria-busy={isLoading || undefined}
      onClick={onClick}
      onFocus={onFocus}
      onBlur={onBlur}
      className={`tw-relative tw-z-20 tw-inline-flex tw-size-5 tw-flex-shrink-0 tw-items-center tw-justify-center tw-rounded-full tw-border-0 tw-p-0 tw-transition-all tw-duration-200 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-primary-400 desktop-hover:hover:tw-bg-iron-700/70 desktop-hover:hover:tw-text-iron-200 desktop-hover:hover:tw-opacity-100 ${buttonStateClasses}`}
    >
      {isLoading ? (
        <ArrowPathIcon
          className="tw-size-3.5 tw-animate-spin"
          strokeWidth={2.5}
          aria-hidden="true"
        />
      ) : (
        <ChevronRightIcon
          className={`tw-size-3.5 tw-transition-transform tw-duration-200 tw-ease-out ${
            isExpanded ? "tw-rotate-90" : ""
          }`}
          strokeWidth={2.75}
          aria-hidden="true"
        />
      )}
    </button>
  );
}
