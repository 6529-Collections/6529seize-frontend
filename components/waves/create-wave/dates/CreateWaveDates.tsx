import { useState, useEffect } from "react";
import { CreateWaveDatesConfig } from "../../../../types/waves.types";
import { Period } from "../../../../helpers/Types";
import { ApiWaveType } from "../../../../generated/models/ApiWaveType";
import { CREATE_WAVE_VALIDATION_ERROR } from "../../../../helpers/waves/create-wave.validation";
import StartDates from "./StartDates";
import Decisions from "./Decisions";
import RollingEndDate from "./RollingEndDate";
import { 
  adjustDatesAfterSubmissionChange, 
  calculateEndDate,
  validateDateSequence 
} from "../services/waveDecisionService";

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
  // Initialize rolling mode from dates config
  const [isRollingMode, setIsRollingMode] = useState(dates.isRolling);
  const [expandedSections, setExpandedSections] = useState({
    start: true,
    decisions: false,
    rolling: dates.isRolling, // Open rolling section if rolling is enabled
  });
  const [autoCollapsedSections, setAutoCollapsedSections] = useState({
    start: false,
    decisions: false,
  });
  
  // Keep local state in sync with dates prop
  useEffect(() => {
    setIsRollingMode(dates.isRolling);
    if (dates.isRolling && !expandedSections.rolling) {
      setExpandedSections(prev => ({
        ...prev,
        rolling: true
      }));
    }
  }, [dates.isRolling]);
  
  // Validate dates whenever they change
  useEffect(() => {
    const validationErrors = validateDateSequence(dates);
    if (validationErrors.length > 0) {
      console.warn("Date validation errors:", validationErrors);
      // Note: We're not setting errors state here since that would display errors
      // before the user has finished inputting all dates
    }
    
    // Ensure end date is calculated correctly for non-rolling mode
    if (!dates.isRolling) {
      const calculatedEndDate = calculateEndDate(dates);
      if (calculatedEndDate !== dates.endDate) {
        setDates({
          ...dates,
          endDate: calculatedEndDate
        });
      }
    }
  }, [dates.submissionStartDate, dates.votingStartDate, dates.firstDecisionTime, dates.subsequentDecisions, dates.isRolling]);

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
  
  // Handle date changes with proper adjustments
  const handleDateUpdate = (newDates: CreateWaveDatesConfig) => {
    // Ensure valid date sequence
    if (newDates.submissionStartDate !== dates.submissionStartDate) {
      // If submission date changed, adjust other dates if needed
      const adjustedDates = adjustDatesAfterSubmissionChange(dates, newDates.submissionStartDate);
      setDates(adjustedDates);
    } else {
      // Otherwise just update as provided
      setDates(newDates);
    }
  };

  return (
    <div className="tw-space-y-4">
      <StartDates
        waveType={waveType}
        dates={dates}
        setDates={handleDateUpdate}
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

      {/* Only show RollingEndDate when there are at least 2 winner announcements (first + at least 1 subsequent) */}
      {dates.subsequentDecisions.length > 0 && (
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
      )}
    </div>
  );
}
