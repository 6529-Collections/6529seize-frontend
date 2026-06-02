import type { ApiWave } from "@/generated/models/ApiWave";
import { ApiWaveCreditScope } from "@/generated/models/ApiWaveCreditScope";
import { ApiWaveType } from "@/generated/models/ApiWaveType";
import WaveAuthor from "./WaveAuthor";
import WaveTypeIcon from "./WaveTypeIcon";
import WaveRating from "./WaveRating";
import WaveSlowMode from "./WaveSlowMode";
import WaveDisableLinks from "./WaveDisableLinks";
import WaveApprovalThresholds from "./WaveApprovalThresholds";

const CREDIT_SCOPE_LABELS: Record<ApiWaveCreditScope, string> = {
  [ApiWaveCreditScope.Wave]: "Whole wave",
  [ApiWaveCreditScope.Drop]: "Each drop",
};

interface WaveSpecsProps {
  readonly wave: ApiWave;
  readonly useRing?: boolean | undefined;
}

export default function WaveSpecs({ wave, useRing = true }: WaveSpecsProps) {
  const ringClasses = useRing
    ? "tw-ring-1 tw-ring-inset tw-ring-iron-800 tw-rounded-xl"
    : "";
  const isChatWave = wave.wave.type === ApiWaveType.Chat;
  const isApproveWave = wave.wave.type === ApiWaveType.Approve;
  const showSlowMode = wave.chat.enabled;
  const creditScope = wave.voting.credit_scope ?? ApiWaveCreditScope.Wave;
  const creditScopeLabel =
    CREDIT_SCOPE_LABELS[creditScope] ??
    CREDIT_SCOPE_LABELS[ApiWaveCreditScope.Wave];

  return (
    <div
      className={`tw-relative tw-overflow-auto tw-bg-iron-950 ${ringClasses}`}
    >
      <div className="tw-pb-4">
        <div className="tw-flex tw-items-center tw-justify-between tw-px-4 tw-pt-3">
          <p className="tw-mb-0 tw-text-base tw-font-semibold tw-tracking-tight tw-text-iron-200">
            General
          </p>
        </div>

        <div className="tw-mt-2.5 tw-flex tw-flex-col tw-gap-2 tw-px-4">
          <div className="tw-group tw-flex tw-h-6 tw-w-full tw-items-center tw-justify-between tw-gap-1.5 tw-text-sm">
            <span className="tw-font-medium tw-text-iron-400">Type</span>
            <div className="tw-flex tw-items-center tw-gap-x-1">
              <WaveTypeIcon waveType={wave.wave.type} />
            </div>
          </div>

          {!isChatWave && (
            <>
              <div className="tw-group tw-flex tw-w-full tw-items-start tw-justify-between tw-gap-2 tw-text-sm">
                <span className="tw-font-medium tw-text-iron-400">Voting</span>
                <div className="tw-flex tw-flex-1 tw-justify-end">
                  <WaveRating wave={wave} />
                </div>
              </div>

              <div className="tw-group tw-flex tw-h-6 tw-w-full tw-items-center tw-justify-between tw-gap-1.5 tw-text-sm">
                <span className="tw-font-medium tw-text-iron-400">
                  Voting power
                </span>
                <span className="tw-self-end tw-font-medium tw-text-iron-200">
                  {creditScopeLabel}
                </span>
              </div>
            </>
          )}

          {isApproveWave && <WaveApprovalThresholds wave={wave} />}

          <div className="tw-group tw-flex tw-h-6 tw-w-full tw-items-center tw-justify-between tw-gap-1.5 tw-text-sm">
            <span className="tw-font-medium tw-text-iron-400">Creator</span>
            <div className="tw-flex tw-items-center tw-gap-x-1">
              <WaveAuthor wave={wave} />
            </div>
          </div>

          {showSlowMode && (
            <>
              <WaveSlowMode wave={wave} />
              <WaveDisableLinks wave={wave} />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
