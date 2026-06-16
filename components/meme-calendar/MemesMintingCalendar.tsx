"use client";
import { DEFAULT_LOCALE, type SupportedLocale } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import { useState } from "react";
import type { DisplayTz } from "./meme-calendar.helpers";
import MemeCalendar from "./MemeCalendar";
import MemeCalendarOverview from "./MemeCalendarOverview";

export default function MemesMintingCalendar({
  locale = DEFAULT_LOCALE,
}: {
  readonly locale?: SupportedLocale | undefined;
}) {
  const [displayTz, setDisplayTz] = useState<DisplayTz>("local");

  const baseBtn =
    "tw-min-h-8 tw-px-4 tw-py-1.5 tw-text-sm tw-font-medium tw-border tw-transition-colors tw-duration-200 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-primary-400";

  const activeBtn =
    "tw-bg-blue-600 tw-text-white tw-border-blue-500 hover:tw-bg-blue-700";

  const inactiveBtn =
    "tw-bg-transparent tw-text-gray-300 tw-border-gray-600 hover:tw-bg-gray-700 hover:tw-text-white";

  return (
    <div className="tw-flex tw-flex-col tw-gap-3">
      {/* Global Local/UTC toggle */}
      <div className="tw-flex tw-justify-end">
        <fieldset className="tw-m-0 tw-inline-flex tw-border-0 tw-p-0">
          <legend className="tw-sr-only">
            {t(locale, "memeCalendar.timezone.regionLabel")}
          </legend>
          <button
            className={`${baseBtn} ${
              displayTz === "local" ? activeBtn : inactiveBtn
            } tw-rounded-l-md tw-border-r-0`}
            aria-label={t(locale, "memeCalendar.timezone.showLocal")}
            aria-pressed={displayTz === "local"}
            onClick={() => setDisplayTz("local")}
            title={t(locale, "memeCalendar.timezone.showLocal")}
            type="button"
          >
            {t(locale, "memeCalendar.timezone.local")}
          </button>
          <button
            className={`${baseBtn} ${
              displayTz === "utc" ? activeBtn : inactiveBtn
            } tw-rounded-r-md`}
            aria-label={t(locale, "memeCalendar.timezone.showUtc")}
            aria-pressed={displayTz === "utc"}
            onClick={() => setDisplayTz("utc")}
            title={t(locale, "memeCalendar.timezone.showUtc")}
            type="button"
          >
            {t(locale, "memeCalendar.timezone.utc")}
          </button>
        </fieldset>
      </div>

      <div className="tw-flex tw-flex-wrap tw-gap-8">
        <div className="tw-w-full">
          <MemeCalendarOverview displayTz={displayTz} locale={locale} />
        </div>
        <div className="tw-w-full">
          <MemeCalendar displayTz={displayTz} locale={locale} />
        </div>
      </div>
    </div>
  );
}
