"use client";

import type { CreateWaveDatesConfig } from "@/types/waves.types";
import CreateWaveDatesApproveStart from "./CreateWaveDatesApproveStart";
import CreateWaveDatesApproveEnd from "./CreateWaveDatesApproveEnd";
import { CREATE_WAVE_VALIDATION_ERROR } from "@/helpers/waves/create-wave.validation";
import CreateWaveAdvancedSection from "../utils/CreateWaveAdvancedSection";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";

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
  const locale = useBrowserLocale();
  const hasEndDateError = errors.includes(
    CREATE_WAVE_VALIDATION_ERROR.END_DATE_MUST_BE_AFTER_VOTING_START_DATE
  );

  return (
    <div className="tw-space-y-4">
      <CreateWaveDatesApproveStart dates={dates} setDates={setDates} />

      <CreateWaveAdvancedSection
        title={t(locale, "waves.create.dates.approve.advancedSummary")}
        isCustomized={dates.endDate !== null}
        hasError={hasEndDateError}
        variant="filled"
      >
        <CreateWaveDatesApproveEnd
          dates={dates}
          errors={errors}
          setDates={setDates}
        />
      </CreateWaveAdvancedSection>
    </div>
  );
}
