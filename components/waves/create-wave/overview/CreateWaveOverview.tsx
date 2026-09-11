import type { CREATE_WAVE_VALIDATION_ERROR } from "@/helpers/waves/create-wave.validation";
import type {
  CreateWaveDisplayConfig,
  WaveOverviewConfig,
} from "@/types/waves.types";
import { ApiWaveType } from "@/generated/models/ApiWaveType";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";
import { getCreateSubwaveTitle } from "@/helpers/waves/create-subwave-title.helpers";
import CreateWaveDisplaySettings from "./CreateWaveDisplaySettings";
import CreateWaveImageInput from "./CreateWaveImageInput";
import CreateWaveNameInput from "./CreateWaveNameInput";
import CreateWaveType from "./type/CreateWaveType";
import RankScheduleModeSelector from "./type/RankScheduleModeSelector";
import { DEFAULT_PROPOSAL_CARD_RECIPE } from "@/helpers/waves/proposal-card.helpers";
import CreateWaveStepHeader from "../utils/CreateWaveStepHeader";
import { CREATE_WAVE_FORM_STYLES } from "../utils/createWaveFormStyles";

const DEFAULT_DISPLAY: CreateWaveDisplayConfig = {
  proposalCards: {
    mode: "custom",
    excerptMaxCharacters: DEFAULT_PROPOSAL_CARD_RECIPE.excerptMaxCharacters,
    showMediaThumbnail: DEFAULT_PROPOSAL_CARD_RECIPE.showMediaThumbnail,
  },
  customRules: null,
  outcomesVisible: true,
  submissionButtonLabel: null,
  approve: {
    approvalsTabLabel: "",
    approvedTabLabel: "",
  },
};

export default function CreateWaveOverview({
  overview,
  isSubwave = false,
  parentWaveName,
  display = DEFAULT_DISPLAY,
  errors,
  ongoingRanking = false,
  setOverview,
  setDisplay = () => undefined,
  onOngoingRankingChange = () => undefined,
}: {
  readonly overview: WaveOverviewConfig;
  readonly isSubwave?: boolean;
  readonly parentWaveName?: string | null | undefined;
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

  return (
    <div className="tw-flex tw-min-w-0 tw-flex-col tw-gap-y-6 tw-break-words">
      <CreateWaveStepHeader
        title={
          isSubwave
            ? getCreateSubwaveTitle(locale, parentWaveName)
            : t(locale, "waves.create.overview.title")
        }
      />
      <CreateWaveNameInput
        onChange={onChange}
        name={overview.name}
        isSubwave={isSubwave}
        errors={errors}
      />
      <div className="tw-space-y-3">
        <h3 className={CREATE_WAVE_FORM_STYLES.sectionTitle}>
          {t(
            locale,
            isSubwave
              ? "waves.create.overview.subwavePicture"
              : "waves.create.overview.picture"
          )}
        </h3>
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
      <CreateWaveType
        isSubwave={isSubwave}
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
      {overview.type === ApiWaveType.Rank ||
      overview.type === ApiWaveType.Approve ? (
        <CreateWaveDisplaySettings
          display={display}
          errors={errors}
          onChange={setDisplay}
          waveType={overview.type}
        />
      ) : null}
    </div>
  );
}
