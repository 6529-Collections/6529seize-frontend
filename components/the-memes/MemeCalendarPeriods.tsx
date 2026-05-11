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

export default function MemeCalendarPeriods({ id }: { readonly id: number }) {
  const d = dateFromMintNumber(id);
  const idx = getSeasonIndexForDate(d);
  const eon = displayedEonNumberFromIndex(idx);
  const era = displayedEraNumberFromIndex(idx);
  const period = displayedPeriodNumberFromIndex(idx);
  const epoch = displayedEpochNumberFromIndex(idx);
  const year = displayedYearNumberFromIndex(idx);
  const szn = displayedSeasonNumberFromIndex(idx);

  const printPeriod = (label: string, number: number) => {
    return (
      <span className="tw-whitespace-nowrap">
        <span>{label}</span> <span className="tw-font-semibold">{number}</span>
      </span>
    );
  };

  return (
    <span className="tw-flex tw-flex-wrap tw-items-center tw-gap-x-2 tw-gap-y-1">
      {printPeriod("SZN", szn)}
      <span className="tw-text-iron-600">/</span>
      {printPeriod("YEAR", year)}
      <span className="tw-text-iron-600">/</span>
      {printPeriod("EPOCH", epoch)}
      <span className="tw-text-iron-600">/</span>
      {printPeriod("PERIOD", period)}
      <span className="tw-text-iron-600">/</span>
      {printPeriod("ERA", era)}
      <span className="tw-text-iron-600">/</span>
      {printPeriod("EON", eon)}
    </span>
  );
}
