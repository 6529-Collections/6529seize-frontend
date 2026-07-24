"use client";

import { useState } from "react";
import type { CreateWaveDatesConfig } from "@/types/waves.types";
import type { ApiWaveType } from "@/generated/models/ApiWaveType";
import StartDates from "./StartDates";
import Decisions from "./Decisions";
import RollingEndDate from "./RollingEndDate";
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
    // Expanded by default so the announcement schedule is visible before Next;
    // a collapsed section made it easy to miss that scheduled (non-perpetual)
    // waves need their winner announcements configured.
    decisions: true,
    rolling: dates.isRolling,
  });
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

  return (
    <div className="tw-space-y-4">
      <StartDates
        waveType={waveType}
        dates={dates}
        setDates={commitDates}
        isExpanded={expandedSections.start}
        setIsExpanded={() => toggleSection("start")}
      />

      {!isOngoingRanking && (
        <>
          <Decisions
            dates={dates}
            errors={decisionErrors}
            setDates={commitDates}
            onRollingEnabled={handleRollingEnabled}
            isExpanded={expandedSections.decisions}
            setIsExpanded={() => toggleSection("decisions")}
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
