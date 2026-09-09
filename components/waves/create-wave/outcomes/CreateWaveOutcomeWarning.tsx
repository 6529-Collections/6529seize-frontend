"use client";

import { ApiWaveType } from "@/generated/models/ApiWaveType";
import type { CreateWaveDatesConfig } from "@/types/waves.types";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";
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
  const locale = useBrowserLocale();
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
          title: t(locale, "waves.create.outcomes.warning.unlimited.title"),
          description: t(
            locale,
            "waves.create.outcomes.warning.unlimited.description"
          ),
        }
      : {
          title: t(locale, "waves.create.outcomes.warning.indefinite.title"),
          description: t(
            locale,
            "waves.create.outcomes.warning.indefinite.description"
          ),
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
