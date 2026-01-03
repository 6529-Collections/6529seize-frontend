export interface CalendarDay {
  date: number;
  isActiveMonth: boolean;
  startTimestamp: number;
}

export const generateCalendar = ({
  year,
  month,
}: {
  readonly year: number;
  readonly month: number;
}): CalendarDay[] => {
  const daysInWeek = 7;

  // Get first day of the month (0 indexed)
  const firstDayOfMonth = new Date(year, month, 1);
  const startDayOfWeek =
    firstDayOfMonth.getDay() === 0 ? 6 : firstDayOfMonth.getDay() - 1; // Adjust so Monday is 0

  // Get last day of the month
  const lastDayOfMonth = new Date(year, month + 1, 0);

  // Get the number of days in the month
  const daysInMonth = lastDayOfMonth.getDate();

  // Calculate total number of days to display
  const totalDaysToDisplay = startDayOfWeek + daysInMonth;

  // Calculate the number of rows needed
  const rows = Math.ceil(totalDaysToDisplay / daysInWeek);

  // Calculate total cells needed
  const grid = daysInWeek * rows;

  const result: CalendarDay[] = [];

  // Get the number of days in the previous month
  const prevMonthLastDay = new Date(year, month, 0);
  const daysInPrevMonth = prevMonthLastDay.getDate();

  // Fill the previous month's days
  for (let i = startDayOfWeek - 1; i >= 0; i--) {
    const date = daysInPrevMonth - i;
    const timestamp = new Date(year, month - 1, date).getTime();
    result.push({
      date,
      isActiveMonth: false,
      startTimestamp: timestamp,
    });
  }

  // Fill the current month's days
  for (let date = 1; date <= daysInMonth; date++) {
    const timestamp = new Date(year, month, date).getTime();
    result.push({
      date,
      isActiveMonth: true,
      startTimestamp: timestamp,
    });
  }

  // Fill the next month's days to complete the grid
  const remainingDays = grid - result.length;
  for (let date = 1; date <= remainingDays; date++) {
    const timestamp = new Date(year, month + 1, date).getTime();
    result.push({
      date,
      isActiveMonth: false,
      startTimestamp: timestamp,
    });
  }

  return result;
};
