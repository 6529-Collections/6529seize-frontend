import {
  dateFromMintNumber,
  displayedEonNumberFromIndex,
  displayedEpochNumberFromIndex,
  displayedEraNumberFromIndex,
  displayedPeriodNumberFromIndex,
  displayedSeasonNumberFromIndex,
  displayedYearNumberFromIndex,
  getSeasonIndexForDate,
} from "@/components/meme-calendar/meme-calendar.helpers";
import { getTheMemesRouteHrefWithLocale } from "@/components/the-memes/theMemesRouteParams";
import { formatInteger } from "@/i18n/format";
import { DEFAULT_LOCALE, type SupportedLocale } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import clsx from "clsx";
import Link from "next/link";

const SECONDARY_PERIOD_CLASS_NAME = "tw-hidden md:tw-flex";
const PERIOD_SEPARATOR_CLASS_NAME =
  "tw-text-xs tw-font-medium tw-text-iron-700";
const PRIMARY_PERIOD_CHIP_CLASS_NAME =
  "tw-inline-flex tw-min-h-6 tw-items-center tw-gap-1 tw-rounded-md tw-border tw-border-solid tw-border-iron-700 tw-bg-iron-900 tw-px-2.5 tw-py-0.5 tw-text-xs tw-font-semibold tw-leading-4 tw-text-iron-100";
const PRIMARY_PERIOD_CHIP_LINK_CLASS_NAME = `${PRIMARY_PERIOD_CHIP_CLASS_NAME} tw-no-underline tw-transition-colors hover:tw-border-primary-400 hover:tw-text-primary-300 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-primary-400`;
const SECONDARY_PERIOD_ITEM_CLASS_NAME =
  "tw-inline-flex tw-items-center tw-gap-1 tw-rounded-md tw-px-1.5 tw-py-0.5 tw-text-[10.5px] tw-font-medium tw-uppercase tw-tracking-wider tw-text-iron-500";

export default function MemeCalendarPeriods({
  id,
  locale = DEFAULT_LOCALE,
  seasonHref,
  yearHref,
  showOnlySeasonOnMobile = false,
}: {
  readonly id: number;
  readonly locale?: SupportedLocale | undefined;
  readonly seasonHref?: string | undefined;
  readonly yearHref?: string | undefined;
  readonly showOnlySeasonOnMobile?: boolean | undefined;
}) {
  const d = dateFromMintNumber(id);
  const idx = getSeasonIndexForDate(d);
  const eon = displayedEonNumberFromIndex(idx);
  const era = displayedEraNumberFromIndex(idx);
  const period = displayedPeriodNumberFromIndex(idx);
  const epoch = displayedEpochNumberFromIndex(idx);
  const year = displayedYearNumberFromIndex(idx);
  const szn = displayedSeasonNumberFromIndex(idx);
  const formattedSeason = formatInteger(locale, szn);
  const formattedYear = formatInteger(locale, year);

  const secondaryPeriodContent = (label: string, number: number) => (
    <>
      <span>{label}</span>
      <span className="tw-font-semibold tw-text-iron-300">
        {formatInteger(locale, number)}
      </span>
    </>
  );

  const printSecondaryPeriod = (label: string, number: number) => (
    <span className={SECONDARY_PERIOD_ITEM_CLASS_NAME}>
      {secondaryPeriodContent(label, number)}
    </span>
  );
  const secondaryPeriods = [
    {
      key: "year",
      label: t(locale, "memeCalendar.periods.year"),
      number: year,
    },
    {
      key: "epoch",
      label: t(locale, "memeCalendar.periods.epoch"),
      number: epoch,
    },
    {
      key: "period",
      label: t(locale, "memeCalendar.periods.period"),
      number: period,
    },
    { key: "era", label: t(locale, "memeCalendar.periods.era"), number: era },
    { key: "eon", label: t(locale, "memeCalendar.periods.eon"), number: eon },
  ];
  const seasonContent = (
    <>
      <span>{t(locale, "memeCalendar.periods.seasonShort")}</span>
      <span>{formattedSeason}</span>
    </>
  );

  const secondaryPeriodVisibilityClassName = showOnlySeasonOnMobile
    ? SECONDARY_PERIOD_CLASS_NAME
    : undefined;
  const seasonLinkHref =
    seasonHref === undefined
      ? undefined
      : getTheMemesRouteHrefWithLocale({ href: seasonHref, locale });
  const yearLinkHref =
    yearHref === undefined
      ? undefined
      : getTheMemesRouteHrefWithLocale({ href: yearHref, locale });

  return (
    <span className="tw-flex tw-flex-wrap tw-items-center tw-gap-2">
      {seasonHref ? (
        <Link
          href={seasonLinkHref ?? seasonHref}
          aria-label={t(locale, "memeCalendar.periods.seasonLinkAriaLabel", {
            season: formattedSeason,
          })}
          className={PRIMARY_PERIOD_CHIP_LINK_CLASS_NAME}
        >
          {seasonContent}
        </Link>
      ) : (
        <span className={PRIMARY_PERIOD_CHIP_CLASS_NAME}>{seasonContent}</span>
      )}
      <span
        aria-hidden="true"
        className={clsx(
          PERIOD_SEPARATOR_CLASS_NAME,
          secondaryPeriodVisibilityClassName
        )}
      >
        /
      </span>
      <span
        aria-label={t(locale, "memeCalendar.periods.positionLabel")}
        role="group"
        className={clsx(
          "tw-flex-wrap tw-items-center tw-gap-1.5",
          secondaryPeriodVisibilityClassName
        )}
      >
        {secondaryPeriods.map(({ key, label, number }, index) => (
          <span key={key} className="tw-inline-flex tw-items-center tw-gap-1.5">
            {index > 0 && (
              <span aria-hidden="true" className={PERIOD_SEPARATOR_CLASS_NAME}>
                /
              </span>
            )}
            {key === "year" && yearLinkHref !== undefined ? (
              <Link
                href={yearLinkHref}
                aria-label={t(
                  locale,
                  "memeCalendar.periods.yearLinkAriaLabel",
                  {
                    year: formattedYear,
                  }
                )}
                className={PRIMARY_PERIOD_CHIP_LINK_CLASS_NAME}
              >
                {secondaryPeriodContent(label, number)}
              </Link>
            ) : (
              printSecondaryPeriod(label, number)
            )}
          </span>
        ))}
      </span>
    </span>
  );
}
