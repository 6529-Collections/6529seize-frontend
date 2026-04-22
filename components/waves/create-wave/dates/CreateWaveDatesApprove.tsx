"use client";

import { useState } from "react";
import type { CreateWaveDatesConfig } from "@/types/waves.types";
import CreateWaveDatesApproveStart from "./CreateWaveDatesApproveStart";
import CreateWaveDatesApproveEnd from "./CreateWaveDatesApproveEnd";

interface CreateWaveDatesApproveProps {
  readonly dates: CreateWaveDatesConfig;
  readonly setDates: (dates: CreateWaveDatesConfig) => void;
}

export default function CreateWaveDatesApprove({
  dates,
  setDates,
}: CreateWaveDatesApproveProps) {
  const [expandedSections, setExpandedSections] = useState({
    start: true,
    end: false,
  });

  return (
    <div className="tw-space-y-4">
      <CreateWaveDatesApproveStart
        dates={dates}
        setDates={setDates}
        isExpanded={expandedSections.start}
        setIsExpanded={(expanded) =>
          setExpandedSections((prev) => ({
            ...prev,
            start: expanded,
          }))
        }
      />

      <CreateWaveDatesApproveEnd
        dates={dates}
        setDates={setDates}
        isExpanded={expandedSections.end}
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
