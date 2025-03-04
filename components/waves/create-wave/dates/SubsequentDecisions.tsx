import { useState } from "react";
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
    <div className="tw-bg-iron-800/30 tw-rounded-lg tw-p-4 tw-mb-4">
      <div className="tw-flex tw-items-center tw-justify-between">
        <h3 className="tw-text-iron-100 tw-text-base tw-font-medium tw-mb-3">
          Winners Announcements
        </h3>
      </div>

      {/* Explanation about sequence */}
      <div className="tw-bg-iron-900/50 tw-rounded tw-p-2.5 tw-mb-4">
        <p className="tw-text-xs tw-text-iron-300 tw-mb-0">
          These announcements create a sequence where winners are selected. Each date builds upon the previous one, with the schedule shown below.
        </p>
      </div>

      {/* First Decision Point (can't be deleted) */}
      <div className="tw-mb-4 tw-relative">
        <div className="tw-flex tw-items-center tw-justify-between tw-h-12 tw-px-3 tw-bg-[#24242B] tw-rounded-lg hover:tw-bg-[#26262E] tw-transition-colors tw-duration-200">
          <div className="tw-flex tw-items-center">
            <div className="tw-flex tw-items-center tw-justify-center tw-w-6 tw-h-6 tw-rounded-full tw-bg-primary-500/20 tw-text-primary-400 tw-text-xs tw-font-medium tw-mr-3">
              1
            </div>
            <p className="tw-mb-0 tw-text-sm tw-font-medium">
              <span className="tw-text-iron-400">First winners announcement:</span>{" "}
              <span className="tw-text-iron-50">
                {formatDate(firstDecisionTime)}
              </span>
            </p>
          </div>
        </div>
      </div>

      {/* Visualization of the timeline connection */}
      {subsequentDecisions.length > 0 && (
        <div className="tw-ml-3 tw-mb-1 tw-flex tw-flex-col tw-items-center">
          <div className="tw-h-6 tw-w-px tw-bg-primary-500/30"></div>
        </div>
      )}

      {/* Subsequent Decision Points */}
      {subsequentDecisions.map((interval, index) => (
        <div key={index} className="tw-mb-4 tw-relative">
          <div className="tw-flex tw-items-center tw-justify-between tw-h-12 tw-px-3 tw-bg-[#24242B] tw-rounded-lg hover:tw-bg-[#26262E] tw-transition-colors tw-duration-200 tw-group">
            <div className="tw-flex tw-items-center">
              <div className="tw-flex tw-items-center tw-justify-center tw-w-6 tw-h-6 tw-rounded-full tw-bg-primary-500/20 tw-text-primary-400 tw-text-xs tw-font-medium tw-mr-3">
                {index + 2}
              </div>
              <p className="tw-mb-0 tw-text-sm tw-font-medium">
                <span className="tw-text-iron-400">
                  Winners announcement {index + 2}:
                </span>{" "}
                <span className="tw-text-iron-50">
                  {formatDate(decisionDates[index + 1])}
                </span>
                <span className="tw-text-iron-400 tw-text-xs tw-ml-2">
                  (+{interval >= periodToMs(1, Period.WEEKS) ? 
                      `${Math.round(interval / periodToMs(1, Period.WEEKS))} weeks` : 
                      interval >= periodToMs(1, Period.DAYS) ? 
                      `${Math.round(interval / periodToMs(1, Period.DAYS))} days` : 
                      interval >= periodToMs(1, Period.HOURS) ? 
                      `${Math.round(interval / periodToMs(1, Period.HOURS))} hours` : 
                      `${Math.round(interval / periodToMs(1, Period.MINUTES))} minutes`} after previous)
                </span>
              </p>
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
        </div>
      ))}

      {/* Add New Decision Point */}
      <div className="tw-mt-6 tw-border-t tw-border-iron-700/50 tw-pt-4">
        <div className="tw-flex tw-items-center tw-mb-2">
          <div className="tw-flex tw-items-center tw-justify-center tw-size-7 tw-rounded-full tw-bg-primary-500/20 tw-text-primary-400 tw-text-xs tw-font-medium tw-mr-3">
            <FontAwesomeIcon
              icon={faCalendarPlus}
              className="tw-size-3.5 tw-flex-shrink-0"
            />
          </div>
          <p className="tw-mb-0 tw-text-base tw-font-medium tw-text-iron-50">
            Add another winners announcement
          </p>
        </div>

        <div className="tw-ml-10 tw-mb-2">
          <p className="tw-text-xs tw-text-iron-400 tw-mb-0">
            Schedule the next announcement to occur after the previous one:
          </p>
        </div>

        <div className="tw-flex tw-items-center">
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
            Add
          </button>
        </div>

        {/* Preview next announcement if settings are valid */}
        {subsequentDecisions.length > 0 && decisionDates.length > 1 && additionalTime > 0 && (
          <div className="tw-mt-3 tw-ml-10 tw-bg-iron-900/70 tw-rounded tw-p-2 tw-border-l-2 tw-border-primary-500/30">
            <p className="tw-text-xs tw-text-iron-400 tw-mb-0.5">
              <strong>Preview:</strong> With current settings, adding the next announcement would create:
            </p>
            <p className="tw-text-xs tw-text-iron-300 tw-mb-0">
              Winners Announcement #{subsequentDecisions.length + 2} on <span className="tw-text-primary-400 tw-font-medium">{formatDate(new Date(decisionDates[decisionDates.length - 1]).getTime() + periodToMs(additionalTime, timeframeUnit))}</span>
              <span className="tw-text-iron-500"> (+{additionalTime} {timeframeUnit.toLowerCase()} after previous announcement)</span>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
