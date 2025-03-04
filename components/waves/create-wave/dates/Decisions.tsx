import { useState, useMemo } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCalendarPlus,
  faTrashCan,
} from "@fortawesome/free-regular-svg-icons";
import { faArrowRight } from "@fortawesome/free-solid-svg-icons";
import CommonCalendar from "../../../utils/calendar/CommonCalendar";
import { CreateWaveDatesConfig } from "../../../../types/waves.types";
import { Period } from "../../../../helpers/Types";
import DateAccordion from "../../../common/DateAccordion";
import TimePicker from "../../../common/TimePicker";
import DecisionPointDropdown from "./DecisionPointDropdown";
import DecisionsFirst from "./DecisionsFirst";

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
  const [decisionPoints, setDecisionPoints] = useState<
    { time: number; period: Period }[]
  >([]);
  const [additionalTime, setAdditionalTime] = useState<number>(1);
  const [timeframeUnit, setTimeframeUnit] = useState<Period>(Period.DAYS);

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

    const endDate = new Date(dates.endDate);
    endDate.setHours(hours);
    endDate.setMinutes(minutes);
    const firstPointText = formatDate(endDate);

    const points = decisionPoints.map((point, index) => {
      const { time, period } = point;
      const pointDate = new Date(endDate);

      switch (period) {
        case Period.HOURS:
          pointDate.setHours(pointDate.getHours() - time);
          break;
        case Period.DAYS:
          pointDate.setDate(pointDate.getDate() - time);
          break;
        case Period.WEEKS:
          pointDate.setDate(pointDate.getDate() - time * 7);
          break;
        case Period.MONTHS:
          pointDate.setMonth(pointDate.getMonth() - time);
          break;
      }

      return {
        index,
        date: pointDate,
        formattedDate: formatDate(pointDate),
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

  const renderCollapsedContent = () => {
    // Only show collapsed content when there's an end date set
    if (!dates.endDate) return null;

    return (
      <div className="tw-flex tw-items-center tw-bg-[#24242B] tw-px-3 tw-py-2 tw-rounded-lg tw-shadow-md hover:tw-translate-y-[-1px] tw-transition-transform tw-duration-200">
        <FontAwesomeIcon
          icon={faCalendarPlus}
          className="tw-mr-2 tw-size-4 tw-text-primary-400"
        />
        <div>
          <p className="tw-mb-0 tw-text-xs tw-text-iron-300/70">
            Decision Points
          </p>
          <p className="tw-mb-0 tw-text-sm tw-font-medium tw-text-iron-50">
            {decisionPoints.length > 0
              ? `${decisionPoints.length + 1} points configured`
              : "First point configured"}
          </p>
        </div>
      </div>
    );
  };

  // TODO: calculate end date based on first decision time and decision points and isRolling

  return (
    <DateAccordion
      title="Decisions"
      isExpanded={isExpanded}
      onToggle={() => setIsExpanded(!isExpanded)}
      collapsedContent={renderCollapsedContent()}
    >
      <div
        className="tw-grid tw-grid-cols-1 tw-gap-y-4 tw-gap-x-10 md:tw-grid-cols-2 tw-px-5 tw-pb-5 tw-pt-2"
        onClick={onInteraction}
      >
        <DecisionsFirst
          firstDecisionTime={dates.firstDecisionTime}
          setFirstDecisionTime={(time) =>
            setDates({ ...dates, firstDecisionTime: time })
          }
        />

        {dates.endDate && (
          <div className="tw-col-span-2">
            <div className="tw-flex tw-flex-col tw-gap-y-2">
              {dates.endDate && (
                <div className="tw-bg-iron-800/30 tw-rounded-lg tw-p-4 tw-mb-4">
                  <h3 className="tw-text-iron-100 tw-text-base tw-font-medium tw-mb-3">
                    Decision Points
                  </h3>
                  <div className="tw-mb-4 tw-relative">
                    <div className="tw-flex tw-items-center tw-justify-between tw-h-12 tw-px-3 tw-bg-[#24242B] tw-rounded-lg hover:tw-bg-[#26262E] tw-transition-colors tw-duration-200">
                      <div className="tw-flex tw-items-center">
                        <div className="tw-flex tw-items-center tw-justify-center tw-w-6 tw-h-6 tw-rounded-full tw-bg-primary-500/20 tw-text-primary-400 tw-text-xs tw-font-medium tw-mr-3">
                          1
                        </div>
                        <p className="tw-mb-0 tw-text-sm tw-font-medium">
                          <span className="tw-text-iron-400">
                            First decision point:
                          </span>{" "}
                          <span className="tw-text-iron-50">
                            {firstPointText}
                          </span>
                        </p>
                      </div>
                    </div>
                  </div>
                  {formattedPoints.map((point, index) => (
                    <div key={index} className="tw-mb-4 tw-relative">
                      <div className="tw-flex tw-items-center tw-justify-between tw-h-12 tw-px-3 tw-bg-[#24242B] tw-rounded-lg hover:tw-bg-[#26262E] tw-transition-colors tw-duration-200 tw-group">
                        <div className="tw-flex tw-items-center">
                          <div className="tw-flex tw-items-center tw-justify-center tw-w-6 tw-h-6 tw-rounded-full tw-bg-primary-500/20 tw-text-primary-400 tw-text-xs tw-font-medium tw-mr-3">
                            {index + 2}
                          </div>
                          <p className="tw-mb-0 tw-text-sm tw-font-medium">
                            <span className="tw-text-iron-400">
                              Decision point {index + 2}:
                            </span>{" "}
                            <span className="tw-text-iron-50">
                              {point.formattedDate}
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
                    </div>
                  ))}
                </div>
              )}

              <div className="tw-flex tw-items-center tw-mb-2">
                <div className="tw-flex tw-items-center tw-justify-center tw-size-7 tw-rounded-full tw-bg-primary-500/20 tw-text-primary-400 tw-text-xs tw-font-medium tw-mr-3">
                  <FontAwesomeIcon
                    icon={faCalendarPlus}
                    className="tw-size-3.5 tw-flex-shrink-0"
                  />
                </div>
                <p className="tw-mb-0 tw-text-base tw-font-medium tw-text-iron-50">
                  Add decision point
                </p>
              </div>

              <div className="tw-flex tw-items-center">
                <div className="tw-flex tw-items-stretch tw-rounded-lg tw-flex-1 tw-w-full">
                  <div className="tw-w-24 tw-bg-iron-900 tw-rounded-l-lg tw-ring-1 tw-ring-iron-700 tw-ring-inset focus-within:tw-ring-primary-400 tw-transition tw-duration-300 tw-ease-out">
                    <input
                      type="number"
                      min="1"
                      value={additionalTime}
                      onChange={(e) =>
                        setAdditionalTime(
                          e.target.value === ""
                            ? 0
                            : parseInt(e.target.value, 10)
                        )
                      }
                      className="tw-w-full tw-h-full tw-px-4 tw-py-4 tw-bg-transparent tw-border-0 tw-text-primary-400 tw-font-medium tw-caret-primary-300 focus:tw-outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:tw-appearance-none [&::-webkit-inner-spin-button]:tw-appearance-none"
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
          </div>
        )}
      </div>
    </DateAccordion>
  );
}
