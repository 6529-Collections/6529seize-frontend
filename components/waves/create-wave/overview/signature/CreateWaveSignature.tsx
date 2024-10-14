import { ApiWaveType } from "../../../../../generated/models/ApiWaveType";
import { WaveSignatureType } from "../../../../../types/waves.types";
import CreateWaveSignatureInputs from "./CreateWaveSignatureInputs";

export default function CreateWaveSignature({
  selectedWaveType,
  selectedSignatureType,
  onChange,
}: {
  readonly selectedWaveType: ApiWaveType;
  readonly selectedSignatureType: WaveSignatureType;
  readonly onChange: (type: WaveSignatureType) => void;
}) {
  return (
    <div>
      <p className="tw-mb-0 tw-text-lg  sm:tw-text-xl tw-font-semibold tw-text-iron-50">
        Signature Type
      </p>
      <CreateWaveSignatureInputs
        selectedWaveType={selectedWaveType}
        selectedSignatureType={selectedSignatureType}
        onChange={onChange}
      />
    </div>
  );
}
