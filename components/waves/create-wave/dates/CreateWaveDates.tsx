import CommonCalendar from "../../../utils/calendar/CommonCalendar";
import { CreateWaveDatesConfig } from "../../../../types/waves.types";
import { CREATE_WAVE_START_DATE_LABELS } from "../../../../helpers/waves/waves.constants";
import CreateWaveDatesEndDate from "./end-date/CreateWaveDatesEndDate";
import { ApiWaveType } from "../../../../generated/models/ApiWaveType";
import { useEffect, useState } from "react";
import { CREATE_WAVE_VALIDATION_ERROR } from "../../../../helpers/waves/create-wave.helpers";
import { Time } from "../../../../helpers/time";

export default function CreateWaveDates({
  waveType,
  dates,
  errors,
  setDates,
}: {
  readonly waveType: ApiWaveType;
  readonly dates: CreateWaveDatesConfig;
  readonly errors: CREATE_WAVE_VALIDATION_ERROR[];
  readonly setDates: (dates: CreateWaveDatesConfig) => void;
}) {
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();

  const getHaveMultipleTimestamps = (): boolean =>
    waveType === ApiWaveType.Rank;

  // Submission start date is always the minimum timestamp
  const getMinTimestamp = (): number | null => {
    if (!getHaveMultipleTimestamps()) return null;
    return dates.submissionStartDate;
  };

  const haveVotingStartDate = getHaveMultipleTimestamps();

  const onStartTimestampChange = (timestamp: number) => {
    const adjustedTimestamp =
      Time.currentMillis() > timestamp ? Time.currentMillis() : timestamp;
    setDates({
      ...dates,
      submissionStartDate: adjustedTimestamp,
      votingStartDate:
        haveVotingStartDate && dates.votingStartDate > adjustedTimestamp
          ? dates.votingStartDate
          : adjustedTimestamp,
    });
  };

  const onVotingStartTimestampChange = (timestamp: number) => {
    const adjustedTimestamp =
      dates.submissionStartDate > timestamp
        ? dates.submissionStartDate
        : timestamp;
    setDates({
      ...dates,
      votingStartDate: adjustedTimestamp,
    });
  };

  const onEndTimestampChange = (timestamp: number | null) => {
    setDates({
      ...dates,
      endDate: timestamp,
    });
  };

  const [minTimestamp, setMinTimestamp] = useState<number | null>(
    getMinTimestamp()
  );
  useEffect(() => {
    setMinTimestamp(getMinTimestamp());
  }, [waveType, dates]);

  return (
    <div className="tw-relative tw-grid tw-grid-cols-1 tw-gap-y-8 tw-gap-x-20 md:tw-grid-cols-2">
      <div className="tw-col-span-1">
        <p className="tw-mb-0 tw-text-lg  sm:tw-text-xl tw-font-semibold tw-text-iron-50">
          {CREATE_WAVE_START_DATE_LABELS[waveType]}
        </p>
        <CommonCalendar
          initialMonth={currentMonth}
          initialYear={currentYear}
          selectedTimestamp={dates.submissionStartDate}
          minTimestamp={null}
          maxTimestamp={null}
          setSelectedTimestamp={onStartTimestampChange}
        />
      </div>
      {haveVotingStartDate && (
        <div className="tw-col-span-1">
          <p className="tw-mb-0 tw-text-lg  sm:tw-text-xl tw-font-semibold tw-text-iron-50">
            Voting start date
          </p>
          <CommonCalendar
            initialMonth={currentMonth}
            initialYear={currentYear}
            minTimestamp={minTimestamp}
            maxTimestamp={null}
            selectedTimestamp={dates.votingStartDate}
            setSelectedTimestamp={onVotingStartTimestampChange}
          />
        </div>
      )}
      <CreateWaveDatesEndDate
        waveType={waveType}
        startTimestamp={dates.votingStartDate}
        errors={errors}
        onEndTimestampChange={onEndTimestampChange}
      />
    </div>
  );
}
