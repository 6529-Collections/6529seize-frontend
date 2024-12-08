import { useEffect, useState } from "react";
import { Period } from "../../../../helpers/Types";
import { assertUnreachable } from "../../../../helpers/AllowlistToolHelpers";
import CreateWaveDatesEndDateSelectPeriod from "../dates/end-date/CreateWaveDatesEndDateSelectPeriod";
import { CREATE_WAVE_VALIDATION_ERROR } from "../../../../helpers/waves/create-wave.validation";

export default function CreateWaveApprovalThresholdTime({
  thresholdTimeMs,
  thresholdTimeError,
  thresholdDurationError,
  setThresholdTimeMs,
}: {
  readonly thresholdTimeMs: number | null;
  readonly thresholdTimeError: boolean;
  readonly thresholdDurationError: boolean;
  readonly setThresholdTimeMs: (thresholdTimeMs: number | null) => void;
}) {
  const [time, setTime] = useState<number | null>(null);
  const [period, setPeriod] = useState<Period | null>(null);

  const onTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = parseInt(e.target.value);
    const isValid = !isNaN(newTime) && newTime > 0;
    setTime(isValid ? newTime : null);
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

  const getTimeError = () =>
    (thresholdTimeError && !time) || thresholdDurationError;

  const getPeriodError = () => {
    if (!thresholdTimeError) return [];
    if (!thresholdDurationError && !period)
      return [CREATE_WAVE_VALIDATION_ERROR.END_DATE_REQUIRED];
    return [];
  };

  const [timeError, setTimeError] = useState(getTimeError());
  const [periodErrors, setPeriodErrors] = useState<
    CREATE_WAVE_VALIDATION_ERROR[]
  >(getPeriodError());

  useEffect(() => {
    setTimeError(getTimeError());
    setPeriodErrors(getPeriodError());
  }, [thresholdTimeError, thresholdDurationError, time]);

  useEffect(() => {
    setThresholdTimeMs(getMillis());
  }, [time, period]);

  return (
    <div className="tw-mt-8 tw-col-span-full">
      <p className="tw-mb-0 tw-text-lg  sm:tw-text-xl tw-font-semibold tw-text-iron-50">
        Select time
      </p>
      <div className="tw-mt-3 tw-grid tw-grid-cols-2 tw-gap-x-4 tw-gap-y-4">
        <div>
          <div className="tw-relative">
            <input
              type="string"
              value={time !== null ? time.toString() : ""}
              onChange={onTimeChange}
              id="dates-end-time"
              autoComplete="off"
              className={`${
                timeError
                  ? "tw-ring-error focus:tw-border-error focus:tw-ring-error tw-caret-error"
                  : "tw-border-iron-650 tw-ring-iron-650  focus:tw-border-blue-500 tw-caret-primary-400 focus:tw-ring-primary-400"
              } tw-form-input tw-pb-3 tw-pt-4 tw-pl-10 tw-pr-4 tw-text-base tw-block tw-w-full tw-rounded-lg tw-border-0 tw-appearance-none ${
                time
                  ? "focus:tw-text-white tw-text-primary-400"
                  : "tw-text-white"
              } tw-font-medium tw-peer tw-bg-iron-900 focus:tw-bg-iron-900 tw-shadow-sm tw-ring-1 tw-ring-inset placeholder:tw-text-iron-500 focus:tw-outline-none focus:tw-ring-1 focus:tw-ring-inset tw-transition tw-duration-300 tw-ease-out`}
              placeholder=" "
            />
            <label
              htmlFor="dates-end-time"
              className={`${
                timeError
                  ? "peer-focus:tw-text-error"
                  : "peer-focus:tw-text-primary-400"
              } tw-text-base tw-text-iron-500 tw-absolute tw-cursor-text tw-font-medium tw-duration-300 tw-transform -tw-translate-y-4 tw-scale-75 tw-top-2 tw-origin-[0] tw-bg-iron-900 peer-focus:tw-bg-iron-900 tw-ml-7 tw-px-2 peer-focus:tw-px-2 peer-placeholder-shown:tw-scale-100 peer-placeholder-shown:-tw-translate-y-1/2 peer-placeholder-shown:tw-top-1/2 peer-focus:tw-top-2 peer-focus:tw-scale-75 peer-focus:-tw-translate-y-4 rtl:peer-focus:tw-translate-x-1/4 rtl:peer-focus:tw-left-auto tw-start-1`}
            >
              Set time
            </label>
            <div className="tw-pointer-events-none tw-absolute tw-flex tw-items-center tw-inset-y-0 tw-pl-3">
              <svg
                className={`${
                  timeError ? "tw-text-error" : "tw-text-iron-300 "
                } tw-w-5 tw-h-5 tw-flex-shrink-0 tw-transition tw-duration-300 tw-ease-out`}
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

          {timeError && (
            <div className="tw-mt-1.5 tw-text-error tw-text-xs tw-font-medium">
              <div className="tw-flex tw-items-center tw-gap-x-2">
                <svg
                  className="tw-size-5 tw-flex-shrink-0 tw-text-error"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M12 8V12M12 16H12.01M22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12Z"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <span>
                  {thresholdDurationError
                    ? "Threshold duration can't be longer than wave duration"
                    : "Please set time"}
                </span>
              </div>
            </div>
          )}
        </div>
        <CreateWaveDatesEndDateSelectPeriod
          activePeriod={period}
          errors={periodErrors}
          onPeriodSelect={onPeriodSelect}
        />
      </div>
    </div>
  );
}
