import { useCallback, useEffect, useState } from "react";
import { CreateWaveDatesConfig } from "../../../../types/waves.types";
import CommonCalendar from "../../../utils/calendar/CommonCalendar";
import TimePicker from "../../../common/TimePicker";
import { faInfoCircle } from "@fortawesome/free-solid-svg-icons";
import TooltipIconButton from "../../../common/TooltipIconButton";

interface DecisionsFirstProps {
  readonly firstDecisionTime: number;
  readonly setFirstDecisionTime: (time: number) => void;
  readonly minTimestamp: number | null; // Minimum allowed timestamp (typically votingStartDate)
}

export default function DecisionsFirst({
  firstDecisionTime,
  setFirstDecisionTime,
  minTimestamp,
}: DecisionsFirstProps) {
  const [selectedTimestamp, setSelectedTimestamp] = useState(firstDecisionTime);
  const [minTimeObj, setMinTimeObj] = useState<{ hours: number; minutes: number } | null>(null);

  // Update local state if the prop changes
  useEffect(() => {
    setSelectedTimestamp(firstDecisionTime);
  }, [firstDecisionTime]);

  // Calculate min time object and handle initial/default date setting
  useEffect(() => {
    if (minTimestamp) {
      // Create a date from minTimestamp to get hours and minutes
      const minDate = new Date(minTimestamp);
      setMinTimeObj({
        hours: minDate.getHours(),
        minutes: minDate.getMinutes()
      });
      
      // Only adjust times on initial load or when min timestamp changes
      // We don't want to reset on every render or prop change
      const isInitialOrChange = 
        !firstDecisionTime || // Initial load
        firstDecisionTime < minTimestamp || // Current time is before min time
        firstDecisionTime === minTimestamp; // Exact match (likely coming from a prop update)
      
      if (isInitialOrChange) {
        // Set default to same day at 11:59 PM
        const defaultDate = new Date(minTimestamp);
        defaultDate.setHours(23, 59, 0, 0);
        
        setSelectedTimestamp(defaultDate.getTime());
        setFirstDecisionTime(defaultDate.getTime());
      }
    } else {
      setMinTimeObj(null);
    }
  }, [minTimestamp, setFirstDecisionTime, firstDecisionTime]);

  const getHours = useCallback(() => {
    return new Date(selectedTimestamp).getHours();
  }, [selectedTimestamp]);

  const getMinutes = useCallback(() => {
    return new Date(selectedTimestamp).getMinutes();
  }, [selectedTimestamp]);

  const onTimeChange = useCallback(
    (hours: number, minutes: number) => {
      const date = new Date(selectedTimestamp);
      date.setHours(hours, minutes, 0, 0);
      const newTimestamp = date.getTime();
      
      setSelectedTimestamp(newTimestamp);
      setFirstDecisionTime(newTimestamp);
    },
    [selectedTimestamp, setFirstDecisionTime]
  );

  const handleDateSelection = (timestamp: number) => {
    // Preserve the time from the current selection
    const currentDate = new Date(selectedTimestamp);
    const newDate = new Date(timestamp);
    
    // Get the current hours/minutes
    const currentHours = currentDate.getHours();
    const currentMinutes = currentDate.getMinutes();
    
    // Check if new date is same day as minTimestamp
    const isMinTimestampDay = minTimestamp && 
      newDate.toDateString() === new Date(minTimestamp).toDateString();
    
    // If it's the min timestamp day, ensure the time is valid
    if (isMinTimestampDay && minTimeObj) {
      // If current time is before min time, use min time
      if (currentHours < minTimeObj.hours || 
          (currentHours === minTimeObj.hours && currentMinutes < minTimeObj.minutes)) {
        // Use minimum time + a small buffer (30 minutes)
        const bufferHours = minTimeObj.hours;
        const bufferMinutes = minTimeObj.minutes + 30;
        
        // Handle minute overflow
        const adjustedHours = bufferMinutes >= 60 ? bufferHours + 1 : bufferHours;
        const adjustedMinutes = bufferMinutes >= 60 ? bufferMinutes - 60 : bufferMinutes;
        
        newDate.setHours(adjustedHours, adjustedMinutes, 0, 0);
      } else {
        // Current time is valid, keep it
        newDate.setHours(currentHours, currentMinutes, 0, 0);
      }
    } else {
      // Not min day, keep current time
      newDate.setHours(currentHours, currentMinutes, 0, 0);
    }
    
    const newTimestamp = newDate.getTime();
    setSelectedTimestamp(newTimestamp);
    setFirstDecisionTime(newTimestamp);
  };

  return (
    <div className="tw-col-span-2">
      <div className="tw-flex tw-items-center tw-gap-x-2 tw-mb-3">
        <p className="tw-mb-0 tw-text-base tw-font-medium tw-text-iron-50">
          First Winners Announcement
        </p>
        <TooltipIconButton 
          icon={faInfoCircle} 
          tooltipText="This is when you'll announce the first set of winners for your wave. It must occur after voting begins. This is when creators will find out if they've won and their work will be showcased."
          tooltipPosition="right"
          tooltipWidth="tw-w-72"
        />
      </div>
      
      <div className="tw-flex tw-flex-col md:tw-flex-row tw-justify-between tw-gap-x-6 tw-gap-y-4 tw-p-3 tw-bg-iron-800/30 tw-rounded-lg md:tw-h-[390px]">
        {/* Date selection */}
        <div className="tw-w-full md:tw-w-[280px]">
          <p className="tw-mb-2 tw-text-sm tw-font-medium tw-text-iron-300">
            Select Date:
          </p>
          <CommonCalendar
            initialMonth={new Date(selectedTimestamp).getMonth()}
            initialYear={new Date(selectedTimestamp).getFullYear()}
            selectedTimestamp={selectedTimestamp}
            minTimestamp={minTimestamp}
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
              hours={getHours()}
              minutes={getMinutes()}
              onTimeChange={onTimeChange}
              minTime={
                // Only apply min time constraint if the selected date is the same as min timestamp date
                minTimestamp && new Date(selectedTimestamp).toDateString() === new Date(minTimestamp).toDateString() 
                  ? minTimeObj 
                  : null
              }
            />
          </div>
        </div>
      </div>
    </div>
  );
}
