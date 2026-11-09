"use client";

import { Popover, PopoverButton, PopoverPanel } from "@headlessui/react";
import { ChevronRightIcon, ClockIcon } from "@heroicons/react/24/outline";
import { XMarkIcon } from "@heroicons/react/20/solid";
import clsx from "clsx";
import Link from "next/link";
import { useState } from "react";
import type { CompactMenuItem } from "@/components/compact-menu";
import {
  describeDisplayTimeZone,
  getAlternativeDisplayTimeZone,
  type DisplayTimeZoneChoice,
} from "@/components/display-time-zone/displayTimeZoneChoices";
import { getPreferencesHref } from "@/helpers/preferences-navigation";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import {
  useDisplayTimeZoneState,
  type DisplayTimeZoneState,
} from "@/hooks/useDisplayTimeZone";
import type { SupportedLocale } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import {
  getTimeZoneCityName,
  LOCAL_TIME_ZONE_PREFERENCE,
  UTC_TIME_ZONE_PREFERENCE,
  type DisplayTimeZonePreference,
} from "@/lib/display-time-zone/displayTimeZone";

const HEADER_BUTTON_CLASSES =
  "tw-flex tw-h-8 tw-w-8 tw-items-center tw-justify-center tw-rounded-lg tw-border-0 tw-bg-iron-900 tw-text-iron-200 tw-ring-1 tw-ring-inset tw-ring-white/5 tw-transition-colors tw-duration-150 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-primary-400 data-[open]:tw-bg-iron-800 data-[open]:tw-text-white desktop-hover:hover:tw-bg-iron-800 desktop-hover:hover:tw-text-white desktop-hover:hover:tw-ring-white/10";

const APP_BUTTON_CLASSES =
  "tw-flex tw-size-9 tw-flex-shrink-0 tw-items-center tw-justify-center tw-rounded-lg tw-border-0 tw-bg-black tw-text-iron-300 tw-shadow-sm tw-transition tw-duration-300 tw-ease-out focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-primary-400 data-[open]:tw-text-iron-50 hover:tw-text-iron-50";

const CHIP_CLASSES =
  "tw-flex tw-h-8 tw-items-center tw-rounded-full tw-border tw-border-solid tw-border-primary-400/45 tw-bg-primary-500/15 tw-text-xs tw-font-semibold tw-text-primary-300";

const CHIP_PART_CLASSES =
  "tw-flex tw-h-full tw-items-center tw-border-0 tw-bg-transparent tw-text-primary-300 tw-transition-colors focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-primary-400 desktop-hover:hover:tw-bg-primary-500/20";

interface SwitchChoices {
  readonly setting: DisplayTimeZoneChoice;
  readonly alternative: DisplayTimeZoneChoice;
  readonly current: DisplayTimeZoneChoice;
  readonly isOverridden: boolean;
}

function getSwitchChoices(
  state: DisplayTimeZoneState,
  locale: SupportedLocale
): SwitchChoices {
  const options = { locale, deviceTimeZone: state.deviceTimeZone };
  const setting = describeDisplayTimeZone(state.preference, options);
  const alternative = describeDisplayTimeZone(
    getAlternativeDisplayTimeZone(state.preference),
    options
  );
  const isOverridden = state.override !== null;
  const current = isOverridden
    ? describeDisplayTimeZone(state.effectivePreference, options)
    : setting;
  return { setting, alternative, current, isOverridden };
}

function choiceDescription(
  choice: DisplayTimeZoneChoice,
  locale: SupportedLocale,
  deviceTimeZone: string | undefined
): string {
  if (choice.preference === UTC_TIME_ZONE_PREFERENCE) {
    return t(locale, "displayTimeZone.switch.sameForEveryone", {
      time: choice.timeNow,
    });
  }
  if (choice.preference === LOCAL_TIME_ZONE_PREFERENCE && deviceTimeZone) {
    return `${getTimeZoneCityName(deviceTimeZone)} · ${choice.timeNow}`;
  }
  return choice.timeNow;
}

function SwitchOption({
  name,
  choice,
  title,
  description,
  checked,
  onSelect,
}: {
  readonly name: string;
  readonly choice: DisplayTimeZoneChoice;
  readonly title: string;
  readonly description: string;
  readonly checked: boolean;
  readonly onSelect: (preference: DisplayTimeZonePreference) => void;
}) {
  return (
    <label
      className={clsx(
        "tw-flex tw-cursor-pointer tw-items-start tw-gap-3 tw-rounded-lg tw-border tw-border-solid tw-px-3 tw-py-2.5 tw-transition-colors has-[:focus-visible]:tw-ring-2 has-[:focus-visible]:tw-ring-primary-400",
        checked
          ? "tw-border-primary-400/45 tw-bg-primary-500/10"
          : "tw-border-transparent desktop-hover:hover:tw-bg-iron-800"
      )}
    >
      <input
        type="radio"
        name={name}
        value={choice.preference}
        checked={checked}
        onChange={() => onSelect(choice.preference)}
        className="tw-mt-0.5 tw-size-4 tw-flex-shrink-0 tw-accent-primary-400"
      />
      <span className="tw-min-w-0">
        <span className="tw-block tw-text-sm tw-font-semibold tw-text-iron-50">
          {title}
        </span>
        <span className="tw-block tw-text-xs tw-tabular-nums tw-text-iron-400">
          {description}
        </span>
      </span>
    </label>
  );
}

/**
 * The wave header time switch. It shows times in UTC (or back in local time)
 * for this tab only, and turns into a "Times in UTC" chip with an undo button
 * while it is on. Variants: `header` for the wave header, `app` for the
 * mobile app header (short chip), and `compact` for compact wave headers,
 * where only the chip renders and the switch itself lives in the overflow
 * menu (see `useDisplayTimeZoneMenuItem`).
 */
export default function DisplayTimeZoneSwitch({
  variant = "header",
  tooltipId,
}: {
  readonly variant?: "header" | "app" | "compact" | undefined;
  readonly tooltipId?: string | undefined;
}) {
  const locale = useBrowserLocale();
  const state = useDisplayTimeZoneState();
  const [announcement, setAnnouncement] = useState("");
  const { setting, alternative, current, isOverridden } = getSwitchChoices(
    state,
    locale
  );
  const radioName = "display-time-zone-switch";

  const select = (preference: DisplayTimeZonePreference) => {
    const next = preference === state.preference ? null : preference;
    state.setOverride(next);
    const nextChoice = next === null ? setting : alternative;
    setAnnouncement(
      t(locale, "displayTimeZone.announce", { zone: nextChoice.name })
    );
  };

  if (variant === "compact" && !isOverridden) {
    return <AnnouncementRegion text={announcement} />;
  }

  const switchLabel = t(locale, "displayTimeZone.switch.label", {
    zone: current.name,
  });
  const isNamedZoneSetting =
    state.preference !== LOCAL_TIME_ZONE_PREFERENCE &&
    state.preference !== UTC_TIME_ZONE_PREFERENCE;
  const settingTitle = isNamedZoneSetting
    ? t(locale, "displayTimeZone.switch.setting", { zone: setting.label })
    : setting.label;

  return (
    <div className="tw-flex tw-flex-shrink-0 tw-items-center">
      <Popover className="tw-relative tw-flex">
        {isOverridden ? (
          <span className={CHIP_CLASSES}>
            <PopoverButton
              aria-label={switchLabel}
              className={`${CHIP_PART_CLASSES} tw-gap-1.5 tw-rounded-l-full tw-pl-2.5 tw-pr-1.5`}
            >
              <ClockIcon aria-hidden="true" className="tw-size-4" />
              <span className="tw-whitespace-nowrap">
                {variant === "header"
                  ? t(locale, "displayTimeZone.chip.label", {
                      zone: current.name,
                    })
                  : current.name}
              </span>
            </PopoverButton>
            <button
              type="button"
              onClick={() => select(state.preference)}
              aria-label={t(locale, "displayTimeZone.chip.reset", {
                zone: setting.name,
              })}
              className={`${CHIP_PART_CLASSES} tw-w-8 tw-justify-center tw-rounded-r-full`}
            >
              <XMarkIcon aria-hidden="true" className="tw-size-4" />
            </button>
          </span>
        ) : (
          <PopoverButton
            aria-label={switchLabel}
            {...(tooltipId
              ? {
                  "data-tooltip-id": tooltipId,
                  "data-tooltip-content": switchLabel,
                }
              : {})}
            className={
              variant === "app" ? APP_BUTTON_CLASSES : HEADER_BUTTON_CLASSES
            }
          >
            <ClockIcon
              aria-hidden="true"
              className={
                variant === "app"
                  ? "tw-size-5 tw-flex-shrink-0"
                  : "tw-h-4 tw-w-4 tw-flex-shrink-0"
              }
            />
          </PopoverButton>
        )}
        <PopoverPanel
          anchor={{ to: "bottom end", gap: 8, padding: 16 }}
          className="tailwind-scope tw-z-[1030] tw-w-80 tw-max-w-[calc(100vw-2rem)] tw-rounded-xl tw-border tw-border-solid tw-border-white/10 tw-bg-iron-950 tw-p-3 tw-shadow-xl tw-shadow-black/60"
        >
          <fieldset className="tw-m-0 tw-min-w-0 tw-border-0 tw-p-0">
            <legend className="tw-mb-2 tw-px-1 tw-text-sm tw-font-semibold tw-text-iron-100">
              {t(locale, "displayTimeZone.switch.heading")}
            </legend>
            <div className="tw-space-y-1">
              <SwitchOption
                name={radioName}
                choice={setting}
                title={settingTitle}
                description={choiceDescription(
                  setting,
                  locale,
                  state.deviceTimeZone
                )}
                checked={!isOverridden}
                onSelect={select}
              />
              <SwitchOption
                name={radioName}
                choice={alternative}
                title={alternative.label}
                description={choiceDescription(
                  alternative,
                  locale,
                  state.deviceTimeZone
                )}
                checked={isOverridden}
                onSelect={select}
              />
            </div>
          </fieldset>
          <p className="tw-mb-0 tw-mt-3 tw-border-0 tw-border-t tw-border-solid tw-border-iron-800 tw-px-1 tw-pt-3 tw-text-xs tw-leading-5 tw-text-iron-400">
            {t(locale, "displayTimeZone.switch.note")}
          </p>
          <Link
            href={getPreferencesHref({ tab: "time-zone" })}
            className="tw-mt-1 tw-inline-flex tw-min-h-9 tw-items-center tw-gap-1 tw-rounded-md tw-px-1 tw-text-xs tw-font-semibold tw-text-primary-300 tw-no-underline focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-primary-400 desktop-hover:hover:tw-text-primary-400"
          >
            {t(locale, "displayTimeZone.switch.preferencesLink")}
            <ChevronRightIcon aria-hidden="true" className="tw-size-3.5" />
          </Link>
        </PopoverPanel>
      </Popover>
      <AnnouncementRegion text={announcement} />
    </div>
  );
}

function AnnouncementRegion({ text }: { readonly text: string }) {
  return (
    <span role="status" aria-live="polite" className="tw-sr-only">
      {text}
    </span>
  );
}

/**
 * The overflow-menu entry for compact headers and the app header: one tap
 * switches to UTC (or local time) for this tab, a second tap switches back.
 */
export function useDisplayTimeZoneMenuItem(): CompactMenuItem {
  const locale = useBrowserLocale();
  const state = useDisplayTimeZoneState();
  const { setting, alternative, isOverridden } = getSwitchChoices(
    state,
    locale
  );

  if (isOverridden) {
    return {
      id: "display-time-zone",
      label: t(locale, "displayTimeZone.menu.reset", { zone: setting.name }),
      icon: <ClockIcon className="tw-h-4 tw-w-4 tw-flex-shrink-0" />,
      onSelect: () => state.setOverride(null),
    };
  }
  return {
    id: "display-time-zone",
    label: t(
      locale,
      alternative.preference === UTC_TIME_ZONE_PREFERENCE
        ? "displayTimeZone.menu.useUtc"
        : "displayTimeZone.menu.useLocal"
    ),
    icon: <ClockIcon className="tw-h-4 tw-w-4 tw-flex-shrink-0" />,
    onSelect: () => state.setOverride(alternative.preference),
  };
}
