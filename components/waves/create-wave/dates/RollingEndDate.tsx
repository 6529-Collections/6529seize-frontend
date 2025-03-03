import { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCalendarAlt, faInfoCircle } from "@fortawesome/free-solid-svg-icons";
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
  const [showTooltip, setShowTooltip] = useState(false);

  const formatEndDateTime = () => {
    if (!dates.endDate) return "Not set";

    const date = new Date(dates.endDate);
    const formattedDate = date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });

    const hours = date.getHours();
    const minutes = date.getMinutes();
    const ampm = hours >= 12 ? "PM" : "AM";
    const formattedHours = hours % 12 || 12;
    const formattedMinutes = minutes.toString().padStart(2, "0");

    return `${formattedDate} at ${formattedHours}:${formattedMinutes} ${ampm}`;
  };

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
            {formatEndDateTime()}
          </p>
        </div>
      </div>
    );
  };

  const handleDateSelection = (timestamp: number) => {
    const date = new Date(timestamp);
    date.setHours(endDateHours);
    date.setMinutes(endDateMinutes);
    setDates({ ...dates, endDate: date.getTime() });
  };

  const handleTimeChange = (h: number, m: number) => {
    setEndDateHours(h);
    setEndDateMinutes(m);

    if (dates.endDate) {
      const date = new Date(dates.endDate);
      date.setHours(h);
      date.setMinutes(m);
      setDates({ ...dates, endDate: date.getTime() });
    }
  };

  const renderExpandedContent = () => (
    <div className="tw-grid tw-grid-cols-1 tw-gap-y-4 tw-gap-x-10 md:tw-grid-cols-2 tw-px-5 tw-pb-5 tw-pt-2">
      <div className="tw-col-span-1">
        <CommonCalendar
          initialMonth={new Date().getMonth()}
          initialYear={new Date().getFullYear()}
          selectedTimestamp={dates.endDate}
          minTimestamp={dates.submissionStartDate}
          maxTimestamp={null}
          setSelectedTimestamp={handleDateSelection}
        />
      </div>
      <div className="tw-col-span-1">
        <TimePicker
          hours={endDateHours}
          minutes={endDateMinutes}
          onTimeChange={handleTimeChange}
        />
      </div>
    </div>
  );

  const handleToggleSwitch = (value: boolean) => {
    setIsRollingMode(value);
    
    if (value) {
      // When turning on rolling mode, always expand the accordion
      setIsExpanded(true);
    } else {
      // When turning off rolling mode, always collapse the accordion
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
                    A rolling end date allows the wave to end based on decision points rather than a fixed date. Toggle this on to enable dynamic end date calculation.
                  </div>
                )}
              </div>
            </div>
            <div onClick={(e) => e.stopPropagation()}>
              <CommonSwitch
                label=""
                isOn={isRollingMode}
                setIsOn={handleToggleSwitch}
              />
            </div>
          </div>
        }
        isExpanded={isRollingMode && isExpanded}
        onToggle={() => {
          if (isRollingMode) {
            setIsExpanded(!isExpanded);
          }
        }}
        collapsedContent={renderCollapsedContent()}
        showChevron={isRollingMode}
      >
        {renderExpandedContent()}
      </DateAccordion>
    </div>
  );
}
