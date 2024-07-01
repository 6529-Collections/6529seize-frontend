import { useEffect, useState } from "react";
import { CREATE_WAVE_VALIDATION_ERROR } from "../../../../helpers/waves/create-wave.helpers";
import { WaveOverviewConfig } from "../../../../types/waves.types";
import CreateWaveImageInput from "./CreateWaveImageInput";
import CreateWaveNameInput from "./CreateWaveNameInput";

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

  const [file, setFile] = useState<File | null>();

  useEffect(() => {
    onChange({ key: "image", value: file ? URL.createObjectURL(file) : null });
  }, [file]);

  return (
    <div className="tw-flex tw-flex-col tw-space-y-6">
      <CreateWaveImageInput imageToShow={overview.image} setFile={setFile} />
      <CreateWaveNameInput
        onChange={onChange}
        name={overview.name}
        errors={errors}
      />
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
