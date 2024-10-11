import { useEffect, useState } from "react";
import CreateWaveDatesEndDateSelectPeriod from "./CreateWaveDatesEndDateSelectPeriod";
import { Period } from "../../../../../helpers/Types";
import { assertUnreachable } from "../../../../../helpers/AllowlistToolHelpers";
import { ApiWaveType } from "../../../../../generated/models/ApiWaveType";
import { CREATE_WAVE_VALIDATION_ERROR } from "../../../../../helpers/waves/create-wave.helpers";
import CreateWaveDatesEndDateSetTime from "./CreateWaveDatesEndDateSetTime";
import CreateWaveDatesEndDateHeader from "./CreateWaveDatesEndDateHeader";
import CreateWaveDatesEndDateEndingAt from "./CreateWaveDatesEndDateEndingAt";

export default function CreateWaveDatesEndDate({
  waveType,
  startTimestamp,
  errors,
  onEndTimestampChange,
}: {
  readonly waveType: ApiWaveType;
  readonly startTimestamp: number | null;
  readonly errors: CREATE_WAVE_VALIDATION_ERROR[];
  readonly onEndTimestampChange: (timestamp: number | null) => void;
}) {
  const endDateIsOptional = waveType !== ApiWaveType.Rank;
  const [time, setTime] = useState<number | null>(null);
  const [period, setPeriod] = useState<Period | null>(null);

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
      <CreateWaveDatesEndDateHeader endDateIsOptional={endDateIsOptional} />
      <div className="tw-mt-3 tw-grid md:tw-grid-cols-2 tw-gap-x-5 tw-gap-y-4">
        <CreateWaveDatesEndDateSetTime
          time={time}
          setTime={setTime}
          errors={errors}
        />
        <CreateWaveDatesEndDateSelectPeriod
          activePeriod={period}
          errors={errors}
          onPeriodSelect={onPeriodSelect}
        />
      </div>
      {endDate && <CreateWaveDatesEndDateEndingAt endDate={endDate} />}
    </div>
  );
}
