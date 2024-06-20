import { WaveType } from "../../../../../generated/models/WaveType";
import { WAVE_SIGNATURE_LABELS } from "../../../../../helpers/waves/waves.constants";
import { WaveSignatureType } from "../../../../../types/waves.types";
import CommonBorderedRadioButton from "../../../../utils/radio/CommonBorderedRadioButton";

export default function CreateWaveSignatureInputs({
  selectedWaveType,
  selectedSignatureType,
  onChange,
}: {
  readonly selectedWaveType: WaveType;
  readonly selectedSignatureType: WaveSignatureType;
  readonly onChange: (type: WaveSignatureType) => void;
}) {
  return (
    <div className="tw-mt-2 tw-flex tw-gap-x-4 tw-gap-y-4">
      {Object.values(WaveSignatureType).map((signatureType) => (
        <CommonBorderedRadioButton
          key={signatureType}
          type={signatureType}
          selected={selectedSignatureType}
          label={WAVE_SIGNATURE_LABELS[selectedWaveType][signatureType]}
          onChange={onChange}
        />
      ))}
    </div>
  );
}
