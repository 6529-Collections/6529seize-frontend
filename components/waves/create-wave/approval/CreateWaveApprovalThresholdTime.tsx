import { useEffect, useState } from "react";
import { Period } from "../../../../helpers/Types";
import { assertUnreachable } from "../../../../helpers/AllowlistToolHelpers";
import CreateWaveDatesEndDateSelectPeriod from "../dates/end-date/CreateWaveDatesEndDateSelectPeriod";

export default function CreateWaveApprovalThresholdTime({
  thresholdTimeMs,
  setThresholdTimeMs,
}: {
  readonly thresholdTimeMs: number | null;
  readonly setThresholdTimeMs: (thresholdTimeMs: number | null) => void;
}) {
  const [time, setTime] = useState<number | null>(null);
  const [period, setPeriod] = useState<Period | null>(null);

  const onTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = parseInt(e.target.value);
    setTime(typeof newTime === "number" ? newTime : null);
  };
  const onPeriodSelect = (newPeriod: Period) => {
    setPeriod(newPeriod);
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

  useEffect(() => {
    setThresholdTimeMs(getMillis());
  }, [time, period]);

  return (
    <div className="tw-mt-6 tw-col-span-full">
      <p className="tw-mb-0 tw-text-xl tw-font-bold tw-text-iron-50">
        Select time
      </p>
      <div className="tw-mt-2.5 tw-grid tw-grid-cols-2 tw-gap-x-4 tw-gap-y-4">
        <div className="tw-relative">
          <input
            type="number"
            value={time ?? undefined}
            onChange={onTimeChange}
            className="tw-form-input tw-block tw-w-full tw-text-base tw-rounded-lg tw-border-0 tw-appearance-none tw-text-white tw-border-iron-600 focus:tw-border-blue-500 tw-peer
      tw-pl-4 tw-pr-4 tw-bg-iron-900 hover:tw-bg-iron-800 focus:tw-bg-iron-900 tw-font-medium tw-caret-primary-300 tw-shadow-sm tw-ring-1 tw-ring-inset tw-ring-iron-600 placeholder:tw-text-iron-500 focus:tw-outline-none focus:tw-ring-1 focus:tw-ring-inset focus:tw-ring-primary-400 tw-transition tw-duration-300 tw-ease-out"
            placeholder="Set time"
          />
          <div className="tw-pointer-events-none tw-absolute tw-inset-y-0 tw-right-0 tw-flex tw-items-center -tw-mr-1 tw-pr-3.5">
            <svg
              className="tw-h-5 tw-w-5 tw-text-iron-300"
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden="true"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M6 9L12 15L18 9"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              ></path>
            </svg>
          </div>
        </div>
        <CreateWaveDatesEndDateSelectPeriod
          activePeriod={period}
          onPeriodSelect={onPeriodSelect}
        />
      </div>
    </div>
  );
}
