import { useState, useRef, useEffect } from "react";
import { CreateWaveDatesConfig } from "../../../../types/waves.types";
import { Period } from "../../../../helpers/Types";
import { ApiWaveType } from "../../../../generated/models/ApiWaveType";
import { CREATE_WAVE_VALIDATION_ERROR } from "../../../../helpers/waves/create-wave.validation";
import StartDates from "./StartDates";
import Decisions from "./Decisions";
import RollingEndDate from "./RollingEndDate";

interface CreateWaveDatesProps {
  readonly waveType: ApiWaveType;
  readonly dates: CreateWaveDatesConfig;
  readonly errors: CREATE_WAVE_VALIDATION_ERROR[];
  readonly setDates: (dates: CreateWaveDatesConfig) => void;
  readonly endDateConfig: { time: number | null; period: Period | null };
  readonly setEndDateConfig: (config: { time: number | null; period: Period | null }) => void;
}

export default function CreateWaveDates({
  waveType,
  dates,
  setDates,
  errors,
  endDateConfig,
  setEndDateConfig,
}: CreateWaveDatesProps) {
  const [isRollingMode, setIsRollingMode] = useState(false);
  const [expandedSections, setExpandedSections] = useState({
    start: true,
    decisions: false,
    rolling: false,
  });
  const [autoCollapsedSections, setAutoCollapsedSections] = useState({
    start: false,
    decisions: false,
  });

  // Toggle a section's expanded state
  const toggleSection = (sectionName: 'start' | 'decisions' | 'rolling') => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionName]: !prev[sectionName]
    }));
  };

  // Handler for when user interacts with Decisions section
  const handleDecisionsInteraction = () => {
    // Only auto-collapse Start section if it hasn't been auto-collapsed before
    if (!autoCollapsedSections.start) {
      setExpandedSections(prev => ({
        ...prev,
        start: false
      }));
      setAutoCollapsedSections(prev => ({
        ...prev,
        start: true
      }));
    }
  };

  // Handler for when user interacts with Rolling End Date section
  const handleRollingInteraction = () => {
    // Only auto-collapse Decisions section if it hasn't been auto-collapsed before
    if (!autoCollapsedSections.decisions) {
      setExpandedSections(prev => ({
        ...prev,
        decisions: false
      }));
      setAutoCollapsedSections(prev => ({
        ...prev,
        decisions: true
      }));
    }
  };

  return (
    <div className="tw-space-y-4">
      <StartDates
        waveType={waveType}
        dates={dates}
        setDates={setDates}
        errors={errors}
        isExpanded={expandedSections.start}
        setIsExpanded={() => toggleSection('start')}
      />

      <Decisions
        dates={dates}
        setDates={setDates}
        isRollingMode={isRollingMode}
        endDateConfig={endDateConfig}
        setEndDateConfig={setEndDateConfig}
        isExpanded={expandedSections.decisions}
        setIsExpanded={() => toggleSection('decisions')}
        onInteraction={handleDecisionsInteraction}
      />

      <RollingEndDate
        dates={dates}
        setDates={setDates}
        isRollingMode={isRollingMode}
        setIsRollingMode={(isRolling) => {
          setIsRollingMode(isRolling);
          handleRollingInteraction();
        }}
        isExpanded={expandedSections.rolling}
        setIsExpanded={() => toggleSection('rolling')}
      />
    </div>
  );
}
