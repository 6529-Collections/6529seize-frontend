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
      <>
        <span>{label}</span> <span className="tw-font-semibold">{number}</span>
      </>
    );
  };

  return (
    <div className="tw-text-xs sm:tw-text-sm tw-text-iron-300">
      {printPeriod("SZN", szn)} / {printPeriod("YEAR", year)} /{" "}
      {printPeriod("EPOCH", epoch)} / {printPeriod("PERIOD", period)} /{" "}
      {printPeriod("ERA", era)} / {printPeriod("EON", eon)}
    </div>
  );
}
