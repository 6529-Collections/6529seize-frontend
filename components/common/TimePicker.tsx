import { useId, type ChangeEvent } from "react";

interface TimePickerProps {
  readonly hours: number;
  readonly minutes: number;
  readonly onTimeChange: (hours: number, minutes: number) => void;
  readonly minTime?: { hours: number; minutes: number } | null | undefined;
  readonly disabled?: boolean;
}

interface TimeOption {
  label: string;
  hours: number;
  minutes: number;
}

const formatTime = (timeHours: number, timeMinutes: number) => {
  const period = timeHours >= 12 ? "PM" : "AM";
  const hour12 = timeHours % 12 === 0 ? 12 : timeHours % 12;
  const minuteLabel = timeMinutes.toString().padStart(2, "0");
  return `${hour12}:${minuteLabel} ${period}`;
};

export default function TimePicker({
  hours,
  minutes,
  onTimeChange,
  minTime = null,
  disabled = false,
}: TimePickerProps) {
  const baseId = useId();
  const hoursInputId = `${baseId}-hours`;
  const minutesInputId = `${baseId}-minutes`;
  const minTimeDescriptionId = minTime ? `${baseId}-min-time` : undefined;
  const minTimeDescription =
    minTime === null
      ? undefined
      : `Earliest selectable time is ${formatTime(
          minTime.hours,
          minTime.minutes
        )}.`;

  const timeOptions: TimeOption[] = [
    { label: "12 AM", hours: 0, minutes: 0 },
    { label: "6 AM", hours: 6, minutes: 0 },
    { label: "9 AM", hours: 9, minutes: 0 },
    { label: "12 PM", hours: 12, minutes: 0 },
    { label: "3 PM", hours: 15, minutes: 0 },
    { label: "6 PM", hours: 18, minutes: 0 },
    { label: "9 PM", hours: 21, minutes: 0 },
    { label: "11:59 PM", hours: 23, minutes: 59 },
  ];

  const toggleAmPm = () => {
    if (disabled) return;
    const newHours = hours >= 12 ? hours - 12 : hours + 12;
    if (isTimeDisabled(newHours, minutes)) return;
    onTimeChange(newHours, minutes);
  };

  const isPm = hours >= 12;

  const displayHours = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;

  // Check if a time is disabled based on minTime
  const isTimeDisabled = (h: number, m: number) => {
    if (!minTime) return false;

    // Compare hours first
    if (h < minTime.hours) return true;
    // If hours are equal, compare minutes
    if (h === minTime.hours && m < minTime.minutes) return true;

    return false;
  };

  const onHoursChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (disabled) return;
    const val = parseInt(e.target.value, 10);
    if (isNaN(val)) return;
    const newHours = isPm ? (val === 12 ? 12 : val + 12) : val === 12 ? 0 : val;

    if (!isTimeDisabled(newHours, minutes)) {
      onTimeChange(newHours, minutes);
    }
  };

  const onMinutesChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (disabled) return;
    const val = parseInt(e.target.value, 10);
    if (isNaN(val)) return;

    if (!isTimeDisabled(hours, val)) {
      onTimeChange(hours, val);
    }
  };

  return (
    <div
      className={`tw-relative tw-rounded-lg tw-bg-iron-800/60 tw-py-4 tw-shadow-md tw-ring-1 tw-ring-iron-700/50 ${
        disabled ? "tw-opacity-60" : ""
      }`}
    >
      <div className="tw-px-5">
        <div className="tw-mb-5 tw-flex tw-items-center">
          <div className="tw-flex tw-flex-1 tw-items-center tw-space-x-2">
            <div className="tw-relative tw-w-20">
              <label className="tw-sr-only" htmlFor={hoursInputId}>
                Hours
              </label>
              <input
                type="number"
                min="1"
                max="12"
                value={displayHours}
                onChange={onHoursChange}
                disabled={disabled}
                id={hoursInputId}
                aria-describedby={minTimeDescriptionId}
                className={`tw-w-full tw-rounded-lg tw-border-0 tw-bg-[#2A2A33] tw-p-2 tw-ring-1 tw-ring-iron-700/30 tw-transition-all tw-duration-300 [appearance:textfield] [&::-webkit-inner-spin-button]:tw-appearance-none [&::-webkit-outer-spin-button]:tw-appearance-none ${
                  disabled
                    ? "tw-cursor-not-allowed tw-text-iron-500"
                    : "tw-text-white focus:tw-outline-none focus:tw-ring-primary-400"
                }`}
                placeholder="HH"
              />
            </div>
            <span className="tw-font-bold tw-text-iron-50">:</span>
            <div className="tw-relative tw-w-20">
              <label className="tw-sr-only" htmlFor={minutesInputId}>
                Minutes
              </label>
              <input
                type="number"
                min="0"
                max="59"
                value={minutes}
                onChange={onMinutesChange}
                disabled={disabled}
                id={minutesInputId}
                aria-describedby={minTimeDescriptionId}
                className={`tw-w-full tw-rounded-lg tw-border-0 tw-bg-[#2A2A33] tw-p-2 tw-ring-1 tw-ring-iron-700/30 tw-transition-all tw-duration-300 [appearance:textfield] [&::-webkit-inner-spin-button]:tw-appearance-none [&::-webkit-outer-spin-button]:tw-appearance-none ${
                  disabled
                    ? "tw-cursor-not-allowed tw-text-iron-500"
                    : "tw-text-white focus:tw-outline-none focus:tw-ring-primary-400"
                }`}
                placeholder="MM"
              />
            </div>
            <button
              onClick={toggleAmPm}
              disabled={disabled}
              aria-label="Toggle AM/PM"
              className={`tw-ml-1 tw-rounded-lg tw-border-0 tw-px-3 tw-py-2 tw-transition-all tw-duration-200 ${
                disabled
                  ? "tw-cursor-not-allowed tw-bg-[#2A2A33] tw-text-iron-500"
                  : "tw-bg-[#2A2A33] tw-text-white tw-shadow-md hover:tw-translate-y-[-1px] hover:tw-bg-[#32323C] hover:tw-shadow-lg"
              }`}
            >
              {isPm ? "PM" : "AM"}
            </button>
          </div>
        </div>

        {minTimeDescription ? (
          <p id={minTimeDescriptionId} className="tw-sr-only">
            {minTimeDescription}
          </p>
        ) : null}

        <div className="tw-grid tw-grid-cols-3 tw-gap-1.5">
          {timeOptions.map((option) => {
            const optionDisabled =
              disabled || isTimeDisabled(option.hours, option.minutes);
            const isSelected =
              !disabled && hours === option.hours && minutes === option.minutes;
            let optionStateClassName =
              "tw-bg-[#2A2A33] tw-text-iron-50 tw-shadow-sm hover:tw-translate-y-[-1px] hover:tw-bg-[#32323C] hover:tw-shadow-md";

            if (isSelected) {
              optionStateClassName =
                "tw-bg-primary-500 tw-text-white tw-ring-2 tw-ring-primary-400/30 hover:tw-bg-primary-600";
            } else if (optionDisabled) {
              optionStateClassName =
                "tw-cursor-not-allowed tw-bg-[#2A2A33] tw-text-iron-600 tw-opacity-50";
            }

            return (
              <button
                key={option.label}
                onClick={() =>
                  !optionDisabled && onTimeChange(option.hours, option.minutes)
                }
                disabled={optionDisabled}
                className={`tw-rounded-lg tw-border-0 tw-p-1.5 tw-text-xs tw-transition-all tw-duration-200 sm:tw-text-sm ${optionStateClassName}`}
              >
                {option.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
