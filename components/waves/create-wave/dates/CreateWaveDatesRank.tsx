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
  validateDateSequence,
} from "../services/waveDecisionService";

interface CreateWaveDatesRankProps {
  readonly waveType: ApiWaveType;
  readonly dates: CreateWaveDatesConfig;
  readonly setDates: (dates: CreateWaveDatesConfig) => void;
}

export default function CreateWaveDatesRank({
  waveType,
  dates,
  setDates,
}: CreateWaveDatesRankProps) {
  const isRollingMode = dates.isRolling;
  const [expandedSections, setExpandedSections] = useState({
    start: true,
    decisions: false,
    rolling: dates.isRolling,
  });
  const [hasAutoCollapsedStart, setHasAutoCollapsedStart] = useState(false);

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

    if (!normalizedDates.isRolling) {
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
        setDates={commitDates}
        onRollingEnabled={handleRollingEnabled}
        isExpanded={expandedSections.decisions}
        setIsExpanded={() => toggleSection("decisions")}
        onInteraction={handleDecisionsInteraction}
      />

      {dates.subsequentDecisions.length > 0 && isRollingMode && (
        <RollingEndDate
          dates={dates}
          setDates={commitDates}
          isExpanded={expandedSections.rolling}
          setIsExpanded={() => toggleSection("rolling")}
        />
      )}
    </div>
  );
}
