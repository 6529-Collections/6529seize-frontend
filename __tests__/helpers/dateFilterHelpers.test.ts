import { getDateFilters } from "@/helpers/dateFilterHelpers";
import { DateIntervalsSelection } from "@/types/enums";

interface DateFilterCase {
  readonly now: string;
  readonly selection: DateIntervalsSelection;
  readonly expected: string;
}

// Expected bounds are written out by hand as exact UTC calendar days, so the
// table is the specification rather than a re-run of the helper's arithmetic.
const MONTH_AND_YEAR_CASES: readonly DateFilterCase[] = [
  // Previous month: the 29th-31st overflow cases, leap years and year rollover.
  {
    now: "2026-10-31T12:00:00Z",
    selection: DateIntervalsSelection.PREVIOUS_MONTH,
    expected: "&from_date=2026-09-01&to_date=2026-09-30",
  },
  {
    now: "2026-03-31T12:00:00Z",
    selection: DateIntervalsSelection.PREVIOUS_MONTH,
    expected: "&from_date=2026-02-01&to_date=2026-02-28",
  },
  {
    now: "2026-12-31T12:00:00Z",
    selection: DateIntervalsSelection.PREVIOUS_MONTH,
    expected: "&from_date=2026-11-01&to_date=2026-11-30",
  },
  {
    now: "2027-01-31T12:00:00Z",
    selection: DateIntervalsSelection.PREVIOUS_MONTH,
    expected: "&from_date=2026-12-01&to_date=2026-12-31",
  },
  {
    now: "2028-02-29T12:00:00Z",
    selection: DateIntervalsSelection.PREVIOUS_MONTH,
    expected: "&from_date=2028-01-01&to_date=2028-01-31",
  },
  {
    now: "2028-03-31T12:00:00Z",
    selection: DateIntervalsSelection.PREVIOUS_MONTH,
    expected: "&from_date=2028-02-01&to_date=2028-02-29",
  },
  {
    now: "2026-01-31T12:00:00Z",
    selection: DateIntervalsSelection.PREVIOUS_MONTH,
    expected: "&from_date=2025-12-01&to_date=2025-12-31",
  },
  {
    now: "2026-10-15T12:00:00Z",
    selection: DateIntervalsSelection.PREVIOUS_MONTH,
    expected: "&from_date=2026-09-01&to_date=2026-09-30",
  },
  // Month to date.
  {
    now: "2026-10-31T12:00:00Z",
    selection: DateIntervalsSelection.THIS_MONTH,
    expected: "&from_date=2026-10-01",
  },
  {
    now: "2026-03-31T12:00:00Z",
    selection: DateIntervalsSelection.THIS_MONTH,
    expected: "&from_date=2026-03-01",
  },
  {
    now: "2028-02-29T12:00:00Z",
    selection: DateIntervalsSelection.THIS_MONTH,
    expected: "&from_date=2028-02-01",
  },
  // Year to date.
  {
    now: "2026-10-31T12:00:00Z",
    selection: DateIntervalsSelection.YEAR_TO_DATE,
    expected: "&from_date=2026-01-01",
  },
  {
    now: "2026-12-31T12:00:00Z",
    selection: DateIntervalsSelection.YEAR_TO_DATE,
    expected: "&from_date=2026-01-01",
  },
  {
    now: "2027-01-31T12:00:00Z",
    selection: DateIntervalsSelection.YEAR_TO_DATE,
    expected: "&from_date=2027-01-01",
  },
  // Last calendar year.
  {
    now: "2026-10-31T12:00:00Z",
    selection: DateIntervalsSelection.LAST_YEAR,
    expected: "&from_date=2025-01-01&to_date=2025-12-31",
  },
  {
    now: "2026-03-31T12:00:00Z",
    selection: DateIntervalsSelection.LAST_YEAR,
    expected: "&from_date=2025-01-01&to_date=2025-12-31",
  },
  {
    now: "2027-01-31T12:00:00Z",
    selection: DateIntervalsSelection.LAST_YEAR,
    expected: "&from_date=2026-01-01&to_date=2026-12-31",
  },
  {
    now: "2028-02-29T12:00:00Z",
    selection: DateIntervalsSelection.LAST_YEAR,
    expected: "&from_date=2027-01-01&to_date=2027-12-31",
  },
  // Relative ranges that cross month and year edges.
  {
    now: "2027-01-01T00:30:00Z",
    selection: DateIntervalsSelection.YESTERDAY,
    expected: "&from_date=2026-12-31&to_date=2026-12-31",
  },
  {
    now: "2026-03-01T12:00:00Z",
    selection: DateIntervalsSelection.YESTERDAY,
    expected: "&from_date=2026-02-28&to_date=2026-02-28",
  },
  {
    now: "2028-03-01T12:00:00Z",
    selection: DateIntervalsSelection.YESTERDAY,
    expected: "&from_date=2028-02-29&to_date=2028-02-29",
  },
  {
    now: "2026-10-31T12:00:00Z",
    selection: DateIntervalsSelection.LAST_7,
    expected: "&from_date=2026-10-24",
  },
  {
    now: "2026-03-03T12:00:00Z",
    selection: DateIntervalsSelection.LAST_7,
    expected: "&from_date=2026-02-24",
  },
];

describe("getDateFilters UTC month and year boundaries", () => {
  afterEach(() => {
    jest.useRealTimers();
  });

  it.each<DateFilterCase>(MONTH_AND_YEAR_CASES)(
    "$selection at $now",
    ({ now, selection, expected }) => {
      jest.useFakeTimers().setSystemTime(new Date(now));

      expect(getDateFilters(selection, undefined, undefined)).toBe(expected);
    }
  );
});
