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
    const currentMillis = now.getTime();
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
    return now.getTime() - currentMillis;
  };

  useEffect(() => {
    setThresholdTimeMs(getMillis());
  }, [time, period]);

  return (
    <div className="tw-mt-8 tw-col-span-full">
      <p className="tw-mb-0 tw-text-xl tw-font-semibold tw-text-iron-50">
        Select time
      </p>
      <div className="tw-mt-3 tw-grid tw-grid-cols-2 tw-gap-x-4 tw-gap-y-4">
        <div className="tw-relative">
          <input
            type="number"
            value={time ?? undefined}
            onChange={onTimeChange}
            className={`tw-form-input tw-block tw-w-full tw-text-base tw-rounded-lg tw-border-0 tw-appearance-none ${
              time ? "tw-text-primary-400 " : "tw-font-normal"
            } focus:tw-border-blue-500 tw-peer tw-py-3 tw-pl-10 tw-pr-4 tw-bg-iron-900 hover:tw-bg-iron-800 focus:tw-bg-iron-900 tw-caret-primary-300 tw-shadow-sm tw-ring-1 tw-ring-inset tw-ring-iron-650 placeholder:tw-text-iron-500 focus:tw-outline-none focus:tw-ring-1 focus:tw-ring-inset focus:tw-ring-primary-400 tw-transition tw-duration-300 tw-ease-out`}
            placeholder="Set time"
          />
          <div className="tw-pointer-events-none tw-absolute tw-flex tw-items-center tw-inset-y-0 tw-pl-3">
            <svg
              className={`tw-h-5 tw-w-5 ${
                time ? "tw-text-blue-500" : "tw-text-iron-300"
              } tw-flex-shrink-0`}
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden="true"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M5 3L2 6M22 6L19 3M6 19L4 21M18 19L20 21M12 9V13L14 15M12 21C14.1217 21 16.1566 20.1571 17.6569 18.6569C19.1571 17.1566 20 15.1217 20 13C20 10.8783 19.1571 8.84344 17.6569 7.34315C16.1566 5.84285 14.1217 5 12 5C9.87827 5 7.84344 5.84285 6.34315 7.34315C4.84285 8.84344 4 10.8783 4 13C4 15.1217 4.84285 17.1566 6.34315 18.6569C7.84344 20.1571 9.87827 21 12 21Z"
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
    </div>
  );
}
