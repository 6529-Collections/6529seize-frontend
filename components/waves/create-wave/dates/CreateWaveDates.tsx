import CommonCalendar from "../../../utils/calendar/CommonCalendar";
import { CreateWaveDatesConfig } from "../../../../types/waves.types";
import { CREATE_WAVE_START_DATE_LABELS } from "../../../../helpers/waves/waves.constants";
import CreateWaveDatesEndDate from "./end-date/CreateWaveDatesEndDate";
import { WaveType } from "../../../../generated/models/WaveType";

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

  const haveVotingStartDate = waveType === WaveType.Rank;

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


  return (
    <div className="tw-relative tw-grid tw-grid-cols-1 tw-gap-y-8 tw-gap-x-10 md:tw-grid-cols-2">
      <div className="tw-col-span-1">
        <p className="tw-mb-0 tw-text-2xl tw-font-semibold tw-text-iron-50">
          {CREATE_WAVE_START_DATE_LABELS[waveType]}
        </p>
        <CommonCalendar
          initialMonth={currentMonth}
          initialYear={currentYear}
          selectedTimestamp={dates.submissionStartDate}
          setSelectedTimestamp={onStartTimestampChange}
        />
      </div>
      {haveVotingStartDate && (
        <div className="tw-col-span-1">
          <p className="tw-mb-0 tw-text-2xl tw-font-semibold tw-text-iron-50">
            Voting start date
          </p>
          <CommonCalendar
            initialMonth={currentMonth}
            initialYear={currentYear}
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
