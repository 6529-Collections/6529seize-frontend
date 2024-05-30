import { useEffect, useState } from "react";
import { WaveType } from "../../../../../types/waves.types";
import CreateWaveDatesEndDateSelectPeriod from "./CreateWaveDatesEndDateSelectPeriod";
import { Period } from "../../../../../helpers/Types";
import { assertUnreachable } from "../../../../../helpers/AllowlistToolHelpers";

export default function CreateWaveDatesEndDate({
  waveType,
  onEndTimestampChange,
}: {
  readonly waveType: WaveType;
  readonly onEndTimestampChange: (timestamp: number | null) => void;
}) {
  const endDateIsOptional = waveType !== WaveType.RANK;
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
    if (!time || !period) {
      return null;
    }
    const now = new Date();
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
  }, [time, period]);
  return (
    <div className="tw-col-span-full">
      <p className="tw-mb-0 tw-text-xl tw-font-bold tw-text-iron-50">
        Period{" "}
        {endDateIsOptional && (
          <span className="tw-text-base tw-font-semibold tw-text-iron-400">
            (optional)
          </span>
        )}
      </p>
      <div className="tw-mt-3 tw-grid tw-grid-cols-2 tw-gap-x-4 tw-gap-y-4">
        <input
          type="number"
          value={time ?? undefined}
          onChange={onTimeChange}
          className="tw-form-input tw-block tw-w-full tw-text-base tw-rounded-lg tw-border-0 tw-appearance-none tw-text-white tw-border-iron-600 focus:tw-border-blue-500 tw-peer
      tw-pl-4 tw-pr-4 tw-bg-iron-900 hover:tw-bg-iron-800 focus:tw-bg-iron-900 tw-font-medium tw-caret-primary-300 tw-shadow-sm tw-ring-1 tw-ring-inset tw-ring-iron-600 placeholder:tw-text-iron-500 focus:tw-outline-none focus:tw-ring-1 focus:tw-ring-inset focus:tw-ring-primary-400 tw-transition tw-duration-300 tw-ease-out"
          placeholder="Set time"
        />
        <CreateWaveDatesEndDateSelectPeriod
          activePeriod={period}
          onPeriodSelect={onPeriodSelect}
        />
      </div>
      {endDate && (
        <div className="tw-flex tw-items-center tw-gap-x-1.5">
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
            <span className="tw-text-iron-300 tw-font-semibold">{endDate}</span>
          </span>
        </div>
      )}
    </div>
  );
}
