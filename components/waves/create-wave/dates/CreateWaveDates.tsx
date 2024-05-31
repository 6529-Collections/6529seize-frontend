import { useState } from "react";
import { getCurrentDayStartTimestamp } from "../../../../helpers/calendar/calendar.helpers";
import CommonCalendar from "../../../utils/calendar/CommonCalendar";
import { CreateWaveDatesConfig, WaveType } from "../../../../types/waves.types";
import { CREATE_WAVE_START_DATE_LABELS } from "../../../../helpers/waves/waves.constants";
import CreateWaveDatesEndDate from "./end-date/CreateWaveDatesEndDate";

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

  return (
    <div className="tw-w-full">
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
        <button
          type="button"
          className="tw-relative tw-inline-flex tw-items-center tw-justify-center tw-cursor-pointer tw-bg-primary-500 tw-px-4 tw-py-2.5 tw-text-base tw-font-semibold tw-text-white tw-border tw-border-solid tw-border-primary-500 tw-rounded-lg hover:tw-bg-primary-600 hover:tw-border-primary-600 tw-transition tw-duration-300 tw-ease-out"
        >
          <span>Next step</span>
        </button>
      </div>
    </div>
  );
}
