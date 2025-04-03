import { CREATE_WAVE_VALIDATION_ERROR } from "../../../../helpers/waves/create-wave.validation";
import { WaveOverviewConfig } from "../../../../types/waves.types";
import CreateWaveImageInput from "./CreateWaveImageInput";
import CreateWaveNameInput from "./CreateWaveNameInput";
import CreateWaveType from "./type/CreateWaveType";

export default function CreateWaveOverview({
  overview,
  errors,
  setOverview,
}: {
  readonly overview: WaveOverviewConfig;
  readonly errors: CREATE_WAVE_VALIDATION_ERROR[];
  readonly setOverview: (overview: WaveOverviewConfig) => void;
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
    <div className="tw-flex tw-flex-col tw-space-y-6">
      <CreateWaveNameInput
        onChange={onChange}
        name={overview.name}
        errors={errors}
      />
      <div className="tw-space-y-2">
        <p className="tw-mb-0 tw-text-lg  sm:tw-text-xl tw-font-semibold tw-text-iron-50">
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
    </div>
  );
}
