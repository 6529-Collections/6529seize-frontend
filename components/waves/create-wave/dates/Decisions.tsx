import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCalendarPlus } from "@fortawesome/free-regular-svg-icons";
import { faTriangleExclamation } from "@fortawesome/free-solid-svg-icons";
import type { CreateWaveDatesConfig } from "@/types/waves.types";
import CollapsibleCard from "@/components/common/CollapsibleCard";
import DecisionsFirst from "./DecisionsFirst";
import SubsequentDecisions from "./SubsequentDecisions";
import { calculateDecisionTimes } from "../services/waveDecisionService";
import CommonSwitch from "@/components/utils/switch/CommonSwitch";
import { CREATE_WAVE_VALIDATION_ERROR } from "@/helpers/waves/create-wave.validation";
import { CREATE_WAVE_FORM_STYLES } from "../utils/createWaveFormStyles";
import CreateWaveAdvancedSection from "../utils/CreateWaveAdvancedSection";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t, tRich } from "@/i18n/messages";
import type { ReactNode } from "react";

interface DecisionsProps {
  readonly dates: CreateWaveDatesConfig;
  readonly errors: CREATE_WAVE_VALIDATION_ERROR[];
  readonly setDates: (dates: CreateWaveDatesConfig) => void;
  readonly onRollingEnabled: () => void;
  readonly isExpanded: boolean;
  readonly setIsExpanded: (expanded: boolean) => void;
  readonly advancedContent?: ReactNode;
  readonly hasAdvancedError?: boolean;
}

interface DecisionsCollapsedContentProps {
  readonly totalDecisionPoints: number;
  readonly isRollingMode: boolean;
}

function DecisionsCollapsedContent({
  totalDecisionPoints,
  isRollingMode,
}: DecisionsCollapsedContentProps) {
  const locale = useBrowserLocale();

  return (
    <span className="tw-flex tw-items-center tw-rounded-lg tw-bg-iron-700/40 tw-px-3 tw-py-2 tw-shadow-md tw-transition-transform tw-duration-200 hover:tw-translate-y-[-1px]">
      <FontAwesomeIcon
        icon={faCalendarPlus}
        className="tw-mr-2 tw-size-4 tw-text-primary-400"
      />
      <span className="tw-flex tw-flex-col">
        <span className="tw-block tw-text-xs tw-text-iron-300/70">
          {t(locale, "waves.create.dates.rank.announcements.summaryLabel")}
        </span>
        <span className="tw-flex tw-items-center">
          <span className="tw-text-sm tw-font-medium tw-text-iron-50">
            {t(
              locale,
              totalDecisionPoints === 1
                ? "waves.create.dates.rank.announcements.summarySingular"
                : "waves.create.dates.rank.announcements.summaryPlural",
              { count: totalDecisionPoints }
            )}
          </span>
          {isRollingMode && (
            <span className="tw-ml-2 tw-rounded tw-bg-blue-500/20 tw-px-1.5 tw-text-xs tw-text-blue-400">
              {t(
                locale,
                "waves.create.dates.rank.announcements.recurringBadge"
              )}
            </span>
          )}
        </span>
      </span>
    </span>
  );
}

export default function Decisions({
  dates,
  errors,
  setDates,
  onRollingEnabled,
  isExpanded,
  setIsExpanded,
  advancedContent,
  hasAdvancedError = false,
}: DecisionsProps) {
  const locale = useBrowserLocale();
  const isRollingMode = dates.isRolling;
  const hasRankFutureDateError = errors.includes(
    CREATE_WAVE_VALIDATION_ERROR.RANK_DECISION_TIME_MUST_BE_IN_FUTURE
  );
  const hasEndDateBeforeVotingStartError = errors.includes(
    CREATE_WAVE_VALIDATION_ERROR.END_DATE_MUST_BE_AFTER_VOTING_START_DATE
  );
  const hasFirstDecisionBeforeVotingStartError = errors.includes(
    CREATE_WAVE_VALIDATION_ERROR.RANK_FIRST_DECISION_TIME_MUST_BE_AFTER_OR_EQUAL_TO_VOTING_START_DATE
  );
  const shouldShowExpandedContent =
    isExpanded ||
    hasRankFutureDateError ||
    hasEndDateBeforeVotingStartError ||
    hasFirstDecisionBeforeVotingStartError;

  // Calculate total decision points for summary
  const totalDecisionPoints = 1 + dates.subsequentDecisions.length;

  const handleUpdateSubsequentDecisions = (decisions: number[]) => {
    setDates({ ...dates, subsequentDecisions: decisions });
  };

  // Handle the recurring mode toggle
  const handleToggleSwitch = (value: boolean) => {
    // Can't enable rolling mode without subsequent decisions
    if (value && dates.subsequentDecisions.length === 0) {
      return;
    }

    if (value) {
      onRollingEnabled();

      // When turning on rolling mode:
      // 1. Set isRolling flag
      // 2. Leave the optional end date blank by default
      setDates({
        ...dates,
        isRolling: true,
        endDate: null,
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
        if (potentialNewEndDate !== undefined) {
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
    <div className="tw-space-y-4">
      <CollapsibleCard
        title={
          <span className="tw-text-iron-100">
            {t(locale, "waves.create.dates.rank.announcements.title")}
          </span>
        }
        isExpanded={shouldShowExpandedContent}
        onToggle={() => setIsExpanded(!shouldShowExpandedContent)}
        collapsedContent={
          <DecisionsCollapsedContent
            totalDecisionPoints={totalDecisionPoints}
            isRollingMode={isRollingMode}
          />
        }
      >
        <div className="tw-px-5 tw-pb-1 tw-pt-2">
          {hasRankFutureDateError && (
            <div
              role="alert"
              className="tw-mb-3 tw-flex tw-items-center tw-gap-x-2 tw-rounded-lg tw-border tw-border-error/40 tw-bg-error/10 tw-px-3 tw-py-2 tw-text-xs tw-font-medium tw-text-error"
            >
              <FontAwesomeIcon
                icon={faTriangleExclamation}
                className="tw-size-4 tw-flex-shrink-0"
                aria-hidden="true"
              />
              <span>
                {t(locale, "waves.create.dates.rank.announcements.futureError")}
              </span>
            </div>
          )}
          {hasEndDateBeforeVotingStartError && (
            <div
              role="alert"
              className="tw-mb-3 tw-flex tw-items-center tw-gap-x-2 tw-rounded-lg tw-border tw-border-error/40 tw-bg-error/10 tw-px-3 tw-py-2 tw-text-xs tw-font-medium tw-text-error"
            >
              <FontAwesomeIcon
                icon={faTriangleExclamation}
                className="tw-size-4 tw-flex-shrink-0"
                aria-hidden="true"
              />
              <span>
                {t(
                  locale,
                  "waves.create.dates.rank.announcements.endBeforeVotingError"
                )}
              </span>
            </div>
          )}
          {hasFirstDecisionBeforeVotingStartError && (
            <div
              role="alert"
              className="tw-mb-3 tw-flex tw-items-center tw-gap-x-2 tw-rounded-lg tw-border tw-border-error/40 tw-bg-error/10 tw-px-3 tw-py-2 tw-text-xs tw-font-medium tw-text-error"
            >
              <FontAwesomeIcon
                icon={faTriangleExclamation}
                className="tw-size-4 tw-flex-shrink-0"
                aria-hidden="true"
              />
              <span>
                {t(
                  locale,
                  "waves.create.dates.rank.announcements.firstBeforeVotingError"
                )}
              </span>
            </div>
          )}
          <div className="tw-mb-3 tw-border-b tw-border-iron-700/50 tw-pb-3">
            <p className={CREATE_WAVE_FORM_STYLES.supportingText}>
              {tRich(
                locale,
                "waves.create.dates.rank.announcements.description",
                {
                  emphasis: (
                    <strong key="winner-announcements-emphasis">
                      {t(
                        locale,
                        "waves.create.dates.rank.announcements.descriptionEmphasis"
                      )}
                    </strong>
                  ),
                }
              )}
              {dates.subsequentDecisions.length === 0 && (
                <span className="tw-text-primary-300">
                  {" "}
                  {t(
                    locale,
                    "waves.create.dates.rank.announcements.fixedEndNote"
                  )}
                </span>
              )}
            </p>
            <p
              className={`tw-mt-1 tw-italic ${CREATE_WAVE_FORM_STYLES.compactSupportingText}`}
            >
              {t(locale, "waves.create.dates.rank.announcements.examples")}
            </p>
          </div>
        </div>
        <div className="tw-grid tw-grid-cols-1 tw-gap-x-10 tw-gap-y-6 tw-px-5 tw-pb-5 md:tw-grid-cols-2">
          <DecisionsFirst
            firstDecisionTime={dates.firstDecisionTime}
            setFirstDecisionTime={(time) =>
              setDates({ ...dates, firstDecisionTime: time })
            }
            minTimestamp={dates.votingStartDate}
          />
        </div>
      </CollapsibleCard>

      <CreateWaveAdvancedSection
        title={t(locale, "waves.create.dates.rank.advancedSummary")}
        isCustomized={dates.subsequentDecisions.length > 0}
        hasError={hasAdvancedError}
        variant="filled"
      >
        <div className="tw-space-y-6 tw-p-5">
          <SubsequentDecisions
            firstDecisionTime={dates.firstDecisionTime}
            subsequentDecisions={dates.subsequentDecisions}
            setSubsequentDecisions={handleUpdateSubsequentDecisions}
          />
          {dates.subsequentDecisions.length > 0 && (
            <div className="tw-rounded-lg tw-border tw-border-solid tw-border-white/5 tw-bg-iron-950/40 tw-p-4">
              <div className="tw-flex tw-items-center tw-justify-between">
                <div className="tw-flex-1">
                  <h3 className={CREATE_WAVE_FORM_STYLES.sectionTitle}>
                    {t(locale, "waves.create.dates.rank.recurring.title")}
                  </h3>
                  <p className={CREATE_WAVE_FORM_STYLES.compactSupportingText}>
                    {t(locale, "waves.create.dates.rank.recurring.description")}
                  </p>
                </div>
                <div>
                  <CommonSwitch
                    label={t(
                      locale,
                      "waves.create.dates.rank.recurring.switchLabel"
                    )}
                    isOn={isRollingMode}
                    setIsOn={handleToggleSwitch}
                  />
                </div>
              </div>

              {isRollingMode && (
                <div className="tw-mt-3 tw-rounded-lg tw-border tw-border-primary-500/30 tw-bg-primary-500/20 tw-p-3 tw-shadow-inner">
                  <p className="tw-text-primary-100 tw-mb-0 tw-text-xs">
                    <strong>
                      {t(
                        locale,
                        "waves.create.dates.rank.recurring.enabledTitle"
                      )}
                    </strong>{" "}
                    {t(
                      locale,
                      "waves.create.dates.rank.recurring.enabledDescription"
                    )}
                  </p>
                </div>
              )}
            </div>
          )}

          {advancedContent}
        </div>
      </CreateWaveAdvancedSection>
    </div>
  );
}
