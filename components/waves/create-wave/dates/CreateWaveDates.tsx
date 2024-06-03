import { useEffect, useState } from "react";
import { getCurrentDayStartTimestamp } from "../../../../helpers/calendar/calendar.helpers";
import CommonCalendar from "../../../utils/calendar/CommonCalendar";
import { CreateWaveDatesConfig, WaveType } from "../../../../types/waves.types";
import { CREATE_WAVE_START_DATE_LABELS } from "../../../../helpers/waves/waves.constants";
import CreateWaveDatesEndDate from "./end-date/CreateWaveDatesEndDate";
import CreateWaveNextStep from "../utils/CreateWaveNextStep";
import { assertUnreachable } from "../../../../helpers/AllowlistToolHelpers";

export default function CreateWaveDates({
  waveType,
  dates,
  setDates,
  onNextStep,
}: {
  readonly waveType: WaveType;
  readonly dates: CreateWaveDatesConfig;
  readonly setDates: (dates: CreateWaveDatesConfig) => void;
  readonly onNextStep: () => void;
}) {
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();

  const haveVotingStartDate = waveType === WaveType.RANK;

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

  const getIsNextStepDisabled = () => {
    switch (waveType) {
      case WaveType.CHAT:
      case WaveType.APPROVE:
        return (
          !dates.submissionStartDate ||
          dates.submissionStartDate !== dates.votingStartDate
        );
      case WaveType.RANK:
        return (
          !dates.submissionStartDate ||
          !dates.votingStartDate ||
          dates.votingStartDate < dates.submissionStartDate ||
          !dates.endDate ||
          dates.endDate < dates.votingStartDate
        );
      default:
        assertUnreachable(waveType);
        return true;
    }
  };

  const [isNextStepDisabled, setIsNextStepDisabled] = useState(
    getIsNextStepDisabled()
  );

  useEffect(() => {
    setIsNextStepDisabled(getIsNextStepDisabled());
  }, [dates, waveType]);

  return (
    <div className="tw-max-w-xl tw-mx-auto tw-w-full">
      <div className="tw-relative tw-grid tw-grid-cols-1 tw-gap-y-10 tw-gap-x-10 md:tw-grid-cols-2">
        <div className="tw-col-span-1">
          <p className="tw-mb-0 tw-text-xl tw-font-bold tw-text-iron-50">
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
            <p className="tw-mb-0 tw-text-xl tw-font-bold tw-text-iron-50">
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
          onEndTimestampChange={onEndTimestampChange}
        />
      </div>
      <div className="tw-mt-6 tw-text-right">
        <CreateWaveNextStep
          onClick={onNextStep}
          disabled={isNextStepDisabled}
        />
      </div>
    </div>
  );
}
