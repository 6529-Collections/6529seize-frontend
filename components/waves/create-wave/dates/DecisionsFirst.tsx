"use client";

import TimePicker from "@/components/common/TimePicker";
import TooltipIconButton from "@/components/common/TooltipIconButton";
import { CREATE_WAVE_FORM_STYLES } from "../utils/createWaveFormStyles";
import CommonCalendar from "@/components/utils/calendar/CommonCalendar";
import { faInfoCircle } from "@fortawesome/free-solid-svg-icons";

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
  // The min time-of-day is derived straight from minTimestamp (voting start);
  // no need to mirror it into state. The safe default for firstDecisionTime is
  // owned by the config/date layer (getDefaultFirstDecisionTime), so this step
  // never seeds it back up to its parent.
  const minTimeObj =
    minTimestamp !== null
      ? {
          hours: new Date(minTimestamp).getHours(),
          minutes: new Date(minTimestamp).getMinutes(),
        }
      : null;

  const selectedDate = new Date(firstDecisionTime);
  const onTimeChange = (hours: number, minutes: number) => {
    const date = new Date(firstDecisionTime);
    date.setHours(hours, minutes, 0, 0);
    setFirstDecisionTime(date.getTime());
  };

  const handleDateSelection = (timestamp: number) => {
    // Preserve the time from the current selection
    const currentDate = new Date(firstDecisionTime);
    const newDate = new Date(timestamp);

    // Get the current hours/minutes
    const currentHours = currentDate.getHours();
    const currentMinutes = currentDate.getMinutes();

    // Check if new date is same day as minTimestamp
    const isMinTimestampDay =
      minTimestamp &&
      newDate.toDateString() === new Date(minTimestamp).toDateString();

    // If it's the min timestamp day, ensure the time is valid
    if (isMinTimestampDay && minTimeObj) {
      // If current time is before min time, use min time
      if (
        currentHours < minTimeObj.hours ||
        (currentHours === minTimeObj.hours &&
          currentMinutes < minTimeObj.minutes)
      ) {
        // Use minimum time + a small buffer (30 minutes)
        const bufferHours = minTimeObj.hours;
        const bufferMinutes = minTimeObj.minutes + 30;

        // Handle minute overflow
        const adjustedHours =
          bufferMinutes >= 60 ? bufferHours + 1 : bufferHours;
        const adjustedMinutes =
          bufferMinutes >= 60 ? bufferMinutes - 60 : bufferMinutes;

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
    setFirstDecisionTime(newTimestamp);
  };

  return (
    <div className="tw-col-span-2">
      <div className="tw-mb-3 tw-flex tw-items-center tw-gap-x-2">
        <h3 className={CREATE_WAVE_FORM_STYLES.sectionTitle}>
          First Winners Announcement
        </h3>
        <TooltipIconButton
          icon={faInfoCircle}
          tooltipText="This is when you'll announce the first set of winners for your wave. It must occur after voting begins. This is when creators will find out if they've won and their work will be showcased."
          // Opens downward (centered) rather than to the right: a right-opening
          // tooltip pushed a fixed-width box past the viewport edge and forced
          // the page to scroll horizontally on mobile.
          tooltipPosition="bottom"
          tooltipWidth="tw-w-72"
        />
      </div>

      <div className="tw-grid tw-grid-cols-1 tw-gap-x-10 tw-gap-y-8 md:tw-grid-cols-2">
        {/* Date selection */}
        <div className="tw-w-full">
          <p className={`tw-mb-2 ${CREATE_WAVE_FORM_STYLES.fieldLabel}`}>
            Select Date:
          </p>
          <CommonCalendar
            initialMonth={selectedDate.getMonth()}
            initialYear={selectedDate.getFullYear()}
            selectedTimestamp={firstDecisionTime}
            minTimestamp={minTimestamp}
            maxTimestamp={null}
            setSelectedTimestamp={handleDateSelection}
            variant="flat"
          />
        </div>

        {/* Time selection */}
        <div className="tw-w-full">
          <p className={`tw-mb-2 ${CREATE_WAVE_FORM_STYLES.fieldLabel}`}>
            Select Time:
          </p>

          <TimePicker
            hours={selectedDate.getHours()}
            minutes={selectedDate.getMinutes()}
            onTimeChange={onTimeChange}
            variant="flat"
            minTime={
              // Only apply min time constraint if the selected date is the same as min timestamp date
              minTimestamp &&
              selectedDate.toDateString() ===
                new Date(minTimestamp).toDateString()
                ? minTimeObj
                : null
            }
          />
        </div>
      </div>
    </div>
  );
}
