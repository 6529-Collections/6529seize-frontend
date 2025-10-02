import { CREATE_WAVE_VALIDATION_ERROR } from "@/helpers/waves/create-wave.validation";
import CreateWaveApprovalThreshold from "./CreateWaveApprovalThreshold";
import CreateWaveApprovalThresholdTime from "./CreateWaveApprovalThresholdTime";

export default function CreateWaveApproval({
  threshold,
  thresholdTimeMs,
  errors,
  setThreshold,
  setThresholdTimeMs,
}: {
  readonly threshold: number | null;
  readonly thresholdTimeMs: number | null;
  readonly errors: CREATE_WAVE_VALIDATION_ERROR[];
  readonly setThreshold: (threshold: number | null) => void;
  readonly setThresholdTimeMs: (thresholdTimeMs: number | null) => void;
}) {
  const thresholdError = errors.includes(
    CREATE_WAVE_VALIDATION_ERROR.APPROVAL_THRESHOLD_REQUIRED
  );

  const thresholdTimeError = errors.includes(
    CREATE_WAVE_VALIDATION_ERROR.APPROVAL_THRESHOLD_TIME_REQUIRED
  );
  const thresholdDurationError = errors.includes(
    CREATE_WAVE_VALIDATION_ERROR.APPROVAL_THRESHOLD_TIME_MUST_BE_SMALLER_THAN_WAVE_DURATION
  );
  return (
    <div>
      <p className="tw-mb-0 tw-text-lg  sm:tw-text-xl tw-font-semibold tw-text-iron-50">
        Approval
      </p>
      <div className="tw-mt-2">
        <CreateWaveApprovalThreshold
          threshold={threshold}
          error={thresholdError}
          setThreshold={setThreshold}
        />
        <CreateWaveApprovalThresholdTime
          thresholdTimeMs={thresholdTimeMs}
          thresholdTimeError={thresholdTimeError}
          thresholdDurationError={thresholdDurationError}
          setThresholdTimeMs={setThresholdTimeMs}
        />
      </div>
    </div>
  );
}
