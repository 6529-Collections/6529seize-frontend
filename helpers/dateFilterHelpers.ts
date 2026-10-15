import { DateIntervalsSelection } from "@/types/enums";

const formatDateFilterDate = (d: Date) => {
  const year = d.getUTCFullYear();
  const month = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export function getDateFilters(
  dateSelection: DateIntervalsSelection,
  fromDate: Date | undefined,
  toDate: Date | undefined
) {
  let filters = "";
  switch (dateSelection) {
    case DateIntervalsSelection.ALL:
      break;
    case DateIntervalsSelection.TODAY:
      filters += `&from_date=${formatDateFilterDate(new Date())}`;
      break;
    case DateIntervalsSelection.YESTERDAY: {
      const yesterday = new Date();
      yesterday.setUTCDate(yesterday.getUTCDate() - 1);
      filters += `&from_date=${formatDateFilterDate(yesterday)}`;
      filters += `&to_date=${formatDateFilterDate(yesterday)}`;
      break;
    }
    case DateIntervalsSelection.LAST_7: {
      const weekAgo = new Date();
      weekAgo.setUTCDate(weekAgo.getUTCDate() - 7);
      filters += `&from_date=${formatDateFilterDate(weekAgo)}`;
      break;
    }
    case DateIntervalsSelection.THIS_MONTH: {
      const firstDayOfMonth = new Date();
      firstDayOfMonth.setUTCDate(1);
      filters += `&from_date=${formatDateFilterDate(firstDayOfMonth)}`;
      break;
    }
    // Month and year math sets the target month and day in one call. Setting
    // the month first on a 29th-31st date overflows into the next month (for
    // example Oct 31 -> "Sep 31" -> Oct 1), which inverts the range.
    case DateIntervalsSelection.PREVIOUS_MONTH: {
      const now = new Date();
      const firstDayOfPreviousMonth = new Date(now);
      firstDayOfPreviousMonth.setUTCMonth(now.getUTCMonth() - 1, 1);
      const lastDayOfPreviousMonth = new Date(now);
      lastDayOfPreviousMonth.setUTCDate(0);
      filters += `&from_date=${formatDateFilterDate(firstDayOfPreviousMonth)}`;
      filters += `&to_date=${formatDateFilterDate(lastDayOfPreviousMonth)}`;
      break;
    }
    case DateIntervalsSelection.YEAR_TO_DATE: {
      const firstDayOfYear = new Date();
      firstDayOfYear.setUTCMonth(0, 1);
      filters += `&from_date=${formatDateFilterDate(firstDayOfYear)}`;
      break;
    }
    case DateIntervalsSelection.LAST_YEAR: {
      const now = new Date();
      const firstDayOfLastYear = new Date(now);
      firstDayOfLastYear.setUTCFullYear(now.getUTCFullYear() - 1, 0, 1);
      const lastDayOfLastYear = new Date(now);
      lastDayOfLastYear.setUTCFullYear(now.getUTCFullYear(), 0, 0);
      filters += `&from_date=${formatDateFilterDate(firstDayOfLastYear)}`;
      filters += `&to_date=${formatDateFilterDate(lastDayOfLastYear)}`;
      break;
    }
    case DateIntervalsSelection.CUSTOM_DATES:
      if (fromDate) filters += `&from_date=${formatDateFilterDate(fromDate)}`;
      if (toDate) filters += `&to_date=${formatDateFilterDate(toDate)}`;
      break;
  }
  return filters;
}
