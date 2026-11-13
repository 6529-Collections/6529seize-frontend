import CreateWaveOutcomesManual from "./manual/CreateWaveOutcomesManual";
import CreateWaveOutcomesRows from "./winners/rows/CreateWaveOutcomesRows";
import type {
  CreateWaveDatesConfig,
  CreateWaveDisplayConfig,
  CreateWaveOutcomeConfig,
} from "@/types/waves.types";
import { CreateWaveOutcomeType } from "@/types/waves.types";
import CommonAnimationHeight from "@/components/utils/animation/CommonAnimationHeight";
import { ApiWaveType } from "@/generated/models/ApiWaveType";
import type { CREATE_WAVE_VALIDATION_ERROR } from "@/helpers/waves/create-wave.validation";
import CreateWaveApprovalMaxWinners from "./CreateWaveApprovalMaxWinners";
import CreateWaveOutcomeWarning from "./CreateWaveOutcomeWarning";
import { t } from "@/i18n/messages";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import CreateWaveAdvancedSection from "../utils/CreateWaveAdvancedSection";
import CreateWaveStepHeader from "../utils/CreateWaveStepHeader";

export default function WavesOutcome({
  outcomes,
  outcomeType,
  waveType,
  errors,
  dates,
  maxWinners,
  lockDefinitions = false,
  setOutcomeType,
  setOutcomes,
  setMaxWinners,
}: {
  readonly outcomes: CreateWaveOutcomeConfig[];
  readonly outcomeType: CreateWaveOutcomeType | null;
  readonly waveType: ApiWaveType;
  readonly errors: CREATE_WAVE_VALIDATION_ERROR[];
  readonly dates: CreateWaveDatesConfig;
  readonly display: CreateWaveDisplayConfig;
  readonly maxWinners: number | null;
  readonly lockDefinitions?: boolean;
  readonly setOutcomeType: (outcomeType: CreateWaveOutcomeType | null) => void;
  readonly setOutcomes: (outcomes: CreateWaveOutcomeConfig[]) => void;
  readonly setDisplay: (display: CreateWaveDisplayConfig) => void;
  readonly setMaxWinners: (maxWinners: number | null) => void;
}) {
  const locale = useBrowserLocale();
  const isApproveWave = waveType === ApiWaveType.Approve;
  const isPerpetualRanking =
    waveType === ApiWaveType.Rank && (dates.ongoingRanking ?? false);
  const isAdvancedCustomized = isApproveWave && maxWinners !== null;

  const onOutcome = (outcome: CreateWaveOutcomeConfig) => {
    if (lockDefinitions) return;
    setOutcomes([...outcomes, outcome]);
    setOutcomeType(null);
  };

  const onCancel = () => {
    setOutcomeType(null);
  };

  if (isPerpetualRanking) {
    return (
      <div className="tw-mx-auto tw-w-full">
        <CreateWaveStepHeader
          title={t(locale, "waves.create.outcomes.title")}
        />
        <div className="tw-mt-3 tw-space-y-4">
          <div className="tw-rounded-lg tw-border tw-border-solid tw-border-primary-500/30 tw-bg-primary-500/10 tw-p-4 tw-shadow-inner">
            <p className="tw-mb-1 tw-text-sm tw-font-semibold tw-text-iron-50">
              {t(locale, "waves.create.outcomes.perpetual.title")}
            </p>
            <p className="tw-mb-0 tw-text-xs tw-text-iron-300">
              {t(locale, "waves.create.outcomes.perpetual.description")}
            </p>
          </div>
          {/* The step flow skips this page for perpetual waves; this branch
              is only a safety net for direct navigation. */}
        </div>
      </div>
    );
  }

  return (
    <div className="tw-mx-auto tw-w-full">
      <CreateWaveStepHeader title={t(locale, "waves.create.outcomes.title")} />
      <div className="tw-mt-6 tw-space-y-6">
        <fieldset
          disabled={lockDefinitions}
          className="tw-m-0 tw-min-w-0 tw-space-y-6 tw-border-0 tw-p-0 disabled:tw-opacity-60"
        >
          <p className="tw-m-0 tw-text-sm tw-text-iron-400">
            {t(locale, "waves.create.outcomes.optionalDescription")}
          </p>
          {outcomeType !== CreateWaveOutcomeType.MANUAL && !lockDefinitions && (
            <button
              type="button"
              onClick={() => setOutcomeType(CreateWaveOutcomeType.MANUAL)}
              className="tw-min-h-11 tw-rounded-lg tw-border tw-border-solid tw-border-iron-700 tw-bg-iron-900 tw-px-4 tw-py-2 tw-text-sm tw-font-semibold tw-text-iron-100 hover:tw-bg-iron-800 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-primary-400"
            >
              {t(locale, "waves.create.outcomes.addOutcome")}
            </button>
          )}
          <div>
            {/* <h3 className="tw-mb-2 tw-text-base tw-font-semibold tw-text-white">Title for created outcome cards</h3> */}
            <CommonAnimationHeight>
              {outcomeType === CreateWaveOutcomeType.MANUAL ? (
                <CreateWaveOutcomesManual
                  onOutcome={onOutcome}
                  onCancel={onCancel}
                  waveType={waveType}
                />
              ) : (
                <CreateWaveOutcomesRows
                  waveType={waveType}
                  errors={errors}
                  outcomes={outcomes}
                  setOutcomes={lockDefinitions ? () => undefined : setOutcomes}
                />
              )}
            </CommonAnimationHeight>
          </div>
        </fieldset>
        {isApproveWave && (
          <CreateWaveOutcomeWarning
            waveType={waveType}
            dates={dates}
            maxWinners={maxWinners}
          />
        )}
        {isApproveWave && (
          <CreateWaveAdvancedSection
            title={t(locale, "waves.create.outcomes.approveAdvancedSummary")}
            isCustomized={isAdvancedCustomized}
            hasError={false}
          >
            <div>
              <CreateWaveApprovalMaxWinners
                maxWinners={maxWinners}
                setMaxWinners={setMaxWinners}
              />
            </div>
          </CreateWaveAdvancedSection>
        )}
      </div>
    </div>
  );
}
