import { CREATE_WAVE_VALIDATION_ERROR } from "@/helpers/waves/create-wave.validation";
import type {
  CreateWaveDisplayConfig,
  WaveOverviewConfig,
} from "@/types/waves.types";
import { ApiWaveType } from "@/generated/models/ApiWaveType";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";
import CreateWaveAdvancedSection from "../utils/CreateWaveAdvancedSection";
import CreateWaveDisplaySettings from "./CreateWaveDisplaySettings";
import CreateWaveImageInput from "./CreateWaveImageInput";
import CreateWaveNameInput from "./CreateWaveNameInput";
import CreateWaveType from "./type/CreateWaveType";
import RankScheduleModeSelector from "./type/RankScheduleModeSelector";

const DEFAULT_DISPLAY: CreateWaveDisplayConfig = {
  compactProposalCards: false,
  customRules: null,
  outcomesVisible: true,
  submissionButtonLabel: null,
  approve: {
    approvalsTabLabel: "",
    approvedTabLabel: "",
  },
};

const ADVANCED_OVERVIEW_ERRORS = new Set<CREATE_WAVE_VALIDATION_ERROR>([
  CREATE_WAVE_VALIDATION_ERROR.SUBMISSION_BUTTON_LABEL_TOO_LONG,
  CREATE_WAVE_VALIDATION_ERROR.APPROVE_WAVE_TAB_LABEL_TOO_LONG,
  CREATE_WAVE_VALIDATION_ERROR.APPROVE_WAVE_TAB_LABELS_DUPLICATE,
  CREATE_WAVE_VALIDATION_ERROR.APPROVE_WAVE_TAB_LABEL_RESERVED,
]);

export default function CreateWaveOverview({
  overview,
  display = DEFAULT_DISPLAY,
  errors,
  ongoingRanking = false,
  setOverview,
  setDisplay = () => undefined,
  onOngoingRankingChange = () => undefined,
}: {
  readonly overview: WaveOverviewConfig;
  readonly display?: CreateWaveDisplayConfig | undefined;
  readonly errors: CREATE_WAVE_VALIDATION_ERROR[];
  readonly ongoingRanking?: boolean;
  readonly setOverview: (overview: WaveOverviewConfig) => void;
  readonly setDisplay?:
    | ((display: CreateWaveDisplayConfig) => void)
    | undefined;
  readonly onOngoingRankingChange?: (ongoingRanking: boolean) => void;
}) {
  const locale = useBrowserLocale();
  const onChange = <K extends keyof WaveOverviewConfig>({
    key,
    value,
  }: {
    readonly key: K;
    readonly value: WaveOverviewConfig[K];
  }) =>
    setOverview({
      ...overview,
      [key]: value,
    });

  const isProposalWave =
    overview.type === ApiWaveType.Rank ||
    overview.type === ApiWaveType.Approve;
  const hasCustomApproveLabels =
    overview.type === ApiWaveType.Approve &&
    (display.approve.approvalsTabLabel.trim().length > 0 ||
      display.approve.approvedTabLabel.trim().length > 0);
  const isAdvancedCustomized =
    overview.image !== null ||
    (isProposalWave &&
      ((display.submissionButtonLabel?.trim().length ?? 0) > 0 ||
        display.compactProposalCards === true ||
        hasCustomApproveLabels));
  const hasAdvancedError = errors.some((error) =>
    ADVANCED_OVERVIEW_ERRORS.has(error)
  );

  return (
    <div className="tw-flex tw-flex-col tw-gap-y-6">
      <CreateWaveNameInput
        onChange={onChange}
        name={overview.name}
        errors={errors}
      />
      <CreateWaveType
        selected={overview.typeSelected ? overview.type : null}
        errors={errors}
        onChange={(type) =>
          // Record the explicit pick so the selector highlights it and the
          // Overview "type required" gate clears.
          setOverview({ ...overview, type, typeSelected: true })
        }
      />
      {overview.type === ApiWaveType.Rank && (
        <RankScheduleModeSelector
          ongoingRanking={ongoingRanking}
          onChange={onOngoingRankingChange}
        />
      )}
      <CreateWaveAdvancedSection
        summary={t(
          locale,
          isAdvancedCustomized
            ? "waves.create.overview.advanced.customSummary"
            : "waves.create.overview.advanced.defaultSummary"
        )}
        isCustomized={isAdvancedCustomized}
        hasError={hasAdvancedError}
      >
        <div className="tw-flex tw-flex-col tw-gap-y-6">
          <div className="tw-space-y-3">
            <p className="tw-mb-0 tw-text-sm tw-font-semibold tw-text-iron-200">
              {t(locale, "waves.create.overview.picture")}
            </p>
            <CreateWaveImageInput
              imageToShow={overview.image}
              setFile={(file) =>
                onChange({
                  key: "image",
                  value: file,
                })
              }
            />
          </div>
          {isProposalWave ? (
            <CreateWaveDisplaySettings
              display={display}
              errors={errors}
              onChange={setDisplay}
              waveType={overview.type}
            />
          ) : null}
        </div>
      </CreateWaveAdvancedSection>
    </div>
  );
}
