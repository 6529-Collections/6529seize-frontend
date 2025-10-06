"use client";

import { useEffect, useState } from "react";
import { generateCalendar } from "@/helpers/calendar/calendar.helpers";
import CommonCalendarDay from "./CommonCalendarDay";

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

export default function CommonCalendar({
  initialMonth,
  initialYear,
  minTimestamp,
  maxTimestamp,
  selectedTimestamp,
  setSelectedTimestamp,
}: {
  readonly initialMonth: number;
  readonly initialYear: number;
  readonly minTimestamp: number | null;
  readonly maxTimestamp: number | null;
  readonly selectedTimestamp: number | null;
  readonly setSelectedTimestamp: (timestamp: number) => void;
}) {
  const [month, setMonth] = useState(() => {
    if (selectedTimestamp) {
      return new Date(selectedTimestamp).getMonth();
    }
    return initialMonth;
  });

  const [year, setYear] = useState(() => {
    if (selectedTimestamp) {
      return new Date(selectedTimestamp).getFullYear();
    }
    return initialYear;
  });

  const [days, setDays] = useState(generateCalendar({ month, year }));
  useEffect(() => setDays(generateCalendar({ month, year })), [month, year]);

  useEffect(() => {
    if (selectedTimestamp) {
      const date = new Date(selectedTimestamp);
      setMonth(date.getMonth());
      setYear(date.getFullYear());
    }
  }, [selectedTimestamp]);

  const setNextMonth = () => {
    if (month === 11) {
      setMonth(0);
      setYear(year + 1);
    } else {
      setMonth(month + 1);
    }
  };

  const setPreviousMonth = () => {
    if (month === 0) {
      setMonth(11);
      setYear(year - 1);
    } else {
      setMonth(month - 1);
    }
  };

  return (
    <div className="tw-py-3 tw-relative tw-rounded-lg tw-bg-iron-800/60 tw-shadow-md tw-ring-1 tw-ring-iron-700/50 tw-ring-inset">
      <button
        onClick={setPreviousMonth}
        type="button"
        aria-label="Previous month"
        className="tw-bg-transparent tw-border tw-border-transparent tw-border-solid tw-absolute 
              tw-left-1.5 tw-top-1.5 tw-flex tw-items-center tw-justify-center tw-p-2 tw-text-iron-300 hover:tw-text-iron-500 tw-transition tw-duration-300 tw-ease-out">
        <svg
          className="tw-h-6 tw-w-6"
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden="true"
          xmlns="http://www.w3.org/2000/svg">
          <path
            d="M15 18L9 12L15 6"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
      <button
        onClick={setNextMonth}
        type="button"
        aria-label="Next month"
        className="tw-bg-transparent tw-border tw-border-transparent tw-border-solid tw-absolute tw-right-1.5 tw-top-1.5 tw-flex tw-items-center tw-justify-center tw-p-2 tw-text-iron-300 hover:tw-text-iron-500 tw-transition tw-duration-300 tw-ease-out">
        <svg
          className="tw-h-6 tw-w-6"
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden="true"
          xmlns="http://www.w3.org/2000/svg">
          <path
            d="M9 18L15 12L9 6"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
      <section className="tw-text-center">
        <p className="tw-text-base tw-font-medium tw-text-iron-50">
          {MONTHS[month]}
        </p>
        <div className="tw-mt-4 tw-px-3 tw-grid tw-grid-cols-7 tw-text-sm tw-leading-6 tw-font-medium tw-text-iron-500">
          <div>Mo</div>
          <div>Tu</div>
          <div>We</div>
          <div>Th</div>
          <div>Fr</div>
          <div>Sa</div>
          <div>Su</div>
        </div>
        <div className="tw-isolate tw-mt-2 tw-grid tw-grid-cols-7 tw-gap-1.5 tw-px-4">
          {days.map((day) => (
            <CommonCalendarDay
              key={`calendar-${day.startTimestamp}`}
              day={day}
              minTimestamp={minTimestamp}
              maxTimestamp={maxTimestamp}
              selectedTimestamp={selectedTimestamp}
              setSelectedTimestamp={setSelectedTimestamp}
            />
          ))}
        </div>
      </section>
    </div>
  );
}
