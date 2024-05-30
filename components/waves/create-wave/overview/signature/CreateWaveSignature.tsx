import { WaveSignatureType, WaveType } from "../../../../../types/waves.types";
import CreateWaveSignatureInputs from "./CreateWaveSignatureInputs";

export default function CreateWaveSignature({
  selectedWaveType,
  selectedSignatureType,
  onChange,
}: {
  readonly selectedWaveType: WaveType;
  readonly selectedSignatureType: WaveSignatureType;
  readonly onChange: (type: WaveSignatureType) => void;
}) {
  return (
    <div>
      <p className="tw-mb-0 tw-text-2xl tw-font-bold tw-text-iron-50">
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
