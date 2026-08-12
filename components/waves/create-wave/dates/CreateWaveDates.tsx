"use client";

import type { CreateWaveDatesConfig } from "@/types/waves.types";
import { ApiWaveType } from "@/generated/models/ApiWaveType";
import CreateWaveDatesApprove from "./CreateWaveDatesApprove";
import CreateWaveDatesRank from "./CreateWaveDatesRank";
import type { CREATE_WAVE_VALIDATION_ERROR } from "@/helpers/waves/create-wave.validation";

interface CreateWaveDatesProps {
  readonly waveType: ApiWaveType;
  readonly dates: CreateWaveDatesConfig;
  readonly errors: CREATE_WAVE_VALIDATION_ERROR[];
  readonly setDates: (dates: CreateWaveDatesConfig) => void;
}

export default function CreateWaveDates({
  waveType,
  dates,
  errors,
  setDates,
}: CreateWaveDatesProps) {
  if (waveType === ApiWaveType.Approve) {
    return (
      <CreateWaveDatesApprove
        dates={dates}
        errors={errors}
        setDates={setDates}
      />
    );
  }

  return (
    <CreateWaveDatesRank
      waveType={waveType}
      dates={dates}
      errors={errors}
      setDates={setDates}
    />
  );
}
