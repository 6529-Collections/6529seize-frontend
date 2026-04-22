"use client";

import { useMemo } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCalendarAlt, faInfoCircle } from "@fortawesome/free-solid-svg-icons";
import CommonCalendar from "@/components/utils/calendar/CommonCalendar";
import type { CreateWaveDatesConfig } from "@/types/waves.types";
import DateAccordion from "@/components/common/DateAccordion";
import TimePicker from "@/components/common/TimePicker";
import TooltipIconButton from "@/components/common/TooltipIconButton";

interface CreateWaveDatesApproveEndProps {
  readonly dates: CreateWaveDatesConfig;
  readonly setDates: (dates: CreateWaveDatesConfig) => void;
  readonly isExpanded: boolean;
  readonly setIsExpanded: (expanded: boolean) => void;
}

const formatDateTime = (timestamp: number) =>
  new Date(timestamp).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });

export default function CreateWaveDatesApproveEnd({
  dates,
  setDates,
  isExpanded,
  setIsExpanded,
}: CreateWaveDatesApproveEndProps) {
  const selectedTimestamp = dates.endDate ?? dates.submissionStartDate;

  const minTime = useMemo(() => {
    const minDate = new Date(dates.submissionStartDate);
    return {
      hours: minDate.getHours(),
      minutes: minDate.getMinutes(),
    };
  }, [dates.submissionStartDate]);

  const selectedDate = useMemo(
    () => new Date(selectedTimestamp),
    [selectedTimestamp]
  );
  const startDate = useMemo(
    () => new Date(dates.submissionStartDate),
    [dates.submissionStartDate]
  );
  const isSameDayAsStart =
    selectedDate.toDateString() === startDate.toDateString();

  const endDate = dates.endDate;

  const collapsedContent =
    endDate !== null && Number.isFinite(endDate) ? (
      <div className="tw-flex tw-items-center tw-rounded-lg tw-bg-iron-700/40 tw-px-3 tw-py-2 tw-shadow-md tw-transition-transform tw-duration-200 hover:tw-translate-y-[-1px]">
        <FontAwesomeIcon
          icon={faCalendarAlt}
          className="tw-mr-2 tw-size-4 tw-text-primary-400"
        />
        <div>
          <p className="tw-mb-0 tw-text-xs tw-text-iron-300/70">Wave Ends</p>
          <p className="tw-mb-0 tw-text-sm tw-font-medium tw-text-iron-50">
            {formatDateTime(endDate)}
          </p>
        </div>
      </div>
    ) : undefined;

  const handleDateSelection = (timestamp: number) => {
    const currentDate = new Date(selectedTimestamp);
    const newDate = new Date(timestamp);
    const currentHours = currentDate.getHours();
    const currentMinutes = currentDate.getMinutes();
    const isStartDay = newDate.toDateString() === startDate.toDateString();

    if (
      isStartDay &&
      (currentHours < minTime.hours ||
        (currentHours === minTime.hours && currentMinutes < minTime.minutes))
    ) {
      newDate.setHours(minTime.hours, minTime.minutes, 0, 0);
    } else {
      newDate.setHours(currentHours, currentMinutes, 0, 0);
    }

    const newTimestamp = newDate.getTime();
    setDates({
      ...dates,
      endDate: newTimestamp,
    });
  };

  const handleTimeChange = (hours: number, minutes: number) => {
    const nextDate = new Date(selectedTimestamp);
    nextDate.setHours(hours, minutes, 0, 0);
    const newTimestamp = nextDate.getTime();
    setDates({
      ...dates,
      endDate: newTimestamp,
    });
  };

  return (
    <DateAccordion
      title={
        <div className="tw-flex tw-items-center tw-gap-x-2">
          <span>Wave End</span>
          <TooltipIconButton
            icon={faInfoCircle}
            tooltipText="Choose when the approve wave closes. This is the actual end timestamp sent to the API."
            tooltipPosition="bottom"
            tooltipWidth="tw-w-80"
          />
        </div>
      }
      isExpanded={isExpanded}
      onToggle={() => setIsExpanded(!isExpanded)}
      collapsedContent={collapsedContent}
    >
      <div className="tw-px-5 tw-pb-5 tw-pt-2">
        <div className="tw-grid tw-grid-cols-1 tw-gap-x-10 tw-gap-y-8 md:tw-grid-cols-2">
          <div className="tw-w-full">
            <p className="tw-mb-2 tw-text-sm tw-font-medium tw-text-iron-300">
              Select End Date:
            </p>
            <CommonCalendar
              initialMonth={selectedDate.getMonth()}
              initialYear={selectedDate.getFullYear()}
              selectedTimestamp={selectedTimestamp}
              minTimestamp={dates.submissionStartDate}
              maxTimestamp={null}
              setSelectedTimestamp={handleDateSelection}
            />
          </div>

          <div className="tw-w-full">
            <p className="tw-mb-2 tw-text-sm tw-font-medium tw-text-iron-300">
              Select End Time:
            </p>
            <TimePicker
              hours={selectedDate.getHours()}
              minutes={selectedDate.getMinutes()}
              onTimeChange={handleTimeChange}
              minTime={isSameDayAsStart ? minTime : null}
            />
          </div>
        </div>
      </div>
    </DateAccordion>
  );
}
