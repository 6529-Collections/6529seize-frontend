import CreateWaveApprovalThreshold from "./CreateWaveApprovalThreshold";
import CreateWaveApprovalThresholdTime from "./CreateWaveApprovalThresholdTime";

export default function CreateWaveApproval({
  threshold,
  thresholdTimeMs,
  setThreshold,
  setThresholdTimeMs,
}: {
  readonly threshold: number | null;
  readonly thresholdTimeMs: number | null;
  readonly setThreshold: (threshold: number | null) => void;
  readonly setThresholdTimeMs: (thresholdTimeMs: number | null) => void;
}) {
  return (
    <div>
      <p className="tw-mb-0 tw-text-xl tw-font-semibold tw-text-iron-50">
        Approval
      </p>
      <div className="tw-mt-2">
        <CreateWaveApprovalThreshold
          threshold={threshold}
          setThreshold={setThreshold}
        />
        <CreateWaveApprovalThresholdTime
          thresholdTimeMs={thresholdTimeMs}
          setThresholdTimeMs={setThresholdTimeMs}
        />
      </div>
    </div>
  );
}
