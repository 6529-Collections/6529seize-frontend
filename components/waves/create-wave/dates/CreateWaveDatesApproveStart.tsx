"use client";

import { useMemo } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCalendarDays } from "@fortawesome/free-regular-svg-icons";
import { faInfoCircle } from "@fortawesome/free-solid-svg-icons";
import CommonCalendar from "@/components/utils/calendar/CommonCalendar";
import type { CreateWaveDatesConfig } from "@/types/waves.types";
import DateAccordion from "@/components/common/DateAccordion";
import TooltipIconButton from "@/components/common/TooltipIconButton";
import { Time } from "@/helpers/time";

interface CreateWaveDatesApproveStartProps {
  readonly dates: CreateWaveDatesConfig;
  readonly setDates: (dates: CreateWaveDatesConfig) => void;
  readonly isExpanded: boolean;
  readonly setIsExpanded: (expanded: boolean) => void;
}

const formatShortDate = (timestamp: number) =>
  new Date(timestamp).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

export default function CreateWaveDatesApproveStart({
  dates,
  setDates,
  isExpanded,
  setIsExpanded,
}: CreateWaveDatesApproveStartProps) {
  const startDateFormatted = useMemo(
    () => formatShortDate(dates.submissionStartDate),
    [dates.submissionStartDate]
  );

  const handleStartDateChange = (timestamp: number) => {
    const adjustedTimestamp = Math.max(timestamp, Time.currentMillis());
    setDates({
      ...dates,
      submissionStartDate: adjustedTimestamp,
      votingStartDate: adjustedTimestamp,
    });
  };

  return (
    <DateAccordion
      title={
        <div className="tw-flex tw-items-center tw-gap-x-2">
          <span>Wave Start</span>
          <TooltipIconButton
            icon={faInfoCircle}
            tooltipText="Choose when the approve wave opens. Approvals and submissions start at the same moment."
            tooltipPosition="bottom"
            tooltipWidth="tw-w-80"
          />
        </div>
      }
      isExpanded={isExpanded}
      onToggle={() => setIsExpanded(!isExpanded)}
      collapsedContent={
        <div className="tw-flex tw-items-center tw-rounded-lg tw-bg-iron-700/40 tw-px-3 tw-py-2 tw-shadow-md tw-transition-transform tw-duration-200 hover:tw-translate-y-[-1px]">
          <FontAwesomeIcon
            icon={faCalendarDays}
            className="tw-mr-2 tw-size-4 tw-text-primary-400"
          />
          <div>
            <p className="tw-mb-0 tw-text-xs tw-text-iron-300/70">
              Wave Starts
            </p>
            <p className="tw-mb-0 tw-text-sm tw-font-medium tw-text-iron-50">
              {startDateFormatted}
            </p>
          </div>
        </div>
      }
    >
      <div className="tw-grid tw-grid-cols-1 tw-gap-x-10 tw-gap-y-8 tw-px-5 tw-pb-5 tw-pt-2">
        <div className="tw-col-span-1">
          <p className="tw-mb-0 tw-text-lg tw-font-semibold tw-text-iron-50 sm:tw-text-xl">
            Wave Starts
          </p>
          <p className="tw-mt-1 tw-text-xs tw-text-iron-400">
            This is when the approve wave opens for submissions and approvals.
          </p>
          <div className="tw-mt-4 tw-w-full tw-max-w-md">
            <CommonCalendar
              initialMonth={new Date().getMonth()}
              initialYear={new Date().getFullYear()}
              selectedTimestamp={dates.submissionStartDate}
              minTimestamp={null}
              maxTimestamp={null}
              setSelectedTimestamp={handleStartDateChange}
            />
          </div>
        </div>
      </div>
    </DateAccordion>
  );
}
