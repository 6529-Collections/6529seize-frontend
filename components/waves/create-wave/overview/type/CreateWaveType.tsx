import type { ApiWaveType } from "@/generated/models/ApiWaveType";
import { CREATE_WAVE_VALIDATION_ERROR } from "@/helpers/waves/create-wave.validation";
import CreateWaveTypeInputs from "./CreateWaveTypeInputs";
import { CREATE_WAVE_FORM_STYLES } from "../../utils/createWaveFormStyles";

const NO_VALIDATION_ERRORS: CREATE_WAVE_VALIDATION_ERROR[] = [];

export default function CreateWaveType({
  selected,
  errors = NO_VALIDATION_ERRORS,
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
      <h3 className={CREATE_WAVE_FORM_STYLES.sectionTitle}>Wave Type</h3>
      <div
        aria-invalid={isTypeError}
        aria-describedby={isTypeError ? errorId : undefined}
      >
        <CreateWaveTypeInputs onChange={onChange} selected={selected} />
      </div>
      {isTypeError && (
        <p
          id={errorId}
          className="tw-m-0 tw-text-xs tw-font-medium tw-text-red"
        >
          Please choose a wave type to continue.
        </p>
      )}
    </div>
  );
}
