import type { CREATE_WAVE_VALIDATION_ERROR } from "@/helpers/waves/create-wave.validation";
import type {
  CreateWaveDisplayConfig,
  WaveOverviewConfig,
} from "@/types/waves.types";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";
import { getCreateSubwaveTitle } from "@/helpers/waves/create-subwave-title.helpers";
import CreateWaveImageInput from "./CreateWaveImageInput";
import CreateWaveNameInput from "./CreateWaveNameInput";
import CreateWaveStepHeader from "../utils/CreateWaveStepHeader";
import { CREATE_WAVE_FORM_STYLES } from "../utils/createWaveFormStyles";

export default function CreateWaveOverview({
  overview,
  isSubwave = false,
  parentWaveName,
  errors,
  setOverview,
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
    </div>
  );
}
