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

const SECONDARY_PERIOD_CLASS_NAME = "tw-hidden md:tw-flex";
const PERIOD_SEPARATOR_CLASS_NAME =
  "tw-text-xs tw-font-medium tw-text-iron-700";

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

  const printSecondaryPeriod = (label: string, number: number) => (
    <span className="tw-inline-flex tw-items-center tw-gap-1 tw-px-1.5 tw-py-0.5 tw-text-[10.5px] tw-font-medium tw-uppercase tw-tracking-wider tw-text-iron-500">
      <span>{label}</span>
      <span className="tw-font-semibold tw-text-iron-300">{number}</span>
    </span>
  );
  const secondaryPeriods = [
    { label: "YEAR", number: year },
    { label: "EPOCH", number: epoch },
    { label: "PERIOD", number: period },
    { label: "ERA", number: era },
    { label: "EON", number: eon },
  ];
  const seasonContent = (
    <>
      <span>SZN</span>
      <span>{szn}</span>
    </>
  );

  const secondaryPeriodClassName = showOnlySeasonOnMobile
    ? SECONDARY_PERIOD_CLASS_NAME
    : undefined;

  return (
    <span className="tw-flex tw-flex-wrap tw-items-center tw-gap-2">
      {seasonHref ? (
        <Link
          href={seasonHref}
          aria-label={`View SZN ${szn} cards`}
          className="tw-inline-flex tw-items-center tw-gap-1 tw-rounded-md tw-border tw-border-solid tw-border-iron-700 tw-bg-iron-900 tw-px-2.5 tw-py-0.5 tw-text-xs tw-font-semibold tw-leading-4 tw-text-iron-100 tw-no-underline tw-transition-colors hover:tw-border-primary-400 hover:tw-text-primary-300"
        >
          {seasonContent}
        </Link>
      ) : (
        <span className="tw-inline-flex tw-items-center tw-gap-1 tw-rounded-md tw-border tw-border-solid tw-border-iron-700 tw-bg-iron-900 tw-px-2.5 tw-py-0.5 tw-text-xs tw-font-semibold tw-leading-4 tw-text-iron-100">
          {seasonContent}
        </span>
      )}
      <span
        aria-hidden="true"
        className={clsx(PERIOD_SEPARATOR_CLASS_NAME, secondaryPeriodClassName)}
      >
        /
      </span>
      <span
        aria-label="Meme calendar position"
        className={clsx(
          "tw-flex-wrap tw-items-center tw-gap-1.5",
          secondaryPeriodClassName
        )}
      >
        {secondaryPeriods.map(({ label, number }, index) => (
          <span
            key={label}
            className="tw-inline-flex tw-items-center tw-gap-1.5"
          >
            {index > 0 && (
              <span aria-hidden="true" className={PERIOD_SEPARATOR_CLASS_NAME}>
                /
              </span>
            )}
            {printSecondaryPeriod(label, number)}
          </span>
        ))}
      </span>
    </span>
  );
}
