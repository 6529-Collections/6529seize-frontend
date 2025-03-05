import { useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCalendarAlt, faInfoCircle } from "@fortawesome/free-solid-svg-icons";
import CommonCalendar from "../../../utils/calendar/CommonCalendar";
import { CreateWaveDatesConfig } from "../../../../types/waves.types";
import CommonSwitch from "../../../utils/switch/CommonSwitch";
import DateAccordion from "../../../common/DateAccordion";
import TimePicker from "../../../common/TimePicker";
import TooltipIconButton from "../../../common/TooltipIconButton";
import { 
  calculateDecisionTimes, 
  calculateEndDateForCycles,
  countTotalDecisions,
  formatDate 
} from "../services/waveDecisionService";

interface RollingEndDateProps {
  readonly dates: CreateWaveDatesConfig;
  readonly setDates: (dates: CreateWaveDatesConfig) => void;
  readonly isRollingMode: boolean;
  readonly setIsRollingMode: (isRolling: boolean) => void;
  readonly isExpanded: boolean;
  readonly setIsExpanded: (expanded: boolean) => void;
}

export default function RollingEndDate({
  dates,
  setDates,
  isRollingMode,
  setIsRollingMode,
  isExpanded,
  setIsExpanded,
}: RollingEndDateProps) {
  // Initialize with current end date values or defaults
  const initialDate = dates.endDate ? new Date(dates.endDate) : new Date();
  const [endDateHours, setEndDateHours] = useState(initialDate.getHours());
  const [endDateMinutes, setEndDateMinutes] = useState(initialDate.getMinutes());
  const [showTooltip, setShowTooltip] = useState(false);
  
  // Determine minimum allowed end date based on decisions
  const calculateMinEndDate = (): number => {
    // If no subsequent decisions, minimum is the first decision
    if (dates.subsequentDecisions.length === 0) {
      return dates.firstDecisionTime;
    }
    
    // Otherwise, minimum is after at least one cycle of decisions
    const decisionTimes = calculateDecisionTimes(dates.firstDecisionTime, dates.subsequentDecisions);
    return decisionTimes[decisionTimes.length - 1];
  };
  
  // Update local state when dates change
  useEffect(() => {
    if (dates.endDate) {
      const date = new Date(dates.endDate);
      setEndDateHours(date.getHours());
      setEndDateMinutes(date.getMinutes());
    }
  }, [dates.endDate]);

  const renderCollapsedContent = () => {
    if (!dates.endDate || !isRollingMode) return null;

    return (
      <div className="tw-flex tw-items-center tw-bg-[#24242B] tw-px-3 tw-py-2 tw-rounded-lg tw-shadow-md hover:tw-translate-y-[-1px] tw-transition-transform tw-duration-200">
        <FontAwesomeIcon
          icon={faCalendarAlt}
          className="tw-mr-2 tw-size-4 tw-text-primary-400"
        />
        <div>
          <p className="tw-mb-0 tw-text-xs tw-text-iron-300/70">Recurring Winners End Date</p>
          <p className="tw-mb-0 tw-text-sm tw-font-medium tw-text-iron-50">
            {formatDate(dates.endDate)}
          </p>
        </div>
      </div>
    );
  };

  const handleDateSelection = (timestamp: number) => {
    const date = new Date(timestamp);
    date.setHours(endDateHours);
    date.setMinutes(endDateMinutes);
    setDates({ 
      ...dates, 
      endDate: date.getTime() 
    });
  };

  const handleTimeChange = (h: number, m: number) => {
    setEndDateHours(h);
    setEndDateMinutes(m);

    if (dates.endDate) {
      const date = new Date(dates.endDate);
      date.setHours(h);
      date.setMinutes(m);
      setDates({ 
        ...dates, 
        endDate: date.getTime() 
      });
    }
  };
  
  // Calculate total decisions that will occur
  const calculateTotalDecisions = () => {
    if (!dates.endDate) return 0;
    return countTotalDecisions(
      dates.firstDecisionTime,
      dates.subsequentDecisions,
      dates.endDate
    );
  };
  
  // This function is simpler now since the main toggle is in the Decisions component
  const handleToggleSwitch = (value: boolean) => {
    setIsRollingMode(value);
    
    if (!value) {
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

  return (
    <div className="tw-relative">
      <DateAccordion
        title={
          <div className="tw-flex tw-items-center tw-gap-x-2">
            <span>Recurring Winners End Date</span>
            <TooltipIconButton 
              icon={faInfoCircle} 
              tooltipText="Set the final end date for your wave with recurring winner announcements. Your wave will continue the same pattern of announcements until reaching this date."
              tooltipPosition="bottom"
              tooltipWidth="tw-w-80"
            />
          </div>
        }
        isExpanded={isExpanded}
        onToggle={() => setIsExpanded(!isExpanded)}
        collapsedContent={renderCollapsedContent()}
      >
        <div className="tw-px-5 tw-pt-2 tw-pb-5">
          {/* Date and Time Selection Container */}
          <div className="tw-col-span-2">
            <p className="tw-mb-3 tw-text-base tw-font-medium tw-text-iron-50">
              Wave Final End Date
            </p>
            
            <div className="tw-flex tw-flex-col md:tw-flex-row tw-justify-between tw-gap-x-6 tw-gap-y-4 tw-p-3 tw-bg-iron-800/30 tw-rounded-lg md:tw-h-[390px]">
              {/* Date selection */}
              <div className="tw-w-full md:tw-w-[280px]">
                <p className="tw-mb-2 tw-text-sm tw-font-medium tw-text-iron-300">
                  Select Date:
                </p>
                <CommonCalendar
                  initialMonth={initialDate.getMonth()}
                  initialYear={initialDate.getFullYear()}
                  selectedTimestamp={dates.endDate ?? initialDate.getTime()}
                  minTimestamp={calculateMinEndDate()}
                  maxTimestamp={null}
                  setSelectedTimestamp={handleDateSelection}
                />
              </div>
              
              {/* Time selection */}
              <div className="tw-w-full md:tw-w-80 tw-flex tw-flex-col">
                <p className="tw-mb-2 tw-text-sm tw-font-medium tw-text-iron-300">
                  Select Time:
                </p>
                <div className="tw-flex-1 tw-flex tw-items-center tw-justify-center">
                  <TimePicker
                    hours={endDateHours}
                    minutes={endDateMinutes}
                    onTimeChange={handleTimeChange}
                  />
                </div>
              </div>
            </div>
          </div>
          
          {/* Explanatory text - moved below the calendar and time picker */}
          <div className="tw-mt-4 tw-bg-iron-800/30 tw-rounded-lg tw-p-3">
            <p className="tw-mb-1 tw-text-sm tw-font-medium tw-text-iron-200">Recurring Winners End Date</p>
            
            <p className="tw-text-xs tw-text-iron-400 tw-mb-3">
              Since you've enabled recurring winner announcements, you need to set when your wave will permanently end. Your wave will continue repeating the same pattern of winner announcements until this final end date.
            </p>
            
            <p className="tw-text-xs tw-text-iron-400 tw-mb-3">
              {isRollingMode ? 
                "This is when your wave will permanently end, after completing all recurring winner announcements." : 
                "In standard mode, your wave automatically ends after the final winner announcement."}
            </p>
            
            {/* Display total decisions count when end date is set */}
            {dates.endDate && (
              <div className="tw-bg-primary-500/10 tw-rounded-lg tw-p-2 tw-mt-3">
                <p className="tw-flex tw-items-center tw-justify-between tw-mb-0 tw-text-xs">
                  <span className="tw-text-iron-200">Total winner announcements before end date:</span>
                  <span className="tw-text-primary-400 tw-font-semibold">
                    {calculateTotalDecisions()} announcements
                  </span>
                </p>
              </div>
            )}
          </div>
        </div>
      </DateAccordion>
    </div>
  );
}
