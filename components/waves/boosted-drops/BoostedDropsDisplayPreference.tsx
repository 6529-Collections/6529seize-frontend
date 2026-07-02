"use client";

import { CheckIcon } from "@heroicons/react/24/outline";
import type { CompactMenuItem } from "@/components/compact-menu";
import { useBoostedDropsDisplayPreference } from "@/hooks/useBoostedDropsDisplayPreference";
import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t, type MessageKey } from "@/i18n/messages";
import {
  BOOSTED_DROPS_DISPLAY_PREFERENCES,
  type BoostedDropsDisplayPreference,
} from "@/types/boosted-drops.types";
import clsx from "clsx";
import { useId } from "react";

const BOOSTED_DROPS_DISPLAY_LABEL_KEYS = {
  expanded: "waveChat.boostedDrops.display.expanded",
  compact: "waveChat.boostedDrops.display.compact",
  hidden: "waveChat.boostedDrops.display.hidden",
} as const satisfies Record<BoostedDropsDisplayPreference, MessageKey>;

export const getBoostedDropsDisplayPreferenceLabel = (
  preference: BoostedDropsDisplayPreference
): string => t(DEFAULT_LOCALE, BOOSTED_DROPS_DISPLAY_LABEL_KEYS[preference]);

export const getBoostedDropsDisplayPreferenceMenuLabel = (
  preference: BoostedDropsDisplayPreference
): string =>
  t(DEFAULT_LOCALE, "waveChat.boostedDrops.display.menuCurrent", {
    mode: getBoostedDropsDisplayPreferenceLabel(preference),
  });

export const getBoostedDropsDisplayPreferenceMenuItems = ({
  preference,
  setPreference,
}: {
  readonly preference: BoostedDropsDisplayPreference;
  readonly setPreference: (preference: BoostedDropsDisplayPreference) => void;
}): CompactMenuItem[] => [
  {
    id: "boosted-drops-display-section",
    kind: "section",
    label: getBoostedDropsDisplayPreferenceMenuLabel(preference),
  },
  ...BOOSTED_DROPS_DISPLAY_PREFERENCES.map((option): CompactMenuItem => {
    const selected = option === preference;
    const label = getBoostedDropsDisplayPreferenceLabel(option);

    return {
      id: `boosted-drops-display-${option}`,
      label,
      icon: selected ? (
        <CheckIcon className="tw-h-4 tw-w-4 tw-flex-shrink-0" />
      ) : (
        <span className="tw-h-4 tw-w-4 tw-flex-shrink-0" aria-hidden="true" />
      ),
      active: selected,
      ariaLabel: label,
      onSelect: () => setPreference(option),
    };
  }),
];

interface BoostedDropsDisplayPreferenceProps {
  readonly className?: string | undefined;
}

export default function BoostedDropsDisplayPreference({
  className,
}: BoostedDropsDisplayPreferenceProps) {
  const [preference, setPreference] = useBoostedDropsDisplayPreference();
  const groupName = useId();
  const descriptionId = useId();

  return (
    <fieldset
      className={clsx(
        "tw-m-0 tw-flex tw-min-w-0 tw-flex-col tw-gap-3 tw-rounded-lg tw-border tw-border-solid tw-border-white/5 tw-bg-black/20 tw-p-3",
        className
      )}
      aria-describedby={descriptionId}
    >
      <legend className="tw-m-0 tw-text-sm tw-font-medium tw-text-iron-50">
        {t(DEFAULT_LOCALE, "waveChat.boostedDrops.display.label")}
      </legend>
      <p
        id={descriptionId}
        className="tw-m-0 tw-text-xs tw-leading-5 tw-text-iron-400"
      >
        {t(DEFAULT_LOCALE, "waveChat.boostedDrops.display.description")}
      </p>
      <div className="tw-grid tw-grid-cols-3 tw-gap-1.5">
        {BOOSTED_DROPS_DISPLAY_PREFERENCES.map((option) => {
          const selected = preference === option;
          const label = getBoostedDropsDisplayPreferenceLabel(option);

          return (
            <label key={option} className="tw-min-w-0">
              <input
                type="radio"
                name={groupName}
                value={option}
                checked={selected}
                onChange={() => setPreference(option)}
                className="tw-peer tw-sr-only"
              />
              <span
                className={clsx(
                  "tw-flex tw-min-h-9 tw-w-full tw-min-w-0 tw-cursor-pointer tw-items-center tw-justify-center tw-rounded-lg tw-border tw-border-solid tw-px-2 tw-text-center tw-text-xs tw-font-semibold tw-leading-4 tw-transition-colors tw-duration-200 peer-focus-visible:tw-outline peer-focus-visible:tw-outline-2 peer-focus-visible:tw-outline-offset-2 peer-focus-visible:tw-outline-primary-400",
                  selected
                    ? "tw-border-primary-500/40 tw-bg-primary-500/10 tw-text-primary-300"
                    : "tw-border-white/5 tw-bg-iron-950 tw-text-iron-300 desktop-hover:hover:tw-border-white/10 desktop-hover:hover:tw-bg-iron-900 desktop-hover:hover:tw-text-iron-100"
                )}
              >
                <span className="tw-min-w-0 tw-truncate">{label}</span>
              </span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
