import { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCalendarPlus } from "@fortawesome/free-regular-svg-icons";
import { faInfoCircle } from "@fortawesome/free-solid-svg-icons";
import { CreateWaveDatesConfig } from "../../../../types/waves.types";
import { Period } from "../../../../helpers/Types";
import DateAccordion from "../../../common/DateAccordion";
import DecisionsFirst from "./DecisionsFirst";
import SubsequentDecisions from "./SubsequentDecisions";
import { calculateDecisionTimes, formatDate } from "../services/waveDecisionService";
import TooltipIconButton from "../../../common/TooltipIconButton";

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
            Winners Announcements
          </p>
          <p className="tw-mb-0 tw-text-sm tw-font-medium tw-text-iron-50">
            {totalDecisionPoints} winner announcement{totalDecisionPoints !== 1 ? 's' : ''} configured
          </p>
        </div>
      </div>
    );
  };

  return (
    <DateAccordion
      title={
        <div className="tw-flex tw-items-center tw-gap-x-2">
          <span>Winners Announcements</span>
          <TooltipIconButton 
            icon={faInfoCircle} 
            tooltipText="Schedule when winners from your wave will be announced. These are key moments in your wave's lifecycle and determine when creators receive recognition. Without recurring cycles, the last announcement will mark the end of your wave."
            tooltipPosition="bottom"
            tooltipWidth="tw-w-80"
          />
          {isRollingMode ? (
            <span className="tw-text-xs tw-ml-2 tw-px-2 tw-py-0.5 tw-rounded tw-bg-blue-500/20 tw-text-blue-400">
              Rolling Mode
            </span>
          ) : (
            <span className="tw-text-xs tw-ml-2 tw-px-2 tw-py-0.5 tw-rounded tw-bg-green-500/20 tw-text-green-400">
              Standard Mode
            </span>
          )}
        </div>
      }
      isExpanded={isExpanded}
      onToggle={() => setIsExpanded(!isExpanded)}
      collapsedContent={renderCollapsedContent()}
    >
      <div className="tw-px-5 tw-pt-0.5">
        <div className="tw-bg-iron-800/30 tw-rounded-lg tw-p-3 tw-my-3">
          <p className="tw-mb-0 tw-text-sm tw-text-iron-300">
            <strong>Winners Announcements are key milestones when creators are selected and showcased.</strong> 
            These are exciting moments that participants anticipate in your wave's journey.
            All submissions remain in the competition pool at each announcement point.
          </p>
          <p className="tw-mb-0 tw-mt-2 tw-text-xs tw-text-iron-400">
            <strong>Examples:</strong> Announce top 3 creators every Friday, select weekly winners on Mondays, 
            or run a 3-week contest with winners announced each Sunday. In standard mode, your wave ends after the final announcement.
          </p>
          <p className="tw-mb-0 tw-mt-2 tw-text-xs tw-text-primary-300/70">
            <strong>Tip:</strong> The first announcement must occur after submission/voting begins. In standard mode, the final announcement marks the end of your wave.
          </p>
        </div>
      </div>
      <div
        className="tw-grid tw-grid-cols-1 tw-gap-y-4 tw-gap-x-10 md:tw-grid-cols-2 tw-px-5 tw-pb-5"
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
