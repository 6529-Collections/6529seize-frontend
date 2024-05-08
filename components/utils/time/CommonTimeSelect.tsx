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
    label: mode,
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
    <div>
      <CommonInput
        value={value.toString()}
        inputType="number"
        onChange={(newV) => setValue(parseInt(newV ?? "0"))}
        placeholder="Time"
      />
      <CommonDropdown
        items={timeModeItems}
        activeItem={timeMode}
        filterLabel="Time Mode"
        setSelected={setTimeMode}
      />
      <div>
        <span>Expires At: {expiresAt}</span>
      </div>
    </div>
  );
}
