import type { ApiWaveType } from "@/generated/models/ApiWaveType";
import { CREATE_WAVE_VALIDATION_ERROR } from "@/helpers/waves/create-wave.validation";
import CreateWaveTypeInputs from "./CreateWaveTypeInputs";

export default function CreateWaveType({
  selected,
  errors = [],
  onChange,
}: {
  readonly selected: ApiWaveType | null;
  readonly errors?: CREATE_WAVE_VALIDATION_ERROR[];
  readonly onChange: (type: ApiWaveType) => void;
}) {
  const isTypeError = errors.includes(
    CREATE_WAVE_VALIDATION_ERROR.TYPE_REQUIRED
  );
  const errorId = "create-wave-type-error";

  return (
    <div className="tw-space-y-3">
      <p className="tw-mb-0 tw-text-sm tw-font-semibold tw-text-iron-200">
        Wave Type
      </p>
      <div
        aria-invalid={isTypeError}
        aria-describedby={isTypeError ? errorId : undefined}
      >
        <CreateWaveTypeInputs onChange={onChange} selected={selected} />
      </div>
      {isTypeError && (
        <p
          id={errorId}
          className="tw-mb-0 tw-text-xs tw-font-medium tw-text-red"
        >
          Please choose a wave type to continue.
        </p>
      )}
    </div>
  );
}
