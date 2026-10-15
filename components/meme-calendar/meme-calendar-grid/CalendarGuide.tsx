import type { SupportedLocale } from "@/i18n/locales";
import { t } from "@/i18n/messages";

import type { DisplayTz } from "../meme-calendar.helpers";
import { formatMintWeekdaysInZone, GRID_INFO_ITEMS } from "./calendarText";

interface CalendarGuideItemProps {
  readonly label: string;
  readonly text: string;
  readonly note?: string | undefined;
}

function CalendarGuideItem({ label, text, note }: CalendarGuideItemProps) {
  return (
    <div className="tw-min-w-0 tw-border-0 tw-border-b tw-border-solid tw-border-iron-800 tw-py-4 first:tw-pt-0 last:tw-border-b-0 last:tw-pb-0">
      <dt className="tw-text-[11px] tw-font-semibold tw-uppercase tw-leading-4 tw-tracking-[0.14em] tw-text-iron-500">
        {label}
      </dt>
      <dd className="tw-m-0 tw-mt-1 tw-text-sm tw-leading-5 tw-text-iron-200">
        {text} {note && <span className="tw-text-iron-500">{note}</span>}
      </dd>
    </div>
  );
}

interface CalendarGuideProps {
  readonly displayTz: DisplayTz;
  readonly hidden: boolean;
  readonly locale: SupportedLocale;
  /** IANA zone whose calendar dates the grid shows. */
  readonly timeZone: string;
}

/**
 * The calendar guide. Minting days are UTC days; in local mode the guide also
 * names the viewer's weekdays for them, which differ east of UTC. That reads
 * the viewer's zone and clock, so the guide renders only on the client, inside
 * the client-only grid.
 */
export function CalendarGuide({
  displayTz,
  hidden,
  locale,
  timeZone,
}: CalendarGuideProps) {
  const localMintingDays =
    displayTz === "local"
      ? t(locale, "memeCalendar.grid.info.mintingDays.local", {
          days: formatMintWeekdaysInZone(locale, timeZone, new Date()),
        })
      : undefined;

  return (
    <section
      id="meme-calendar-info"
      aria-label={t(locale, "memeCalendar.grid.info.panelLabel")}
      className="tw-mb-5 tw-rounded-2xl tw-bg-iron-950 tw-p-5 tw-text-sm tw-leading-5 tw-text-iron-300 tw-shadow-lg tw-ring-1 tw-ring-iron-800 sm:tw-p-6"
      hidden={hidden}
    >
      <dl className="tw-m-0 tw-flex tw-flex-col">
        <CalendarGuideItem
          label={t(locale, "memeCalendar.grid.info.mintingDays.label")}
          text={t(locale, "memeCalendar.grid.info.mintingDays.text")}
          note={localMintingDays}
        />
        {GRID_INFO_ITEMS.map(({ label, text, note }) => (
          <CalendarGuideItem
            key={label}
            label={t(locale, label)}
            text={t(locale, text)}
            note={note ? t(locale, note) : undefined}
          />
        ))}
      </dl>
    </section>
  );
}
