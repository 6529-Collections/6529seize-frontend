"use client";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCalendarAlt,
  faTriangleExclamation,
  faXmark,
} from "@fortawesome/free-solid-svg-icons";
import CommonCalendar from "@/components/utils/calendar/CommonCalendar";
import type { CreateWaveDatesConfig } from "@/types/waves.types";
import CollapsibleCard from "@/components/common/CollapsibleCard";
import TimePicker from "@/components/common/TimePicker";
import {
  countTotalDecisions,
  formatDate,
  getMinimumRollingEndDate,
} from "../services/waveDecisionService";
import { calculateLastDecisionTime } from "@/helpers/waves/create-wave.helpers";
import { CREATE_WAVE_VALIDATION_ERROR } from "@/helpers/waves/create-wave.validation";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";
import { CREATE_WAVE_FORM_STYLES } from "../utils/createWaveFormStyles";

interface RollingEndDateProps {
  readonly dates: CreateWaveDatesConfig;
  readonly errors: CREATE_WAVE_VALIDATION_ERROR[];
  readonly setDates: (dates: CreateWaveDatesConfig) => void;
  readonly isExpanded: boolean;
  readonly setIsExpanded: (expanded: boolean) => void;
}

interface RollingEndDateCollapsedContentProps {
  readonly endDate: number | null;
}

function RollingEndDateCollapsedContent({
  endDate,
}: RollingEndDateCollapsedContentProps) {
  const locale = useBrowserLocale();

  return (
    <span className="tw-flex tw-items-center tw-rounded-lg tw-bg-iron-700/40 tw-px-3 tw-py-2 tw-shadow-md tw-transition-transform tw-duration-200 hover:tw-translate-y-[-1px]">
      <FontAwesomeIcon
        icon={faCalendarAlt}
        className="tw-mr-2 tw-size-4 tw-text-primary-400"
      />
      <span className="tw-block">
        <span className="tw-block tw-text-xs tw-text-iron-300/70">
          {t(locale, "waves.create.dates.rank.end.collapsedLabel")}
        </span>
        <span className="tw-block tw-text-sm tw-font-medium tw-text-iron-50">
          {endDate === null
            ? t(locale, "waves.create.dates.rank.end.noEndDate")
            : formatDate(endDate, locale)}
        </span>
      </span>
    </span>
  );
}

export default function RollingEndDate({
  dates,
  errors,
  setDates,
  isExpanded,
  setIsExpanded,
}: RollingEndDateProps) {
  const locale = useBrowserLocale();
  const isRollingMode = dates.isRolling;
  const hasRankFutureDateError = errors.includes(
    CREATE_WAVE_VALIDATION_ERROR.RANK_DECISION_TIME_MUST_BE_IN_FUTURE
  );
  const hasEndDateBeforeVotingStartError = errors.includes(
    CREATE_WAVE_VALIDATION_ERROR.END_DATE_MUST_BE_AFTER_VOTING_START_DATE
  );
  const shouldShowExpandedContent =
    isExpanded || hasRankFutureDateError || hasEndDateBeforeVotingStartError;
  const selectedEndDate =
    dates.endDate !== null && Number.isFinite(dates.endDate)
      ? dates.endDate
      : null;
  const hasSelectedEndDate = selectedEndDate !== null;
  const minEndDate = getMinimumRollingEndDate(
    dates.firstDecisionTime,
    dates.subsequentDecisions
  );
  const displayedTimestamp = selectedEndDate ?? minEndDate;
  const displayedDate = new Date(displayedTimestamp);
  const displayedHours = displayedDate.getHours();
  const displayedMinutes = displayedDate.getMinutes();

  const handleDateSelection = (timestamp: number) => {
    const date = new Date(timestamp);
    date.setHours(displayedHours, displayedMinutes, 0, 0);
    setDates({
      ...dates,
      endDate: date.getTime(),
    });
  };

  const handleTimeChange = (h: number, m: number) => {
    if (selectedEndDate === null) return;

    const date = new Date(selectedEndDate);
    date.setHours(h, m, 0, 0);
    setDates({
      ...dates,
      endDate: date.getTime(),
    });
  };

  const handleClearEndDate = () => {
    setDates({
      ...dates,
      endDate: null,
    });
  };

  // Calculate total decisions that will occur
  const calculateTotalDecisions = () => {
    if (selectedEndDate === null) return 0;
    return countTotalDecisions(
      dates.firstDecisionTime,
      dates.subsequentDecisions,
      selectedEndDate
    );
  };

  const collapsedContent = (
    <RollingEndDateCollapsedContent endDate={selectedEndDate} />
  );

  return (
    <div className="tw-relative">
      <CollapsibleCard
        title={
          <span className="tw-text-iron-100">
            {t(locale, "waves.create.dates.rank.end.optionalTitle")}
          </span>
        }
        isExpanded={shouldShowExpandedContent}
        onToggle={() => setIsExpanded(!shouldShowExpandedContent)}
        collapsedContent={collapsedContent}
      >
        <div className="tw-px-5 tw-pb-5 tw-pt-2">
          {/* Date and Time Selection Container */}
          <div className="tw-col-span-2">
            <div className="tw-mb-3 tw-flex tw-flex-col tw-gap-3 sm:tw-flex-row sm:tw-items-start sm:tw-justify-between">
              <div>
                <h3 className={CREATE_WAVE_FORM_STYLES.sectionTitle}>
                  {t(locale, "waves.create.dates.rank.end.setTitle")}
                </h3>
                <p
                  className={`tw-mt-1 ${CREATE_WAVE_FORM_STYLES.compactSupportingText}`}
                >
                  {t(locale, "waves.create.dates.rank.end.description")}
                </p>
              </div>
              <div className="tw-rounded-lg tw-bg-iron-700/40 tw-px-3 tw-py-2 tw-shadow-md">
                <p className="tw-mb-0 tw-text-xs tw-text-iron-300/70">
                  {t(locale, "waves.create.dates.rank.end.summaryLabel")}
                </p>
                <div className="tw-flex tw-items-center tw-gap-x-2">
                  <p className="tw-mb-0 tw-text-sm tw-font-medium tw-text-iron-50">
                    {selectedEndDate === null
                      ? t(locale, "waves.create.dates.rank.end.noEndDate")
                      : formatDate(selectedEndDate, locale)}
                  </p>
                  {hasSelectedEndDate && (
                    <button
                      type="button"
                      aria-label={t(
                        locale,
                        "waves.create.dates.rank.end.clearAriaLabel"
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
            {hasRankFutureDateError && (
              <div
                role="alert"
                className="tw-mb-3 tw-flex tw-items-center tw-gap-x-2 tw-rounded-lg tw-border tw-border-error/40 tw-bg-error/10 tw-px-3 tw-py-2 tw-text-xs tw-font-medium tw-text-error"
              >
                <FontAwesomeIcon
                  icon={faTriangleExclamation}
                  className="tw-size-4 tw-flex-shrink-0"
                  aria-hidden="true"
                />
                <span>
                  {t(locale, "waves.create.dates.rank.end.futureError")}
                </span>
              </div>
            )}
            {hasEndDateBeforeVotingStartError && (
              <div
                role="alert"
                className="tw-mb-3 tw-flex tw-items-center tw-gap-x-2 tw-rounded-lg tw-border tw-border-error/40 tw-bg-error/10 tw-px-3 tw-py-2 tw-text-xs tw-font-medium tw-text-error"
              >
                <FontAwesomeIcon
                  icon={faTriangleExclamation}
                  className="tw-size-4 tw-flex-shrink-0"
                  aria-hidden="true"
                />
                <span>
                  {t(locale, "waves.create.dates.rank.end.beforeVotingError")}
                </span>
              </div>
            )}

            <div className="tw-grid tw-grid-cols-1 tw-gap-x-10 tw-gap-y-8 md:tw-grid-cols-2">
              {/* Date selection */}
              <div className="tw-w-full">
                <p className={`tw-mb-2 ${CREATE_WAVE_FORM_STYLES.fieldLabel}`}>
                  {t(locale, "waves.create.dates.rank.end.dateLabel")}
                </p>
                <CommonCalendar
                  initialMonth={displayedDate.getMonth()}
                  initialYear={displayedDate.getFullYear()}
                  selectedTimestamp={selectedEndDate}
                  minTimestamp={minEndDate}
                  maxTimestamp={null}
                  setSelectedTimestamp={handleDateSelection}
                  variant="flat"
                />
              </div>

              {/* Time selection */}
              <div className="tw-w-full">
                <p className={`tw-mb-2 ${CREATE_WAVE_FORM_STYLES.fieldLabel}`}>
                  {t(locale, "waves.create.dates.rank.end.timeLabel")}
                </p>
                <TimePicker
                  hours={displayedHours}
                  minutes={displayedMinutes}
                  onTimeChange={handleTimeChange}
                  disabled={!hasSelectedEndDate}
                  variant="flat"
                />
                {!hasSelectedEndDate && (
                  <p
                    className={`tw-mt-2 ${CREATE_WAVE_FORM_STYLES.compactSupportingText}`}
                  >
                    {t(
                      locale,
                      "waves.create.dates.rank.end.disabledTimeGuidance"
                    )}
                  </p>
                )}

                {/* Last decision time info */}
                {selectedEndDate !== null && isRollingMode && (
                  <div className="tw-mt-4 tw-rounded-lg tw-bg-primary-500/10 tw-p-2">
                    <p className="tw-mb-0 tw-text-xs">
                      <span className="tw-text-iron-300">
                        {t(
                          locale,
                          "waves.create.dates.rank.end.lastAnnouncementLabel"
                        )}
                      </span>
                    </p>
                    <p className="tw-mb-0 tw-text-sm tw-font-medium tw-text-primary-400">
                      {formatDate(
                        calculateLastDecisionTime(
                          dates.firstDecisionTime,
                          dates.subsequentDecisions,
                          selectedEndDate
                        ),
                        locale
                      )}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Explanatory text - moved below the calendar and time picker */}
          <div className="tw-mt-4 tw-rounded-lg tw-bg-iron-800/30 tw-p-3">
            <p className="tw-mb-1 tw-text-sm tw-font-medium tw-text-iron-200">
              {t(
                locale,
                isRollingMode
                  ? "waves.create.dates.rank.end.aboutRecurringTitle"
                  : "waves.create.dates.rank.end.aboutFixedTitle"
              )}
            </p>

            {isRollingMode ? (
              <>
                <p className="tw-mb-2 tw-text-xs tw-text-iron-400">
                  {t(
                    locale,
                    "waves.create.dates.rank.end.recurringDescription"
                  )}
                </p>

                <p className="tw-mb-2 tw-text-xs tw-text-iron-400">
                  {t(
                    locale,
                    "waves.create.dates.rank.end.recurringOpenEndedDescription"
                  )}
                </p>
              </>
            ) : (
              <p className="tw-mb-2 tw-text-xs tw-text-iron-400">
                {t(locale, "waves.create.dates.rank.end.fixedDescription")}
              </p>
            )}

            {/* Display total decisions count when end date is set and in rolling mode */}
            {selectedEndDate !== null && isRollingMode && (
              <div className="tw-mt-3 tw-rounded-lg tw-bg-primary-500/10 tw-p-2">
                <p className="tw-mb-0 tw-flex tw-items-center tw-justify-between tw-text-xs">
                  <span className="tw-text-iron-200">
                    {t(
                      locale,
                      "waves.create.dates.rank.end.totalAnnouncementsLabel"
                    )}
                  </span>
                  <span className="tw-font-semibold tw-text-primary-400">
                    {calculateTotalDecisions()}
                  </span>
                </p>
              </div>
            )}
          </div>
        </div>
      </CollapsibleCard>
    </div>
  );
}
