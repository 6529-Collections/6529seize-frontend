import { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCalendarAlt } from "@fortawesome/free-solid-svg-icons";
import CommonCalendar from "../../../utils/calendar/CommonCalendar";
import { CreateWaveDatesConfig } from "../../../../types/waves.types";
import CommonSwitch from "../../../utils/switch/CommonSwitch";
import DateAccordion from "../../../common/DateAccordion";
import TimePicker from "../../../common/TimePicker";

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
  const [endDateHours, setEndDateHours] = useState(0);
  const [endDateMinutes, setEndDateMinutes] = useState(0);

  const formatEndDateTime = () => {
    if (!dates.endDate) return null;

    const date = new Date(dates.endDate);
    date.setHours(endDateHours);
    date.setMinutes(endDateMinutes);

    return date.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "numeric",
      hour12: true,
    });
  };

  const formattedEndDate = dates.endDate ? formatEndDateTime() : null;

  return (
    <DateAccordion
      title={
        <div className="tw-flex tw-items-center tw-justify-between tw-flex-1 tw-gap-x-4">
          <span>Rolling End Date</span>
          <CommonSwitch
            label=""
            isOn={isRollingMode}
            setIsOn={setIsRollingMode}
          />
        </div>
      }
      isExpanded={isExpanded}
      onToggle={() => setIsExpanded(!isExpanded)}
      collapsedContent={
        dates.endDate && (
          <div className="tw-flex tw-items-center tw-gap-x-2">
            <div className="tw-h-4 tw-w-[1px] tw-bg-iron-700/50" />
            <div className="tw-flex tw-items-center tw-gap-x-1.5">
              <FontAwesomeIcon icon={faCalendarAlt} className="tw-size-3.5 tw-text-primary-400" />
              <p className="tw-mb-0 tw-text-sm tw-text-iron-300">{formattedEndDate}</p>
            </div>
          </div>
        )
      }
    >
      <div className="tw-grid tw-grid-cols-1 tw-gap-y-4 tw-gap-x-10 md:tw-grid-cols-2  tw-px-5 tw-pb-5 tw-pt-2">
        <div className="tw-col-span-1">
          {isRollingMode && (
            <>
              <p className="tw-mb-3 tw-text-base tw-font-medium tw-text-iron-50">Select end date</p>
              <div className="tw-bg-[#24242B] tw-rounded-xl tw-shadow-md tw-ring-1 tw-ring-iron-700/50 tw-p-4">
                <CommonCalendar
                  initialMonth={new Date().getMonth()}
                  initialYear={new Date().getFullYear()}
                  selectedTimestamp={dates.endDate}
                  minTimestamp={dates.submissionStartDate}
                  maxTimestamp={null}
                  setSelectedTimestamp={(timestamp) => setDates({...dates, endDate: timestamp})}
                />
              </div>
            </>
          )}
        </div>
        
        <div className="tw-col-span-1">
          {isRollingMode && (
            <div className="tw-mt-9">
              <TimePicker 
                hours={endDateHours} 
                minutes={endDateMinutes} 
                onTimeChange={(h, m) => {
                  setEndDateHours(h);
                  setEndDateMinutes(m);
                }} 
              />
            </div>
          )}
        </div>
      </div>
    </DateAccordion>
  );
} 