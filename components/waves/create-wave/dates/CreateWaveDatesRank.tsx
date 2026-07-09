"use client";

import { useState } from "react";
import type { CreateWaveDatesConfig } from "@/types/waves.types";
import type { ApiWaveType } from "@/generated/models/ApiWaveType";
import StartDates from "./StartDates";
import Decisions from "./Decisions";
import RollingEndDate from "./RollingEndDate";
import CommonBorderedRadioButton from "@/components/utils/radio/CommonBorderedRadioButton";
import {
  adjustDatesAfterSubmissionChange,
  calculateEndDate,
  clampRollingEndDate,
  validateDateSequence,
} from "../services/waveDecisionService";
import { CREATE_WAVE_VALIDATION_ERROR } from "@/helpers/waves/create-wave.validation";
import { Time } from "@/helpers/time";

interface CreateWaveDatesRankProps {
  readonly waveType: ApiWaveType;
  readonly dates: CreateWaveDatesConfig;
  readonly errors: CREATE_WAVE_VALIDATION_ERROR[];
  readonly setDates: (dates: CreateWaveDatesConfig) => void;
}

type RankScheduleMode = "ANNOUNCE_WINNERS" | "PERPETUAL_RANKING";

const RANK_SCHEDULE_MODES: {
  readonly mode: RankScheduleMode;
  readonly title: string;
  readonly description: string;
}[] = [
  {
    mode: "ANNOUNCE_WINNERS",
    title: "Announce Winners",
    description:
      "Winners are announced on the schedule you set below — a fixed timeline that ends the wave, or repeating cycles.",
  },
  {
    mode: "PERPETUAL_RANKING",
    title: "Perpetual Ranking",
    description:
      "Rankings update continuously with no winners and no end date — a live, always-on leaderboard.",
  },
];

export default function CreateWaveDatesRank({
  waveType,
  dates,
  errors,
  setDates,
}: CreateWaveDatesRankProps) {
  const isRollingMode = dates.isRolling;
  const isOngoingRanking = dates.ongoingRanking ?? false;
  const [expandedSections, setExpandedSections] = useState({
    start: true,
    decisions: false,
    rolling: dates.isRolling,
  });
  const [hasAutoCollapsedStart, setHasAutoCollapsedStart] = useState(false);
  const rankFutureDateError =
    CREATE_WAVE_VALIDATION_ERROR.RANK_DECISION_TIME_MUST_BE_IN_FUTURE;
  const endDateBeforeVotingStartError =
    CREATE_WAVE_VALIDATION_ERROR.END_DATE_MUST_BE_AFTER_VOTING_START_DATE;
  const firstDecisionBeforeVotingStartError =
    CREATE_WAVE_VALIDATION_ERROR.RANK_FIRST_DECISION_TIME_MUST_BE_AFTER_OR_EQUAL_TO_VOTING_START_DATE;
  const hasRankFutureDateError = errors.includes(rankFutureDateError);
  const hasEndDateBeforeVotingStartError = errors.includes(
    endDateBeforeVotingStartError
  );
  const hasFirstDecisionBeforeVotingStartError = errors.includes(
    firstDecisionBeforeVotingStartError
  );
  const now = hasRankFutureDateError ? Time.currentMillis() : null;
  const isFirstDecisionTimeInPast =
    now !== null && dates.firstDecisionTime <= now;
  const isRollingEndDateInPast =
    now !== null &&
    dates.isRolling &&
    dates.endDate !== null &&
    (!Number.isFinite(dates.endDate) || dates.endDate <= now);
  const unroutedErrors = errors.filter(
    (error) =>
      error !== rankFutureDateError &&
      error !== endDateBeforeVotingStartError &&
      error !== firstDecisionBeforeVotingStartError
  );
  const decisionErrors = [
    ...unroutedErrors,
    ...(hasFirstDecisionBeforeVotingStartError
      ? [firstDecisionBeforeVotingStartError]
      : []),
    ...(hasEndDateBeforeVotingStartError && !dates.isRolling
      ? [endDateBeforeVotingStartError]
      : []),
    ...(hasRankFutureDateError &&
    (!dates.isRolling || isFirstDecisionTimeInPast)
      ? [rankFutureDateError]
      : []),
  ];
  const rollingEndDateErrors = [
    ...(hasEndDateBeforeVotingStartError && dates.isRolling
      ? [endDateBeforeVotingStartError]
      : []),
    ...(hasRankFutureDateError && isRollingEndDateInPast
      ? [rankFutureDateError]
      : []),
  ];

  const toggleSection = (sectionName: "start" | "decisions" | "rolling") => {
    setExpandedSections((prev) => ({
      ...prev,
      [sectionName]: !prev[sectionName],
    }));
  };

  const commitDates = (nextDates: CreateWaveDatesConfig) => {
    let normalizedDates = nextDates;

    if (nextDates.submissionStartDate !== dates.submissionStartDate) {
      const normalizedTimeline = adjustDatesAfterSubmissionChange(
        dates,
        nextDates.submissionStartDate
      );
      normalizedDates = {
        ...nextDates,
        submissionStartDate: normalizedTimeline.submissionStartDate,
        votingStartDate: normalizedTimeline.votingStartDate,
        firstDecisionTime: normalizedTimeline.firstDecisionTime,
      };
    }

    if (normalizedDates.ongoingRanking) {
      // Perpetual ranking: no decision schedule and no end date.
      normalizedDates = {
        ...normalizedDates,
        endDate: null,
      };
    } else if (normalizedDates.isRolling) {
      normalizedDates = {
        ...normalizedDates,
        endDate: clampRollingEndDate(normalizedDates),
      };
    } else {
      normalizedDates = {
        ...normalizedDates,
        endDate: calculateEndDate(normalizedDates),
      };
    }

    const validationErrors = validateDateSequence(normalizedDates);
    if (validationErrors.length > 0) {
      console.warn("Date validation errors:", validationErrors);
    }

    setDates(normalizedDates);
  };

  const handleDecisionsInteraction = () => {
    if (!hasAutoCollapsedStart) {
      setExpandedSections((prev) => ({
        ...prev,
        start: false,
      }));
      setHasAutoCollapsedStart(true);
    }
  };

  const handleRollingEnabled = () => {
    setExpandedSections((prev) =>
      prev.rolling
        ? prev
        : {
            ...prev,
            rolling: true,
          }
    );
  };

  const handleOngoingRankingChange = (ongoing: boolean) => {
    // The decision schedule is kept when entering perpetual mode so switching
    // back restores it; payload, validation and rendering all gate on
    // ongoingRanking, so the hidden schedule has no effect while perpetual.
    // commitDates nulls the end date while perpetual and recomputes it from
    // the preserved schedule when returning to announcements.
    commitDates({ ...dates, ongoingRanking: ongoing });
  };

  const selectedScheduleMode: RankScheduleMode = isOngoingRanking
    ? "PERPETUAL_RANKING"
    : "ANNOUNCE_WINNERS";

  const handleScheduleModeChange = (mode: RankScheduleMode) => {
    const ongoing = mode === "PERPETUAL_RANKING";
    if (ongoing !== isOngoingRanking) {
      handleOngoingRankingChange(ongoing);
    }
  };

  return (
    <div className="tw-space-y-4">
      <StartDates
        waveType={waveType}
        dates={dates}
        setDates={commitDates}
        isExpanded={expandedSections.start}
        setIsExpanded={() => toggleSection("start")}
      />

      <fieldset className="tw-m-0 tw-min-w-0 tw-border-0 tw-p-0">
        <legend className="tw-sr-only">Ranking mode</legend>
        <div className="tw-grid tw-grid-cols-1 tw-gap-3 sm:tw-grid-cols-2 [&>div]:tw-rounded-xl [&>div]:tw-px-3 [&>div]:tw-py-3 [&>div]:tw-shadow-none">
          {RANK_SCHEDULE_MODES.map(({ mode, title, description }) => {
            const isSelected = selectedScheduleMode === mode;
            const titleColorClass = isSelected
              ? "tw-text-white"
              : "tw-text-iron-300 group-hover:tw-text-white";
            const descriptionColorClass = isSelected
              ? "tw-text-iron-300"
              : "tw-text-iron-500";

            return (
              <CommonBorderedRadioButton
                key={mode}
                type={mode}
                selected={selectedScheduleMode}
                variant="subtle"
                ariaLabel={title}
                onChange={handleScheduleModeChange}
              >
                <div className="tw-min-w-0 tw-whitespace-normal">
                  <span
                    className={`tw-flex tw-min-h-4 tw-items-center tw-text-sm tw-font-semibold ${titleColorClass}`}
                  >
                    {title}
                  </span>
                  <p
                    className={`tw-mb-0 tw-mt-1 tw-text-xs tw-font-medium tw-leading-4 ${descriptionColorClass}`}
                  >
                    {description}
                  </p>
                </div>
              </CommonBorderedRadioButton>
            );
          })}
        </div>
      </fieldset>

      {!isOngoingRanking && (
        <>
          <Decisions
            dates={dates}
            errors={decisionErrors}
            setDates={commitDates}
            onRollingEnabled={handleRollingEnabled}
            isExpanded={expandedSections.decisions}
            setIsExpanded={() => toggleSection("decisions")}
            onInteraction={handleDecisionsInteraction}
          />

          {dates.subsequentDecisions.length > 0 && isRollingMode && (
            <RollingEndDate
              dates={dates}
              errors={rollingEndDateErrors}
              setDates={commitDates}
              isExpanded={expandedSections.rolling}
              setIsExpanded={() => toggleSection("rolling")}
            />
          )}
        </>
      )}
    </div>
  );
}
