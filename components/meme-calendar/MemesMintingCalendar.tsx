"use client";

import type { CommonSelectItem } from "@/components/utils/select/CommonSelect";
import CommonTabs from "@/components/utils/select/tabs/CommonTabs";
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
  const timezoneItems: readonly CommonSelectItem<DisplayTz>[] = [
    {
      key: "local",
      label: t(locale, "memeCalendar.timezone.local"),
      value: "local",
    },
    {
      key: "utc",
      label: t(locale, "memeCalendar.timezone.utc"),
      value: "utc",
    },
  ];

  const timezoneToggle = (
    <div className="tw-w-fit tw-max-w-full">
      <CommonTabs<DisplayTz>
        items={timezoneItems}
        activeItem={displayTz}
        filterLabel={t(locale, "memeCalendar.timezone.regionLabel")}
        setSelected={setDisplayTz}
        size="sm"
        fill={false}
        activeTone="primary"
      />
    </div>
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
