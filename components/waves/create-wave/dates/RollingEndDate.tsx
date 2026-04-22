"use client";

import { useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCalendarAlt, faInfoCircle } from "@fortawesome/free-solid-svg-icons";
import CommonCalendar from "@/components/utils/calendar/CommonCalendar";
import type { CreateWaveDatesConfig } from "@/types/waves.types";
import DateAccordion from "@/components/common/DateAccordion";
import TimePicker from "@/components/common/TimePicker";
import TooltipIconButton from "@/components/common/TooltipIconButton";
import {
  calculateDecisionTimes,
  countTotalDecisions,
  formatDate,
} from "../services/waveDecisionService";
import { calculateLastDecisionTime } from "@/helpers/waves/create-wave.helpers";

interface RollingEndDateProps {
  readonly dates: CreateWaveDatesConfig;
  readonly setDates: (dates: CreateWaveDatesConfig) => void;
  readonly isExpanded: boolean;
  readonly setIsExpanded: (expanded: boolean) => void;
}

interface RollingEndDateCollapsedContentProps {
  readonly endDate: number;
}

function RollingEndDateCollapsedContent({
  endDate,
}: RollingEndDateCollapsedContentProps) {
  return (
    <div className="tw-flex tw-items-center tw-rounded-lg tw-bg-iron-700/40 tw-px-3 tw-py-2 tw-shadow-md tw-transition-transform tw-duration-200 hover:tw-translate-y-[-1px]">
      <FontAwesomeIcon
        icon={faCalendarAlt}
        className="tw-mr-2 tw-size-4 tw-text-primary-400"
      />
      <div>
        <p className="tw-mb-0 tw-text-xs tw-text-iron-300/70">Wave End Date</p>
        <p className="tw-mb-0 tw-text-sm tw-font-medium tw-text-iron-50">
          {formatDate(endDate)}
        </p>
      </div>
    </div>
  );
}

export default function RollingEndDate({
  dates,
  setDates,
  isExpanded,
  setIsExpanded,
}: RollingEndDateProps) {
  const isRollingMode = dates.isRolling;

  // Initialize with current end date values or defaults
  const initialDate = dates.endDate ? new Date(dates.endDate) : new Date();
  const [endDateHours, setEndDateHours] = useState(() =>
    initialDate.getHours()
  );
  const [endDateMinutes, setEndDateMinutes] = useState(() =>
    initialDate.getMinutes()
  );

  // Determine minimum allowed end date based on decisions
  const calculateMinEndDate = (): number => {
    // If no subsequent decisions, minimum is the first decision
    if (dates.subsequentDecisions.length === 0) {
      return dates.firstDecisionTime;
    }

    // Otherwise, minimum is after at least one cycle of decisions
    const decisionTimes = calculateDecisionTimes(
      dates.firstDecisionTime,
      dates.subsequentDecisions
    );
    return decisionTimes[decisionTimes.length - 1]!;
  };

  // Update local state when dates change
  useEffect(() => {
    if (dates.endDate) {
      const date = new Date(dates.endDate);
      setEndDateHours(date.getHours());
      setEndDateMinutes(date.getMinutes());
    }
  }, [dates.endDate]);

  const handleDateSelection = (timestamp: number) => {
    const date = new Date(timestamp);
    date.setHours(endDateHours);
    date.setMinutes(endDateMinutes);
    setDates({
      ...dates,
      endDate: date.getTime(),
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
        endDate: date.getTime(),
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

  const collapsedContent =
    dates.endDate === null ? undefined : (
      <RollingEndDateCollapsedContent endDate={dates.endDate} />
    );

  return (
    <div className="tw-relative">
      <DateAccordion
        title={
          <div className="tw-flex tw-items-center tw-gap-x-2">
            <span>Wave End Date</span>
            <TooltipIconButton
              icon={faInfoCircle}
              tooltipText="Set when your wave will officially end. With recurring winners, the last announcement may happen before this date."
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
          {/* Date and Time Selection Container */}
          <div className="tw-col-span-2">
            <p className="tw-mb-3 tw-text-base tw-font-medium tw-text-iron-50">
              Set Wave End Date
            </p>

            <div className="tw-grid tw-grid-cols-1 tw-gap-x-10 tw-gap-y-8 md:tw-grid-cols-2">
              {/* Date selection */}
              <div className="tw-w-full">
                <p className="tw-mb-2 tw-text-sm tw-font-medium tw-text-iron-300">
                  Select Official End Date:
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
              <div className="tw-w-full">
                <p className="tw-mb-2 tw-text-sm tw-font-medium tw-text-iron-300">
                  Select Time:
                </p>
                <TimePicker
                  hours={endDateHours}
                  minutes={endDateMinutes}
                  onTimeChange={handleTimeChange}
                />

                {/* Last decision time info */}
                {dates.endDate && isRollingMode && (
                  <div className="tw-mt-4 tw-rounded-lg tw-bg-primary-500/10 tw-p-2">
                    <p className="tw-mb-0 tw-text-xs">
                      <span className="tw-text-iron-300">
                        Last winner announcement will be at:
                      </span>
                    </p>
                    <p className="tw-mb-0 tw-text-sm tw-font-medium tw-text-primary-400">
                      {formatDate(
                        calculateLastDecisionTime(
                          dates.firstDecisionTime,
                          dates.subsequentDecisions,
                          dates.endDate
                        )
                      )}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Explanatory text - moved below the calendar and time picker */}
          <div className="tw-mt-4 tw-rounded-lg tw-bg-iron-800/30 tw-p-3">
            <p className="tw-mb-1 tw-text-sm tw-font-medium tw-text-iron-200">
              {isRollingMode
                ? "About Recurring Winners"
                : "About Wave End Date"}
            </p>

            {isRollingMode ? (
              <>
                <p className="tw-mb-2 tw-text-xs tw-text-iron-400">
                  In recurring mode, your wave continues announcing winners in
                  regular intervals until the official end date.
                </p>

                <p className="tw-mb-2 tw-text-xs tw-text-iron-400">
                  The last winner announcement may occur before the official end
                  date, depending on your cycle timing.
                </p>
              </>
            ) : (
              <p className="tw-mb-2 tw-text-xs tw-text-iron-400">
                Your wave will end immediately after the final winner
                announcement.
              </p>
            )}

            {/* Display total decisions count when end date is set and in rolling mode */}
            {dates.endDate && isRollingMode && (
              <div className="tw-mt-3 tw-rounded-lg tw-bg-primary-500/10 tw-p-2">
                <p className="tw-mb-0 tw-flex tw-items-center tw-justify-between tw-text-xs">
                  <span className="tw-text-iron-200">
                    Total winner announcements:
                  </span>
                  <span className="tw-font-semibold tw-text-primary-400">
                    {calculateTotalDecisions()}
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
