import { useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCalendarDays } from "@fortawesome/free-regular-svg-icons";
import { faInfoCircle } from "@fortawesome/free-solid-svg-icons";
import CommonCalendar from "../../../utils/calendar/CommonCalendar";
import { CreateWaveDatesConfig } from "../../../../types/waves.types";
import { CREATE_WAVE_START_DATE_LABELS } from "../../../../helpers/waves/waves.constants";
import { ApiWaveType } from "../../../../generated/models/ApiWaveType";
import { Time } from "../../../../helpers/time";
import DateAccordion from "../../../common/DateAccordion";
import TooltipIconButton from "../../../common/TooltipIconButton";

interface StartDatesProps {
  readonly waveType: ApiWaveType;
  readonly dates: CreateWaveDatesConfig;
  readonly setDates: (dates: CreateWaveDatesConfig) => void;
  readonly isExpanded: boolean;
  readonly setIsExpanded: (expanded: boolean) => void;
}

export default function StartDates({
  waveType,
  dates,
  setDates,
  isExpanded,
  setIsExpanded,
}: StartDatesProps) {
  const [minVotingTimestamp, setMinVotingTimestamp] = useState<number | null>(
    null
  );
  const isRankWave = waveType === ApiWaveType.Rank;

  useEffect(() => {
    setMinVotingTimestamp(isRankWave ? dates.submissionStartDate : null);
  }, [isRankWave, dates.submissionStartDate]);

  const handleSubmissionDateChange = (timestamp: number) => {
    const adjustedTimestamp = Math.max(timestamp, Time.currentMillis());
    setDates({
      ...dates,
      submissionStartDate: adjustedTimestamp,
      votingStartDate: isRankWave
        ? Math.max(dates.votingStartDate, adjustedTimestamp)
        : adjustedTimestamp,
    });
  };

  const handleVotingDateChange = (timestamp: number) => {
    setDates({
      ...dates,
      votingStartDate: Math.max(timestamp, dates.submissionStartDate),
    });
  };

  const formatShortDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const submissionDateFormatted = formatShortDate(dates.submissionStartDate);
  const votingDateFormatted = formatShortDate(dates.votingStartDate);

  return (
    <DateAccordion
      title={
        <div className="tw-flex tw-items-center tw-gap-x-2">
          <span>Wave Timeline</span>
          <TooltipIconButton
            icon={faInfoCircle}
            tooltipText="Set when your wave begins accepting submissions and when voting starts. These dates create the foundational timeline for your wave."
            tooltipPosition="bottom"
            tooltipWidth="tw-w-80"
          />
        </div>
      }
      isExpanded={isExpanded}
      onToggle={() => setIsExpanded(!isExpanded)}
      collapsedContent={
        <div className="tw-flex tw-items-center tw-space-x-4">
          <div className="tw-flex tw-items-center tw-bg-iron-700/40 tw-px-3 tw-py-2 tw-rounded-lg tw-shadow-md hover:tw-translate-y-[-1px] tw-transition-transform tw-duration-200">
            <FontAwesomeIcon
              icon={faCalendarDays}
              className="tw-mr-2 tw-size-4 tw-text-primary-400"
            />
            <div>
              <p className="tw-mb-0 tw-text-xs tw-text-iron-300/70">
                Drops Submission Opens
              </p>
              <p className="tw-mb-0 tw-text-sm tw-font-medium tw-text-iron-50">
                {submissionDateFormatted}
              </p>
            </div>
          </div>
          {isRankWave && (
            <div className="tw-flex tw-items-center tw-bg-iron-700/40 tw-px-3 tw-py-2 tw-rounded-lg tw-shadow-md hover:tw-translate-y-[-1px] tw-transition-transform tw-duration-200">
              <FontAwesomeIcon
                icon={faCalendarDays}
                className="tw-mr-2 tw-size-4 tw-text-primary-400"
              />
              <div>
                <p className="tw-mb-0 tw-text-xs tw-text-iron-300/70">
                  Drops Voting Begins
                </p>
                <p className="tw-mb-0 tw-text-sm tw-font-medium tw-text-iron-50">
                  {votingDateFormatted}
                </p>
              </div>
            </div>
          )}
        </div>
      }
    >
      {/* Calendar Selection */}
      <div className="tw-grid tw-grid-cols-1 tw-gap-y-8 tw-gap-x-10 md:tw-grid-cols-2 tw-px-5 tw-pb-5 tw-pt-2">
        <div className="tw-col-span-1">
          <p className="tw-mb-0 tw-text-lg sm:tw-text-xl tw-font-semibold tw-text-iron-50">
            {CREATE_WAVE_START_DATE_LABELS[waveType]}
          </p>
          <p className="tw-text-xs tw-text-iron-400 tw-mt-1">
            Creators begin submitting work to your wave
          </p>
          <div className="tw-mt-4">
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
              Drops Voting Begins
            </p>
            <p className="tw-text-xs tw-text-iron-400 tw-mt-1">
              Community voting on wave submissions begins
            </p>
            <div className="tw-mt-4">
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
