interface TimePickerProps {
  readonly hours: number;
  readonly minutes: number;
  readonly onTimeChange: (hours: number, minutes: number) => void;
  readonly minTime?: { hours: number; minutes: number } | null;
}

interface TimeOption {
  label: string;
  hours: number;
  minutes: number;
}

export default function TimePicker({
  hours,
  minutes,
  onTimeChange,
  minTime = null,
}: TimePickerProps) {
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
    const newHours = hours >= 12 ? hours - 12 : hours + 12;
    if (isTimeDisabled(newHours, minutes)) return;
    onTimeChange(newHours, minutes);
  };

  const isPm = hours >= 12;

  const displayHours = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;

  const isTimeDisabled = (h: number, m: number) => {
    if (!minTime) return false;

    if (h < minTime.hours) return true;
    if (h === minTime.hours && m < minTime.minutes) return true;

    return false;
  };

  const onHoursChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value, 10);
    if (isNaN(val)) return;
    const newHours = isPm ? (val === 12 ? 12 : val + 12) : val === 12 ? 0 : val;

    if (!isTimeDisabled(newHours, minutes)) {
      onTimeChange(newHours, minutes);
    }
  };

  const onMinutesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value, 10);
    if (isNaN(val)) return;

    if (!isTimeDisabled(hours, val)) {
      onTimeChange(hours, val);
    }
  }

  return (
    <div className="tw:py-4 tw:relative tw:rounded-lg tw:bg-iron-800/60 tw:shadow-md tw:ring-1 tw:ring-iron-700/50">
      <div className="tw:px-5">
        <div className="tw:flex tw:items-center tw:mb-5">
          <div className="tw:flex tw:items-center tw:space-x-2 tw:flex-1">
            <div className="tw:w-20 tw:relative">
              <input
                type="number"
                min="1"
                max="12"
                value={displayHours}
                onChange={onHoursChange}
                className="tw:w-full tw:bg-[#2A2A33] tw:border-0 tw:text-white tw:rounded-lg tw:p-2 tw:ring-1 tw:ring-iron-700/30 tw:transition-all tw:duration-300 tw:focus:ring-primary-400 tw:focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:tw:appearance-none [&::-webkit-inner-spin-button]:tw:appearance-none"
                placeholder="HH"
              />
            </div>
            <span className="tw:text-iron-50 tw:font-bold">:</span>
            <div className="tw:w-20 tw:relative">
              <input
                type="number"
                min="0"
                max="59"
                value={minutes}
                onChange={onMinutesChange}
                className="tw:w-full tw:bg-[#2A2A33] tw:border-0 tw:text-white tw:rounded-lg tw:p-2 tw:ring-1 tw:ring-iron-700/30 tw:transition-all tw:duration-300 tw:focus:ring-primary-400 tw:focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:tw:appearance-none [&::-webkit-inner-spin-button]:tw:appearance-none"
                placeholder="MM"
              />
            </div>
            <button
              onClick={toggleAmPm}
              className="tw:bg-[#2A2A33] tw:text-white tw:rounded-lg tw:px-3 tw:py-2 tw:transition-all tw:duration-200 tw:border-0 tw:shadow-md tw:ml-1 tw:hover:bg-[#32323C] tw:hover:shadow-lg tw:hover:translate-y-[-1px]"
            >
              {isPm ? "PM" : "AM"}
            </button>
          </div>
        </div>

        <div className="tw:grid tw:grid-cols-3 tw:gap-1.5">
          {timeOptions.map((option) => {
            const disabled = isTimeDisabled(option.hours, option.minutes);
            return (
              <button
                key={option.label}
                onClick={() =>
                  !disabled && onTimeChange(option.hours, option.minutes)
                }
                disabled={disabled}
                className={`tw:p-1.5 tw:rounded-lg tw:transition-all tw:duration-200 tw:border-0 tw:shadow-sm tw:hover:shadow-md tw:hover:translate-y-[-1px] ${
                  hours === option.hours && minutes === option.minutes
                    ? "tw:bg-primary-500 tw:text-white tw:ring-2 tw:ring-primary-400/30 tw:hover:bg-primary-600"
                    : disabled
                    ? "tw:bg-[#2A2A33] tw:text-iron-600 tw:opacity-50 tw:cursor-not-allowed"
                    : "tw:bg-[#2A2A33] tw:text-iron-50 tw:hover:bg-[#32323C]"
                } tw:text-xs tw:sm:text-sm`}
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
