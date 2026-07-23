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
    case DateIntervalsSelection.PREVIOUS_MONTH: {
      const firstDayOfPreviousMonth = new Date();
      firstDayOfPreviousMonth.setUTCMonth(
        firstDayOfPreviousMonth.getUTCMonth() - 1
      );
      firstDayOfPreviousMonth.setUTCDate(1);
      const lastDayOfPreviousMonth = new Date();
      lastDayOfPreviousMonth.setUTCDate(0);
      filters += `&from_date=${formatDateFilterDate(firstDayOfPreviousMonth)}`;
      filters += `&to_date=${formatDateFilterDate(lastDayOfPreviousMonth)}`;
      break;
    }
    case DateIntervalsSelection.YEAR_TO_DATE: {
      const firstDayOfYear = new Date();
      firstDayOfYear.setUTCMonth(0);
      firstDayOfYear.setUTCDate(1);
      filters += `&from_date=${formatDateFilterDate(firstDayOfYear)}`;
      break;
    }
    case DateIntervalsSelection.LAST_YEAR: {
      const firstDayOfLastYear = new Date();
      firstDayOfLastYear.setUTCFullYear(
        firstDayOfLastYear.getUTCFullYear() - 1
      );
      firstDayOfLastYear.setUTCMonth(0);
      firstDayOfLastYear.setUTCDate(1);
      const lastDayOfLastYear = new Date();
      lastDayOfLastYear.setUTCMonth(0);
      lastDayOfLastYear.setUTCDate(0);
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
