"use client";

import type { CreateWaveDatesConfig } from "@/types/waves.types";
import CreateWaveDatesApproveStart from "./CreateWaveDatesApproveStart";
import CreateWaveDatesApproveEnd from "./CreateWaveDatesApproveEnd";
import type { CREATE_WAVE_VALIDATION_ERROR } from "@/helpers/waves/create-wave.validation";

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
  return (
    <div className="tw-space-y-4">
      <CreateWaveDatesApproveStart dates={dates} setDates={setDates} />

      <CreateWaveDatesApproveEnd
        dates={dates}
        errors={errors}
        setDates={setDates}
      />
    </div>
  );
}
