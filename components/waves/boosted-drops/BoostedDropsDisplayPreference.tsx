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

const getBoostedDropsDisplayPreferenceLabel = (
  preference: BoostedDropsDisplayPreference
): string => t(DEFAULT_LOCALE, BOOSTED_DROPS_DISPLAY_LABEL_KEYS[preference]);

const getBoostedDropsDisplayPreferenceMenuLabel = (
  preference: BoostedDropsDisplayPreference
): string =>
  t(DEFAULT_LOCALE, "waveChat.boostedDrops.display.menuCurrent", {
    mode: getBoostedDropsDisplayPreferenceLabel(preference),
  });

function ExpandedPreview() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 34 22"
      fill="none"
      className="tw-h-5 tw-w-[1.9375rem]"
      stroke="currentColor"
      strokeWidth="1.5"
    >
      <rect x="1.5" y="1.5" width="31" height="19" rx="3" />
      <circle cx="7" cy="7" r="2.2" fill="currentColor" stroke="none" />
      <path d="M12 6h15M12 10h11M4 15h26" opacity="0.65" />
    </svg>
  );
}

function CompactPreview() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 34 22"
      fill="none"
      className="tw-h-5 tw-w-[1.9375rem]"
      stroke="currentColor"
      strokeWidth="1.5"
    >
      <rect x="4" y="7" width="26" height="8" rx="2" />
      <circle cx="8.5" cy="11" r="1.6" fill="currentColor" stroke="none" />
      <path d="M12 11h13" />
    </svg>
  );
}

function HiddenPreview() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 34 22"
      fill="none"
      className="tw-h-5 tw-w-[1.9375rem]"
      stroke="currentColor"
      strokeWidth="1.5"
    >
      <rect
        x="4"
        y="7"
        width="26"
        height="8"
        rx="2"
        strokeDasharray="3 3"
        opacity="0.65"
      />
      <path d="m3 3 28 16" strokeWidth="1.6" />
    </svg>
  );
}

const BOOSTED_DROPS_DISPLAY_PREVIEWS = {
  expanded: ExpandedPreview,
  compact: CompactPreview,
  hidden: HiddenPreview,
} satisfies Record<BoostedDropsDisplayPreference, typeof ExpandedPreview>;

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
        "tw-m-0 tw-flex tw-min-w-0 tw-flex-col tw-gap-3 tw-rounded-lg tw-border tw-border-solid tw-border-white/5 tw-bg-white/[0.015] tw-p-3",
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
      <div className="tw-grid tw-grid-cols-3 tw-gap-2">
        {BOOSTED_DROPS_DISPLAY_PREFERENCES.map((option) => {
          const selected = preference === option;
          const label = getBoostedDropsDisplayPreferenceLabel(option);
          const Preview = BOOSTED_DROPS_DISPLAY_PREVIEWS[option];

          return (
            <label
              key={option}
              className="tw-relative tw-flex tw-min-w-0 tw-cursor-pointer"
            >
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
                  "tw-flex tw-w-full tw-min-w-0 tw-flex-col tw-items-center tw-justify-center tw-gap-1 tw-rounded-lg tw-border tw-border-solid tw-px-2 tw-py-2.5 tw-text-center tw-transition-colors tw-duration-200 peer-focus-visible:tw-ring-2 peer-focus-visible:tw-ring-primary-400 peer-focus-visible:tw-ring-offset-2 peer-focus-visible:tw-ring-offset-iron-950",
                  selected
                    ? "tw-border-primary-400 tw-bg-primary-500/[0.08] tw-text-primary-300"
                    : "tw-border-white/10 tw-bg-white/[0.015] tw-text-iron-400 desktop-hover:hover:tw-border-white/20 desktop-hover:hover:tw-bg-white/[0.04] desktop-hover:hover:tw-text-iron-200"
                )}
              >
                <Preview />
                <span className="tw-min-w-0 tw-truncate tw-text-xs tw-font-medium tw-leading-4">
                  {label}
                </span>
              </span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
