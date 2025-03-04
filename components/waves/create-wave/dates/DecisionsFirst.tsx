import { useCallback, useEffect, useState } from "react";
import { CreateWaveDatesConfig } from "../../../../types/waves.types";
import CommonCalendar from "../../../utils/calendar/CommonCalendar";
import TimePicker from "../../../common/TimePicker";

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
  
  // Update local state if the prop changes
  useEffect(() => {
    setSelectedTimestamp(firstDecisionTime);
  }, [firstDecisionTime]);

  const getHours = useCallback(() => {
    return new Date(selectedTimestamp).getHours();
  }, [selectedTimestamp]);

  const getMinutes = useCallback(() => {
    return new Date(selectedTimestamp).getMinutes();
  }, [selectedTimestamp]);

  const onTimeChange = useCallback((hours: number, minutes: number) => {
    const date = new Date(selectedTimestamp);
    date.setHours(hours, minutes, 0, 0);
    const newTimestamp = date.getTime();
    setSelectedTimestamp(newTimestamp);
    setFirstDecisionTime(newTimestamp);
  }, [selectedTimestamp, setFirstDecisionTime]);
  
  const handleDateSelection = (timestamp: number) => {
    // Preserve the time from the current selection
    const currentDate = new Date(selectedTimestamp);
    const newDate = new Date(timestamp);
    newDate.setHours(currentDate.getHours(), currentDate.getMinutes(), 0, 0);
    
    const newTimestamp = newDate.getTime();
    setSelectedTimestamp(newTimestamp);
    setFirstDecisionTime(newTimestamp);
  };

  return (
    <>
      <div className="tw-col-span-1">
        <p className="tw-mb-3 tw-text-base tw-font-medium tw-text-iron-50">
          First Decision Date
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
      <div className="tw-col-span-1">
        <p className="tw-mb-3 tw-text-base tw-font-medium tw-text-iron-50">
          First Decision Time
        </p>
        <TimePicker
          hours={getHours()}
          minutes={getMinutes()}
          onTimeChange={onTimeChange}
        />
      </div>
    </>
  );
}
