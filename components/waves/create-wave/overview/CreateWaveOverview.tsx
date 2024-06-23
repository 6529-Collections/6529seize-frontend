import { CREATE_WAVE_VALIDATION_ERROR } from "../../../../helpers/waves/create-wave.helpers";
import { WaveOverviewConfig } from "../../../../types/waves.types";
import CreateWaveOverviewInputs from "./CreateWaveOverviewInputs";
import CreateWaveSignature from "./signature/CreateWaveSignature";
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
      <CreateWaveOverviewInputs onChange={onChange} name={overview.name} errors={errors}/>
      <CreateWaveType
        selected={overview.type}
        onChange={(type) =>
          onChange({
            key: "type",
            value: type,
          })
        }
      />
      <CreateWaveSignature
        selectedWaveType={overview.type}
        selectedSignatureType={overview.signatureType}
        onChange={(type) => onChange({ key: "signatureType", value: type })}
      />
    </div>
  );
}
