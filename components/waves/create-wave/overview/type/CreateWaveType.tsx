import type { ApiWaveType } from "@/generated/models/ApiWaveType";
import CreateWaveTypeInputs from "./CreateWaveTypeInputs";

export default function CreateWaveType({
  selected,
  onChange,
}: {
  readonly selected: ApiWaveType;
  readonly onChange: (type: ApiWaveType) => void;
}) {
  return (
    <div className="tw-space-y-3">
      <p className="tw-mb-0 tw-text-sm tw-font-semibold tw-text-iron-200">
        Wave Type
      </p>
      <CreateWaveTypeInputs onChange={onChange} selected={selected} />
    </div>
  );
}
