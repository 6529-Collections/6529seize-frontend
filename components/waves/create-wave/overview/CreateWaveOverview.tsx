import type { CREATE_WAVE_VALIDATION_ERROR } from "@/helpers/waves/create-wave.validation";
import type {
  CreateWaveDisplayConfig,
  WaveOverviewConfig,
} from "@/types/waves.types";
import { ApiWaveType } from "@/generated/models/ApiWaveType";
import CreateWaveDisplaySettings from "./CreateWaveDisplaySettings";
import CreateWaveImageInput from "./CreateWaveImageInput";
import CreateWaveNameInput from "./CreateWaveNameInput";
import CreateWaveType from "./type/CreateWaveType";

const DEFAULT_DISPLAY: CreateWaveDisplayConfig = {
  customRules: null,
  outcomesVisible: true,
  approve: {
    approvalsTabLabel: "",
    approvedTabLabel: "",
  },
};

export default function CreateWaveOverview({
  overview,
  display = DEFAULT_DISPLAY,
  errors,
  setOverview,
  setDisplay = () => undefined,
}: {
  readonly overview: WaveOverviewConfig;
  readonly display?: CreateWaveDisplayConfig | undefined;
  readonly errors: CREATE_WAVE_VALIDATION_ERROR[];
  readonly setOverview: (overview: WaveOverviewConfig) => void;
  readonly setDisplay?:
    | ((display: CreateWaveDisplayConfig) => void)
    | undefined;
}) {
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
    <div className="tw-flex tw-flex-col tw-gap-y-6">
      <CreateWaveNameInput
        onChange={onChange}
        name={overview.name}
        errors={errors}
      />
      <div className="tw-space-y-3">
        <p className="tw-mb-0 tw-text-sm tw-font-semibold tw-text-iron-200">
          Wave Profile Picture
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
      <CreateWaveType
        selected={overview.type}
        onChange={(type) =>
          onChange({
            key: "type",
            value: type,
          })
        }
      />
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
