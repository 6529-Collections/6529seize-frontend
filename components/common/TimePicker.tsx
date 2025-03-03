import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faClock } from "@fortawesome/free-regular-svg-icons";

interface TimePickerProps {
  readonly hours: number;
  readonly minutes: number;
  readonly onTimeChange: (hours: number, minutes: number) => void;
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

  const toggleAmPm = () =>
    onTimeChange(hours >= 12 ? hours - 12 : hours + 12, minutes);
  const isPm = hours >= 12;
  
  const displayHours = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;

  return (
    <div className="tw-py-4 tw-relative tw-rounded-xl tw-bg-[#24242B] tw-shadow-md tw-ring-1 tw-ring-iron-700/50">
      <div className="tw-px-5">
        <div className="tw-flex tw-items-center tw-mb-4">
          <FontAwesomeIcon
            icon={faClock}
            className="tw-mr-3 tw-size-5 tw-text-primary-400"
          />
          <p className="tw-mb-0 tw-text-base tw-font-medium tw-text-iron-50">
            Select time
          </p>
        </div>

        <div className="tw-flex tw-items-center tw-mb-5">
          <div className="tw-flex tw-items-center tw-space-x-2 tw-flex-1">
            <div className="tw-w-20 tw-relative">
              <input
                type="number"
                min="1"
                max="12"
                value={displayHours}
                onChange={(e) => {
                  const val = parseInt(e.target.value, 10);
                  if (isNaN(val)) return;
                  const newHours = isPm ? 
                    (val === 12 ? 12 : val + 12) : 
                    (val === 12 ? 0 : val);
                  onTimeChange(newHours, minutes);
                }}
                className="tw-w-full tw-bg-[#2A2A33] tw-border-0 tw-text-white tw-rounded-lg tw-p-2 tw-ring-1 tw-ring-iron-700/30 focus:tw-ring-primary-400 focus:tw-outline-none tw-transition-all tw-duration-300 [appearance:textfield] [&::-webkit-outer-spin-button]:tw-appearance-none [&::-webkit-inner-spin-button]:tw-appearance-none"
                placeholder="HH"
              />
            </div>
            <span className="tw-text-iron-50 tw-font-bold">:</span>
            <div className="tw-w-20 tw-relative">
              <input
                type="number"
                min="0"
                max="59"
                value={minutes}
                onChange={(e) => {
                  const val = parseInt(e.target.value, 10);
                  if (isNaN(val)) return;
                  onTimeChange(hours, val);
                }}
                className="tw-w-full tw-bg-[#2A2A33] tw-border-0 tw-text-white tw-rounded-lg tw-p-2 tw-ring-1 tw-ring-iron-700/30 focus:tw-ring-primary-400 focus:tw-outline-none tw-transition-all tw-duration-300 [appearance:textfield] [&::-webkit-outer-spin-button]:tw-appearance-none [&::-webkit-inner-spin-button]:tw-appearance-none"
                placeholder="MM"
              />
            </div>
            <button
              onClick={toggleAmPm}
              className="tw-bg-[#2A2A33] hover:tw-bg-[#32323C] tw-text-white tw-rounded-lg tw-px-3 tw-py-2 tw-transition-all tw-duration-200 tw-border-0 tw-shadow-md hover:tw-shadow-lg hover:tw-translate-y-[-1px] tw-ml-1"
            >
              {isPm ? "PM" : "AM"}
            </button>
          </div>
        </div>

        <div className="tw-grid tw-grid-cols-3 tw-gap-1.5">
          {timeOptions.map((option) => (
            <button
              key={option.label}
              onClick={() => onTimeChange(option.hours, option.minutes)}
              className={`tw-p-1.5 tw-text-xs sm:tw-text-sm tw-rounded-lg tw-transition-all tw-duration-200 tw-border-0 tw-shadow-sm hover:tw-shadow-md hover:tw-translate-y-[-1px] ${
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
