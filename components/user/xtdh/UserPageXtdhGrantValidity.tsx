"use client";

import { useEffect, useState } from "react";
import CommonCalendar from "@/components/utils/calendar/CommonCalendar";
import TimePicker from "@/components/common/TimePicker";

export interface UserPageXtdhGrantValidityProps {
  readonly value: Date | null;
  readonly onChange: (value: Date | null) => void;
}

const createDefaultExpiry = () => {
  const date = new Date();
  date.setMinutes(date.getMinutes() + 10);
  date.setSeconds(0, 0);
  return date;
};

export default function UserPageXtdhGrantValidity({
  value,
  onChange,
}: Readonly<UserPageXtdhGrantValidityProps>) {
  const [neverExpires, setNeverExpires] = useState<boolean>(value === null);
  const [selectedDate, setSelectedDate] = useState<Date>(() =>
    value ? new Date(value) : createDefaultExpiry()
  );

  const getMinTimestamp = () => {
    const now = new Date();
    now.setSeconds(0, 0);
    return now.getTime();
  };

  const clampToMin = (date: Date): Date => {
    const minTimestamp = getMinTimestamp();
    if (date.getTime() < minTimestamp) {
      const minDate = new Date(minTimestamp);
      return minDate;
    }
    return date;
  };

  useEffect(() => {
    if (!value) {
      setNeverExpires(true);
      return;
    }
    setNeverExpires(false);
    setSelectedDate((prev) => {
      const next = clampToMin(new Date(value));
      return prev.getTime() === next.getTime() ? prev : next;
    });
  }, [value]);

  const handleNeverExpiresChange = (checked: boolean) => {
    setNeverExpires(checked);
    if (checked) {
      onChange(null);
      return;
    }
    const next = clampToMin(selectedDate ?? createDefaultExpiry());
    setSelectedDate(next);
    onChange(next);
  };

  const handleCalendarSelect = (timestamp: number) => {
    const next = new Date(timestamp);
    next.setHours(selectedDate.getHours(), selectedDate.getMinutes(), 0, 0);
    const clamped = clampToMin(next);
    setSelectedDate(clamped);
    onChange(clamped);
  };

  const handleTimeChange = (hours: number, minutes: number) => {
    const next = new Date(selectedDate);
    next.setHours(hours, minutes, 0, 0);
    const clamped = clampToMin(next);
    setSelectedDate(clamped);
    onChange(clamped);
  };

  const timePickerMin = (() => {
    const minDate = new Date(getMinTimestamp());
    return selectedDate.toDateString() === minDate.toDateString()
      ? { hours: minDate.getHours(), minutes: minDate.getMinutes() }
      : null;
  })();

  return (
    <div className="tw-flex tw-flex-col tw-gap-4">
      <div className="tw-flex tw-items-center tw-justify-between tw-gap-4">
        <h3 className="tw-m-0 tw-text-sm tw-font-semibold tw-text-iron-100">Validity</h3>
        <label className="tw-inline-flex tw-items-center tw-gap-2 tw-text-xs tw-font-medium tw-text-iron-200">
          <input
            type="checkbox"
            className="tw-h-4 tw-w-4 tw-rounded tw-border-iron-600 tw-bg-iron-900 focus:tw-ring-primary-400"
            checked={neverExpires}
            onChange={(event) => handleNeverExpiresChange(event.target.checked)}
          />
          {" "}
          <span>Never expires</span>
        </label>
      </div>

      {!neverExpires && (
        <div className="tw-grid tw-grid-cols-1 md:tw-grid-cols-2 tw-gap-6">
          <CommonCalendar
            initialMonth={selectedDate.getMonth()}
            initialYear={selectedDate.getFullYear()}
            selectedTimestamp={selectedDate.getTime()}
            minTimestamp={getMinTimestamp()}
            maxTimestamp={null}
            setSelectedTimestamp={handleCalendarSelect}
          />
          <TimePicker
            hours={selectedDate.getHours()}
            minutes={selectedDate.getMinutes()}
            onTimeChange={handleTimeChange}
            minTime={timePickerMin}
          />
        </div>
      )}
    </div>
  );
}
