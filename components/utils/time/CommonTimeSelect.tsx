import { useEffect, useState } from "react";
import { Time } from "../../../helpers/time";
import CommonInput from "../input/CommonInput";
import { CommonSelectItem } from "../select/CommonSelect";
import CommonDropdown from "../select/dropdown/CommonDropdown";
import { assertUnreachable } from "../../../helpers/AllowlistToolHelpers";

enum TimeMode {
  MINUTES = "MINUTES",
  HOURS = "HOURS",
  DAYS = "DAYS",
  WEEKS = "WEEKS",
  MONTHS = "MONTHS",
}

const TIME_MODE_LABEL: Record<TimeMode, string> = {
  [TimeMode.MINUTES]: "Minutes",
  [TimeMode.HOURS]: "Hours",
  [TimeMode.DAYS]: "Days",
  [TimeMode.WEEKS]: "Weeks",
  [TimeMode.MONTHS]: "Months",
};

export default function CommonTimeSelect({
  currentTime,
  onMillis,
  disabled = false,
  inline = false,
  size = "md",
}: {
  readonly currentTime: number | null;
  readonly onMillis: (millis: number) => void;
  readonly disabled?: boolean;
  readonly inline?: boolean;
  readonly size?: "sm" | "md";
}) {
  const hours = currentTime
    ? +Time.millis(currentTime).diffFromNow().toHours().toFixed(0)
    : 0;
  const [value, setValue] = useState<number>(hours);

  const [timeMode, setTimeMode] = useState<TimeMode>(TimeMode.HOURS);
  const timeModeItems: CommonSelectItem<TimeMode>[] = Object.values(
    TimeMode
  ).map((mode) => ({
    label: TIME_MODE_LABEL[mode],
    value: mode,
    key: mode,
  }));

  const getMillis = (): number => {
    const now = new Date();
    switch (timeMode) {
      case TimeMode.MINUTES:
        now.setMinutes(now.getMinutes() + value);
        break;
      case TimeMode.HOURS:
        now.setHours(now.getHours() + value);
        break;
      case TimeMode.DAYS:
        now.setDate(now.getDate() + value);
        break;
      case TimeMode.WEEKS:
        now.setDate(now.getDate() + value * 7);
        break;
      case TimeMode.MONTHS:
        now.setMonth(now.getMonth() + value);
        break;
      default:
        assertUnreachable(timeMode);
    }
    return now.getTime();
  };

  const getExpiresAt = (): string => {
    const millis = getMillis();
    return new Date(millis).toLocaleString();
  };

  const [expiresAt, setExpiresAt] = useState<string>(getExpiresAt());
  useEffect(() => {
    onMillis(getMillis());
    setExpiresAt(getExpiresAt());
  }, [value, timeMode]);

  return (
    <div className="tw-flex tw-flex-col tw-gap-y-3 tw-w-full">
      <div className="tw-flex tw-flex-col md:tw-flex-row md:tw-items-center tw-gap-4">
        <div className="tw-flex tw-flex-col sm:tw-flex-row sm:tw-items-center tw-gap-4 tw-w-full md:tw-w-auto">
          <div className="tw-w-full lg:tw-w-40">
            <CommonInput
              value={value.toString()}
              inputType="number"
              disabled={disabled}
              onChange={(newV) => setValue(parseInt(newV ?? "0"))}
              placeholder="Time"
              theme="light"
              size={size}
            />
          </div>
          <div className="tw-w-full lg:tw-w-40">
            <CommonDropdown
              items={timeModeItems}
              activeItem={timeMode}
              disabled={disabled}
              dynamicPosition={false}
              filterLabel="Time Mode"
              theme="light"
              size="sm"
              setSelected={setTimeMode}
            />
          </div>
        </div>
        {inline && (
          <div
            className={`${
              disabled ? "tw-opacity-50 tw-hidden" : ""
            }  tw-flex tw-items-center tw-gap-x-1.5`}
          >
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
              <span>Expires At:</span>
              <span className="tw-text-iron-300 tw-font-semibold">
                {expiresAt}
              </span>
            </span>
          </div>
        )}
      </div>
      {!inline && (
        <div
          className={`${
            disabled ? "tw-opacity-50 tw-hidden" : ""
          }  tw-flex tw-items-center tw-gap-x-1.5`}
        >
          <svg
            className="tw-h-4 tw-w-4 tw-text-iron-400"
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
            <span>Expires At:</span>
            <span className="tw-text-iron-300 tw-font-semibold">
              {expiresAt}
            </span>
          </span>
        </div>
      )}
    </div>
  );
}
