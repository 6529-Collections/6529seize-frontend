"use client";

import {
  Combobox,
  ComboboxInput,
  ComboboxOption,
  ComboboxOptions,
} from "@headlessui/react";
import { MagnifyingGlassIcon } from "@heroicons/react/24/outline";
import { useEffect, useId, useMemo, useState } from "react";
import { describeDisplayTimeZone } from "@/components/display-time-zone/displayTimeZoneChoices";
import PreferenceRadioOption from "@/components/preferences/PreferenceRadioOption";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { useHasHydrated } from "@/hooks/useHasHydrated";
import { useDisplayTimeZoneState } from "@/hooks/useDisplayTimeZone";
import { t } from "@/i18n/messages";
import {
  getTimeZoneCityName,
  getTimeZoneShortName,
  LOCAL_TIME_ZONE_PREFERENCE,
  resolveDisplayTimeZone,
  UTC_TIME_ZONE_PREFERENCE,
  type DisplayTimeZonePreference,
} from "@/lib/display-time-zone/displayTimeZone";
import { searchTimeZones } from "@/lib/display-time-zone/timeZoneSearch";
import { formatZonedClockTime } from "@/lib/display-time-zone/waveDropTimeFormat";

type OptionKind = "local" | "utc" | "other";

const CLOCK_REFRESH_MS = 30_000;

function getOptionKind(preference: DisplayTimeZonePreference): OptionKind {
  if (preference === LOCAL_TIME_ZONE_PREFERENCE) return "local";
  if (preference === UTC_TIME_ZONE_PREFERENCE) return "utc";
  return "other";
}

/** Re-renders every 30 seconds so "now" times in the options stay current. */
function useNow(): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = globalThis.setInterval(
      () => setNow(Date.now()),
      CLOCK_REFRESH_MS
    );
    return () => globalThis.clearInterval(id);
  }, []);
  return now;
}

/**
 * Preferences > Time Zone. The choice is saved on this device only and works
 * signed out, since waves can be read without an account. It shows "now" in
 * several zones, which the server cannot know, so it renders after hydration.
 */
export default function TimeZonePreferencesSettings() {
  const locale = useBrowserLocale();
  const hasHydrated = useHasHydrated();
  if (!hasHydrated) {
    return (
      <output
        aria-label={t(locale, "displayTimeZone.loading")}
        className="tw-flex tw-min-h-32 tw-items-center tw-justify-center tw-rounded-2xl tw-border tw-border-solid tw-border-iron-800 tw-bg-iron-950"
      >
        <span className="tw-size-6 tw-animate-spin tw-rounded-full tw-border-2 tw-border-iron-600 tw-border-t-primary-400 motion-reduce:tw-animate-none" />
      </output>
    );
  }
  return <TimeZonePreferencesCard />;
}

function TimeZonePreferencesCard() {
  const locale = useBrowserLocale();
  const now = useNow();
  const state = useDisplayTimeZoneState();
  const { preference, deviceTimeZone } = state;
  // "Another time zone" can be picked before a zone is chosen; until then
  // the saved setting stays in effect.
  const [isChoosingOther, setIsChoosingOther] = useState(false);
  const kind: OptionKind = isChoosingOther
    ? "other"
    : getOptionKind(preference);
  const [query, setQuery] = useState("");
  const [announcement, setAnnouncement] = useState("");
  const headingId = useId();
  const searchId = useId();

  const describe = (value: DisplayTimeZonePreference) =>
    describeDisplayTimeZone(value, { locale, deviceTimeZone, now });
  const local = describe(LOCAL_TIME_ZONE_PREFERENCE);
  const utc = describe(UTC_TIME_ZONE_PREFERENCE);
  const savedZone =
    getOptionKind(preference) === "other" ? describe(preference) : null;
  const results = useMemo(() => searchTimeZones(query), [query]);

  const save = (value: DisplayTimeZonePreference) => {
    state.setPreference(value);
    setAnnouncement(
      t(locale, "displayTimeZone.announce", { zone: describe(value).name })
    );
  };

  const localDescription = deviceTimeZone
    ? t(locale, "displayTimeZone.option.local.description", {
        zone: getTimeZoneCityName(deviceTimeZone),
        time: local.timeNow,
      })
    : t(locale, "displayTimeZone.option.local.descriptionUnknown", {
        time: local.timeNow,
      });
  const otherDescription = savedZone
    ? t(locale, "displayTimeZone.option.other.selected", {
        zone: `${savedZone.label} (${preference})`,
        time: savedZone.timeNow,
      })
    : t(locale, "displayTimeZone.option.other.description");
  const preview = formatZonedClockTime(new Date(now), {
    zone: resolveDisplayTimeZone(state.effectivePreference, deviceTimeZone),
  });

  return (
    <section
      aria-labelledby={headingId}
      className="tw-overflow-hidden tw-rounded-2xl tw-border tw-border-solid tw-border-iron-800/80 tw-bg-iron-900/70 tw-px-4 tw-py-6 tw-shadow-sm tw-shadow-black/20 sm:tw-px-6 lg:tw-px-8"
    >
      <h2
        id={headingId}
        className="tw-m-0 tw-text-lg tw-font-medium tw-text-iron-100"
      >
        {t(locale, "displayTimeZone.settings.heading")}
      </h2>
      <p className="tw-mb-0 tw-mt-1 tw-max-w-2xl tw-text-sm tw-text-iron-400">
        {t(locale, "displayTimeZone.settings.description")}
      </p>
      <fieldset className="tw-m-0 tw-mt-6 tw-min-w-0 tw-max-w-2xl tw-border-0 tw-p-0">
        <legend className="tw-sr-only">
          {t(locale, "displayTimeZone.settings.heading")}
        </legend>
        <div className="tw-space-y-3">
          <PreferenceRadioOption
            name="display-time-zone"
            value="local"
            checked={kind === "local"}
            label={local.label}
            description={localDescription}
            onChange={() => {
              setIsChoosingOther(false);
              save(LOCAL_TIME_ZONE_PREFERENCE);
            }}
          />
          <PreferenceRadioOption
            name="display-time-zone"
            value="utc"
            checked={kind === "utc"}
            label={utc.label}
            description={t(locale, "displayTimeZone.option.utc.description", {
              time: utc.timeNow,
            })}
            onChange={() => {
              setIsChoosingOther(false);
              save(UTC_TIME_ZONE_PREFERENCE);
            }}
          />
          <PreferenceRadioOption
            name="display-time-zone"
            value="other"
            checked={kind === "other"}
            label={t(locale, "displayTimeZone.option.other")}
            description={otherDescription}
            onChange={() => setIsChoosingOther(true)}
          />
        </div>
        {kind === "other" && (
          <div className="tw-mt-3 tw-pl-0 sm:tw-pl-11">
            <label
              htmlFor={searchId}
              className="tw-mb-1.5 tw-block tw-text-xs tw-font-medium tw-text-iron-300"
            >
              {t(locale, "displayTimeZone.search.label")}
            </label>
            <Combobox
              value={null}
              onChange={(zone: string | null) => {
                if (zone) {
                  setIsChoosingOther(false);
                  save(zone);
                  setQuery("");
                }
              }}
              immediate
            >
              <div className="tw-relative">
                <MagnifyingGlassIcon
                  aria-hidden="true"
                  className="tw-pointer-events-none tw-absolute tw-left-3 tw-top-1/2 tw-size-4 -tw-translate-y-1/2 tw-text-iron-400"
                />
                <ComboboxInput
                  id={searchId}
                  autoComplete="off"
                  placeholder={t(locale, "displayTimeZone.search.placeholder")}
                  onChange={(event) => setQuery(event.target.value)}
                  className="tw-min-h-11 tw-w-full tw-rounded-lg tw-border tw-border-solid tw-border-white/10 tw-bg-iron-900 tw-py-2 tw-pl-9 tw-pr-3 tw-text-sm tw-text-iron-50 placeholder:tw-text-iron-500 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-primary-400"
                />
              </div>
              {query.trim().length > 0 && (
                <ComboboxOptions
                  anchor="bottom start"
                  modal={false}
                  className="tailwind-scope tw-z-50 tw-max-h-72 tw-w-[var(--input-width)] tw-overflow-auto tw-rounded-lg tw-bg-iron-900 tw-p-1 tw-text-sm tw-text-iron-100 tw-shadow-lg tw-ring-1 tw-ring-white/10 [--anchor-gap:0.5rem] focus:tw-outline-none"
                >
                  {results.length === 0 ? (
                    <div className="tw-px-3 tw-py-3 tw-text-sm tw-text-iron-300">
                      {t(locale, "displayTimeZone.search.empty", {
                        query: query.trim(),
                      })}
                    </div>
                  ) : (
                    results.map((zone) => (
                      <ComboboxOption
                        key={zone}
                        value={zone}
                        className="tw-flex tw-min-h-12 tw-cursor-pointer tw-items-center tw-justify-between tw-gap-3 tw-rounded-md tw-px-3 tw-py-2 data-[focus]:tw-bg-iron-800 data-[focus]:tw-ring-2 data-[focus]:tw-ring-inset data-[focus]:tw-ring-primary-400"
                      >
                        <span className="tw-min-w-0">
                          <span className="tw-block tw-truncate tw-text-sm tw-font-medium tw-text-iron-50">
                            {getTimeZoneCityName(zone)}
                          </span>
                          <span className="tw-block tw-truncate tw-text-xs tw-text-iron-400">
                            {zone} ·{" "}
                            {getTimeZoneShortName(locale, zone, new Date(now))}
                          </span>
                        </span>
                        <span className="tw-flex-shrink-0 tw-whitespace-nowrap tw-text-xs tw-tabular-nums tw-text-iron-300">
                          {formatZonedClockTime(new Date(now), {
                            zone: { timeZone: zone, isLocal: true },
                          })}
                        </span>
                      </ComboboxOption>
                    ))
                  )}
                </ComboboxOptions>
              )}
            </Combobox>
          </div>
        )}
      </fieldset>
      <p className="tw-mb-0 tw-mt-5 tw-flex tw-max-w-2xl tw-flex-wrap tw-items-center tw-gap-x-3 tw-gap-y-1 tw-rounded-lg tw-border tw-border-dashed tw-border-iron-700 tw-px-3 tw-py-2.5 tw-text-sm">
        <span className="tw-text-[11px] tw-font-semibold tw-uppercase tw-tracking-wider tw-text-iron-500">
          {t(locale, "displayTimeZone.preview.label")}
        </span>
        <span className="tw-tabular-nums tw-text-white/60">{preview}</span>
      </p>
      <p className="tw-mb-0 tw-mt-4 tw-max-w-2xl tw-text-xs tw-leading-5 tw-text-iron-500">
        {t(locale, "displayTimeZone.footnote")}
      </p>
      <span role="status" aria-live="polite" className="tw-sr-only">
        {announcement}
      </span>
    </section>
  );
}
