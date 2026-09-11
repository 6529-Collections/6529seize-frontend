"use client";

import { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCalendarPlus,
  faTrashCan,
} from "@fortawesome/free-regular-svg-icons";
import { Period } from "@/helpers/Types";
import DecisionPointDropdown from "./DecisionPointDropdown";
import {
  calculateDecisionTimes,
  formatDate,
} from "../services/waveDecisionService";
import Button from "@/components/utils/button/Button";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t, tRich } from "@/i18n/messages";
import { CREATE_WAVE_FORM_STYLES } from "../utils/createWaveFormStyles";

interface SubsequentDecisionsProps {
  readonly firstDecisionTime: number;
  readonly subsequentDecisions: number[]; // array of intervals in milliseconds
  readonly setSubsequentDecisions: (decisions: number[]) => void;
}

export default function SubsequentDecisions({
  firstDecisionTime,
  subsequentDecisions,
  setSubsequentDecisions,
}: SubsequentDecisionsProps) {
  const locale = useBrowserLocale();
  const [additionalTime, setAdditionalTime] = useState<number>(1);
  const [timeframeUnit, setTimeframeUnit] = useState<Period>(Period.DAYS);

  // Reset the timeframe unit to HOURS if it was previously set to MINUTES
  useEffect(() => {
    if (timeframeUnit === Period.MINUTES) {
      setTimeframeUnit(Period.HOURS);
    }
  }, [timeframeUnit]);

  // Convert from Period to milliseconds
  const periodToMs = (time: number, period: Period): number => {
    const minute = 60 * 1000;
    const hour = 60 * minute;
    const day = 24 * hour;
    const week = 7 * day;

    switch (period) {
      case Period.MINUTES:
        return time * minute;
      case Period.HOURS:
        return time * hour;
      case Period.DAYS:
        return time * day;
      case Period.WEEKS:
        return time * week;
      default:
        return 0;
    }
  };

  const handleAddTimeframe = () => {
    if (additionalTime <= 0) return;

    // Convert to milliseconds
    const intervalMs = periodToMs(additionalTime, timeframeUnit);

    // Add to the array
    setSubsequentDecisions([...subsequentDecisions, intervalMs]);

    // Reset input
    setAdditionalTime(1);
  };

  const formatInterval = (interval: number) => {
    const week = periodToMs(1, Period.WEEKS);
    const day = periodToMs(1, Period.DAYS);
    const hour = periodToMs(1, Period.HOURS);
    const minute = periodToMs(1, Period.MINUTES);

    if (interval % week === 0) {
      return t(locale, "waves.create.dates.rank.additional.intervalWeeks", {
        count: interval / week,
      });
    }
    if (interval % day === 0) {
      return t(locale, "waves.create.dates.rank.additional.intervalDays", {
        count: interval / day,
      });
    }
    if (interval % hour === 0) {
      return t(locale, "waves.create.dates.rank.additional.intervalHours", {
        count: interval / hour,
      });
    }
    return t(locale, "waves.create.dates.rank.additional.intervalMinutes", {
      count: interval / minute,
    });
  };

  const handleDeleteDecision = (index: number, e: React.MouseEvent) => {
    e.stopPropagation();
    const newDecisions = [...subsequentDecisions];
    newDecisions.splice(index, 1);
    setSubsequentDecisions(newDecisions);
  };

  // Calculate the actual dates for display
  const decisionDates = calculateDecisionTimes(
    firstDecisionTime,
    subsequentDecisions
  );
  const subsequentDecisionRows = subsequentDecisions.map((interval, index) => ({
    interval,
    decisionDate: decisionDates.at(index + 1) ?? firstDecisionTime,
    key: subsequentDecisions.slice(0, index + 1).join("-"),
    announcementNumber: index + 2,
    removeIndex: index,
  }));
  const previewMessageKey =
    subsequentDecisions.length > 0
      ? "waves.create.dates.rank.additional.previewNext"
      : "waves.create.dates.rank.additional.previewFirst";
  const previewBaseTime =
    subsequentDecisions.length > 0
      ? (decisionDates.at(-1) ?? firstDecisionTime)
      : firstDecisionTime;
  const previewDate =
    new Date(previewBaseTime).getTime() +
    periodToMs(additionalTime, timeframeUnit);

  return (
    <div>
      <div className="tw-flex tw-items-center tw-justify-between">
        <h3 className={`tw-mb-2 ${CREATE_WAVE_FORM_STYLES.sectionTitle}`}>
          {t(locale, "waves.create.dates.rank.additional.title")}
        </h3>
      </div>

      {/* Explanation about sequence */}
      <div className="tw-mb-2 tw-border-b tw-border-white/5 tw-pb-3">
        <p className="tw-mb-0 tw-text-xs tw-text-iron-300">
          <span className="tw-font-medium tw-text-primary-400">
            {t(locale, "waves.create.dates.rank.additional.timelineLabel")}
          </span>{" "}
          {t(locale, "waves.create.dates.rank.additional.timelineDescription")}
        </p>
      </div>

      <div className="tw-relative tw-mb-6 tw-ml-2 tw-pl-2">
        {/* First Decision Point */}
        <div className="tw-relative tw-mb-6">
          {/* Timeline dot */}
          <div className="tw-absolute tw-left-[-14px] tw-top-3 tw-flex tw-h-6 tw-w-6 tw-items-center tw-justify-center tw-rounded-full tw-bg-primary-500 tw-text-xs tw-font-semibold tw-text-black tw-ring-4 tw-ring-iron-900">
            1
          </div>

          {/* Content */}
          <div className="tw-rounded-lg tw-border tw-border-solid tw-border-white/5 tw-bg-iron-950/40 tw-px-4 tw-py-3">
            <div className="tw-flex tw-min-h-6 tw-items-center tw-text-xs tw-font-medium tw-text-primary-300">
              {t(locale, "waves.create.dates.rank.additional.firstTitle")}
            </div>
            <p className="tw-mb-0 tw-flex tw-items-center tw-text-sm tw-font-medium tw-text-iron-50">
              {formatDate(firstDecisionTime, locale)}
              <span className="tw-ml-1 tw-text-xs tw-text-iron-400">
                (
                {new Date(firstDecisionTime).toLocaleDateString(locale, {
                  weekday: "long",
                })}
                )
              </span>
            </p>
          </div>
        </div>

        {/* Subsequent Decisions */}
        {subsequentDecisionRows.map(
          ({
            interval,
            decisionDate,
            key,
            announcementNumber,
            removeIndex,
          }) => (
            <div key={`decision-${key}`} className="tw-relative tw-mb-6">
              {/* Timeline dot */}
              <div className="tw-absolute tw-left-[-14px] tw-top-3 tw-flex tw-h-6 tw-w-6 tw-items-center tw-justify-center tw-rounded-full tw-bg-primary-400/80 tw-text-xs tw-font-semibold tw-text-black tw-ring-4 tw-ring-iron-900">
                {announcementNumber}
              </div>

              {/* Interval indicator on the timeline */}
              <div className="tw-absolute tw-left-[-22px] tw-top-[-8px] tw-flex tw-items-center tw-justify-center">
                <span className="tw-whitespace-nowrap tw-rounded tw-border tw-border-white/10 tw-bg-iron-900 tw-px-1.5 tw-py-0.5 tw-text-xs tw-font-medium tw-text-primary-300">
                  +{formatInterval(interval)}
                </span>
              </div>

              {/* Content */}
              <div className="tw-group tw-rounded-lg tw-border tw-border-solid tw-border-white/5 tw-bg-iron-950/40 tw-px-4 tw-py-3 tw-transition-colors tw-duration-300 tw-ease-out desktop-hover:hover:tw-border-white/10">
                <div className="tw-flex tw-items-start tw-justify-between">
                  <div>
                    <div className="tw-flex tw-min-h-6 tw-items-center tw-text-xs tw-font-medium tw-text-primary-300/90">
                      {t(
                        locale,
                        "waves.create.dates.rank.additional.announcementTitle",
                        { number: announcementNumber }
                      )}
                    </div>
                    <p className="tw-mb-0 tw-flex tw-items-center tw-text-sm tw-font-medium tw-text-iron-50">
                      {formatDate(decisionDate, locale)}
                      <span className="tw-ml-1 tw-text-xs tw-text-iron-400">
                        (
                        {new Date(decisionDate).toLocaleDateString(locale, {
                          weekday: "long",
                        })}
                        )
                      </span>
                    </p>
                  </div>

                  <button
                    onClick={(e) => handleDeleteDecision(removeIndex, e)}
                    aria-label={t(
                      locale,
                      "waves.create.dates.rank.additional.removeAriaLabel",
                      { number: announcementNumber }
                    )}
                    // Hover-revealed on pointer devices; always visible where
                    // there is no hover to reveal it (touch phones).
                    className="tw-relative tw-flex tw-size-7 tw-items-center tw-justify-center tw-rounded-full tw-border-0 tw-bg-iron-700/30 tw-transition-all tw-duration-300 after:tw-absolute after:-tw-inset-2 after:tw-content-[''] hover:tw-bg-iron-700/60 focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400 focus-visible:tw-ring-offset-2 focus-visible:tw-ring-offset-iron-900 desktop-hover:tw-opacity-0 desktop-hover:group-hover:tw-opacity-100 desktop-hover:hover:tw-text-red desktop-hover:focus-visible:tw-opacity-100 touch-only:tw-opacity-100"
                  >
                    <FontAwesomeIcon
                      icon={faTrashCan}
                      className="tw-size-3.5"
                    />
                  </button>
                </div>
              </div>
            </div>
          )
        )}
      </div>

      {/* Add New Decision Point */}
      <div className="tw-mt-6">
        <div className="tw-mb-3 tw-grid tw-grid-cols-[2rem_minmax(0,1fr)] tw-items-center tw-gap-x-3 tw-gap-y-1">
          <div className="tw-flex tw-size-8 tw-items-center tw-justify-center tw-rounded-full tw-bg-primary-500/20 tw-text-xs tw-font-medium tw-text-primary-400">
            <FontAwesomeIcon
              icon={faCalendarPlus}
              className="tw-size-4 tw-flex-shrink-0"
            />
          </div>
          <p className="tw-m-0 tw-text-base tw-font-medium tw-text-iron-50">
            {t(locale, "waves.create.dates.rank.additional.scheduleTitle")}
          </p>
          <p className="tw-col-start-2 tw-m-0 tw-text-xs tw-text-iron-400">
            {t(
              locale,
              "waves.create.dates.rank.additional.scheduleDescription"
            )}
          </p>
        </div>

        <div className="tw-flex tw-flex-wrap tw-items-center tw-gap-3">
          <div className="tw-flex tw-min-w-0 tw-flex-1 tw-basis-56 tw-items-stretch tw-rounded-lg">
            <div className="tw-h-11 tw-w-24 tw-rounded-l-lg tw-bg-iron-950 tw-ring-1 tw-ring-inset tw-ring-white/10 tw-transition tw-duration-300 tw-ease-out focus-within:tw-ring-2 focus-within:tw-ring-primary-400 desktop-hover:hover:tw-ring-white/15 desktop-hover:hover:focus-within:tw-ring-primary-400">
              <input
                type="number"
                min="1"
                value={additionalTime}
                onChange={(e) =>
                  setAdditionalTime(
                    e.target.value === "" ? 0 : parseInt(e.target.value, 10)
                  )
                }
                className="tw-h-full tw-w-full tw-border-0 tw-bg-transparent tw-px-4 tw-text-base tw-font-medium tw-text-primary-400 tw-caret-primary-300 [appearance:textfield] focus:tw-outline-none sm:tw-text-sm [&::-webkit-inner-spin-button]:tw-appearance-none [&::-webkit-outer-spin-button]:tw-appearance-none"
                aria-label={t(
                  locale,
                  "waves.create.dates.rank.additional.timeValueAriaLabel"
                )}
              />
            </div>
            <DecisionPointDropdown
              value={timeframeUnit}
              onChange={(value) => setTimeframeUnit(value)}
            />
          </div>

          <div className="tw-flex-shrink-0">
            <Button
              variant="primary"
              size="md"
              onClick={handleAddTimeframe}
              disabled={!additionalTime}
            >
              {t(locale, "waves.create.dates.rank.additional.addButton")}
            </Button>
          </div>
        </div>

        {/* Preview next announcement if settings are valid */}
        {additionalTime > 0 && (
          <div className="tw-mt-4">
            <div className="tw-flex tw-items-center">
              <div className="tw-text-xs tw-text-iron-400">
                <span className="tw-text-primary-400/80">
                  {t(locale, "waves.create.dates.rank.additional.previewLabel")}
                </span>{" "}
                {tRich(locale, previewMessageKey, {
                  number: subsequentDecisions.length + 2,
                  date: (
                    <span
                      key="additional-announcement-preview-date"
                      className="tw-font-medium tw-text-iron-300"
                    >
                      {formatDate(previewDate, locale)}
                    </span>
                  ),
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
