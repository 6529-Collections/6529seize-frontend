"use client";

import { useCallback } from "react";
import { ChevronRightIcon } from "@heroicons/react/24/outline";
import useLocalPreference from "@/hooks/useLocalPreference";
import { formatInteger } from "@/i18n/format";
import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t, type MessageKey } from "@/i18n/messages";

const SIDEBAR_LOCALE = DEFAULT_LOCALE;
const HIGHLY_RATED_EXPANDED_STORAGE_KEY = "waves-sidebar-highly-rated-expanded";

const isBoolean = (value: unknown): value is boolean =>
  typeof value === "boolean";

export function useHighlyRatedWavesExpandedPreference() {
  return useLocalPreference(
    HIGHLY_RATED_EXPANDED_STORAGE_KEY,
    false,
    isBoolean
  );
}

export function HighlyRatedWavesToggle({
  controlsId,
  count,
  isExpanded,
  onToggle,
  paddingClassName,
}: {
  readonly controlsId: string;
  readonly count: number;
  readonly isExpanded: boolean;
  readonly onToggle: () => void;
  readonly paddingClassName: string;
}) {
  const countKey = count === 1 ? "one" : "other";
  const labelKey =
    `waves.sidebar.highlyRatedToggleLabel.${countKey}` as MessageKey;
  const ariaLabelKey =
    `waves.sidebar.highlyRated${isExpanded ? "Collapse" : "Expand"}AriaLabel.${countKey}` as MessageKey;
  const formattedCount = formatInteger(SIDEBAR_LOCALE, count);
  const label = t(SIDEBAR_LOCALE, labelKey, { count: formattedCount });
  const ariaLabel = t(SIDEBAR_LOCALE, ariaLabelKey, {
    count: formattedCount,
  });
  const handleClick = useCallback(() => {
    onToggle();
  }, [onToggle]);

  return (
    <div className={`${paddingClassName} tw-pb-1 tw-pt-2`}>
      <button
        type="button"
        aria-controls={controlsId}
        aria-expanded={isExpanded}
        aria-label={ariaLabel}
        onClick={handleClick}
        className="tw-flex tw-h-9 tw-w-full tw-items-center tw-justify-between tw-gap-x-2 tw-rounded-md tw-border tw-border-solid tw-border-iron-700/80 tw-bg-iron-900/60 tw-px-2.5 tw-text-left tw-text-iron-300 tw-transition-colors tw-duration-200 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-primary-400 desktop-hover:hover:tw-border-iron-600 desktop-hover:hover:tw-bg-iron-800/80 desktop-hover:hover:tw-text-iron-100"
      >
        <span className="tw-min-w-0 tw-truncate tw-text-[10px] tw-font-semibold tw-uppercase">
          {label}
        </span>
        <ChevronRightIcon
          className={`tw-size-3.5 tw-flex-shrink-0 tw-transition-transform tw-duration-200 ${
            isExpanded ? "tw-rotate-90" : ""
          }`}
          aria-hidden="true"
          strokeWidth={2.5}
        />
      </button>
    </div>
  );
}
