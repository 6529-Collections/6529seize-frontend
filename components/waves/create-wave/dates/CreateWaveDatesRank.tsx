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
  const [expandedSections, setExpandedSections] = useState({
    start: true,
    decisions: false,
    rolling: dates.isRolling,
  });
  const [hasAutoCollapsedStart, setHasAutoCollapsedStart] = useState(false);
  const rankFutureDateError =
    CREATE_WAVE_VALIDATION_ERROR.RANK_DECISION_TIME_MUST_BE_IN_FUTURE;
  const hasRankFutureDateError = errors.includes(rankFutureDateError);
  const now = hasRankFutureDateError ? Time.currentMillis() : null;
  const isFirstDecisionTimeInPast =
    now !== null && dates.firstDecisionTime <= now;
  const isRollingEndDateInPast =
    now !== null &&
    dates.isRolling &&
    (dates.endDate === null ||
      !Number.isFinite(dates.endDate) ||
      dates.endDate <= now);
  const errorsWithoutRankFutureDate = errors.filter(
    (error) => error !== rankFutureDateError
  );
  const decisionErrors =
    hasRankFutureDateError && (!dates.isRolling || isFirstDecisionTimeInPast)
      ? [...errorsWithoutRankFutureDate, rankFutureDateError]
      : errorsWithoutRankFutureDate;
  const rollingEndDateErrors =
    hasRankFutureDateError && isRollingEndDateInPast
      ? [rankFutureDateError]
      : [];

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

    if (normalizedDates.isRolling) {
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

  return (
    <div className="tw-space-y-4">
      <StartDates
        waveType={waveType}
        dates={dates}
        setDates={commitDates}
        isExpanded={expandedSections.start}
        setIsExpanded={() => toggleSection("start")}
      />

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
    </div>
  );
}
