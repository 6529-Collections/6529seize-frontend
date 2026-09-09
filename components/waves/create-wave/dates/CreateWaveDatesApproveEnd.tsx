"use client";

import { useMemo } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faInfoCircle, faXmark } from "@fortawesome/free-solid-svg-icons";
import CommonCalendar from "@/components/utils/calendar/CommonCalendar";
import type { CreateWaveDatesConfig } from "@/types/waves.types";
import TimePicker from "@/components/common/TimePicker";
import TooltipIconButton from "@/components/common/TooltipIconButton";
import { CREATE_WAVE_VALIDATION_ERROR } from "@/helpers/waves/create-wave.validation";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";
import type { SupportedLocale } from "@/i18n/locales";
import {
  clampApproveWaveEndDate,
  getEarliestApproveWaveEndTimestamp,
} from "./approveWaveDates.helpers";
import { CREATE_WAVE_FORM_STYLES } from "../utils/createWaveFormStyles";

interface CreateWaveDatesApproveEndProps {
  readonly dates: CreateWaveDatesConfig;
  readonly errors: CREATE_WAVE_VALIDATION_ERROR[];
  readonly setDates: (dates: CreateWaveDatesConfig) => void;
}

const formatDateTime = (timestamp: number, locale: SupportedLocale) =>
  new Date(timestamp).toLocaleString(locale, {
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
}: CreateWaveDatesApproveEndProps) {
  const locale = useBrowserLocale();
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
    <section className="tw-bg-transparent tw-p-5">
      <div className="tw-flex tw-flex-col tw-gap-3 sm:tw-flex-row sm:tw-items-start sm:tw-justify-between">
        <div className="tw-space-y-1">
          <div className="tw-flex tw-items-center tw-gap-x-2">
            <h3 className={CREATE_WAVE_FORM_STYLES.sectionTitle}>
              {t(locale, "waves.create.dates.approve.end.title")}
            </h3>
            <TooltipIconButton
              icon={faInfoCircle}
              tooltipText={t(locale, "waves.create.dates.approve.end.tooltip")}
              tooltipPosition="bottom"
              tooltipWidth="tw-w-80"
              aria-label={t(locale, "waves.create.dates.approve.endInfoLabel")}
              className="tw-flex tw-size-6 tw-shrink-0 tw-items-center tw-justify-center tw-leading-none"
            />
          </div>
          <p className={CREATE_WAVE_FORM_STYLES.compactSupportingText}>
            {t(locale, "waves.create.dates.approve.end.description")}
          </p>
        </div>

        <div className="tw-rounded-lg tw-bg-iron-700/40 tw-px-3 tw-py-2 tw-shadow-md">
          <p className="tw-m-0 tw-text-xs tw-text-iron-300/70">
            {t(locale, "waves.create.dates.approve.end.summaryLabel")}
          </p>
          <div className="tw-flex tw-items-center tw-gap-x-2">
            <p
              className={`tw-m-0 tw-text-sm tw-font-medium ${
                hasEndBeforeStartError ? "tw-text-error" : "tw-text-iron-50"
              }`}
            >
              {selectedEndDate !== null
                ? formatDateTime(selectedEndDate, locale)
                : t(locale, "waves.create.dates.approve.end.noEndDate")}
            </p>
            {hasSelectedEndDate && (
              <button
                type="button"
                aria-label={t(
                  locale,
                  "waves.create.dates.approve.end.clearAriaLabel"
                )}
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
            <span>{t(locale, "waves.create.dates.approve.end.error")}</span>
          </div>
        )}
        <div className="tw-grid tw-grid-cols-1 tw-gap-x-10 tw-gap-y-8 md:tw-grid-cols-2">
          <div className="tw-w-full">
            <p className={`tw-mb-2 ${CREATE_WAVE_FORM_STYLES.fieldLabel}`}>
              {t(locale, "waves.create.dates.approve.end.dateLabel")}
            </p>
            <CommonCalendar
              initialMonth={displayedDate.getMonth()}
              initialYear={displayedDate.getFullYear()}
              selectedTimestamp={selectedEndDate}
              minTimestamp={earliestValidEndTimestamp}
              maxTimestamp={null}
              setSelectedTimestamp={handleDateSelection}
              variant="flat"
            />
          </div>

          <div className="tw-w-full">
            <p className={`tw-mb-2 ${CREATE_WAVE_FORM_STYLES.fieldLabel}`}>
              {t(locale, "waves.create.dates.approve.end.timeLabel")}
            </p>
            <TimePicker
              hours={displayedDate.getHours()}
              minutes={displayedDate.getMinutes()}
              onTimeChange={handleTimeChange}
              minTime={isSameDayAsEarliestValidEnd ? minTime : null}
              disabled={!hasSelectedEndDate}
              variant="flat"
            />
            {!hasSelectedEndDate && (
              <p
                className={`tw-mt-2 ${CREATE_WAVE_FORM_STYLES.compactSupportingText}`}
              >
                {t(
                  locale,
                  "waves.create.dates.approve.end.disabledTimeGuidance",
                  {
                    earliest: formatDateTime(earliestValidEndTimestamp, locale),
                  }
                )}
              </p>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
