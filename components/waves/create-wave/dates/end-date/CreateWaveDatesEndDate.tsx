import { useEffect, useState } from "react";
import CreateWaveDatesEndDateSelectPeriod from "./CreateWaveDatesEndDateSelectPeriod";
import { Period } from "../../../../../helpers/Types";
import { assertUnreachable } from "../../../../../helpers/AllowlistToolHelpers";
import { ApiWaveType } from "../../../../../generated/models/ApiWaveType";
import { CREATE_WAVE_VALIDATION_ERROR } from "../../../../../helpers/waves/create-wave.validation";
import CreateWaveDatesEndDateSetTime from "./CreateWaveDatesEndDateSetTime";
import CreateWaveDatesEndDateHeader from "./CreateWaveDatesEndDateHeader";
import CreateWaveDatesEndDateEndingAt from "./CreateWaveDatesEndDateEndingAt";

export default function CreateWaveDatesEndDate({
  waveType,
  startTimestamp,
  errors,
  onEndTimestampChange,
  endDateConfig,
  setEndDateConfig,
}: {
  readonly waveType: ApiWaveType;
  readonly startTimestamp: number | null;
  readonly errors: CREATE_WAVE_VALIDATION_ERROR[];
  readonly onEndTimestampChange: (timestamp: number | null) => void;
  readonly endDateConfig: {time: number | null, period: Period | null};
  readonly setEndDateConfig: (config: {time: number | null, period: Period | null}) => void;
}) {
  const endDateIsOptional = waveType !== ApiWaveType.Rank;
  const [endDate, setEndDate] = useState<string | null>(null);

  const onPeriodSelect = (newPeriod: Period) => {
    setEndDateConfig({
      ...endDateConfig,
      period: endDateIsOptional && newPeriod === endDateConfig.period ? null : newPeriod
    });
  };

  const getMillis = (): number | null => {
    if (!endDateConfig.time || !endDateConfig.period || !startTimestamp) {
      return null;
    }
    const now = new Date(startTimestamp);
    switch (endDateConfig.period) {
      case Period.MINUTES:
        now.setMinutes(now.getMinutes() + endDateConfig.time);
        break;
      case Period.HOURS:
        now.setHours(now.getHours() + endDateConfig.time);
        break;
      case Period.DAYS:
        now.setDate(now.getDate() + endDateConfig.time);
        break;
      case Period.WEEKS:
        now.setDate(now.getDate() + endDateConfig.time * 7);
        break;
      case Period.MONTHS:
        now.setMonth(now.getMonth() + endDateConfig.time);
        break;
      default:
        assertUnreachable(endDateConfig.period);
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

  useEffect(() => {
    setEndDate(getEndDate());
    onEndTimestampChange(getMillis());
  }, [endDateConfig.time, endDateConfig.period, startTimestamp]);

  return (
    <div className="tw-col-span-full">
      <CreateWaveDatesEndDateHeader endDateIsOptional={endDateIsOptional} />
      <div className="tw-mt-3 tw-grid md:tw-grid-cols-2 tw-gap-x-5 tw-gap-y-4">
        <CreateWaveDatesEndDateSetTime
          time={endDateConfig.time}
          setTime={(time) => setEndDateConfig({...endDateConfig, time})}
          errors={errors}
        />
        <CreateWaveDatesEndDateSelectPeriod
          activePeriod={endDateConfig.period}
          errors={errors}
          onPeriodSelect={onPeriodSelect}
        />
      </div>
      {endDate && <CreateWaveDatesEndDateEndingAt endDate={endDate} />}
    </div>
  );
}
