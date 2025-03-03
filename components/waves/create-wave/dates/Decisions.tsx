import { useState, useMemo } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCalendarPlus,
  faTrashCan,
} from "@fortawesome/free-regular-svg-icons";
import CommonCalendar from "../../../utils/calendar/CommonCalendar";
import { CreateWaveDatesConfig } from "../../../../types/waves.types";
import { Period } from "../../../../helpers/Types";
import DateAccordion from "../../../common/DateAccordion";
import TimePicker from "../../../common/TimePicker";
import DecisionPointDropdown from "../../../../components/waves/create-wave/dates/DecisionPointDropdown";

interface DecisionsProps {
  readonly dates: CreateWaveDatesConfig;
  readonly setDates: (dates: CreateWaveDatesConfig) => void;
  readonly isRollingMode: boolean;
  readonly endDateConfig: { time: number | null; period: Period | null };
  readonly setEndDateConfig: (config: {
    time: number | null;
    period: Period | null;
  }) => void;
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
  const [decisionPoints, setDecisionPoints] = useState<
    Array<{ time: number; period: Period }>
  >([]);

  const formatDate = (date: Date) =>
    date.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "numeric",
      hour12: true,
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
        case Period.MINUTES:
          nextDate.setMinutes(nextDate.getMinutes() + point.time);
          break;
        case Period.HOURS:
          nextDate.setHours(nextDate.getHours() + point.time);
          break;
        case Period.DAYS:
          nextDate.setDate(nextDate.getDate() + point.time);
          break;
        case Period.MONTHS:
          nextDate.setMonth(nextDate.getMonth() + point.time);
          break;
      }
      currentDate = nextDate;

      const suffix =
        point.time === 1
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
    const newPoint = { time: additionalTime, period: timeframeUnit };
    setEndDateConfig(newPoint);
    setDecisionPoints([...decisionPoints, newPoint]);
    setAdditionalTime(1);
  };

  const handleDeletePoint = (index: number, e: React.MouseEvent) => {
    e.stopPropagation();
    const newPoints = decisionPoints.filter((_, i) => i !== index);
    setDecisionPoints(newPoints);

    if (newPoints.length > 0) {
      const lastPoint = newPoints[newPoints.length - 1];
      setEndDateConfig(lastPoint);
    } else {
      setEndDateConfig({ time: null, period: null });
    }
  };

  return (
    <DateAccordion
      title="Decisions"
      isExpanded={isExpanded}
      onToggle={() => setIsExpanded(!isExpanded)}
      collapsedContent={
        dates.endDate && (
          <div className="tw-flex tw-items-center tw-flex-wrap tw-gap-2 tw-justify-end">
            {/* First decision point */}
            <div className="tw-flex tw-items-center">
              <div className="tw-flex tw-items-center tw-justify-center tw-w-5 tw-h-5 tw-rounded-full tw-bg-primary-500/20 tw-text-primary-400 tw-text-xs tw-font-medium tw-mr-2">
                1
              </div>
              <p className="tw-mb-0 tw-text-sm tw-text-iron-300">
                {firstPointText}
              </p>
            </div>

            {/* Show up to 3 more decision points */}
            {formattedPoints.slice(0, 3).map((point) => (
              <div key={point.index} className="tw-flex tw-items-center">
                <div className="tw-flex tw-items-center tw-justify-center tw-w-5 tw-h-5 tw-rounded-full tw-bg-primary-500/20 tw-text-primary-400 tw-text-xs tw-font-medium tw-mr-2">
                  {point.index}
                </div>
                <p className="tw-mb-0 tw-text-sm tw-text-iron-300">
                  {point.date}
                </p>
              </div>
            ))}

            {/* If there are more than 4 total points, show an indicator */}
            {formattedPoints.length > 3 && (
              <div className="tw-flex tw-items-center">
                <div className="tw-flex tw-items-center tw-justify-center tw-h-5 tw-px-2 tw-rounded-full tw-bg-primary-500/10 tw-text-primary-400 tw-text-xs tw-font-medium">
                  <div className="tw-flex tw-space-x-0.5 tw-mr-1">
                    <div className="tw-w-1 tw-h-1 tw-rounded-full tw-bg-primary-400"></div>
                    <div className="tw-w-1 tw-h-1 tw-rounded-full tw-bg-primary-400"></div>
                    <div className="tw-w-1 tw-h-1 tw-rounded-full tw-bg-primary-400"></div>
                  </div>
                  <span className="tw-text-xs">
                    {formattedPoints.length - 3} more
                  </span>
                </div>
              </div>
            )}
          </div>
        )
      }
    >
      <div
        className="tw-grid tw-grid-cols-1 tw-gap-y-4 tw-gap-x-10 md:tw-grid-cols-2 tw-px-5 tw-pb-5 tw-pt-2"
        onClick={onInteraction}
      >
        <div className="tw-col-span-1">
          <CommonCalendar
            initialMonth={new Date().getMonth()}
            initialYear={new Date().getFullYear()}
            selectedTimestamp={dates.endDate}
            minTimestamp={dates.submissionStartDate}
            maxTimestamp={null}
            setSelectedTimestamp={(timestamp) =>
              setDates({ ...dates, endDate: timestamp })
            }
          />
        </div>

        <div className="tw-col-span-1">
          <TimePicker
            hours={hours}
            minutes={minutes}
            onTimeChange={(h, m) => {
              setHours(h);
              setMinutes(m);
            }}
          />
        </div>

        {dates.endDate && (
          <div className="tw-col-span-2">
            <div className="tw-flex tw-flex-col tw-gap-y-2">
              <div className="tw-h-12 tw-flex tw-items-center tw-px-3 tw-bg-[#24242B] tw-rounded-lg tw-mb-2 hover:tw-bg-[#26262E] tw-transition-colors tw-duration-200">
                <div className="tw-flex tw-items-center tw-justify-center tw-w-6 tw-h-6 tw-rounded-full tw-bg-primary-500/20 tw-text-primary-400 tw-text-xs tw-font-medium tw-mr-3">
                  1
                </div>
                <p className="tw-mb-0 tw-text-base tw-font-medium tw-text-iron-50">
                  First decision point:{" "}
                  <span className="tw-text-iron-300 tw-font-normal">
                    {firstPointText}
                  </span>
                </p>
              </div>

              {formattedPoints.map((point, index) => (
                <div
                  key={index}
                  className="tw-h-12 tw-flex tw-items-center tw-justify-between tw-px-3 tw-bg-[#24242B] tw-rounded-lg tw-mb-2 tw-group hover:tw-bg-[#26262E] tw-transition-colors tw-duration-200"
                >
                  <div className="tw-flex tw-items-center">
                    <div className="tw-flex tw-items-center tw-justify-center tw-w-6 tw-h-6 tw-rounded-full tw-bg-primary-500/20 tw-text-primary-400 tw-text-xs tw-font-medium tw-mr-3">
                      {point.index}
                    </div>
                    <p className="tw-mb-0 tw-text-base tw-font-medium tw-text-iron-50">
                      Decision point {point.index}:{" "}
                      <span className="tw-text-iron-300 tw-font-normal">
                        {point.date}
                      </span>
                      <span className="tw-text-primary-400 tw-text-sm tw-ml-2">
                        (+{point.timeAdded})
                      </span>
                    </p>
                  </div>
                  <button
                    onClick={(e) => handleDeletePoint(index, e)}
                    className="tw-opacity-0 group-hover:tw-opacity-100 tw-transition-opacity tw-duration-200 tw-bg-transparent tw-border-0 tw-text-iron-400 desktop-hover:hover:tw-text-red tw-size-8 tw-rounded-full desktop-hover:hover:tw-bg-[#32323C]"
                    aria-label="Delete decision point"
                  >
                    <FontAwesomeIcon
                      icon={faTrashCan}
                      className="tw-size-4 tw-flex-shrink-0"
                    />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Always show the "Add next decision point" section when dates.endDate exists */}
        {dates.endDate && (
          <div className="tw-col-span-2 tw-mt-6">
            <div className="tw-flex tw-items-center tw-mb-4">
              <FontAwesomeIcon
                icon={faCalendarPlus}
                className="tw-mr-3 tw-size-5 tw-text-primary-400 tw-flex-shrink-0"
              />
              <p className="tw-mb-0 tw-text-base tw-font-medium tw-text-iron-50">
                Add next decision point
              </p>
            </div>

            <div className="tw-flex tw-items-center tw-justify-between">
              <div className="tw-flex tw-items-stretch tw-rounded-lg tw-flex-1 tw-w-full">
                <div className="tw-w-24 tw-bg-iron-900 tw-rounded-l-lg tw-ring-1 tw-ring-iron-700 desktop-hover:hover:tw-ring-iron-650 tw-ring-inset focus-within:tw-ring-primary-400 tw-transition tw-duration-300 tw-ease-out">
                  <input
                    type="number"
                    min="1"
                    value={additionalTime}
                    onChange={(e) => {
                      const value =
                        e.target.value === ""
                          ? ""
                          : parseInt(e.target.value, 10);
                      setAdditionalTime(value as number);
                    }}
                    className="tw-w-full tw-h-full tw-px-4 tw-py-4 tw-bg-transparent tw-border-0 tw-text-primary-400 tw-font-medium tw-caret-primary-300 focus:tw-outline-none"
                  />
                </div>
                <DecisionPointDropdown
                  value={timeframeUnit}
                  onChange={(value) => setTimeframeUnit(value)}
                />
              </div>
              <button
                onClick={handleAddTimeframe}
                disabled={!additionalTime}
                className="tw-ml-3 tw-flex-shrink-0 tw-bg-primary-500 hover:tw-bg-primary-600 disabled:tw-bg-iron-700 disabled:tw-cursor-not-allowed tw-text-white tw-rounded-lg tw-px-4 tw-py-2.5 tw-text-sm tw-transition-all tw-duration-200 tw-border-0"
              >
                Add
              </button>
            </div>
          </div>
        )}
      </div>
    </DateAccordion>
  );
}
