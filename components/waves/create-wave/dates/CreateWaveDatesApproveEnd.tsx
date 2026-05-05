"use client";

import { useMemo } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faInfoCircle, faXmark } from "@fortawesome/free-solid-svg-icons";
import CommonCalendar from "@/components/utils/calendar/CommonCalendar";
import type { CreateWaveDatesConfig } from "@/types/waves.types";
import TimePicker from "@/components/common/TimePicker";
import TooltipIconButton from "@/components/common/TooltipIconButton";
import { CREATE_WAVE_VALIDATION_ERROR } from "@/helpers/waves/create-wave.validation";
import {
  clampApproveWaveEndDate,
  getEarliestApproveWaveEndTimestamp,
} from "./approveWaveDates.helpers";

interface CreateWaveDatesApproveEndProps {
  readonly dates: CreateWaveDatesConfig;
  readonly errors: CREATE_WAVE_VALIDATION_ERROR[];
  readonly setDates: (dates: CreateWaveDatesConfig) => void;
}

const formatDateTime = (timestamp: number) =>
  new Date(timestamp).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });

const END_DATE_TOOLTIP_TEXT =
  "Choose when the approve wave closes. Leave it blank to keep the wave open " +
  "until max winners is reached, or indefinitely if max winners is blank.";

export default function CreateWaveDatesApproveEnd({
  dates,
  errors,
  setDates,
}: CreateWaveDatesApproveEndProps) {
  const endDate = dates.endDate;
  const selectedEndDate =
    endDate !== null && Number.isFinite(endDate) ? endDate : null;
  const hasSelectedEndDate = selectedEndDate !== null;
  const hasEndBeforeStartError = errors.includes(
    CREATE_WAVE_VALIDATION_ERROR.END_DATE_MUST_BE_AFTER_VOTING_START_DATE
  );
  const endDateErrorId = "approve-wave-end-date-error";
  const earliestValidEndTimestamp = useMemo(
    () => getEarliestApproveWaveEndTimestamp(dates.submissionStartDate),
    [dates.submissionStartDate]
  );
  const displayedTimestamp = selectedEndDate ?? earliestValidEndTimestamp;

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

  const handleDateSelection = (timestamp: number) => {
    const currentDate = new Date(displayedTimestamp);
    const newDate = new Date(timestamp);
    const currentHours = currentDate.getHours();
    const currentMinutes = currentDate.getMinutes();
    newDate.setHours(currentHours, currentMinutes, 0, 0);
    const newTimestamp = clampApproveWaveEndDate(
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
    const newTimestamp = clampApproveWaveEndDate(
      nextDate,
      dates.submissionStartDate
    ).getTime();
    setDates({
      ...dates,
      endDate: newTimestamp,
    });
  };

  const handleClearEndDate = () => {
    setDates({
      ...dates,
      endDate: null,
    });
  };

  return (
    <section className="tw-rounded-xl tw-bg-iron-900 tw-px-5 tw-pb-5 tw-pt-5 tw-shadow-sm tw-ring-1 tw-ring-iron-700/50">
      <div className="tw-flex tw-flex-col tw-gap-3 sm:tw-flex-row sm:tw-items-start sm:tw-justify-between">
        <div>
          <div className="tw-flex tw-items-center tw-gap-x-2">
            <h3 className="tw-mb-0 tw-text-base tw-font-semibold tw-text-iron-300">
              Wave End
            </h3>
            <TooltipIconButton
              icon={faInfoCircle}
              tooltipText={END_DATE_TOOLTIP_TEXT}
              tooltipPosition="bottom"
              tooltipWidth="tw-w-80"
            />
          </div>
          <p className="tw-mb-0 tw-mt-1 tw-text-xs tw-text-iron-400">
            Optional. Leave blank for no end date.
          </p>
        </div>

        <div className="tw-rounded-lg tw-bg-iron-700/40 tw-px-3 tw-py-2 tw-shadow-md">
          <p className="tw-mb-0 tw-text-xs tw-text-iron-300/70">Wave Ends</p>
          <div className="tw-flex tw-items-center tw-gap-x-2">
            <p
              className={`tw-mb-0 tw-text-sm tw-font-medium ${
                hasEndBeforeStartError ? "tw-text-error" : "tw-text-iron-50"
              }`}
            >
              {selectedEndDate !== null
                ? formatDateTime(selectedEndDate)
                : "No end date"}
            </p>
            {hasSelectedEndDate && (
              <button
                type="button"
                aria-label="Clear end date"
                onClick={handleClearEndDate}
                className="tw-flex tw-size-6 tw-items-center tw-justify-center tw-rounded-full tw-border tw-border-solid tw-border-iron-600 tw-bg-iron-800 tw-text-iron-300 tw-transition tw-duration-300 hover:tw-border-primary-400 hover:tw-text-primary-300"
              >
                <FontAwesomeIcon icon={faXmark} className="tw-size-3" />
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="tw-mt-5">
        {hasEndBeforeStartError && (
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
            <span>Wave end must be after wave start.</span>
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
              selectedTimestamp={selectedEndDate}
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
    </section>
  );
}
