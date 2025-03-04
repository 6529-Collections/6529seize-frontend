import { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCalendarPlus, faTrashCan } from "@fortawesome/free-regular-svg-icons";
import { Period } from "../../../../helpers/Types";
import DecisionPointDropdown from "./DecisionPointDropdown";
import { calculateDecisionTimes, formatDate } from "../services/waveDecisionService";

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
  const decisionDates = calculateDecisionTimes(firstDecisionTime, subsequentDecisions);
  
  return (
    <div className="tw-bg-iron-800/30 tw-rounded-lg tw-p-4 tw-mb-4">
      <h3 className="tw-text-iron-100 tw-text-base tw-font-medium tw-mb-3">
        Decision Points
      </h3>
      
      {/* First Decision Point (can't be deleted) */}
      <div className="tw-mb-4 tw-relative">
        <div className="tw-flex tw-items-center tw-justify-between tw-h-12 tw-px-3 tw-bg-[#24242B] tw-rounded-lg hover:tw-bg-[#26262E] tw-transition-colors tw-duration-200">
          <div className="tw-flex tw-items-center">
            <div className="tw-flex tw-items-center tw-justify-center tw-w-6 tw-h-6 tw-rounded-full tw-bg-primary-500/20 tw-text-primary-400 tw-text-xs tw-font-medium tw-mr-3">
              1
            </div>
            <p className="tw-mb-0 tw-text-sm tw-font-medium">
              <span className="tw-text-iron-400">
                First decision point:
              </span>{" "}
              <span className="tw-text-iron-50">
                {formatDate(firstDecisionTime)}
              </span>
            </p>
          </div>
        </div>
      </div>
      
      {/* Subsequent Decision Points */}
      {subsequentDecisions.map((_, index) => (
        <div key={index} className="tw-mb-4 tw-relative">
          <div className="tw-flex tw-items-center tw-justify-between tw-h-12 tw-px-3 tw-bg-[#24242B] tw-rounded-lg hover:tw-bg-[#26262E] tw-transition-colors tw-duration-200 tw-group">
            <div className="tw-flex tw-items-center">
              <div className="tw-flex tw-items-center tw-justify-center tw-w-6 tw-h-6 tw-rounded-full tw-bg-primary-500/20 tw-text-primary-400 tw-text-xs tw-font-medium tw-mr-3">
                {index + 2}
              </div>
              <p className="tw-mb-0 tw-text-sm tw-font-medium">
                <span className="tw-text-iron-400">
                  Decision point {index + 2}:
                </span>{" "}
                <span className="tw-text-iron-50">
                  {formatDate(decisionDates[index + 1])}
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
      <div>
        <div className="tw-flex tw-items-center tw-mb-2">
          <div className="tw-flex tw-items-center tw-justify-center tw-size-7 tw-rounded-full tw-bg-primary-500/20 tw-text-primary-400 tw-text-xs tw-font-medium tw-mr-3">
            <FontAwesomeIcon
              icon={faCalendarPlus}
              className="tw-size-3.5 tw-flex-shrink-0"
            />
          </div>
          <p className="tw-mb-0 tw-text-base tw-font-medium tw-text-iron-50">
            Add decision point
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
                    e.target.value === ""
                      ? 0
                      : parseInt(e.target.value, 10)
                  )
                }
                className="tw-w-full tw-h-full tw-px-4 tw-py-4 tw-bg-transparent tw-border-0 tw-text-primary-400 tw-font-medium tw-caret-primary-300 focus:tw-outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:tw-appearance-none [&::-webkit-inner-spin-button]:tw-appearance-none"
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
      </div>
    </div>
  );
}