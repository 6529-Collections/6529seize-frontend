import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faClock } from "@fortawesome/free-solid-svg-icons";

interface TimePickerProps {
  readonly hours: number;
  readonly minutes: number;
  readonly onTimeChange: (hours: number, minutes: number) => void;
}

export default function TimePicker({ hours, minutes, onTimeChange }: TimePickerProps) {
  const timeOptions = [
    { label: "12:00 AM", hours: 0, minutes: 0 },
    { label: "6:00 AM", hours: 6, minutes: 0 },
    { label: "9:00 AM", hours: 9, minutes: 0 },
    { label: "12:00 PM", hours: 12, minutes: 0 },
    { label: "3:00 PM", hours: 15, minutes: 0 },
    { label: "6:00 PM", hours: 18, minutes: 0 },
    { label: "9:00 PM", hours: 21, minutes: 0 },
    { label: "11:59 PM", hours: 23, minutes: 59 },
  ];

  return (
    <div className="tw-py-4 tw-relative tw-rounded-xl tw-bg-[#24242B] tw-shadow-md tw-ring-1 tw-ring-iron-700/50">
      <div className="tw-px-5">
        <div className="tw-flex tw-items-center tw-mb-4">
          <FontAwesomeIcon icon={faClock} className="tw-mr-3 tw-size-5 tw-text-primary-400" />
          <p className="tw-mb-0 tw-text-base tw-font-medium tw-text-iron-50">Select time</p>
        </div>

        <div className="tw-flex tw-items-center tw-mb-5">
          <div className="tw-flex tw-items-center tw-space-x-2 tw-flex-1">
            <TimeInput
              value={hours}
              max={23}
              onChange={(h) => onTimeChange(h, minutes)}
              placeholder="HH"
            />
            <span className="tw-text-iron-50 tw-font-bold">:</span>
            <TimeInput
              value={minutes}
              max={59}
              onChange={(m) => onTimeChange(hours, m)}
              placeholder="MM"
            />
            <button
              onClick={() => onTimeChange(hours >= 12 ? hours - 12 : hours + 12, minutes)}
              className="tw-bg-[#2A2A33] hover:tw-bg-[#32323C] tw-text-white tw-rounded-lg tw-px-3 tw-py-2 tw-transition-all tw-duration-200 tw-border-0 tw-shadow-md hover:tw-shadow-lg hover:tw-translate-y-[-1px] tw-ml-1 tw-whitespace-nowrap"
            >
              {hours >= 12 ? "PM" : "AM"}
            </button>
          </div>
        </div>

        <div className="tw-grid tw-grid-cols-4 tw-gap-1">
          {timeOptions.map((option) => (
            <button
              key={option.label}
              onClick={() => onTimeChange(option.hours, option.minutes)}
              className={`tw-p-1.5 tw-text-xs sm:tw-text-sm tw-rounded-lg tw-transition-all tw-duration-200 tw-border-0 tw-shadow-sm hover:tw-shadow-md hover:tw-translate-y-[-1px] tw-whitespace-nowrap ${
                hours === option.hours && minutes === option.minutes
                  ? "tw-bg-primary-500 hover:tw-bg-primary-600 tw-text-white tw-ring-2 tw-ring-primary-400/30"
                  : "tw-bg-[#2A2A33] tw-text-iron-50 hover:tw-bg-[#32323C]"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function TimeInput({ value, max, onChange, placeholder }: { readonly value: number; readonly max: number; readonly onChange: (value: number) => void; readonly placeholder: string }) {
  return (
    <div className="tw-w-16">
      <input
        type="number"
        min="0"
        max={max}
        value={value}
        onChange={(e) => onChange(parseInt(e.target.value, 10))}
        className="tw-w-full tw-bg-[#2A2A33] tw-border-0 tw-text-white tw-rounded-lg tw-p-2 tw-text-center tw-ring-1 tw-ring-iron-700/30 focus:tw-ring-primary-500/50 tw-transition-all tw-duration-200"
        placeholder={placeholder}
      />
    </div>
  );
} 
