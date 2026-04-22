import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCalendarPlus } from "@fortawesome/free-regular-svg-icons";
import { faInfoCircle } from "@fortawesome/free-solid-svg-icons";
import type { CreateWaveDatesConfig } from "@/types/waves.types";
import DateAccordion from "@/components/common/DateAccordion";
import DecisionsFirst from "./DecisionsFirst";
import SubsequentDecisions from "./SubsequentDecisions";
import {
  calculateDecisionTimes,
  calculateEndDateForCycles,
  getMinimumRollingEndDate,
} from "../services/waveDecisionService";
import TooltipIconButton from "@/components/common/TooltipIconButton";
import CommonSwitch from "@/components/utils/switch/CommonSwitch";

interface DecisionsProps {
  readonly dates: CreateWaveDatesConfig;
  readonly setDates: (dates: CreateWaveDatesConfig) => void;
  readonly onRollingEnabled: () => void;
  readonly isExpanded: boolean;
  readonly setIsExpanded: (expanded: boolean) => void;
  readonly onInteraction: () => void;
}

interface DecisionsCollapsedContentProps {
  readonly totalDecisionPoints: number;
  readonly isRollingMode: boolean;
}

function DecisionsCollapsedContent({
  totalDecisionPoints,
  isRollingMode,
}: DecisionsCollapsedContentProps) {
  return (
    <div className="tw-flex tw-items-center tw-rounded-lg tw-bg-iron-700/40 tw-px-3 tw-py-2 tw-shadow-md tw-transition-transform tw-duration-200 hover:tw-translate-y-[-1px]">
      <FontAwesomeIcon
        icon={faCalendarPlus}
        className="tw-mr-2 tw-size-4 tw-text-primary-400"
      />
      <div className="tw-flex tw-flex-col">
        <p className="tw-mb-0 tw-text-xs tw-text-iron-300/70">Winners</p>
        <div className="tw-flex tw-items-center">
          <span className="tw-text-sm tw-font-medium tw-text-iron-50">
            {totalDecisionPoints} announcement
            {totalDecisionPoints !== 1 ? "s" : ""}
          </span>
          {isRollingMode && (
            <span className="tw-ml-2 tw-rounded tw-bg-blue-500/20 tw-px-1.5 tw-text-xs tw-text-blue-400">
              Recurring
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

export default function Decisions({
  dates,
  setDates,
  onRollingEnabled,
  isExpanded,
  setIsExpanded,
  onInteraction,
}: DecisionsProps) {
  const isRollingMode = dates.isRolling;

  // Calculate total decision points for summary
  const totalDecisionPoints = 1 + dates.subsequentDecisions.length;

  const handleUpdateSubsequentDecisions = (decisions: number[]) => {
    setDates({ ...dates, subsequentDecisions: decisions });
  };

  // Handle the recurring mode toggle
  const handleToggleSwitch = (value: boolean) => {
    // Can't enable rolling mode without subsequent decisions
    if (value && dates.subsequentDecisions.length === 0) {
      alert(
        "You need to add at least one decision interval before enabling recurring mode"
      );
      return;
    }

    if (value) {
      onRollingEnabled();

      // When turning on rolling mode:
      // 1. Set isRolling flag
      // 2. Calculate end date for 2 complete decision cycles
      const twoCompleteRoundsEndDate = calculateEndDateForCycles(
        dates.firstDecisionTime,
        dates.subsequentDecisions,
        2 // Two complete rounds
      );

      // Use the calculated date or keep existing if already set and valid
      const minEndDate = getMinimumRollingEndDate(
        dates.firstDecisionTime,
        dates.subsequentDecisions
      );

      const newEndDate =
        dates.endDate && minEndDate && dates.endDate > minEndDate
          ? dates.endDate
          : twoCompleteRoundsEndDate;

      setDates({
        ...dates,
        isRolling: true,
        endDate: newEndDate,
      });
    } else {
      // When turning off rolling mode:
      // 1. Clear isRolling flag
      // 2. Set end date to the last decision point
      let newEndDate = dates.firstDecisionTime;

      if (dates.subsequentDecisions.length > 0) {
        const decisionTimes = calculateDecisionTimes(
          dates.firstDecisionTime,
          dates.subsequentDecisions
        );
        const potentialNewEndDate = decisionTimes[decisionTimes.length - 1];
        if (potentialNewEndDate) {
          newEndDate = potentialNewEndDate;
        }
      }

      setDates({
        ...dates,
        isRolling: false,
        endDate: newEndDate,
      });
    }
  };

  return (
    <DateAccordion
      title={
        <div className="tw-flex tw-items-center tw-gap-x-2">
          <span>Winners Announcements</span>
          <TooltipIconButton
            icon={faInfoCircle}
            tooltipText="Schedule when winners will be announced during your wave. With recurring cycles, announcements repeat until your end date."
            tooltipPosition="bottom"
            tooltipWidth="tw-w-80"
          />
          {/* Badge moved to collapsed content for more compact display */}
        </div>
      }
      isExpanded={isExpanded}
      onToggle={() => setIsExpanded(!isExpanded)}
      collapsedContent={
        <DecisionsCollapsedContent
          totalDecisionPoints={totalDecisionPoints}
          isRollingMode={isRollingMode}
        />
      }
    >
      <div className="tw-px-5 tw-pb-1 tw-pt-2">
        <div className="tw-mb-3 tw-border-b tw-border-iron-700/50 tw-pb-3">
          <p className="tw-mb-0 tw-text-sm tw-text-iron-300">
            <strong>Winner announcements</strong> for showcasing selected
            creators. Set your first date, then add more if needed.
            {dates.subsequentDecisions.length === 0 && (
              <span className="tw-text-primary-300">
                {" "}
                With a fixed schedule, the last announcement marks your wave's
                end date.
              </span>
            )}
          </p>
          <p className="tw-mb-0 tw-mt-1 tw-text-xs tw-italic tw-text-iron-400">
            Examples: Weekly, monthly, or quarterly announcements.
          </p>
        </div>
      </div>
      <div
        className="tw-grid tw-grid-cols-1 tw-gap-x-10 tw-gap-y-6 tw-divide-x-0 tw-divide-y tw-divide-solid tw-divide-iron-700 tw-px-5 tw-pb-5 md:tw-grid-cols-2"
        onClick={onInteraction}
      >
        {/* First Decision Date and Time */}
        <DecisionsFirst
          firstDecisionTime={dates.firstDecisionTime}
          setFirstDecisionTime={(time) =>
            setDates({ ...dates, firstDecisionTime: time })
          }
          minTimestamp={dates.votingStartDate} // First decision can't be before voting starts
        />

        {/* Subsequent Decisions */}
        <div className="tw-col-span-2">
          <SubsequentDecisions
            firstDecisionTime={dates.firstDecisionTime}
            subsequentDecisions={dates.subsequentDecisions}
            setSubsequentDecisions={handleUpdateSubsequentDecisions}
          />
        </div>

        {/* Recurring Mode Toggle - Only show when at least one subsequent decision exists */}
        {dates.subsequentDecisions.length > 0 && (
          <div className="tw-col-span-2">
            <div className="tw-mb-2 tw-mt-5 tw-rounded-lg tw-border tw-border-iron-700/50 tw-shadow-md">
              <div className="tw-flex tw-items-center tw-justify-between">
                <div className="tw-flex-1">
                  <h3 className="tw-mb-1 tw-text-base tw-font-semibold tw-text-iron-50">
                    Repeating Announcement Cycles
                  </h3>
                  <p className="tw-mb-0 tw-text-xs tw-text-iron-400">
                    Repeat this pattern until your wave ends
                  </p>
                </div>
                <div>
                  <CommonSwitch
                    label="Enable recurring cycles"
                    isOn={isRollingMode}
                    setIsOn={handleToggleSwitch}
                  />
                </div>
              </div>

              {isRollingMode && (
                <div className="tw-mt-3 tw-rounded-lg tw-border tw-border-primary-500/30 tw-bg-primary-500/20 tw-p-3 tw-shadow-inner">
                  <p className="tw-text-primary-100 tw-mb-0 tw-text-xs">
                    <strong>Recurring cycles enabled.</strong> Announcements
                    will repeat until your wave's end date.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </DateAccordion>
  );
}
