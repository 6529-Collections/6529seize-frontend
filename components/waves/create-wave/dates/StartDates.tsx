import { useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCalendarDays, faInfoCircle } from "@fortawesome/free-regular-svg-icons";
import { faArrowRight } from "@fortawesome/free-solid-svg-icons";
import CommonCalendar from "../../../utils/calendar/CommonCalendar";
import { CreateWaveDatesConfig } from "../../../../types/waves.types";
import { CREATE_WAVE_START_DATE_LABELS } from "../../../../helpers/waves/waves.constants";
import { ApiWaveType } from "../../../../generated/models/ApiWaveType";
import { Time } from "../../../../helpers/time";
import { CREATE_WAVE_VALIDATION_ERROR } from "../../../../helpers/waves/create-wave.validation";
import DateAccordion from "../../../common/DateAccordion";
import TooltipIconButton from "../../../common/TooltipIconButton";
import { formatDate } from "../services/waveDecisionService";

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
  const firstDecisionFormatted = formatShortDate(dates.firstDecisionTime);

  // Calculate time differences for context
  const daysBetweenSubmissionAndVoting = isRankWave ? 
    Math.round((dates.votingStartDate - dates.submissionStartDate) / (1000 * 60 * 60 * 24)) : 0;
  
  const daysBetweenVotingAndDecision = Math.round(
    (dates.firstDecisionTime - (isRankWave ? dates.votingStartDate : dates.submissionStartDate)) / (1000 * 60 * 60 * 24)
  );

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
        <div className="tw-flex tw-items-center tw-space-x-6">
          <div className="tw-flex tw-items-center tw-bg-[#24242B] tw-px-3 tw-py-2 tw-rounded-lg tw-shadow-md hover:tw-translate-y-[-1px] tw-transition-transform tw-duration-200">
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
            <div className="tw-flex tw-items-center tw-bg-[#24242B] tw-px-3 tw-py-2 tw-rounded-lg tw-shadow-md hover:tw-translate-y-[-1px] tw-transition-transform tw-duration-200">
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
      {/* Introduction Text */}
      <div className="tw-px-5 tw-pt-0.5">
        <div className="tw-bg-iron-800/30 tw-rounded-lg tw-p-3 tw-my-3">
          <p className="tw-mb-0 tw-text-sm tw-text-iron-300">
            <strong>The Wave Timeline defines the key phases of your wave.</strong> These dates determine when creators can submit work,
            when voting begins, and when winners will be announced.
          </p>
        </div>
      </div>
      
      {/* Calendar Selection */}
      <div className="tw-grid tw-grid-cols-1 tw-gap-y-8 tw-gap-x-10 md:tw-grid-cols-2 tw-px-5 tw-pb-5 tw-pt-2">
        <div className="tw-col-span-1">
          <p className="tw-mb-0 tw-text-lg sm:tw-text-xl tw-font-semibold tw-text-iron-50">
            {CREATE_WAVE_START_DATE_LABELS[waveType]}
          </p>
          <p className="tw-text-xs tw-text-iron-400 tw-mb-2">
            This is when creators can begin submitting their work to your wave
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
              Drops Voting Begins
            </p>
            <p className="tw-text-xs tw-text-iron-400 tw-mb-2">
              This is when community members can start voting on submissions
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
