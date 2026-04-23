"use client";

import { useMemo } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCalendarAlt, faInfoCircle } from "@fortawesome/free-solid-svg-icons";
import CommonCalendar from "@/components/utils/calendar/CommonCalendar";
import type { CreateWaveDatesConfig } from "@/types/waves.types";
import DateAccordion from "@/components/common/DateAccordion";
import TimePicker from "@/components/common/TimePicker";
import TooltipIconButton from "@/components/common/TooltipIconButton";
import { CREATE_WAVE_VALIDATION_ERROR } from "@/helpers/waves/create-wave.validation";

interface CreateWaveDatesApproveEndProps {
  readonly dates: CreateWaveDatesConfig;
  readonly errors: CREATE_WAVE_VALIDATION_ERROR[];
  readonly setDates: (dates: CreateWaveDatesConfig) => void;
  readonly isExpanded: boolean;
  readonly setIsExpanded: (expanded: boolean) => void;
}

const getEarliestValidEndDate = (submissionStartDate: number) => {
  const earliestValidEndDate = new Date(submissionStartDate);
  earliestValidEndDate.setSeconds(0, 0);
  earliestValidEndDate.setMinutes(earliestValidEndDate.getMinutes() + 1);
  return earliestValidEndDate;
};

const clampToEarliestValidEndDate = (
  candidateDate: Date,
  submissionStartDate: number
) => {
  const earliestValidEndTimestamp =
    getEarliestValidEndDate(submissionStartDate).getTime();
  return new Date(Math.max(candidateDate.getTime(), earliestValidEndTimestamp));
};

const formatDateTime = (timestamp: number) =>
  new Date(timestamp).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });

export default function CreateWaveDatesApproveEnd({
  dates,
  errors,
  setDates,
  isExpanded,
  setIsExpanded,
}: CreateWaveDatesApproveEndProps) {
  const endDate = dates.endDate;
  const hasSelectedEndDate = endDate !== null && Number.isFinite(endDate);
  const hasEndDateError =
    !hasSelectedEndDate &&
    errors.includes(CREATE_WAVE_VALIDATION_ERROR.END_DATE_REQUIRED);
  const endDateErrorId = "approve-wave-end-date-error";
  const earliestValidEndTimestamp = useMemo(
    () => getEarliestValidEndDate(dates.submissionStartDate).getTime(),
    [dates.submissionStartDate]
  );
  const displayedTimestamp = endDate ?? earliestValidEndTimestamp;

  const minTime = useMemo(() => {
    const minDate = new Date(earliestValidEndTimestamp);
    return {
      hours: minDate.getHours(),
      minutes: minDate.getMinutes(),
    };
  }, [earliestValidEndTimestamp]);

  const displayedDate = useMemo(
    () => new Date(displayedTimestamp),
    [displayedTimestamp]
  );
  const earliestValidEndDate = useMemo(
    () => new Date(earliestValidEndTimestamp),
    [earliestValidEndTimestamp]
  );
  const isSameDayAsEarliestValidEnd =
    hasSelectedEndDate &&
    displayedDate.toDateString() === earliestValidEndDate.toDateString();

  const collapsedContent =
    endDate !== null && Number.isFinite(endDate) ? (
      <div className="tw-flex tw-items-center tw-rounded-lg tw-bg-iron-700/40 tw-px-3 tw-py-2 tw-shadow-md tw-transition-transform tw-duration-200 hover:tw-translate-y-[-1px]">
        <FontAwesomeIcon
          icon={faCalendarAlt}
          className="tw-mr-2 tw-size-4 tw-text-primary-400"
        />
        <div>
          <p className="tw-mb-0 tw-text-xs tw-text-iron-300/70">Wave Ends</p>
          <p className="tw-mb-0 tw-text-sm tw-font-medium tw-text-iron-50">
            {formatDateTime(endDate)}
          </p>
        </div>
      </div>
    ) : (
      <div
        className={`tw-flex tw-items-center tw-rounded-lg tw-px-3 tw-py-2 tw-shadow-md tw-transition-transform tw-duration-200 hover:tw-translate-y-[-1px] ${
          hasEndDateError
            ? "tw-bg-iron-700/40 tw-ring-1 tw-ring-error"
            : "tw-bg-iron-700/40"
        }`}
      >
        <FontAwesomeIcon
          icon={faCalendarAlt}
          className={`tw-mr-2 tw-size-4 ${
            hasEndDateError ? "tw-text-error" : "tw-text-primary-400"
          }`}
        />
        <div>
          <p className="tw-mb-0 tw-text-xs tw-text-iron-300/70">Wave Ends</p>
          <p
            className={`tw-mb-0 tw-text-sm tw-font-medium ${
              hasEndDateError ? "tw-text-error" : "tw-text-iron-50"
            }`}
          >
            {hasEndDateError ? "Required" : "Select wave end"}
          </p>
        </div>
      </div>
    );

  const handleDateSelection = (timestamp: number) => {
    const currentDate = new Date(displayedTimestamp);
    const newDate = new Date(timestamp);
    const currentHours = currentDate.getHours();
    const currentMinutes = currentDate.getMinutes();
    newDate.setHours(currentHours, currentMinutes, 0, 0);
    const newTimestamp = clampToEarliestValidEndDate(
      newDate,
      dates.submissionStartDate
    ).getTime();
    setDates({
      ...dates,
      endDate: newTimestamp,
    });
  };

  const handleTimeChange = (hours: number, minutes: number) => {
    const nextDate = new Date(displayedTimestamp);
    nextDate.setHours(hours, minutes, 0, 0);
    const newTimestamp = clampToEarliestValidEndDate(
      nextDate,
      dates.submissionStartDate
    ).getTime();
    setDates({
      ...dates,
      endDate: newTimestamp,
    });
  };

  return (
    <DateAccordion
      title={
        <div className="tw-flex tw-items-center tw-gap-x-2">
          <span>
            Wave End{" "}
            <span className="tw-text-error" aria-hidden="true">
              *
            </span>
          </span>
          <TooltipIconButton
            icon={faInfoCircle}
            tooltipText="Choose when the approve wave closes. This is the actual end timestamp sent to the API."
            tooltipPosition="bottom"
            tooltipWidth="tw-w-80"
          />
        </div>
      }
      isExpanded={isExpanded}
      onToggle={() => setIsExpanded(!isExpanded)}
      collapsedContent={collapsedContent}
    >
      <div className="tw-px-5 tw-pb-5 tw-pt-2">
        {hasEndDateError && (
          <div
            id={endDateErrorId}
            role="alert"
            className="tw-mb-3 tw-flex tw-items-center tw-gap-x-2 tw-text-xs tw-font-medium tw-text-error"
          >
            <svg
              className="tw-size-4 tw-flex-shrink-0"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
            >
              <path
                d="M12 8V12M12 16H12.01M22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12Z"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <span>Choose a wave end before continuing.</span>
          </div>
        )}
        <div className="tw-grid tw-grid-cols-1 tw-gap-x-10 tw-gap-y-8 md:tw-grid-cols-2">
          <div className="tw-w-full">
            <p className="tw-mb-2 tw-text-sm tw-font-medium tw-text-iron-300">
              Select End Date:
            </p>
            <CommonCalendar
              initialMonth={displayedDate.getMonth()}
              initialYear={displayedDate.getFullYear()}
              selectedTimestamp={endDate}
              minTimestamp={earliestValidEndTimestamp}
              maxTimestamp={null}
              setSelectedTimestamp={handleDateSelection}
            />
          </div>

          <div className="tw-w-full">
            <p className="tw-mb-2 tw-text-sm tw-font-medium tw-text-iron-300">
              Select End Time:
            </p>
            <TimePicker
              hours={displayedDate.getHours()}
              minutes={displayedDate.getMinutes()}
              onTimeChange={handleTimeChange}
              minTime={isSameDayAsEarliestValidEnd ? minTime : null}
              disabled={!hasSelectedEndDate}
            />
            {!hasSelectedEndDate && (
              <p className="tw-mt-2 tw-text-xs tw-text-iron-400">
                Pick an end date first. The earliest allowed end time is{" "}
                {formatDateTime(earliestValidEndTimestamp)}.
              </p>
            )}
          </div>
        </div>
      </div>
    </DateAccordion>
  );
}
