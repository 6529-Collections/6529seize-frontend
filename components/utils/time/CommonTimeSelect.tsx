import { useEffect, useState } from "react";
import { Time } from "../../../helpers/time";
import CommonInput from "../input/CommonInput";
import { CommonSelectItem } from "../select/CommonSelect";
import CommonDropdown from "../select/dropdown/CommonDropdown";

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
}: {
  readonly currentTime: number | null;
  readonly onMillis: (millis: number) => void;
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
    <div className="tw-flex tw-items-center tw-gap-x-2">
      <div className="tw-text-sm">
        <span className="tw-text-iron-300 tw-font-normal tw-space-x-1">
          <span> Expires At:</span>
          <span className="tw-text-iron-50 tw-font-medium">{expiresAt}</span>
        </span>
      </div>
      <div className="tw-w-40">
        <CommonInput
          value={value.toString()}
          inputType="number"
          onChange={(newV) => setValue(parseInt(newV ?? "0"))}
          placeholder="Time"
        />
      </div>
      <div className="tw-w-40">
        <CommonDropdown
          items={timeModeItems}
          activeItem={timeMode}
          filterLabel="Time Mode"
          setSelected={setTimeMode}
        />
      </div>
    </div>
  );
}
