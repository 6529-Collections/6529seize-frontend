import { useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCalendarDay, faVoteYea } from "@fortawesome/free-solid-svg-icons";
import CommonCalendar from "../../../utils/calendar/CommonCalendar";
import { CreateWaveDatesConfig } from "../../../../types/waves.types";
import { CREATE_WAVE_START_DATE_LABELS } from "../../../../helpers/waves/waves.constants";
import { ApiWaveType } from "../../../../generated/models/ApiWaveType";
import { Time } from "../../../../helpers/time";
import { CREATE_WAVE_VALIDATION_ERROR } from "../../../../helpers/waves/create-wave.validation";
import DateAccordion from "../../../common/DateAccordion";

interface StartDatesProps {
  readonly waveType: ApiWaveType;
  readonly dates: CreateWaveDatesConfig;
  readonly setDates: (dates: CreateWaveDatesConfig) => void;
  readonly errors: CREATE_WAVE_VALIDATION_ERROR[];
  readonly isExpanded: boolean;
  readonly setIsExpanded: (expanded: boolean) => void;
}

export default function StartDates({
  waveType,
  dates,
  setDates,
  errors,
  isExpanded,
  setIsExpanded,
}: StartDatesProps) {
  const [minVotingTimestamp, setMinVotingTimestamp] = useState<number | null>(null);
  const isRankWave = waveType === ApiWaveType.Rank;

  useEffect(() => {
    setMinVotingTimestamp(isRankWave ? dates.submissionStartDate : null);
  }, [isRankWave, dates.submissionStartDate]);

  const handleSubmissionDateChange = (timestamp: number) => {
    const adjustedTimestamp = Math.max(timestamp, Time.currentMillis());
    setDates({
      ...dates,
      submissionStartDate: adjustedTimestamp,
      votingStartDate: isRankWave ? Math.max(dates.votingStartDate, adjustedTimestamp) : adjustedTimestamp,
    });
  };

  const handleVotingDateChange = (timestamp: number) => {
    setDates({
      ...dates,
      votingStartDate: Math.max(timestamp, dates.submissionStartDate),
    });
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const submissionDateFormatted = formatDate(dates.submissionStartDate);
  const votingDateFormatted = formatDate(dates.votingStartDate);

  return (
    <DateAccordion
      title="Start Dates"
      isExpanded={isExpanded}
      onToggle={() => setIsExpanded(!isExpanded)}
      collapsedContent={
        <div className="tw-flex tw-items-center tw-space-x-6">
          <div className="tw-flex tw-items-center tw-bg-[#24242B] tw-px-3 tw-py-2 tw-rounded-lg tw-shadow-md hover:tw-translate-y-[-1px] tw-transition-transform tw-duration-200">
            <FontAwesomeIcon icon={faCalendarDay} className="tw-mr-2 tw-size-4 tw-text-primary-400" />
            <div>
              <p className="tw-mb-0 tw-text-xs tw-text-iron-300/70">Submission Start</p>
              <p className="tw-mb-0 tw-text-sm tw-font-medium tw-text-iron-50">{submissionDateFormatted}</p>
            </div>
          </div>
          {isRankWave && (
            <div className="tw-flex tw-items-center tw-bg-[#24242B] tw-px-3 tw-py-2 tw-rounded-lg tw-shadow-md hover:tw-translate-y-[-1px] tw-transition-transform tw-duration-200">
              <FontAwesomeIcon icon={faVoteYea} className="tw-mr-2 tw-size-4 tw-text-primary-400" />
              <div>
                <p className="tw-mb-0 tw-text-xs tw-text-iron-300/70">Voting Start</p>
                <p className="tw-mb-0 tw-text-sm tw-font-medium tw-text-iron-50">{votingDateFormatted}</p>
              </div>
            </div>
          )}
        </div>
      }
    >
      <div className="tw-grid tw-grid-cols-1 tw-gap-y-8 tw-gap-x-10 md:tw-grid-cols-2  tw-px-5 tw-pb-5 tw-pt-2">
        <div className="tw-col-span-1">
          <p className="tw-mb-0 tw-text-lg sm:tw-text-xl tw-font-semibold tw-text-iron-50">
            {CREATE_WAVE_START_DATE_LABELS[waveType]}
          </p>
          <div className="tw-mt-2">
            <CommonCalendar
              initialMonth={new Date().getMonth()}
              initialYear={new Date().getFullYear()}
              selectedTimestamp={dates.submissionStartDate}
              minTimestamp={null}
              maxTimestamp={null}
              setSelectedTimestamp={handleSubmissionDateChange}
            />
          </div>
        </div>

        {isRankWave && (
          <div className="tw-col-span-1">
            <p className="tw-mb-0 tw-text-lg sm:tw-text-xl tw-font-semibold tw-text-iron-50">
              Voting start date
            </p>
            <div className="tw-mt-2">
              <CommonCalendar
                initialMonth={new Date().getMonth()}
                initialYear={new Date().getFullYear()}
                selectedTimestamp={dates.votingStartDate}
                minTimestamp={minVotingTimestamp}
                maxTimestamp={null}
                setSelectedTimestamp={handleVotingDateChange}
              />
            </div>
          </div>
        )}
      </div>
    </DateAccordion>
  );
} 