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
import PrimaryButton from "@/components/utils/button/PrimaryButton";

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

  return (
    <div className="tw-mt-5 tw-bg-iron-900">
      <div className="tw-flex tw-items-center tw-justify-between">
        <h3 className="tw-mb-2 tw-text-lg tw-font-semibold tw-text-iron-50">
          Additional Announcements
        </h3>
      </div>

      {/* Explanation about sequence */}
      <div className="tw-mb-2 tw-border-b tw-border-iron-700/30 tw-pb-3">
        <p className="tw-mb-0 tw-text-xs tw-text-iron-300">
          <span className="tw-font-medium tw-text-primary-400">Timeline:</span>{" "}
          Define when winners will be selected throughout your wave.
        </p>
      </div>

      <div className="tw-relative tw-mb-6 tw-ml-2 tw-pl-2">
        {/* First Decision Point */}
        <div className="tw-relative tw-mb-6">
          {/* Timeline dot */}
          <div className="tw-absolute tw-left-[-14px] tw-top-3 tw-flex tw-h-6 tw-w-6 tw-items-center tw-justify-center tw-rounded-full tw-bg-primary-500 tw-text-xs tw-font-semibold tw-text-black tw-ring-4 tw-ring-iron-800">
            1
          </div>

          {/* Content */}
          <div className="tw-rounded-lg tw-border-l-4 tw-border-primary-500 tw-bg-iron-700/40 tw-px-4 tw-py-3 tw-shadow-md">
            <div className="tw-mb-0.5 tw-text-xs tw-font-medium tw-text-primary-300">
              First Winners Announcement
            </div>
            <p className="tw-mb-0 tw-flex tw-items-center tw-text-sm tw-font-medium tw-text-iron-50">
              {formatDate(firstDecisionTime)}
              <span className="tw-ml-1 tw-text-xs tw-text-iron-400">
                (
                {new Date(firstDecisionTime).toLocaleDateString(undefined, {
                  weekday: "long",
                })}
                )
              </span>
            </p>
          </div>
        </div>

        {/* Subsequent Decisions */}
        {subsequentDecisions.map((interval, index) => (
          <div key={index} className="tw-relative tw-mb-6">
            {/* Timeline dot */}
            <div className="tw-absolute tw-left-[-14px] tw-top-3 tw-flex tw-h-6 tw-w-6 tw-items-center tw-justify-center tw-rounded-full tw-bg-primary-400/80 tw-text-xs tw-font-semibold tw-text-black tw-ring-4 tw-ring-iron-800">
              {index + 2}
            </div>

            {/* Interval indicator on the timeline */}
            <div className="tw-absolute tw-left-[-22px] tw-top-[-8px] tw-flex tw-items-center tw-justify-center">
              <span className="tw-whitespace-nowrap tw-rounded tw-border tw-border-iron-700/70 tw-bg-iron-900 tw-px-1.5 tw-py-0.5 tw-text-xs tw-font-medium tw-text-primary-300">
                +
                {interval >= periodToMs(1, Period.WEEKS)
                  ? `${Math.round(interval / periodToMs(1, Period.WEEKS))}w`
                  : interval >= periodToMs(1, Period.DAYS)
                    ? `${Math.round(interval / periodToMs(1, Period.DAYS))}d`
                    : `${Math.round(interval / periodToMs(1, Period.HOURS))}h`}
              </span>
            </div>

            {/* Content */}
            <div className="tw-group tw-rounded-lg tw-border-l-4 tw-border-primary-400/70 tw-bg-[#24242B] tw-px-4 tw-py-3 tw-shadow-sm tw-transition-all tw-duration-200 hover:tw-shadow-md">
              <div className="tw-flex tw-items-start tw-justify-between">
                <div>
                  <div className="tw-mb-0.5 tw-text-xs tw-font-medium tw-text-primary-300/90">
                    Winners Announcement #{index + 2}
                  </div>
                  <p className="tw-mb-0 tw-flex tw-items-center tw-text-sm tw-font-medium tw-text-iron-50">
                    {formatDate(decisionDates[index + 1]!)}
                    <span className="tw-ml-1 tw-text-xs tw-text-iron-400">
                      (
                      {new Date(decisionDates[index + 1]!).toLocaleDateString(
                        undefined,
                        { weekday: "long" }
                      )}
                      )
                    </span>
                  </p>
                </div>

                <button
                  onClick={(e) => handleDeleteDecision(index, e)}
                  className="tw-flex tw-size-7 tw-items-center tw-justify-center tw-rounded-full tw-border-0 tw-bg-iron-700/30 tw-opacity-0 tw-transition-all tw-duration-300 group-hover:tw-opacity-100 hover:tw-bg-iron-700/60 desktop-hover:hover:tw-text-red"
                >
                  <FontAwesomeIcon icon={faTrashCan} className="tw-size-3.5" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add New Decision Point */}
      <div className="tw-mt-6 tw-rounded-lg tw-bg-iron-800/60 tw-p-4">
        <div className="tw-mb-3 tw-flex tw-items-center">
          <div className="tw-mr-3 tw-flex tw-h-8 tw-w-8 tw-items-center tw-justify-center tw-rounded-full tw-bg-primary-500/20 tw-text-xs tw-font-medium tw-text-primary-400">
            <FontAwesomeIcon
              icon={faCalendarPlus}
              className="tw-size-4 tw-flex-shrink-0"
            />
          </div>
          <div>
            <p className="tw-mb-0 tw-text-base tw-font-medium tw-text-iron-50">
              Schedule Next Winners Announcement
            </p>
            <p className="tw-mb-0 tw-text-xs tw-text-iron-400">
              Set time between announcements
            </p>
          </div>
        </div>

        <div className="tw-flex tw-flex-wrap tw-items-center tw-gap-3">
          <div className="tw-flex tw-min-w-0 tw-flex-1 tw-basis-56 tw-items-stretch tw-rounded-lg">
            <div className="tw-w-24 tw-rounded-l-lg tw-bg-iron-900 tw-ring-1 tw-ring-inset tw-ring-iron-700 tw-transition tw-duration-300 tw-ease-out focus-within:tw-ring-primary-400">
              <input
                type="number"
                min="1"
                value={additionalTime}
                onChange={(e) =>
                  setAdditionalTime(
                    e.target.value === "" ? 0 : parseInt(e.target.value, 10)
                  )
                }
                className="tw-h-full tw-w-full tw-border-0 tw-bg-transparent tw-px-4 tw-py-4 tw-font-medium tw-text-primary-400 tw-caret-primary-300 [appearance:textfield] focus:tw-outline-none [&::-webkit-inner-spin-button]:tw-appearance-none [&::-webkit-outer-spin-button]:tw-appearance-none"
                aria-label="Time value"
              />
            </div>
            <DecisionPointDropdown
              value={timeframeUnit}
              onChange={(value) => setTimeframeUnit(value)}
            />
          </div>

          <div className="tw-flex-shrink-0">
            <PrimaryButton
              onClicked={handleAddTimeframe}
              disabled={!additionalTime}
              loading={false}
              padding="tw-px-4 tw-py-2.5"
            >
              Add to Timeline
            </PrimaryButton>
          </div>
        </div>

        {/* Preview next announcement if settings are valid */}
        {additionalTime > 0 && (
          <div className="tw-mt-4">
            <div className="tw-flex tw-items-center">
              <div className="tw-text-xs tw-text-iron-400">
                <span className="tw-text-primary-400/80">Preview:</span>{" "}
                {subsequentDecisions.length > 0
                  ? `Next announcement #${subsequentDecisions.length + 2} on`
                  : "First additional announcement on"}
                <span className="tw-ml-1 tw-font-medium tw-text-iron-300">
                  {formatDate(
                    subsequentDecisions.length > 0
                      ? new Date(
                          decisionDates[decisionDates.length - 1]!
                        ).getTime() + periodToMs(additionalTime, timeframeUnit)
                      : new Date(firstDecisionTime).getTime() +
                          periodToMs(additionalTime, timeframeUnit)
                  )}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
