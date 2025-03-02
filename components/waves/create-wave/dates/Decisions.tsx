import { useState, useMemo } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCalendarPlus, faTrash } from "@fortawesome/free-solid-svg-icons";
import CommonCalendar from "../../../utils/calendar/CommonCalendar";
import { CreateWaveDatesConfig } from "../../../../types/waves.types";
import { Period } from "../../../../helpers/Types";
import DateAccordion from "../../../common/DateAccordion";
import TimePicker from "../../../common/TimePicker";

interface DecisionsProps {
  readonly dates: CreateWaveDatesConfig;
  readonly setDates: (dates: CreateWaveDatesConfig) => void;
  readonly isRollingMode: boolean;
  readonly endDateConfig: { time: number | null; period: Period | null };
  readonly setEndDateConfig: (config: { time: number | null; period: Period | null }) => void;
  readonly isExpanded: boolean;
  readonly setIsExpanded: (expanded: boolean) => void;
  readonly onInteraction: () => void;
}

export default function Decisions({
  dates,
  setDates,
  isRollingMode,
  endDateConfig,
  setEndDateConfig,
  isExpanded,
  setIsExpanded,
  onInteraction,
}: DecisionsProps) {
  const [hours, setHours] = useState(0);
  const [minutes, setMinutes] = useState(0);
  const [additionalTime, setAdditionalTime] = useState(1);
  const [timeframeUnit, setTimeframeUnit] = useState<Period>(Period.DAYS);
  const [decisionPoints, setDecisionPoints] = useState<Array<{ time: number; period: Period }>>([]);

  const formatDate = (date: Date) => date.toLocaleString("en-US", {
    month: "short", day: "numeric", year: "numeric", 
    hour: "numeric", minute: "numeric", hour12: true,
  });

  const { formattedPoints, firstPointText } = useMemo(() => {
    if (!dates.endDate) return { formattedPoints: [], firstPointText: null };

    const firstDate = new Date(dates.endDate);
    firstDate.setHours(hours, minutes);
    const firstPointText = formatDate(firstDate);
    
    if (!decisionPoints.length) return { formattedPoints: [], firstPointText };

    let currentDate = firstDate;
    const points = decisionPoints.map((point, i) => {
      const nextDate = new Date(currentDate);
      switch (point.period) {
        case Period.MINUTES: nextDate.setMinutes(nextDate.getMinutes() + point.time); break;
        case Period.HOURS: nextDate.setHours(nextDate.getHours() + point.time); break;
        case Period.DAYS: nextDate.setDate(nextDate.getDate() + point.time); break;
        case Period.MONTHS: nextDate.setMonth(nextDate.getMonth() + point.time); break;
      }
      currentDate = nextDate;
      
      const suffix = point.time === 1 
        ? point.period.toLowerCase().slice(0, -1) 
        : point.period.toLowerCase();
        
      return {
        index: i + 2,
        date: formatDate(nextDate),
        timeAdded: `${point.time} ${suffix}`,
      };
    });

    return { formattedPoints: points, firstPointText };
  }, [dates.endDate, hours, minutes, decisionPoints]);

  const handleAddTimeframe = () => {
    if (additionalTime <= 0) return;
    setEndDateConfig({ time: additionalTime, period: timeframeUnit });
    setDecisionPoints([...decisionPoints, { time: additionalTime, period: timeframeUnit }]);
    setAdditionalTime(1);
  };

  return (
    <DateAccordion
      title="Decisions"
      isExpanded={isExpanded}
      onToggle={() => setIsExpanded(!isExpanded)}
      collapsedContent={
        dates.endDate && (
          <p className="tw-mb-0 tw-text-sm tw-text-iron-300">
            First point: {firstPointText}
            {decisionPoints.length > 0 && ` + ${decisionPoints.length} more`}
          </p>
        )
      }
    >
      <div className="tw-grid tw-grid-cols-1 tw-gap-y-4 tw-gap-x-10 md:tw-grid-cols-2" onClick={onInteraction}>
        <div className="tw-col-span-1">
          <CommonCalendar
            initialMonth={new Date().getMonth()}
            initialYear={new Date().getFullYear()}
            selectedTimestamp={dates.endDate}
            minTimestamp={dates.submissionStartDate}
            maxTimestamp={null}
            setSelectedTimestamp={(timestamp) => setDates({ ...dates, endDate: timestamp })}
          />
        </div>
        
        <div className="tw-col-span-1">
          <TimePicker 
            hours={hours} 
            minutes={minutes} 
            onTimeChange={(h, m) => { setHours(h); setMinutes(m); }} 
          />
        </div>

        {dates.endDate && (
          <div className="tw-col-span-2">
            <div className="tw-flex tw-flex-col tw-gap-y-2">
              <div className="tw-flex tw-items-center tw-p-3 tw-bg-[#24242B] tw-rounded-lg tw-mb-2 hover:tw-bg-[#26262E] tw-transition-colors tw-duration-200">
                <div className="tw-flex tw-items-center tw-justify-center tw-w-6 tw-h-6 tw-rounded-full tw-bg-primary-500/20 tw-text-primary-400 tw-text-xs tw-font-medium tw-mr-3">1</div>
                <p className="tw-mb-0 tw-text-base tw-font-medium tw-text-iron-50">
                  First decision point: <span className="tw-text-iron-300 tw-font-normal">{firstPointText}</span>
                </p>
              </div>

              {formattedPoints.map((point, index) => (
                <div key={index} className="tw-flex tw-items-center tw-justify-between tw-p-3 tw-bg-[#24242B] tw-rounded-lg tw-mb-2 tw-group hover:tw-bg-[#26262E] tw-transition-colors tw-duration-200">
                  <div className="tw-flex tw-items-center">
                    <div className="tw-flex tw-items-center tw-justify-center tw-w-6 tw-h-6 tw-rounded-full tw-bg-primary-500/20 tw-text-primary-400 tw-text-xs tw-font-medium tw-mr-3">{point.index}</div>
                    <p className="tw-mb-0 tw-text-base tw-font-medium tw-text-iron-50">
                      Decision point {point.index}: <span className="tw-text-iron-300 tw-font-normal">{point.date}</span>
                      <span className="tw-text-primary-400 tw-text-sm tw-ml-2">(+{point.timeAdded})</span>
                    </p>
                  </div>
                  <button
                    onClick={() => setDecisionPoints(decisionPoints.filter((_, i) => i !== index))}
                    className="tw-opacity-0 group-hover:tw-opacity-100 tw-transition-opacity tw-duration-200 tw-bg-transparent tw-border-0 tw-text-iron-400 hover:tw-text-red-400 tw-p-1.5 tw-rounded-full hover:tw-bg-[#32323C]"
                    aria-label="Delete decision point"
                  >
                    <FontAwesomeIcon icon={faTrash} className="tw-size-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {dates.endDate && !isRollingMode && (
          <div className="tw-col-span-2 tw-mt-6">
            <div className="tw-flex tw-items-center tw-mb-4">
              <FontAwesomeIcon icon={faCalendarPlus} className="tw-mr-3 tw-size-5 tw-text-primary-400" />
              <p className="tw-mb-0 tw-text-base tw-font-medium tw-text-iron-50">Add next decision point</p>
            </div>

            <div className="tw-py-4 tw-px-5 tw-rounded-xl tw-bg-iron-900 tw-shadow-sm tw-ring-1 tw-ring-iron-700/50 tw-mb-4">
              <div className="tw-flex tw-items-center tw-justify-between">
                <div className="tw-flex tw-items-stretch tw-border tw-border-iron-700/50 tw-rounded-lg tw-overflow-hidden tw-flex-1 tw-max-w-md">
                  <input
                    type="number"
                    min="1"
                    value={additionalTime}
                    onChange={(e) => setAdditionalTime(parseInt(e.target.value, 10))}
                    className="tw-w-24 tw-bg-iron-900 tw-border-0 tw-text-white tw-p-2.5 tw-text-center"
                  />
                  <select
                    value={timeframeUnit}
                    onChange={(e) => setTimeframeUnit(e.target.value as Period)}
                    className="tw-bg-iron-900 tw-border-0 tw-border-l tw-border-iron-700/50 tw-text-white tw-p-2.5 tw-flex-1 focus:tw-ring-primary-500/50 tw-transition-all tw-duration-200"
                  >
                    <option value={Period.MONTHS}>months</option>
                    <option value={Period.DAYS}>days</option>
                    <option value={Period.HOURS}>hours</option>
                    <option value={Period.MINUTES}>minutes</option>
                  </select>
                </div>
                <button
                  onClick={handleAddTimeframe}
                  className="tw-ml-3 tw-bg-primary-500 hover:tw-bg-primary-600 tw-text-white tw-rounded-lg tw-px-4 tw-py-2.5 tw-text-sm tw-transition-all tw-duration-200 tw-border-0"
                >
                  Add
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DateAccordion>
  );
}
