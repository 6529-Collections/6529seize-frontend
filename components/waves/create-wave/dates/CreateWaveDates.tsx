import { useState, useRef } from "react";
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
    rolling: false
  });

  const toggleSection = (sectionName: 'start' | 'decisions' | 'rolling') => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionName]: !prev[sectionName]
    }));
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
        onInteraction={() => {}}
      />

      <RollingEndDate
        dates={dates}
        setDates={setDates}
        isRollingMode={isRollingMode}
        setIsRollingMode={setIsRollingMode}
      />
    </div>
  );
}
