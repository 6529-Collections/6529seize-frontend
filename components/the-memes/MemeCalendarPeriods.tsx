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
    <span className="tw-inline-flex tw-items-center tw-gap-1 tw-rounded-full tw-border tw-border-solid tw-border-iron-800 tw-bg-iron-950/60 tw-px-2 tw-py-0.5 tw-text-[11px] tw-font-medium tw-leading-4 tw-text-iron-400">
      <span>{label}</span>
      <span className="tw-font-semibold tw-text-iron-200">{number}</span>
    </span>
  );
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
          className="tw-inline-flex tw-items-center tw-gap-1 tw-rounded-full tw-border tw-border-solid tw-border-iron-700 tw-bg-iron-900 tw-px-2.5 tw-py-0.5 tw-text-xs tw-font-semibold tw-leading-4 tw-text-iron-100 tw-no-underline tw-transition-colors hover:tw-border-primary-400 hover:tw-text-primary-300"
        >
          {seasonContent}
        </Link>
      ) : (
        <span className="tw-inline-flex tw-items-center tw-gap-1 tw-rounded-full tw-border tw-border-solid tw-border-iron-700 tw-bg-iron-900 tw-px-2.5 tw-py-0.5 tw-text-xs tw-font-semibold tw-leading-4 tw-text-iron-100">
          {seasonContent}
        </span>
      )}
      <span
        aria-label="Meme calendar position"
        className={clsx(
          "tw-flex-wrap tw-items-center tw-gap-1.5",
          secondaryPeriodClassName
        )}
      >
        {printSecondaryPeriod("YEAR", year)}
        {printSecondaryPeriod("EPOCH", epoch)}
        {printSecondaryPeriod("PERIOD", period)}
        {printSecondaryPeriod("ERA", era)}
        {printSecondaryPeriod("EON", eon)}
      </span>
    </span>
  );
}
