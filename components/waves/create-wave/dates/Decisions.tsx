import { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCalendarPlus } from "@fortawesome/free-regular-svg-icons";
import { faInfoCircle } from "@fortawesome/free-solid-svg-icons";
import { CreateWaveDatesConfig } from "../../../../types/waves.types";
import { Period } from "../../../../helpers/Types";
import DateAccordion from "../../../common/DateAccordion";
import DecisionsFirst from "./DecisionsFirst";
import SubsequentDecisions from "./SubsequentDecisions";
import { calculateDecisionTimes, calculateEndDateForCycles, formatDate } from "../services/waveDecisionService";
import TooltipIconButton from "../../../common/TooltipIconButton";
import CommonSwitch from "../../../utils/switch/CommonSwitch";

interface DecisionsProps {
  readonly dates: CreateWaveDatesConfig;
  readonly setDates: (dates: CreateWaveDatesConfig) => void;
  readonly isRollingMode: boolean;
  readonly setIsRollingMode: (isRolling: boolean) => void;
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
  setIsRollingMode,
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

  // Handle the recurring mode toggle
  const handleToggleSwitch = (value: boolean) => {
    // Can't enable rolling mode without subsequent decisions
    if (value && dates.subsequentDecisions.length === 0) {
      alert("You need to add at least one decision interval before enabling recurring mode");
      return;
    }
    
    // Update rolling mode state
    setIsRollingMode(value);
    
    if (value) {
      // When turning on rolling mode:
      // 1. Set isRolling flag
      // 2. Calculate end date for 2 complete decision cycles
      const twoCompleteRoundsEndDate = calculateEndDateForCycles(
        dates.firstDecisionTime, 
        dates.subsequentDecisions,
        2 // Two complete rounds
      );
      
      // Use the calculated date or keep existing if already set and valid
      const minEndDate = dates.subsequentDecisions.length > 0 ? 
        calculateDecisionTimes(dates.firstDecisionTime, dates.subsequentDecisions)[dates.subsequentDecisions.length] :
        dates.firstDecisionTime;
        
      const newEndDate = (dates.endDate && dates.endDate > minEndDate)
        ? dates.endDate 
        : twoCompleteRoundsEndDate;
        
      setDates({
        ...dates,
        isRolling: true,
        endDate: newEndDate
      });
    } else {
      // When turning off rolling mode:
      // 1. Clear isRolling flag
      // 2. Set end date to the last decision point
      let newEndDate = dates.firstDecisionTime;
      
      if (dates.subsequentDecisions.length > 0) {
        const decisionTimes = calculateDecisionTimes(
          dates.firstDecisionTime, 
          dates.subsequentDecisions
        );
        newEndDate = decisionTimes[decisionTimes.length - 1];
      }
      
      setDates({
        ...dates,
        isRolling: false,
        endDate: newEndDate
      });
    }
  };

  const renderCollapsedContent = () => {
    return (
      <div className="tw-flex tw-items-center tw-bg-[#24242B] tw-px-3 tw-py-2 tw-rounded-lg tw-shadow-md hover:tw-translate-y-[-1px] tw-transition-transform tw-duration-200">
        <FontAwesomeIcon
          icon={faCalendarPlus}
          className="tw-mr-2 tw-size-4 tw-text-primary-400"
        />
        <div className="tw-flex tw-flex-col">
          <p className="tw-mb-0 tw-text-xs tw-text-iron-300/70">
            Winners
          </p>
          <div className="tw-flex tw-items-center">
            <span className="tw-text-sm tw-font-medium tw-text-iron-50">
              {totalDecisionPoints} announcement{totalDecisionPoints !== 1 ? 's' : ''}
            </span>
            {isRollingMode && (
              <span className="tw-text-xs tw-ml-2 tw-px-1.5 tw-rounded tw-bg-blue-500/20 tw-text-blue-400">
                Recurring
              </span>
            )}
          </div>
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
          {/* Badge moved to collapsed content for more compact display */}
        </div>
      }
      isExpanded={isExpanded}
      onToggle={() => setIsExpanded(!isExpanded)}
      collapsedContent={renderCollapsedContent()}
    >
      <div className="tw-px-5 tw-pt-0.5">
        <div className="tw-bg-iron-800/30 tw-rounded-lg tw-p-3 tw-my-3">
          <p className="tw-mb-0 tw-text-sm tw-text-iron-300">
            <strong>Winner announcements</strong> are when creators are selected and showcased. 
            Set your first announcement date, then add additional ones if needed.
            {dates.subsequentDecisions.length === 0 && 
              <span className="tw-text-primary-300"> With a fixed schedule, the last announcement marks your wave's end date.</span>
            }
          </p>
          <p className="tw-mb-0 tw-mt-2 tw-text-xs tw-text-iron-400 tw-italic">
            Examples: Weekly Friday winners, monthly selections, or quarterly showcases.
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
        
        {/* Recurring Mode Toggle - Only show when at least one subsequent decision exists */}
        {dates.subsequentDecisions.length > 0 && (
          <div className="tw-col-span-2 tw-mt-3">
            <div className="tw-bg-iron-800/30 tw-rounded-lg tw-p-4">
              <div className="tw-flex tw-justify-between tw-items-center">
                <div className="tw-flex-1">
                  <h3 className="tw-text-iron-100 tw-text-base tw-font-medium tw-mb-1">
                    Repeating Announcement Cycles
                  </h3>
                  <p className="tw-mb-0 tw-text-xs tw-text-iron-400">
                    Enable to repeat this announcement pattern until your wave ends
                  </p>
                </div>
                <div>
                  <CommonSwitch
                    label="Enable recurring cycles"
                    isOn={dates.isRolling || isRollingMode}
                    setIsOn={handleToggleSwitch}
                  />
                </div>
              </div>
              
              {(dates.isRolling || isRollingMode) && (
                <div className="tw-bg-primary-500/10 tw-rounded-lg tw-p-3 tw-mt-3">
                  <p className="tw-mb-0 tw-text-xs tw-text-iron-300">
                    <strong>Recurring cycles enabled.</strong> Your pattern of winner announcements will repeat until your wave's end date.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </DateAccordion>
  );
}
