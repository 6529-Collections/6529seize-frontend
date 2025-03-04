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
          <p className="tw-mb-0 tw-text-xs tw-text-iron-300/70">Wave End Date</p>
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
  
  // Set up or clear rolling mode
  const handleToggleSwitch = (value: boolean) => {
    // Can't enable rolling mode without subsequent decisions
    if (value && dates.subsequentDecisions.length === 0) {
      alert("You need to add at least one decision interval before enabling rolling mode");
      return;
    }
    
    // Update rolling mode in component and in dates config
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
      const newEndDate = (dates.endDate && dates.endDate > calculateMinEndDate())
        ? dates.endDate 
        : twoCompleteRoundsEndDate;
        
      setDates({
        ...dates,
        isRolling: true,
        endDate: newEndDate
      });
      
      // 3. Expand the accordion
      setIsExpanded(true);
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
      
      // 3. Collapse the accordion
      setIsExpanded(false);
    }
  };

  return (
    <div className="tw-relative">
      <DateAccordion
        title={
          <div className="tw-flex tw-items-center tw-justify-between tw-flex-1 tw-gap-x-4">
            <div className="tw-flex tw-items-center tw-gap-x-2">
              <span>Wave End Date</span>
              <TooltipIconButton 
                icon={faInfoCircle} 
                tooltipText="Set whether your wave runs once and ends, or repeats in regular cycles. With recurring winners enabled, your wave will continue with the same announcement pattern until the final end date you select."
                tooltipPosition="bottom"
                tooltipWidth="tw-w-80"
              />
            </div>
            <div onClick={(e) => e.stopPropagation()}>
              <CommonSwitch
                label="Enable recurring winner announcements"
                isOn={dates.isRolling || isRollingMode}
                setIsOn={handleToggleSwitch}
              />
            </div>
          </div>
        }
        isExpanded={(dates.isRolling || isRollingMode) && isExpanded}
        onToggle={() => {
          if (dates.isRolling || isRollingMode) {
            setIsExpanded(!isExpanded);
          }
        }}
        collapsedContent={renderCollapsedContent()}
        showChevron={dates.isRolling || isRollingMode}
      >
        <div className="tw-grid tw-grid-cols-1 tw-gap-y-4 tw-gap-x-10 md:tw-grid-cols-2 tw-px-5 tw-pb-5 tw-pt-2">
          <div className="tw-col-span-1">
            <p className="tw-mb-3 tw-text-base tw-font-medium tw-text-iron-50">
              Wave Final End Date
            </p>
            <p className="tw-text-xs tw-text-iron-400 tw-mb-2">
              {isRollingMode ? 
                "This is when your wave will permanently end, after completing all recurring winner announcements" : 
                "In standard mode, your wave automatically ends after the final winner announcement"}
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
          <div className="tw-col-span-1">
            <p className="tw-mb-3 tw-text-base tw-font-medium tw-text-iron-50">
              End Time
            </p>
            <p className="tw-text-xs tw-text-iron-400 tw-mb-2">
              Set the exact time when your wave will end on the selected date
            </p>
            <TimePicker
              hours={endDateHours}
              minutes={endDateMinutes}
              onTimeChange={handleTimeChange}
            />
            
            <div className="tw-bg-iron-800/30 tw-rounded-lg tw-p-3 tw-mt-4">
              <p className="tw-mb-1 tw-text-sm tw-font-medium tw-text-iron-200">Wave Duration Settings</p>
              
              <div className="tw-flex tw-justify-between tw-items-start tw-mb-3">
                <div className="tw-flex-1 tw-pr-2">
                  <p className="tw-mb-2 tw-text-xs tw-font-medium tw-text-iron-300">Standard Mode (Default)</p>
                  <p className="tw-text-xs tw-text-iron-400 tw-mb-0">
                    Your wave runs once and automatically ends after the final winners announcement.
                  </p>
                </div>
                <div className="tw-flex-1 tw-pl-2 tw-border-l tw-border-iron-700">
                  <p className="tw-mb-2 tw-text-xs tw-font-medium tw-text-primary-300">Recurring Mode</p>
                  <p className="tw-text-xs tw-text-iron-400 tw-mb-0">
                    Your wave repeats the same pattern of winner announcements until reaching the final end date you've selected.
                  </p>
                </div>
              </div>
              
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
        </div>
      </DateAccordion>
    </div>
  );
}
