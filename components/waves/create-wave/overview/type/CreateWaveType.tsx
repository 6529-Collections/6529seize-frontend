
import { WaveType } from "../../../../../types/waves.types";
import CreateWaveTypeInputs from "./CreateWaveTypeInputs";

export default function CreateWaveType({
  selected,
  onChange,
}: {
  readonly selected: WaveType;
  readonly onChange: (type: WaveType) => void;
}) {
  return (
    <div>
      <p className="tw-mb-0 tw-text-xl tw-font-bold tw-text-iron-50">
        Wave Type
      </p>
      <CreateWaveTypeInputs onChange={onChange} selected={selected} />
    </div>
  );
}
