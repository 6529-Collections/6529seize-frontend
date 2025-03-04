import { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCalendarPlus } from "@fortawesome/free-regular-svg-icons";
import { CreateWaveDatesConfig } from "../../../../types/waves.types";
import { Period } from "../../../../helpers/Types";
import DateAccordion from "../../../common/DateAccordion";
import DecisionsFirst from "./DecisionsFirst";
import SubsequentDecisions from "./SubsequentDecisions";
import { calculateDecisionTimes, formatDate } from "../services/waveDecisionService";

interface DecisionsProps {
  readonly dates: CreateWaveDatesConfig;
  readonly setDates: (dates: CreateWaveDatesConfig) => void;
  readonly isRollingMode: boolean;
  readonly endDateConfig: { time: number | null; period: Period | null };
  readonly setEndDateConfig: (config: {
    time: number | null;
    period: Period | null;
  }) => void;
  readonly isExpanded: boolean;
  readonly setIsExpanded: (expanded: boolean) => void;
  readonly onInteraction: () => void;
}

export default function Decisions({
  dates,
  setDates,
  isRollingMode,
  endDateConfig,
  setEndDateConfig,
  isExpanded,
  setIsExpanded,
  onInteraction,
}: DecisionsProps) {
  // Calculate total decision points for summary
  const totalDecisionPoints = 1 + dates.subsequentDecisions.length;

  const handleUpdateSubsequentDecisions = (decisions: number[]) => {
    setDates({ ...dates, subsequentDecisions: decisions });
    
    // Update end date if not in rolling mode - end date is the last decision
    if (!isRollingMode && !dates.isRolling) {
      if (decisions.length === 0) {
        // If no subsequent decisions, end date is first decision
        setDates({ 
          ...dates, 
          subsequentDecisions: decisions,
          endDate: dates.firstDecisionTime 
        });
      } else {
        // Calculate the last decision time and set it as end date
        const decisionTimes = calculateDecisionTimes(dates.firstDecisionTime, decisions);
        const lastDecisionTime = decisionTimes[decisionTimes.length - 1];
        setDates({ 
          ...dates, 
          subsequentDecisions: decisions,
          endDate: lastDecisionTime 
        });
      }
    }
  };

  const renderCollapsedContent = () => {
    return (
      <div className="tw-flex tw-items-center tw-bg-[#24242B] tw-px-3 tw-py-2 tw-rounded-lg tw-shadow-md hover:tw-translate-y-[-1px] tw-transition-transform tw-duration-200">
        <FontAwesomeIcon
          icon={faCalendarPlus}
          className="tw-mr-2 tw-size-4 tw-text-primary-400"
        />
        <div>
          <p className="tw-mb-0 tw-text-xs tw-text-iron-300/70">
            Decision Points
          </p>
          <p className="tw-mb-0 tw-text-sm tw-font-medium tw-text-iron-50">
            {totalDecisionPoints} point{totalDecisionPoints !== 1 ? 's' : ''} configured
          </p>
        </div>
      </div>
    );
  };

  return (
    <DateAccordion
      title="Winner Announcements"
      isExpanded={isExpanded}
      onToggle={() => setIsExpanded(!isExpanded)}
      collapsedContent={renderCollapsedContent()}
    >
      <div
        className="tw-grid tw-grid-cols-1 tw-gap-y-4 tw-gap-x-10 md:tw-grid-cols-2 tw-px-5 tw-pb-5 tw-pt-2"
        onClick={onInteraction}
      >
        {/* First Decision Date and Time */}
        <DecisionsFirst
          firstDecisionTime={dates.firstDecisionTime}
          setFirstDecisionTime={(time) =>
            setDates({ ...dates, firstDecisionTime: time })
          }
          minTimestamp={dates.votingStartDate} // First decision can't be before voting starts
        />

        {/* Subsequent Decisions */}
        <div className="tw-col-span-2">
          <SubsequentDecisions
            firstDecisionTime={dates.firstDecisionTime}
            subsequentDecisions={dates.subsequentDecisions}
            setSubsequentDecisions={handleUpdateSubsequentDecisions}
          />
        </div>
      </div>
    </DateAccordion>
  );
}
