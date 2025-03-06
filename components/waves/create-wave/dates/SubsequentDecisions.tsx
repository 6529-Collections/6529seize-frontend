import { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCalendarPlus,
  faTrashCan,
} from "@fortawesome/free-regular-svg-icons";
import { Period } from "../../../../helpers/Types";
import DecisionPointDropdown from "./DecisionPointDropdown";
import {
  calculateDecisionTimes,
  formatDate,
} from "../services/waveDecisionService";

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
    <div className="tw-border tw-border-iron-700/40 tw-rounded-lg tw-p-4 tw-mb-4 tw-shadow-md">
      <div className="tw-flex tw-items-center tw-justify-between">
        <h3 className="tw-text-iron-50 tw-text-lg tw-font-semibold tw-mb-3">
          Additional Announcements
        </h3>
      </div>

      {/* Explanation about sequence */}
      <div className="tw-border-b tw-border-iron-700/30 tw-pb-3 tw-mb-4">
        <p className="tw-text-xs tw-text-iron-300 tw-mb-0">
          <span className="tw-text-primary-400 tw-font-medium">Timeline:</span> Define when winners will be selected throughout your wave.
        </p>
      </div>

      {/* First Decision Point (can't be deleted) */}
      <div className="tw-relative">
        <div className="tw-flex tw-items-center tw-justify-between tw-h-14 tw-px-4 tw-bg-[#24242B] tw-rounded-lg tw-border-l-4 tw-border-primary-500 tw-shadow-md">
          <div className="tw-flex tw-items-center">
            <div className="tw-flex tw-items-center tw-justify-center tw-w-8 tw-h-8 tw-rounded-full tw-bg-primary-500 tw-text-black tw-text-xs tw-font-bold tw-mr-3">
              1
            </div>
            <div>
              <div className="tw-text-xs tw-text-primary-300 tw-font-medium tw-mb-0.5">First Winners Announcement</div>
              <p className="tw-mb-0 tw-text-sm tw-font-medium tw-text-iron-50">
                {formatDate(firstDecisionTime)}
                <span className="tw-text-xs tw-text-iron-400 tw-ml-1">
                  ({new Date(firstDecisionTime).toLocaleDateString(undefined, {weekday: 'long'})})
                </span>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Visualization of the timeline connection */}
      {subsequentDecisions.length > 0 && (
        <div className="tw-ml-5 tw-my-1 tw-flex tw-items-center">
          <div className="tw-h-0.5 tw-w-3 tw-bg-primary-500/30"></div>
          <div className="tw-text-xs tw-text-iron-400 tw-px-2 tw-py-1 tw-bg-iron-900/30 tw-rounded">+{
            subsequentDecisions[0] >= periodToMs(1, Period.WEEKS) ? 
            `${Math.round(subsequentDecisions[0] / periodToMs(1, Period.WEEKS))} week${Math.round(subsequentDecisions[0] / periodToMs(1, Period.WEEKS)) !== 1 ? 's' : ''}` : 
            subsequentDecisions[0] >= periodToMs(1, Period.DAYS) ? 
            `${Math.round(subsequentDecisions[0] / periodToMs(1, Period.DAYS))} day${Math.round(subsequentDecisions[0] / periodToMs(1, Period.DAYS)) !== 1 ? 's' : ''}` : 
            `${Math.round(subsequentDecisions[0] / periodToMs(1, Period.HOURS))} hour${Math.round(subsequentDecisions[0] / periodToMs(1, Period.HOURS)) !== 1 ? 's' : ''}`
          }</div>
        </div>
      )}

      {/* Subsequent Decision Points */}
      {subsequentDecisions.map((interval, index) => (
        <div key={index} className="tw-relative">
          <div className="tw-flex tw-items-center tw-justify-between tw-h-14 tw-px-4 tw-bg-[#24242B] tw-rounded-lg tw-border-l-4 tw-border-primary-400/70 tw-shadow-sm tw-group">
            <div className="tw-flex tw-items-center">
              <div className="tw-flex tw-items-center tw-justify-center tw-w-8 tw-h-8 tw-rounded-full tw-bg-primary-400/70 tw-text-black tw-text-xs tw-font-bold tw-mr-3">
                {index + 2}
              </div>
              <div>
                <div className="tw-text-xs tw-text-primary-300/90 tw-font-medium tw-mb-0.5">Winners Announcement #{index + 2}</div>
                <p className="tw-mb-0 tw-text-sm tw-font-medium tw-text-iron-50">
                  {formatDate(decisionDates[index + 1])}
                  <span className="tw-text-xs tw-text-iron-400 tw-ml-1">
                    ({new Date(decisionDates[index + 1]).toLocaleDateString(undefined, {weekday: 'long'})})
                  </span>
                </p>
              </div>
            </div>
            <button
              onClick={(e) => handleDeleteDecision(index, e)}
              className="tw-opacity-0 group-hover:tw-opacity-100 tw-transition-opacity tw-duration-200 tw-bg-transparent tw-border-0 tw-text-iron-400 desktop-hover:hover:tw-text-red tw-size-8 tw-rounded-full desktop-hover:hover:tw-bg-[#32323C]"
              aria-label="Delete decision point"
            >
              <FontAwesomeIcon
                icon={faTrashCan}
                className="tw-size-4 tw-flex-shrink-0"
              />
            </button>
          </div>
          
          {/* Display connector for next item if not the last one */}
          {index < subsequentDecisions.length - 1 && (
            <div className="tw-ml-5 tw-my-1 tw-flex tw-items-center">
              <div className="tw-h-0.5 tw-w-3 tw-bg-primary-400/30"></div>
              <div className="tw-text-xs tw-text-iron-400 tw-px-2 tw-py-1 tw-bg-iron-900/30 tw-rounded">+{
                subsequentDecisions[index + 1] >= periodToMs(1, Period.WEEKS) ? 
                `${Math.round(subsequentDecisions[index + 1] / periodToMs(1, Period.WEEKS))} week${Math.round(subsequentDecisions[index + 1] / periodToMs(1, Period.WEEKS)) !== 1 ? 's' : ''}` : 
                subsequentDecisions[index + 1] >= periodToMs(1, Period.DAYS) ? 
                `${Math.round(subsequentDecisions[index + 1] / periodToMs(1, Period.DAYS))} day${Math.round(subsequentDecisions[index + 1] / periodToMs(1, Period.DAYS)) !== 1 ? 's' : ''}` : 
                `${Math.round(subsequentDecisions[index + 1] / periodToMs(1, Period.HOURS))} hour${Math.round(subsequentDecisions[index + 1] / periodToMs(1, Period.HOURS)) !== 1 ? 's' : ''}`
              }</div>
            </div>
          )}
        </div>
      ))}

      {/* Add New Decision Point */}
      <div className="tw-mt-6 tw-bg-iron-900/40 tw-border tw-border-iron-700/30 tw-rounded-lg tw-p-4">
        <div className="tw-flex tw-items-center tw-mb-3">
          <div className="tw-flex tw-items-center tw-justify-center tw-w-8 tw-h-8 tw-rounded-full tw-bg-primary-500/20 tw-text-primary-400 tw-text-xs tw-font-medium tw-mr-3">
            <FontAwesomeIcon
              icon={faCalendarPlus}
              className="tw-size-4 tw-flex-shrink-0"
            />
          </div>
          <div>
            <p className="tw-mb-0 tw-text-base tw-font-medium tw-text-iron-50">
              Schedule Next Winners Announcement
            </p>
            <p className="tw-text-xs tw-text-iron-400 tw-mb-0">
              Set time between announcements
            </p>
          </div>
        </div>

        <div className="tw-flex tw-items-center tw-bg-iron-950/30 tw-rounded-lg tw-p-3">
          <div className="tw-flex tw-items-stretch tw-rounded-lg tw-flex-1 tw-w-full">
            <div className="tw-w-24 tw-bg-iron-900 tw-rounded-l-lg tw-ring-1 tw-ring-iron-700 tw-ring-inset focus-within:tw-ring-primary-400 tw-transition tw-duration-300 tw-ease-out">
              <input
                type="number"
                min="1"
                value={additionalTime}
                onChange={(e) =>
                  setAdditionalTime(
                    e.target.value === "" ? 0 : parseInt(e.target.value, 10)
                  )
                }
                className="tw-w-full tw-h-full tw-px-4 tw-py-4 tw-bg-transparent tw-border-0 tw-text-primary-400 tw-font-medium tw-caret-primary-300 focus:tw-outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:tw-appearance-none [&::-webkit-inner-spin-button]:tw-appearance-none"
                aria-label="Time value"
              />
            </div>
            <DecisionPointDropdown
              value={timeframeUnit}
              onChange={(value) => setTimeframeUnit(value)}
            />
          </div>

          <button
            onClick={handleAddTimeframe}
            disabled={!additionalTime}
            className="tw-ml-3 tw-flex-shrink-0 tw-bg-primary-500 hover:tw-bg-primary-600 disabled:tw-bg-iron-700 disabled:tw-cursor-not-allowed tw-text-white tw-rounded-lg tw-px-4 tw-py-2.5 tw-text-sm tw-transition-all tw-duration-200 tw-border-0"
          >
            Add to Timeline
          </button>
        </div>

        {/* Preview next announcement if settings are valid */}
        {additionalTime > 0 && (
          <div className="tw-mt-4 tw-bg-primary-500/10 tw-rounded-lg tw-p-3 tw-border-l-4 tw-border-primary-500/30">
            <div className="tw-flex tw-items-center">
              <div className="tw-w-8 tw-h-8 tw-flex-shrink-0 tw-rounded-full tw-bg-primary-500/20 tw-flex tw-items-center tw-justify-center tw-mr-3">
                <span className="tw-text-xs tw-font-bold tw-text-primary-400">
                  {subsequentDecisions.length + 2}
                </span>
              </div>
              <div>
                <div className="tw-text-xs tw-text-primary-300 tw-font-medium">
                  <span className="tw-opacity-60">Preview:</span> Next Announcement Date
                </div>
                <p className="tw-text-sm tw-font-medium tw-text-iron-50 tw-mb-0">
                  {formatDate(subsequentDecisions.length > 0 
                    ? new Date(decisionDates[decisionDates.length - 1]).getTime() + periodToMs(additionalTime, timeframeUnit)
                    : new Date(firstDecisionTime).getTime() + periodToMs(additionalTime, timeframeUnit)
                  )}
                  <span className="tw-text-xs tw-text-iron-300 tw-ml-2">
                    ({new Date(subsequentDecisions.length > 0 
                      ? new Date(decisionDates[decisionDates.length - 1]).getTime() + periodToMs(additionalTime, timeframeUnit)
                      : new Date(firstDecisionTime).getTime() + periodToMs(additionalTime, timeframeUnit)
                    ).toLocaleDateString(undefined, {weekday: 'long'})})
                  </span>
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
