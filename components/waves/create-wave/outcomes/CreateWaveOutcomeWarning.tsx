"use client";

import { ApiWaveType } from "@/generated/models/ApiWaveType";
import type { CreateWaveDatesConfig } from "@/types/waves.types";
import CreateWaveWarning from "../utils/CreateWaveWarning";

export default function CreateWaveOutcomeWarning({
  waveType,
  dates,
  maxWinners,
}: {
  readonly waveType: ApiWaveType;
  readonly dates: CreateWaveDatesConfig;
  readonly maxWinners: number | null;
}) {
  const isApproveWave = waveType === ApiWaveType.Approve;
  const hasMaxWinners = Boolean(maxWinners);
  const hasEndDate = Boolean(dates.endDate);
  let warning: {
    readonly title: string;
    readonly description: string;
  } | null = null;

  if (isApproveWave && !hasMaxWinners) {
    warning = hasEndDate
      ? {
          title: "Warning: Unlimited Awards",
          description:
            "You have not set a maximum number of winners for this wave. Everyone who meets the threshold will be awarded.",
        }
      : {
          title: "Warning: Wave Will Run Indefinitely",
          description:
            "You have not set an end date or a maximum number of winners for this wave. It will run indefinitely, and everyone who meets the threshold will be awarded.",
        };
  }

  if (!warning) {
    return null;
  }

  return (
    <CreateWaveWarning
      title={warning.title}
      description={warning.description}
    />
  );
}
