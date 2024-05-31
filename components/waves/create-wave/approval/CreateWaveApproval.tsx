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
    <div className="tw-max-w-xl tw-mx-auto tw-w-full">
      <div className="tw-pt-6">
        <p className="tw-mb-0 tw-text-xl tw-font-bold tw-text-iron-50">
          Approval
        </p>
        <div className="tw-mt-3">
          <CreateWaveApprovalThreshold
            threshold={threshold}
            setThreshold={setThreshold}
          />
          <CreateWaveApprovalThresholdTime
            thresholdTimeMs={thresholdTimeMs}
            setThresholdTimeMs={setThresholdTimeMs}
          />
        </div>
        <div className="tw-mt-6 tw-text-right">
          <button
            type="button"
            className="tw-relative tw-inline-flex tw-items-center tw-justify-center tw-cursor-pointer tw-bg-primary-500 tw-px-4 tw-py-3 tw-text-base tw-font-semibold tw-text-white tw-border tw-border-solid tw-border-primary-500 tw-rounded-lg hover:tw-bg-primary-600 hover:tw-border-primary-600 tw-transition tw-duration-300 tw-ease-out"
          >
            <span>Finish</span>
          </button>
        </div>
      </div>
    </div>
  );
}
