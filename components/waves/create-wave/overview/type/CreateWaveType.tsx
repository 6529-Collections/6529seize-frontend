

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
    <div>
      <p className="tw-mb-0 tw-text-lg sm:tw-text-xl tw-font-semibold tw-text-iron-50">
        Wave Type
      </p>
      <CreateWaveTypeInputs onChange={onChange} selected={selected} />
    </div>
  );
}
