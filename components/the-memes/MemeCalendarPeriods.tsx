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
import clsx from "clsx";
import Link from "next/link";

const PERIOD_SEPARATOR_CLASS_NAME = "tw-text-iron-500";
const SECONDARY_PERIOD_TEXT_CLASS_NAME = "tw-text-iron-500";
const SECONDARY_PERIOD_CLASS_NAME = "tw-hidden md:tw-inline";

export default function MemeCalendarPeriods({
  id,
  seasonHref,
  showOnlySeasonOnMobile = false,
}: {
  readonly id: number;
  readonly seasonHref?: string | undefined;
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

  const printPeriod = (
    label: string,
    number: number,
    href?: string,
    className?: string
  ) => {
    const content = (
      <span className={clsx("tw-whitespace-nowrap", className)}>
        <span>{label}</span> <span className="tw-font-semibold">{number}</span>
      </span>
    );

    if (!href) {
      return content;
    }

    return (
      <Link
        href={href}
        aria-label={`View ${label} ${number} cards`}
        className={clsx(
          "tw-text-iron-200 tw-underline tw-decoration-iron-600 tw-underline-offset-4 tw-transition-colors hover:tw-text-primary-300 hover:tw-decoration-primary-400",
          className
        )}
      >
        {content}
      </Link>
    );
  };

  const secondaryPeriodClassName = showOnlySeasonOnMobile
    ? SECONDARY_PERIOD_CLASS_NAME
    : undefined;

  return (
    <span className="tw-flex tw-flex-wrap tw-items-center tw-gap-x-2 tw-gap-y-1">
      {printPeriod("SZN", szn, seasonHref)}
      <span
        className={clsx(PERIOD_SEPARATOR_CLASS_NAME, secondaryPeriodClassName)}
      >
        /
      </span>
      {printPeriod(
        "YEAR",
        year,
        undefined,
        clsx(SECONDARY_PERIOD_TEXT_CLASS_NAME, secondaryPeriodClassName)
      )}
      <span
        className={clsx(PERIOD_SEPARATOR_CLASS_NAME, secondaryPeriodClassName)}
      >
        /
      </span>
      {printPeriod(
        "EPOCH",
        epoch,
        undefined,
        clsx(SECONDARY_PERIOD_TEXT_CLASS_NAME, secondaryPeriodClassName)
      )}
      <span
        className={clsx(PERIOD_SEPARATOR_CLASS_NAME, secondaryPeriodClassName)}
      >
        /
      </span>
      {printPeriod(
        "PERIOD",
        period,
        undefined,
        clsx(SECONDARY_PERIOD_TEXT_CLASS_NAME, secondaryPeriodClassName)
      )}
      <span
        className={clsx(PERIOD_SEPARATOR_CLASS_NAME, secondaryPeriodClassName)}
      >
        /
      </span>
      {printPeriod(
        "ERA",
        era,
        undefined,
        clsx(SECONDARY_PERIOD_TEXT_CLASS_NAME, secondaryPeriodClassName)
      )}
      <span
        className={clsx(PERIOD_SEPARATOR_CLASS_NAME, secondaryPeriodClassName)}
      >
        /
      </span>
      {printPeriod(
        "EON",
        eon,
        undefined,
        clsx(SECONDARY_PERIOD_TEXT_CLASS_NAME, secondaryPeriodClassName)
      )}
    </span>
  );
}
