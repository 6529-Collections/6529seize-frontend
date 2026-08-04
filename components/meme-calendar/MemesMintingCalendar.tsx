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
    "tw-inline-flex tw-h-6 tw-items-center tw-justify-center tw-rounded-md tw-border-0 tw-px-2.5 tw-text-xs tw-font-medium tw-leading-none tw-transition tw-duration-300 tw-ease-out focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-primary-400";

  const activeBtn = "tw-bg-iron-800 tw-text-iron-50";

  const inactiveBtn =
    "tw-bg-iron-950 tw-text-iron-400 desktop-hover:hover:tw-text-iron-300";

  const timezoneToggle = (
    <fieldset className="tw-m-0 tw-inline-flex tw-h-8 tw-min-w-0 tw-items-center tw-overflow-hidden tw-whitespace-nowrap tw-rounded-lg tw-border tw-border-solid tw-border-iron-700 tw-bg-iron-950 tw-p-1 tw-text-xs">
      <legend className="tw-sr-only">
        {t(locale, "memeCalendar.timezone.regionLabel")}
      </legend>
      <button
        className={`${baseBtn} ${
          displayTz === "local" ? activeBtn : inactiveBtn
        }`}
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
        }`}
        aria-label={t(locale, "memeCalendar.timezone.showUtc")}
        aria-pressed={displayTz === "utc"}
        onClick={() => setDisplayTz("utc")}
        title={t(locale, "memeCalendar.timezone.showUtc")}
        type="button"
      >
        {t(locale, "memeCalendar.timezone.utc")}
      </button>
    </fieldset>
  );

  return (
    <div className="tw-flex tw-min-w-0 tw-flex-col tw-gap-8 sm:tw-gap-10">
      <div className="tw-w-full">
        <MemeCalendarOverview
          displayTz={displayTz}
          headerAction={timezoneToggle}
          locale={locale}
        />
      </div>
      <div className="tw-w-full">
        <MemeCalendar displayTz={displayTz} locale={locale} />
      </div>
    </div>
  );
}
