"use client";

import { useEffect, useState } from "react";
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

  const [warning, setWarning] = useState<{
    readonly title: string;
    readonly description: string;
  } | null>(null);

  useEffect(() => {
    if (!isApproveWave) {
      setWarning(null);
      return;
    }
    if (maxWinners) {
      setWarning(null);
      return;
    }
    if (!dates.endDate) {
      setWarning({
        title: "Warning: Challenge Will Run Indefinitely",
        description:
          "You have not set an end date or a maximum number of winners for this challenge. It will run indefinitely, and everyone who meets the threshold will be awarded.",
      });
      return;
    }
    setWarning({
      title: "Warning: Unlimited Awards",
      description:
        "You have not set a maximum number of winners for this challenge. Everyone who meets the threshold will be awarded.",
    });
  }, [dates.endDate, maxWinners, isApproveWave]);

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
