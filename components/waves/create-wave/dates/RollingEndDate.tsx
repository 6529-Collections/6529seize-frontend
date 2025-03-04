import { useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCalendarAlt, faInfoCircle } from "@fortawesome/free-solid-svg-icons";
import CommonCalendar from "../../../utils/calendar/CommonCalendar";
import { CreateWaveDatesConfig } from "../../../../types/waves.types";
import CommonSwitch from "../../../utils/switch/CommonSwitch";
import DateAccordion from "../../../common/DateAccordion";
import TimePicker from "../../../common/TimePicker";
import { calculateDecisionTimes, formatDate } from "../services/waveDecisionService";

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
          <p className="tw-mb-0 tw-text-xs tw-text-iron-300/70">End Date</p>
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
      // 2. Make sure we have an end date (default to a week after last decision if none)
      const minEndDate = calculateMinEndDate();
      const oneWeekAfter = minEndDate + (7 * 24 * 60 * 60 * 1000);
      const newEndDate = dates.endDate && dates.endDate > minEndDate 
        ? dates.endDate 
        : oneWeekAfter;
        
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
              <span>Rolling End Date</span>
              <div 
                className="tw-relative tw-cursor-pointer"
                onMouseEnter={() => setShowTooltip(true)}
                onMouseLeave={() => setShowTooltip(false)}
                onClick={(e) => e.stopPropagation()}
              >
                <FontAwesomeIcon
                  icon={faInfoCircle}
                  className="tw-text-iron-400 tw-size-4"
                />
                {showTooltip && (
                  <div className="tw-absolute tw-left-0 tw-top-6 tw-w-64 tw-p-3 tw-bg-iron-900 tw-text-iron-100 tw-text-xs tw-rounded-lg tw-shadow-lg tw-z-10">
                    Rolling mode means that decisions repeat in cycles. When you reach the last decision point, 
                    the system starts again from the first interval, continuing until the end date. 
                    This requires at least one decision interval.
                  </div>
                )}
              </div>
            </div>
            <div onClick={(e) => e.stopPropagation()}>
              <CommonSwitch
                label=""
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
              Rolling End Date
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
            <TimePicker
              hours={endDateHours}
              minutes={endDateMinutes}
              onTimeChange={handleTimeChange}
            />
            
            <div className="tw-bg-iron-800/30 tw-rounded-lg tw-p-3 tw-mt-4">
              <p className="tw-mb-1 tw-text-sm tw-font-medium tw-text-iron-200">Rolling Mode Explanation</p>
              <p className="tw-mb-0 tw-text-xs tw-text-iron-400">
                In rolling mode, decision intervals repeat in cycles. When the last decision point is reached, 
                the system continues from the first interval again. This creates a regular cadence of decisions 
                that continues until the end date.
              </p>
            </div>
          </div>
        </div>
      </DateAccordion>
    </div>
  );
}
