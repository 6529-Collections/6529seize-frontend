"use client";

import { useState } from "react";
import type { CreateWaveDatesConfig } from "@/types/waves.types";
import CreateWaveDatesApproveStart from "./CreateWaveDatesApproveStart";
import CreateWaveDatesApproveEnd from "./CreateWaveDatesApproveEnd";
import { CREATE_WAVE_VALIDATION_ERROR } from "@/helpers/waves/create-wave.validation";

interface CreateWaveDatesApproveProps {
  readonly dates: CreateWaveDatesConfig;
  readonly errors: CREATE_WAVE_VALIDATION_ERROR[];
  readonly setDates: (dates: CreateWaveDatesConfig) => void;
}

export default function CreateWaveDatesApprove({
  dates,
  errors,
  setDates,
}: CreateWaveDatesApproveProps) {
  const [expandedSections, setExpandedSections] = useState({
    start: true,
    end: false,
  });
  const hasEndDateError = errors.includes(
    CREATE_WAVE_VALIDATION_ERROR.END_DATE_REQUIRED
  );

  const isStartExpanded = hasEndDateError ? false : expandedSections.start;
  const isEndExpanded = hasEndDateError ? true : expandedSections.end;
  const setEndDates = (nextDates: CreateWaveDatesConfig) => {
    const hasValidEndDate =
      nextDates.endDate !== null &&
      Number.isFinite(nextDates.endDate) &&
      nextDates.endDate > 0;

    if (hasEndDateError && hasValidEndDate) {
      setExpandedSections({
        start: false,
        end: true,
      });
    }

    setDates(nextDates);
  };

  return (
    <div className="tw-space-y-4">
      <CreateWaveDatesApproveStart
        dates={dates}
        setDates={setDates}
        isExpanded={isStartExpanded}
        setIsExpanded={(expanded) =>
          setExpandedSections((prev) => ({
            ...prev,
            start: expanded,
          }))
        }
      />

      <CreateWaveDatesApproveEnd
        dates={dates}
        errors={errors}
        setDates={setEndDates}
        isExpanded={isEndExpanded}
        setIsExpanded={(expanded) =>
          setExpandedSections((prev) => ({
            ...prev,
            end: expanded,
          }))
        }
      />
    </div>
  );
}
