import { ApiWaveType } from "../../../../../generated/models/ApiWaveType";
import { WAVE_SIGNATURE_LABELS } from "../../../../../helpers/waves/waves.constants";
import { WaveSignatureType } from "../../../../../types/waves.types";
import CommonBorderedRadioButton from "../../../../utils/radio/CommonBorderedRadioButton";

export default function CreateWaveSignatureInputs({
  selectedWaveType,
  selectedSignatureType,
  onChange,
}: {
  readonly selectedWaveType: ApiWaveType;
  readonly selectedSignatureType: WaveSignatureType;
  readonly onChange: (type: WaveSignatureType) => void;
}) {
  const DISABLED_SIGNATURE_TYPES: WaveSignatureType[] = [
    WaveSignatureType.DROPS,
    WaveSignatureType.VOTING,
    WaveSignatureType.DROPS_AND_VOTING,
  ];

  return (
    <div className="tw-mt-3 tw-grid tw-grid-cols-2 md:tw-grid-cols-4 tw-gap-x-4 tw-gap-y-4">
      {Object.values(WaveSignatureType).map((signatureType) => (
        <CommonBorderedRadioButton
          key={signatureType}
          type={signatureType}
          selected={selectedSignatureType}
          disabled={DISABLED_SIGNATURE_TYPES.includes(signatureType)}
          label={WAVE_SIGNATURE_LABELS[selectedWaveType][signatureType]}
          onChange={onChange}
        />
      ))}
    </div>
  );
}
