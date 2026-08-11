"use client";

import type { CreateWaveDatesConfig } from "@/types/waves.types";
import { ApiWaveType } from "@/generated/models/ApiWaveType";
import CreateWaveDatesApprove from "./CreateWaveDatesApprove";
import CreateWaveDatesRank from "./CreateWaveDatesRank";
import type { CREATE_WAVE_VALIDATION_ERROR } from "@/helpers/waves/create-wave.validation";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";

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
  const locale = useBrowserLocale();
  const isApprove = waveType === ApiWaveType.Approve;

  return (
    <div className="tw-flex tw-flex-col tw-gap-y-4">
      <div className="tw-space-y-1">
        <h2 className="tw-m-0 tw-text-xl tw-font-semibold tw-text-white">
          {t(locale, "waves.create.dates.title")}
        </h2>
        <p className="tw-m-0 tw-text-sm tw-leading-relaxed tw-text-iron-300">
          {t(locale, "waves.create.dates.description")}
        </p>
      </div>
      {isApprove ? (
        <CreateWaveDatesApprove
          dates={dates}
          errors={errors}
          setDates={setDates}
        />
      ) : (
        <CreateWaveDatesRank
          waveType={waveType}
          dates={dates}
          errors={errors}
          setDates={setDates}
        />
      )}
    </div>
  );
}
