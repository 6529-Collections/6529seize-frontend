import CommonCalendar from "../../../utils/calendar/CommonCalendar";
import { CreateWaveDatesConfig } from "../../../../types/waves.types";
import { CREATE_WAVE_START_DATE_LABELS } from "../../../../helpers/waves/waves.constants";
import CreateWaveDatesEndDate from "./end-date/CreateWaveDatesEndDate";
import { ApiWaveType } from "../../../../generated/models/ApiWaveType";
import { useEffect, useState, useRef } from "react";
import { Time } from "../../../../helpers/time";
import { CREATE_WAVE_VALIDATION_ERROR } from "../../../../helpers/waves/create-wave.validation";
import { Period } from "../../../../helpers/Types";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faClock,
  faCalendarPlus,
  faCircle,
  faTrash,
  faChevronDown,
  faChevronUp,
  faCalendarDay,
  faVoteYea,
  faCalendarAlt,
} from "@fortawesome/free-solid-svg-icons";
import Toggle from "react-toggle";
import { motion, AnimatePresence } from "framer-motion";

export default function CreateWaveDates({
  waveType,
  dates,
  errors,
  setDates,
  endDateConfig,
  setEndDateConfig,
}: {
  readonly waveType: ApiWaveType;
  readonly dates: CreateWaveDatesConfig;
  readonly errors: CREATE_WAVE_VALIDATION_ERROR[];
  readonly setDates: (dates: CreateWaveDatesConfig) => void;
  readonly endDateConfig: { time: number | null; period: Period | null };
  readonly setEndDateConfig: (config: {
    time: number | null;
    period: Period | null;
  }) => void;
}) {
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();

  const getHaveMultipleTimestamps = (): boolean =>
    waveType === ApiWaveType.Rank;

  // Submission start date is always the minimum timestamp
  const getMinTimestamp = (): number | null => {
    if (!getHaveMultipleTimestamps()) return null;
    return dates.submissionStartDate;
  };

  const haveVotingStartDate = getHaveMultipleTimestamps();

  const onStartTimestampChange = (timestamp: number) => {
    const adjustedTimestamp =
      Time.currentMillis() > timestamp ? Time.currentMillis() : timestamp;
    setDates({
      ...dates,
      submissionStartDate: adjustedTimestamp,
      votingStartDate:
        haveVotingStartDate && dates.votingStartDate > adjustedTimestamp
          ? dates.votingStartDate
          : adjustedTimestamp,
    });
  };

  const onVotingStartTimestampChange = (timestamp: number) => {
    const adjustedTimestamp =
      dates.submissionStartDate > timestamp
        ? dates.submissionStartDate
        : timestamp;
    setDates({
      ...dates,
      votingStartDate: adjustedTimestamp,
    });
  };

  const onEndTimestampChange = (timestamp: number | null) => {
    setDates({
      ...dates,
      endDate: timestamp,
    });
  };

  const [minTimestamp, setMinTimestamp] = useState<number | null>(
    getMinTimestamp()
  );
  useEffect(() => {
    setMinTimestamp(getMinTimestamp());
  }, [waveType, dates]);

  const [hours, setHours] = useState(0);
  const [minutes, setMinutes] = useState(0);
  const [additionalTime, setAdditionalTime] = useState<number>(1);
  const [timeframeUnit, setTimeframeUnit] = useState<Period>(Period.DAYS);
  const [decisionPoints, setDecisionPoints] = useState<
    Array<{ time: number; period: Period }>
  >([]);
  const [isRollingMode, setIsRollingMode] = useState<boolean>(false);
  const [endDateHours, setEndDateHours] = useState(0);
  const [endDateMinutes, setEndDateMinutes] = useState(0);

  // Add state for accordion
  const [isDateSectionExpanded, setIsDateSectionExpanded] = useState(true);

  // Add a ref to track if the toggle was manually triggered
  const userToggledRef = useRef(false);

  // Auto-collapse date section when user interacts with decision section
  useEffect(() => {
    // Only auto-collapse if the user hasn't manually toggled
    if (dates.endDate && isDateSectionExpanded && !userToggledRef.current) {
      const timer = setTimeout(() => {
        setIsDateSectionExpanded(false);
      }, 300);

      return () => clearTimeout(timer);
    }
  }, [dates.endDate, isDateSectionExpanded]);

  const handleTimeChange = (newHours: number, newMinutes: number) => {
    setHours(newHours);
    setMinutes(newMinutes);
  };

  const handleEndDateTimeChange = (newHours: number, newMinutes: number) => {
    setEndDateHours(newHours);
    setEndDateMinutes(newMinutes);
  };

  const timeOptions = [
    { label: "12:00 AM", hours: 0, minutes: 0 },
    { label: "6:00 AM", hours: 6, minutes: 0 },
    { label: "9:00 AM", hours: 9, minutes: 0 },
    { label: "12:00 PM", hours: 12, minutes: 0 },
    { label: "3:00 PM", hours: 15, minutes: 0 },
    { label: "6:00 PM", hours: 18, minutes: 0 },
    { label: "9:00 PM", hours: 21, minutes: 0 },
    { label: "11:59 PM", hours: 23, minutes: 59 },
  ];

  const formatSelectedDateTime = () => {
    if (!dates.endDate) return null;

    const date = new Date(dates.endDate);
    date.setHours(hours);
    date.setMinutes(minutes);

    return date.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "numeric",
      hour12: true,
    });
  };

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

  const handleAddTimeframe = () => {
    if (additionalTime <= 0) return;

    // Update the endDateConfig as before
    setEndDateConfig({
      time: additionalTime,
      period: timeframeUnit,
    });

    // Also add to our local state to display
    setDecisionPoints([
      ...decisionPoints,
      {
        time: additionalTime,
        period: timeframeUnit,
      },
    ]);

    // Reset the input
    setAdditionalTime(1);
  };

  const handleDeleteDecisionPoint = (index: number) => {
    const newDecisionPoints = [...decisionPoints];
    newDecisionPoints.splice(index, 1);
    setDecisionPoints(newDecisionPoints);
  };

  const formatPeriod = (time: number, period: Period): string => {
    const periodText =
      time === 1
        ? period.toLowerCase().slice(0, -1) // Remove 's' for singular
        : period.toLowerCase();

    return `${time} ${periodText}`;
  };

  const calculateNextDecisionPoint = (
    baseDate: Date,
    timeConfig: { time: number; period: Period }
  ): Date => {
    const result = new Date(baseDate);

    switch (timeConfig.period) {
      case Period.MINUTES:
        result.setMinutes(result.getMinutes() + timeConfig.time);
        break;
      case Period.HOURS:
        result.setHours(result.getHours() + timeConfig.time);
        break;
      case Period.DAYS:
        result.setDate(result.getDate() + timeConfig.time);
        break;
      case Period.MONTHS:
        result.setMonth(result.getMonth() + timeConfig.time);
        break;
    }

    return result;
  };

  const formatDecisionPoints = () => {
    if (!dates.endDate || decisionPoints.length === 0) return [];

    const firstDecisionDate = new Date(dates.endDate);
    firstDecisionDate.setHours(hours);
    firstDecisionDate.setMinutes(minutes);

    let currentDate = firstDecisionDate;
    const formattedPoints = [];

    for (let i = 0; i < decisionPoints.length; i++) {
      const nextDate = calculateNextDecisionPoint(
        currentDate,
        decisionPoints[i]
      );

      formattedPoints.push({
        index: i + 2, // First point is index 1
        date: nextDate.toLocaleString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
          hour: "numeric",
          minute: "numeric",
          hour12: true,
        }),
        timeAdded: formatPeriod(
          decisionPoints[i].time,
          decisionPoints[i].period
        ),
      });

      currentDate = nextDate;
    }

    return formattedPoints;
  };

  // Format date for display in collapsed view
  const formatDateForSummary = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  // Toggle date section expansion
  const toggleDateSection = () => {
    // Mark that the user manually toggled
    userToggledRef.current = true;
    setIsDateSectionExpanded(!isDateSectionExpanded);

    // Reset the flag after a delay
    setTimeout(() => {
      userToggledRef.current = false;
    }, 500);
  };

  // Animation variants
  const accordionVariants = {
    open: {
      height: "auto",
      opacity: 1,
      transition: {
        duration: 0.3,
        ease: [0.04, 0.62, 0.23, 0.98],
      },
    },
    closed: {
      height: 0,
      opacity: 0,
      transition: {
        duration: 0.3,
        ease: [0.04, 0.62, 0.23, 0.98],
      },
    },
  };

  const iconVariants = {
    open: { rotate: 0 },
    closed: { rotate: 180 },
  };

  // Add state for decisions section expansion
  const [isDecisionSectionExpanded, setIsDecisionSectionExpanded] =
    useState(true);

  // Add ref to track manual toggle for decisions section
  const decisionsToggledRef = useRef(false);

  // Toggle decisions section expansion
  const toggleDecisionSection = () => {
    // Mark that the user manually toggled
    decisionsToggledRef.current = true;
    setIsDecisionSectionExpanded(!isDecisionSectionExpanded);

    // Reset the flag after a delay
    setTimeout(() => {
      decisionsToggledRef.current = false;
    }, 500);
  };

  // Add state for rolling end date section expansion
  const [isRollingEndDateSectionExpanded, setIsRollingEndDateSectionExpanded] =
    useState(true);

  // Add ref to track manual toggle for rolling end date section
  const rollingEndDateToggledRef = useRef(false);

  // Toggle rolling end date section expansion
  const toggleRollingEndDateSection = () => {
    // Mark that the user manually toggled
    rollingEndDateToggledRef.current = true;
    setIsRollingEndDateSectionExpanded(!isRollingEndDateSectionExpanded);

    // Reset the flag after a delay
    setTimeout(() => {
      rollingEndDateToggledRef.current = false;
    }, 500);
  };

  return (
    <div className="tw-flex tw-flex-col tw-gap-y-8">
      <motion.div
        className="tw-bg-gradient-to-b tw-from-[#1E1E24] tw-to-[#1C1C21] tw-rounded-xl tw-ring-1 tw-ring-iron-700/50 tw-overflow-hidden"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        {/* Header with toggle */}
        <motion.div
          className="tw-flex tw-items-center tw-justify-between tw-px-5 tw-py-4 tw-cursor-pointer hover:tw-bg-[#24242B] tw-transition-colors tw-duration-200"
          onClick={toggleDateSection}
          whileHover={{ backgroundColor: "rgba(36, 36, 43, 0.8)" }}
          whileTap={{ scale: 0.99 }}
        >
          <div className="tw-flex tw-items-center tw-gap-x-3">
            <motion.div
              animate={isDateSectionExpanded ? "open" : "closed"}
              variants={iconVariants}
              transition={{ duration: 0.3 }}
            >
              <FontAwesomeIcon
                icon={faChevronDown}
                className="tw-size-4 tw-text-primary-400"
              />
            </motion.div>
            <p className="tw-mb-0 tw-text-lg tw-font-semibold tw-text-iron-50">
              Start Dates
            </p>
          </div>

          {!isDateSectionExpanded && (
            <motion.div
              className="tw-flex tw-items-center tw-space-x-6"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.1, duration: 0.3 }}
            >
              <div className="tw-flex tw-items-center tw-bg-[#24242B] tw-px-3 tw-py-2 tw-rounded-lg tw-shadow-md hover:tw-translate-y-[-1px] tw-transition-transform tw-duration-200">
                <FontAwesomeIcon
                  icon={faCalendarDay}
                  className="tw-mr-2 tw-size-4 tw-text-primary-400"
                />
                <div>
                  <p className="tw-mb-0 tw-text-xs tw-text-iron-300/70">
                    Submission Start
                  </p>
                  <p className="tw-mb-0 tw-text-sm tw-font-medium tw-text-iron-50">
                    {formatDateForSummary(dates.submissionStartDate)}
                  </p>
                </div>
              </div>

              {haveVotingStartDate && (
                <div className="tw-flex tw-items-center tw-bg-[#24242B] tw-px-3 tw-py-2 tw-rounded-lg tw-shadow-md hover:tw-translate-y-[-1px] tw-transition-transform tw-duration-200">
                  <FontAwesomeIcon
                    icon={faVoteYea}
                    className="tw-mr-2 tw-size-4 tw-text-primary-400"
                  />
                  <div>
                    <p className="tw-mb-0 tw-text-xs tw-text-iron-300/70">
                      Voting Start
                    </p>
                    <p className="tw-mb-0 tw-text-sm tw-font-medium tw-text-iron-50">
                      {formatDateForSummary(dates.votingStartDate)}
                    </p>
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </motion.div>

        {/* Expandable content with smooth transition */}
        <AnimatePresence>
          {isDateSectionExpanded && (
            <motion.div
              initial="closed"
              animate="open"
              exit="closed"
              variants={accordionVariants}
              className="tw-overflow-hidden"
            >
              <div className="tw-px-5 tw-pb-5 tw-pt-2">
                <div className="tw-grid tw-grid-cols-1 tw-gap-y-8 tw-gap-x-10 md:tw-grid-cols-2">
                  <div className="tw-col-span-1">
                    <p className="tw-mb-0 tw-text-lg sm:tw-text-xl tw-font-semibold tw-text-iron-50">
                      {CREATE_WAVE_START_DATE_LABELS[waveType]}
                    </p>
                    <CommonCalendar
                      initialMonth={currentMonth}
                      initialYear={currentYear}
                      selectedTimestamp={dates.submissionStartDate}
                      minTimestamp={null}
                      maxTimestamp={null}
                      setSelectedTimestamp={onStartTimestampChange}
                    />
                  </div>
                  {haveVotingStartDate && (
                    <div className="tw-col-span-1">
                      <p className="tw-mb-0 tw-text-lg sm:tw-text-xl tw-font-semibold tw-text-iron-50">
                        Voting start date
                      </p>
                      <div className="tw-mt-2">
                        <CommonCalendar
                          initialMonth={currentMonth}
                          initialYear={currentYear}
                          minTimestamp={minTimestamp}
                          maxTimestamp={null}
                          selectedTimestamp={dates.votingStartDate}
                          setSelectedTimestamp={onVotingStartTimestampChange}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
        className="tw-bg-gradient-to-b tw-from-[#1E1E24] tw-to-[#1C1C21] tw-rounded-xl tw-ring-1 tw-ring-iron-700/50 tw-p-5"
      >
        <div className="tw-mb-4">
          <div
            className="tw-flex tw-items-center tw-justify-between tw-cursor-pointer"
            onClick={toggleDecisionSection}
          >
            <div className="tw-flex tw-items-center tw-gap-x-3">
              <motion.div
                animate={isDecisionSectionExpanded ? "open" : "closed"}
                variants={iconVariants}
                transition={{ duration: 0.3 }}
              >
                <FontAwesomeIcon
                  icon={faChevronDown}
                  className="tw-size-4 tw-text-primary-400"
                />
              </motion.div>
              <p className="tw-mb-0 tw-text-lg tw-font-semibold tw-text-iron-50">
                Decisions
              </p>
            </div>

            {!isDecisionSectionExpanded && dates.endDate && (
              <motion.div
                className="tw-flex tw-items-center"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.1, duration: 0.3 }}
              >
                <p className="tw-mb-0 tw-text-sm tw-text-iron-300">
                  First point: {formatSelectedDateTime()}
                  {formatDecisionPoints().length > 0 &&
                    ` + ${formatDecisionPoints().length} more`}
                </p>
              </motion.div>
            )}
          </div>
        </div>

        {/* Expandable content with smooth transition */}
        <AnimatePresence>
          {isDecisionSectionExpanded && (
            <motion.div
              initial="closed"
              animate="open"
              exit="closed"
              variants={accordionVariants}
              className="tw-overflow-hidden"
            >
              <div className="tw-grid tw-grid-cols-1 tw-gap-y-4 tw-gap-x-10 md:tw-grid-cols-2">
                <div className="tw-col-span-1">
                  <CommonCalendar
                    initialMonth={currentMonth}
                    initialYear={currentYear}
                    selectedTimestamp={dates.endDate}
                    minTimestamp={dates.submissionStartDate}
                    maxTimestamp={null}
                    setSelectedTimestamp={onEndTimestampChange}
                  />
                </div>
                <div className="tw-col-span-1 tw-flex tw-flex-col tw-justify-between">
                  <div className="tw-mt-3 tw-py-4 tw-relative tw-rounded-xl tw-bg-[#24242B] tw-shadow-md tw-ring-1 tw-ring-iron-700/50">
                    <div className="tw-px-5">
                      <div className="tw-flex tw-items-center tw-mb-4">
                        <FontAwesomeIcon
                          icon={faClock}
                          className="tw-mr-3 tw-size-5 tw-text-primary-400"
                        />
                        <p className="tw-mb-0 tw-text-base tw-font-medium tw-text-iron-50">
                          Select time
                        </p>
                      </div>

                      <div className="tw-flex tw-items-center tw-mb-5">
                        <div className="tw-flex tw-items-center tw-space-x-2 tw-flex-1">
                          <div className="tw-w-16">
                            <input
                              type="number"
                              min="0"
                              max="23"
                              value={hours}
                              onChange={(e) =>
                                handleTimeChange(
                                  parseInt(e.target.value, 10),
                                  minutes
                                )
                              }
                              className="tw-w-full tw-bg-[#2A2A33] tw-border-0 tw-text-white tw-rounded-lg tw-p-2 tw-text-center tw-ring-1 tw-ring-iron-700/30 focus:tw-ring-primary-500/50 tw-transition-all tw-duration-200"
                              placeholder="HH"
                            />
                          </div>
                          <span className="tw-text-iron-50 tw-font-bold">
                            :
                          </span>
                          <div className="tw-w-16">
                            <input
                              type="number"
                              min="0"
                              max="59"
                              value={minutes}
                              onChange={(e) =>
                                handleTimeChange(
                                  hours,
                                  parseInt(e.target.value, 10)
                                )
                              }
                              className="tw-w-full tw-bg-[#2A2A33] tw-border-0 tw-text-white tw-rounded-lg tw-p-2 tw-text-center tw-ring-1 tw-ring-iron-700/30 focus:tw-ring-primary-500/50 tw-transition-all tw-duration-200"
                              placeholder="MM"
                            />
                          </div>
                          <button
                            onClick={() =>
                              handleTimeChange(
                                hours >= 12 ? hours - 12 : hours + 12,
                                minutes
                              )
                            }
                            className="tw-bg-[#2A2A33] hover:tw-bg-[#32323C] tw-text-white tw-rounded-lg tw-px-3 tw-py-2 tw-transition-all tw-duration-200 tw-border-0 tw-shadow-md hover:tw-shadow-lg hover:tw-translate-y-[-1px] tw-ml-1 tw-whitespace-nowrap"
                          >
                            {hours >= 12 ? "PM" : "AM"}
                          </button>
                        </div>
                      </div>

                      <div className="tw-grid tw-grid-cols-3 tw-gap-1 tw-pb-2">
                        {timeOptions.map((option) => (
                          <button
                            key={option.label}
                            onClick={() =>
                              handleTimeChange(option.hours, option.minutes)
                            }
                            className={`tw-p-1.5 tw-text-xs sm:tw-text-sm tw-rounded-lg tw-transition-all tw-duration-200 tw-border-0 tw-shadow-sm hover:tw-shadow-md hover:tw-translate-y-[-1px] tw-whitespace-nowrap
                              ${
                                hours === option.hours &&
                                minutes === option.minutes
                                  ? "tw-bg-primary-500 hover:tw-bg-primary-600 tw-text-white tw-ring-2 tw-ring-primary-400/30"
                                  : "tw-bg-[#2A2A33] tw-text-iron-50 hover:tw-bg-[#32323C]"
                              }`}
                          >
                            {option.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="tw-flex-grow"></div>

                    {dates.endDate && (
                      <div className="tw-px-5 tw-pt-3 tw-mt-auto tw-border-t tw-border-iron-800">
                        <p className="tw-mb-0 tw-text-sm tw-text-iron-300">
                          Selected time:{" "}
                          <span className="tw-text-primary-400 tw-font-medium">
                            {hours.toString().padStart(2, "0")}:
                            {minutes.toString().padStart(2, "0")}{" "}
                            {hours >= 12 ? "PM" : "AM"}
                          </span>
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {dates.endDate && (
                  <div className="tw-col-span-2">
                    <div className="tw-mt-4">
                      <div className="tw-flex tw-flex-col tw-gap-y-2">
                        <div className="tw-flex tw-items-center tw-p-3 tw-bg-[#24242B] tw-rounded-lg tw-mb-2 hover:tw-bg-[#26262E] tw-transition-colors tw-duration-200 tw-shadow-md">
                          <div className="tw-flex tw-items-center tw-justify-center tw-w-6 tw-h-6 tw-rounded-full tw-bg-primary-500/20 tw-text-primary-400 tw-text-xs tw-font-medium tw-mr-3">
                            1
                          </div>
                          <p className="tw-mb-0 tw-text-base tw-font-medium tw-text-iron-50">
                            First decision point:{" "}
                            <span className="tw-text-iron-300 tw-font-normal">
                              {formatSelectedDateTime()}
                            </span>
                          </p>
                        </div>

                        {formatDecisionPoints().map((point, index) => (
                          <div
                            key={point.index}
                            className="tw-flex tw-items-center tw-justify-between tw-p-3 tw-bg-[#24242B] tw-rounded-lg tw-mb-2 tw-group hover:tw-bg-[#26262E] tw-transition-colors tw-duration-200"
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
                              onClick={() => handleDeleteDecisionPoint(index)}
                              className="tw-opacity-0 group-hover:tw-opacity-100 tw-transition-opacity tw-duration-200 tw-bg-transparent tw-border-0 tw-text-iron-400 hover:tw-text-red-400 tw-p-1.5 tw-rounded-full hover:tw-bg-[#32323C]"
                              aria-label="Delete decision point"
                            >
                              <FontAwesomeIcon
                                icon={faTrash}
                                className="tw-size-3.5"
                              />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Add Next Decision Point - Only visible when expanded */}
              {dates.endDate && !isRollingMode && (
                <div className="tw-mt-6">
                  <div className="tw-flex tw-items-center tw-mb-4">
                    <FontAwesomeIcon
                      icon={faCalendarPlus}
                      className="tw-mr-3 tw-size-5 tw-text-primary-400"
                    />
                    <p className="tw-mb-0 tw-text-base tw-font-medium tw-text-iron-50">
                      Add next decision point
                    </p>
                  </div>

                  <div className="tw-py-4 tw-px-5 tw-rounded-xl tw-bg-iron-900 tw-shadow-sm tw-ring-1 tw-ring-iron-700/50 tw-mb-4">
                    <div className="tw-flex tw-items-center tw-justify-between">
                      <div className="tw-flex tw-items-stretch tw-border tw-border-iron-700/50 tw-rounded-lg tw-overflow-hidden tw-flex-1 tw-max-w-md">
                        <input
                          type="number"
                          min="1"
                          value={additionalTime}
                          onChange={(e) =>
                            setAdditionalTime(parseInt(e.target.value, 10))
                          }
                          className="tw-w-24 tw-bg-iron-900 tw-border-0 tw-text-white tw-p-2.5 tw-text-center"
                        />
                        <select
                          value={timeframeUnit}
                          onChange={(e) =>
                            setTimeframeUnit(e.target.value as Period)
                          }
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
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Rolling Toggle Container - Always visible */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="tw-bg-gradient-to-b tw-from-[#1E1E24] tw-to-[#1C1C21] tw-rounded-xl tw-ring-1 tw-ring-iron-700/50 tw-p-5"
      >
        <div className="tw-py-4 tw-px-5 tw-rounded-xl tw-bg-[#24242B] tw-shadow-md tw-ring-1 tw-ring-iron-700/50">
          <div className="tw-flex tw-items-center tw-justify-between">
            <div className="tw-flex tw-items-center">
              <FontAwesomeIcon
                icon={faCircle}
                className="tw-mr-3 tw-size-4 tw-text-primary-400"
              />
              <p className="tw-mb-0 tw-text-base tw-font-medium tw-text-iron-50">
                Rolling end date
              </p>
              <p className="tw-mb-0 tw-ml-3 tw-text-sm tw-text-iron-300/70">
                {isRollingMode
                  ? "Using a single end date"
                  : "Using multiple decision points"}
              </p>
            </div>
            <Toggle
              id="rolling-toggle"
              checked={isRollingMode}
              onChange={() => setIsRollingMode(!isRollingMode)}
            />
          </div>
        </div>
        {/* Rolling End Date Container - Only visible when toggle is ON */}
        {isRollingMode && dates.endDate && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="tw-bg-gradient-to-b tw-from-[#1E1E24] tw-to-[#1C1C21] tw-rounded-xl tw-ring-1 tw-ring-iron-700/50 tw-overflow-hidden"
          >
            {/* Header with toggle */}
            <motion.div
              className="tw-flex tw-items-center tw-justify-between tw-px-5 tw-py-4 tw-cursor-pointer hover:tw-bg-[#24242B] tw-transition-colors tw-duration-200"
              onClick={toggleRollingEndDateSection}
              whileHover={{ backgroundColor: "rgba(36, 36, 43, 0.8)" }}
              whileTap={{ scale: 0.99 }}
            >
              <div className="tw-flex tw-items-center tw-gap-x-3">
                <motion.div
                  animate={isRollingEndDateSectionExpanded ? "open" : "closed"}
                  variants={iconVariants}
                  transition={{ duration: 0.3 }}
                >
                  <FontAwesomeIcon
                    icon={faChevronDown}
                    className="tw-size-4 tw-text-primary-400"
                  />
                </motion.div>
                <p className="tw-mb-0 tw-text-lg tw-font-semibold tw-text-iron-50">
                  Rolling End Date
                </p>
              </div>

              {!isRollingEndDateSectionExpanded && (
                <motion.div
                  className="tw-flex tw-items-center"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.1, duration: 0.3 }}
                >
                  <p className="tw-mb-0 tw-text-sm tw-text-iron-300">
                    {formatEndDateTime()}
                  </p>
                </motion.div>
              )}
            </motion.div>

            {/* Expandable content with smooth transition */}
            <AnimatePresence>
              {isRollingEndDateSectionExpanded && (
                <motion.div
                  initial="closed"
                  animate="open"
                  exit="closed"
                  variants={accordionVariants}
                  className="tw-overflow-hidden"
                >
                  <div className="tw-px-5 tw-pb-5">
                    <div className="tw-grid tw-grid-cols-1 tw-gap-y-4 tw-gap-x-10 md:tw-grid-cols-2">
                      <div className="tw-col-span-1">
                        <p className="tw-mb-3 tw-text-base tw-font-medium tw-text-iron-50">
                          Select end date
                        </p>
                        <div className="tw-bg-[#24242B] tw-rounded-xl tw-shadow-md tw-ring-1 tw-ring-iron-700/50 tw-p-4">
                          <CommonCalendar
                            initialMonth={currentMonth}
                            initialYear={currentYear}
                            selectedTimestamp={dates.endDate}
                            minTimestamp={dates.submissionStartDate}
                            maxTimestamp={null}
                            setSelectedTimestamp={onEndTimestampChange}
                          />
                        </div>
                      </div>
                      <div className="tw-col-span-1">
                        <div className="tw-mt-9 tw-py-4 tw-relative tw-rounded-xl tw-bg-[#24242B] tw-shadow-md tw-ring-1 tw-ring-iron-700/50">
                          <div className="tw-mt-2 tw-px-5">
                            <div className="tw-flex tw-items-center tw-mb-4">
                              <FontAwesomeIcon
                                icon={faClock}
                                className="tw-mr-3 tw-size-5 tw-text-primary-400"
                              />
                              <p className="tw-mb-0 tw-text-base tw-font-medium tw-text-iron-50">
                                Select end time
                              </p>
                            </div>

                            <div className="tw-flex tw-items-center tw-mb-5">
                              <div className="tw-flex tw-items-center tw-space-x-2 tw-flex-1">
                                <div className="tw-w-16">
                                  <input
                                    type="number"
                                    min="0"
                                    max="23"
                                    value={endDateHours}
                                    onChange={(e) =>
                                      handleEndDateTimeChange(
                                        parseInt(e.target.value, 10),
                                        endDateMinutes
                                      )
                                    }
                                    className="tw-w-full tw-bg-[#2A2A33] tw-border-0 tw-text-white tw-rounded-lg tw-p-2 tw-text-center tw-ring-1 tw-ring-iron-700/30 focus:tw-ring-primary-500/50 tw-transition-all tw-duration-200"
                                    placeholder="HH"
                                  />
                                </div>
                                <span className="tw-text-iron-50 tw-font-bold">
                                  :
                                </span>
                                <div className="tw-w-16">
                                  <input
                                    type="number"
                                    min="0"
                                    max="59"
                                    value={endDateMinutes}
                                    onChange={(e) =>
                                      handleEndDateTimeChange(
                                        endDateHours,
                                        parseInt(e.target.value, 10)
                                      )
                                    }
                                    className="tw-w-full tw-bg-[#2A2A33] tw-border-0 tw-text-white tw-rounded-lg tw-p-2 tw-text-center tw-ring-1 tw-ring-iron-700/30 focus:tw-ring-primary-500/50 tw-transition-all tw-duration-200"
                                    placeholder="MM"
                                  />
                                </div>
                                <button
                                  onClick={() =>
                                    handleEndDateTimeChange(
                                      endDateHours >= 12
                                        ? endDateHours - 12
                                        : endDateHours + 12,
                                      endDateMinutes
                                    )
                                  }
                                  className="tw-bg-[#2A2A33] hover:tw-bg-[#32323C] tw-text-white tw-rounded-lg tw-px-3 tw-py-2 tw-transition-all tw-duration-200 tw-border-0 tw-shadow-md hover:tw-shadow-lg hover:tw-translate-y-[-1px] tw-ml-1 tw-whitespace-nowrap"
                                >
                                  {endDateHours >= 12 ? "PM" : "AM"}
                                </button>
                              </div>
                            </div>

                            <div className="tw-grid tw-grid-cols-4 tw-gap-1 tw-pb-2">
                              {timeOptions.map((option) => (
                                <button
                                  key={option.label}
                                  onClick={() =>
                                    handleEndDateTimeChange(
                                      option.hours,
                                      option.minutes
                                    )
                                  }
                                  className={`tw-p-1.5 tw-text-xs sm:tw-text-sm tw-rounded-lg tw-transition-all tw-duration-200 tw-border-0 tw-shadow-sm hover:tw-shadow-md hover:tw-translate-y-[-1px] tw-whitespace-nowrap
                                  ${
                                    endDateHours === option.hours &&
                                    endDateMinutes === option.minutes
                                      ? "tw-bg-primary-500 hover:tw-bg-primary-600 tw-text-white tw-ring-2 tw-ring-primary-400/30"
                                      : "tw-bg-[#2A2A33] tw-text-iron-50 hover:tw-bg-[#32323C]"
                                  }`}
                                >
                                  {option.label}
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="tw-col-span-2">
                        <div className="tw-mt-4 tw-p-3 tw-bg-[#24242B] tw-rounded-lg tw-shadow-md">
                          <div className="tw-flex tw-items-center">
                            <p className="tw-mb-0 tw-text-base tw-font-medium tw-text-iron-50">
                              End date:{" "}
                              <span className="tw-text-iron-300 tw-font-normal">
                                {formatEndDateTime()}
                              </span>
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}
