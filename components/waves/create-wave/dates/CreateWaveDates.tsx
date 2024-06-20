import CommonCalendar from "../../../utils/calendar/CommonCalendar";
import { CreateWaveDatesConfig } from "../../../../types/waves.types";
import { CREATE_WAVE_START_DATE_LABELS } from "../../../../helpers/waves/waves.constants";
import CreateWaveDatesEndDate from "./end-date/CreateWaveDatesEndDate";
import { WaveType } from "../../../../generated/models/WaveType";
import { useEffect, useState } from "react";

export default function CreateWaveDates({
  waveType,
  dates,
  setDates,
}: {
  readonly waveType: WaveType;
  readonly dates: CreateWaveDatesConfig;
  readonly setDates: (dates: CreateWaveDatesConfig) => void;
}) {
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();

  const getHaveMultipleTimestamps = (): boolean => waveType === WaveType.Rank;

  // Submission start date is always the minimum timestamp
  const getMinTimestamp = (): number | null => {
    if (!getHaveMultipleTimestamps()) return null;
    return dates.submissionStartDate;
  };

  // Voting start date is always the maximum timestamp
  const getMaxTimestamp = (): number | null => {
    if (!getHaveMultipleTimestamps()) return null;
    return dates.votingStartDate;
  };

  const haveVotingStartDate = getHaveMultipleTimestamps();

  const onStartTimestampChange = (timestamp: number) => {
    setDates({
      ...dates,
      submissionStartDate: timestamp,
      votingStartDate: haveVotingStartDate ? dates.votingStartDate : timestamp,
    });
  };

  const onVotingStartTimestampChange = (timestamp: number) => {
    setDates({
      ...dates,
      votingStartDate: timestamp,
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
  const [maxTimestamp, setMaxTimestamp] = useState<number | null>(
    getMaxTimestamp()
  );

  useEffect(() => {
    setMinTimestamp(getMinTimestamp());
    setMaxTimestamp(getMaxTimestamp());
  }, [waveType, dates]);

  return (
    <div className="tw-relative tw-grid tw-grid-cols-1 tw-gap-y-8 tw-gap-x-10 md:tw-grid-cols-2">
      <div className="tw-col-span-1">
        <p className="tw-mb-0 tw-text-xl tw-font-semibold tw-text-iron-50">
          {CREATE_WAVE_START_DATE_LABELS[waveType]}
        </p>
        <CommonCalendar
          initialMonth={currentMonth}
          initialYear={currentYear}
          selectedTimestamp={dates.submissionStartDate}
          minTimestamp={null}
          maxTimestamp={maxTimestamp}
          setSelectedTimestamp={onStartTimestampChange}
        />
      </div>
      {haveVotingStartDate && (
        <div className="tw-col-span-1">
          <p className="tw-mb-0 tw-text-xl tw-font-semibold tw-text-iron-50">
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
        onEndTimestampChange={onEndTimestampChange}
      />
    </div>
  );
}
