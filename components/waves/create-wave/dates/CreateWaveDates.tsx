"use client";

import type { CreateWaveDatesConfig } from "@/types/waves.types";
import { ApiWaveType } from "@/generated/models/ApiWaveType";
import CreateWaveDatesApprove from "./CreateWaveDatesApprove";
import CreateWaveDatesRank from "./CreateWaveDatesRank";

interface CreateWaveDatesProps {
  readonly waveType: ApiWaveType;
  readonly dates: CreateWaveDatesConfig;
  readonly setDates: (dates: CreateWaveDatesConfig) => void;
}

export default function CreateWaveDates({
  waveType,
  dates,
  setDates,
}: CreateWaveDatesProps) {
  if (waveType === ApiWaveType.Approve) {
    return <CreateWaveDatesApprove dates={dates} setDates={setDates} />;
  }

  return (
    <CreateWaveDatesRank
      waveType={waveType}
      dates={dates}
      setDates={setDates}
    />
  );
}
