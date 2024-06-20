import { useEffect, useState } from "react";
import CreateWaveDatesEndDateSelectPeriod from "./CreateWaveDatesEndDateSelectPeriod";
import { Period } from "../../../../../helpers/Types";
import { assertUnreachable } from "../../../../../helpers/AllowlistToolHelpers";
import { WaveType } from "../../../../../generated/models/WaveType";

export default function CreateWaveDatesEndDate({
  waveType,
  startTimestamp,
  onEndTimestampChange,
}: {
  readonly waveType: WaveType;
  readonly startTimestamp: number | null;
  readonly onEndTimestampChange: (timestamp: number | null) => void;
}) {
  const endDateIsOptional = waveType !== WaveType.Rank;
  const [time, setTime] = useState<number | null>(null);
  const [period, setPeriod] = useState<Period | null>(null);

  const onTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = parseInt(e.target.value);
    setTime(typeof newTime === "number" ? newTime : null);
  };
  const onPeriodSelect = (newPeriod: Period) => {
    setPeriod(endDateIsOptional && newPeriod === period ? null : newPeriod);
  };

  const getMillis = (): number | null => {
    if (!time || !period || !startTimestamp) {
      return null;
    }
    const now = new Date(startTimestamp);
    switch (period) {
      case Period.MINUTES:
        now.setMinutes(now.getMinutes() + time);
        break;
      case Period.HOURS:
        now.setHours(now.getHours() + time);
        break;
      case Period.DAYS:
        now.setDate(now.getDate() + time);
        break;
      case Period.WEEKS:
        now.setDate(now.getDate() + time * 7);
        break;
      case Period.MONTHS:
        now.setMonth(now.getMonth() + time);
        break;
      default:
        assertUnreachable(period);
    }
    return now.getTime();
  };

  const getEndDate = (): string | null => {
    const millis = getMillis();
    if (!millis) {
      return null;
    }
    return new Date(millis).toLocaleString();
  };

  const [endDate, setEndDate] = useState<string | null>(null);

  useEffect(() => {
    setEndDate(getEndDate());
    onEndTimestampChange(getMillis());
  }, [time, period, startTimestamp]);
  return (
    <div className="tw-col-span-full">
      <p className="tw-mb-0 tw-text-xl tw-font-semibold tw-text-iron-50">
        Period{" "}
        {endDateIsOptional && (
          <span className="tw-text-base tw-font-medium tw-text-iron-400">
            (optional)
          </span>
        )}
      </p>
      <div className="tw-mt-2 tw-grid tw-grid-cols-2 tw-gap-x-4 tw-gap-y-4">
        <div className="tw-relative">
          <input
            type="number"
            value={time ?? undefined}
            onChange={onTimeChange}
            className={`tw-form-input tw-block tw-w-full tw-text-base tw-rounded-lg tw-border-0 tw-appearance-none ${
              time ? "tw-text-primary-400 tw-font-semibold" : "tw-font-medium"
            } tw-border-iron-650 focus:tw-border-blue-500 tw-peer tw-pl-10 tw-py-3 tw-pr-4 tw-bg-iron-900 focus:tw-bg-iron-900  tw-caret-primary-400 tw-shadow-sm tw-ring-1 tw-ring-inset tw-ring-iron-650 placeholder:tw-text-iron-500 focus:tw-outline-none focus:tw-ring-1 focus:tw-ring-inset focus:tw-ring-primary-400 tw-transition tw-duration-300 tw-ease-out`}
            placeholder="Set time"
          />
          <div className="tw-pointer-events-none tw-absolute tw-flex tw-items-center tw-inset-y-0 tw-pl-3">
            <svg
              className={`tw-w-5 tw-h-5 tw-flex-shrink-0 ${
                time ? "tw-text-primary-400 tw-font-semibold" : "tw-text-iron-300 tw-font-medium"
              }`}
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden="true"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M21 10H3M16 2V6M8 2V6M7.8 22H16.2C17.8802 22 18.7202 22 19.362 21.673C19.9265 21.3854 20.3854 20.9265 20.673 20.362C21 19.7202 21 18.8802 21 17.2V8.8C21 7.11984 21 6.27976 20.673 5.63803C20.3854 5.07354 19.9265 4.6146 19.362 4.32698C18.7202 4 17.8802 4 16.2 4H7.8C6.11984 4 5.27976 4 4.63803 4.32698C4.07354 4.6146 3.6146 5.07354 3.32698 5.63803C3 6.27976 3 7.11984 3 8.8V17.2C3 18.8802 3 19.7202 3.32698 20.362C3.6146 20.9265 4.07354 21.3854 4.63803 21.673C5.27976 22 6.11984 22 7.8 22Z"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        </div>
        <CreateWaveDatesEndDateSelectPeriod
          activePeriod={period}
          onPeriodSelect={onPeriodSelect}
        />
      </div>
      {endDate && (
        <div className="tw-mt-2 tw-flex tw-items-center tw-gap-x-1.5">
          <svg
            className="tw-flex-shrink-0 tw-h-4 tw-w-4 tw-text-iron-400"
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden="true"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M12 6V12L16 14M22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12Z"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <span className="tw-text-iron-400 tw-text-xs tw-font-medium tw-space-x-1">
            <span>Ending At:</span>
            <span className="tw-text-iron-500 tw-font-semibold">{endDate}</span>
          </span>
        </div>
      )}
    </div>
  );
}
