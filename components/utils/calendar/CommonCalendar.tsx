"use client";

import { useEffect, useRef, useState } from "react";
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

type CommonCalendarProps = {
  readonly initialMonth: number;
  readonly initialYear: number;
  readonly minTimestamp: number | null;
  readonly maxTimestamp: number | null;
  readonly selectedTimestamp: number | null;
  readonly setSelectedTimestamp: (timestamp: number) => void;
};

const getInitialVisibleDate = ({
  initialMonth,
  initialYear,
  selectedTimestamp,
}: Pick<
  CommonCalendarProps,
  "initialMonth" | "initialYear" | "selectedTimestamp"
>) => {
  if (selectedTimestamp !== null) {
    const selectedDate = new Date(selectedTimestamp);
    return new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1);
  }

  return new Date(initialYear, initialMonth, 1);
};

function CommonCalendarView({
  initialMonth,
  initialYear,
  minTimestamp,
  maxTimestamp,
  selectedTimestamp,
  setSelectedTimestamp,
}: CommonCalendarProps) {
  const [visibleDate, setVisibleDate] = useState(() =>
    getInitialVisibleDate({
      initialMonth,
      initialYear,
      selectedTimestamp,
    })
  );

  // Follow selection changes in place instead of remounting via a key:
  // remounting destroys the tapped day button mid-gesture, which breaks
  // scroll anchoring on mobile Safari and yanks the page. Only snap the
  // view when the selection lands in a different month — time-of-day
  // changes and month browsing must not move it.
  const selectedMonthKey =
    selectedTimestamp !== null
      ? `${new Date(selectedTimestamp).getFullYear()}-${new Date(
          selectedTimestamp
        ).getMonth()}`
      : `initial-${initialYear}-${initialMonth}`;
  const lastSelectedMonthKeyRef = useRef(selectedMonthKey);
  useEffect(() => {
    if (lastSelectedMonthKeyRef.current === selectedMonthKey) {
      return;
    }
    lastSelectedMonthKeyRef.current = selectedMonthKey;
    const target =
      selectedTimestamp !== null
        ? new Date(selectedTimestamp)
        : new Date(initialYear, initialMonth, 1);
    setVisibleDate(new Date(target.getFullYear(), target.getMonth(), 1));
  }, [selectedMonthKey, selectedTimestamp, initialMonth, initialYear]);
  const month = visibleDate.getMonth();
  const year = visibleDate.getFullYear();
  const days = generateCalendar({ month, year });

  const setNextMonth = () => {
    setVisibleDate(
      (currentDate) =>
        new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1)
    );
  };

  const setPreviousMonth = () => {
    setVisibleDate(
      (currentDate) =>
        new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1)
    );
  };

  return (
    <div className="tw-relative tw-rounded-lg tw-bg-iron-800/60 tw-py-3 tw-shadow-md tw-ring-1 tw-ring-inset tw-ring-iron-700/50">
      <button
        onClick={setPreviousMonth}
        type="button"
        aria-label="Previous month"
        className="tw-absolute tw-left-1.5 tw-top-1.5 tw-flex tw-items-center tw-justify-center tw-border tw-border-solid tw-border-transparent tw-bg-transparent tw-p-2 tw-text-iron-300 tw-transition tw-duration-300 tw-ease-out hover:tw-text-iron-500"
      >
        <svg
          className="tw-h-6 tw-w-6"
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden="true"
          xmlns="http://www.w3.org/2000/svg"
        >
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
        className="tw-absolute tw-right-1.5 tw-top-1.5 tw-flex tw-items-center tw-justify-center tw-border tw-border-solid tw-border-transparent tw-bg-transparent tw-p-2 tw-text-iron-300 tw-transition tw-duration-300 tw-ease-out hover:tw-text-iron-500"
      >
        <svg
          className="tw-h-6 tw-w-6"
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden="true"
          xmlns="http://www.w3.org/2000/svg"
        >
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
        <div className="tw-mt-4 tw-grid tw-grid-cols-7 tw-px-3 tw-text-sm tw-font-medium tw-leading-6 tw-text-iron-500">
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

export default function CommonCalendar(props: CommonCalendarProps) {
  return <CommonCalendarView {...props} />;
}
