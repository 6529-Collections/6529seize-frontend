import type { ApiWave } from "@/generated/models/ApiWave";
import { ApiWaveCreditType } from "@/generated/models/ApiWaveCreditType";
import { ApiWaveCreditScope } from "@/generated/models/ApiWaveCreditScope";
import { ApiWaveType } from "@/generated/models/ApiWaveType";
import WaveAuthor from "./WaveAuthor";
import WaveTypeIcon from "./WaveTypeIcon";
import WaveRating from "./WaveRating";
import WaveApprovalThresholds from "./WaveApprovalThresholds";
import WaveApproveTabLabels from "./WaveApproveTabLabels";
import { WaveIdentitySubmissionSpecsRows } from "./WaveIdentitySubmissionSpecs";

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
  const creditScope = wave.voting.credit_scope ?? ApiWaveCreditScope.Wave;
  const creditScopeLabel =
    CREDIT_SCOPE_LABELS[creditScope] ??
    CREDIT_SCOPE_LABELS[ApiWaveCreditScope.Wave];
  const hasVotingDetails =
    wave.voting.credit_type === ApiWaveCreditType.CardSetTdh ||
    !!wave.voting.credit_category ||
    !!wave.voting.creditor;
  const votingRowAlignmentClass = hasVotingDetails
    ? "tw-items-start"
    : "tw-items-center";

  return (
    <div
      className={`tw-relative tw-overflow-auto tw-bg-iron-950 ${ringClasses}`}
    >
      <div className="tw-pb-4">
        <div className="tw-flex tw-items-center tw-justify-between tw-px-4 tw-pt-6">
          <p className="tw-mb-0 tw-text-xs tw-font-semibold tw-uppercase tw-tracking-wider tw-text-iron-300">
            Overview
          </p>
        </div>

        <div className="tw-mt-2.5 tw-flex tw-flex-col tw-gap-y-0.5 tw-px-2">
          <div className="tw-group tw-flex tw-min-h-8 tw-w-full tw-items-center tw-justify-between tw-gap-1.5 tw-px-2 tw-py-1 tw-text-sm">
            <span className="tw-font-normal tw-text-iron-500">Type</span>
            <div className="tw-flex tw-items-center tw-gap-x-1">
              <WaveTypeIcon waveType={wave.wave.type} />
            </div>
          </div>

          {!isChatWave && (
            <>
              <div
                className={`tw-group tw-flex tw-min-h-8 tw-w-full ${votingRowAlignmentClass} tw-justify-between tw-gap-2 tw-px-2 tw-py-1 tw-text-sm`}
              >
                <span className="tw-font-normal tw-text-iron-500">Voting</span>
                <div className="tw-flex tw-flex-1 tw-justify-end">
                  <WaveRating wave={wave} />
                </div>
              </div>

              <div className="tw-group tw-flex tw-min-h-8 tw-w-full tw-items-center tw-justify-between tw-gap-1.5 tw-px-2 tw-py-1 tw-text-sm">
                <span className="tw-font-normal tw-text-iron-500">
                  Voting power
                </span>
                <span className="tw-self-end tw-font-medium tw-text-iron-50">
                  {creditScopeLabel}
                </span>
              </div>
            </>
          )}

          {isApproveWave && (
            <>
              <WaveApprovalThresholds wave={wave} />
              <WaveApproveTabLabels wave={wave} />
            </>
          )}

          <div className="tw-group tw-flex tw-min-h-8 tw-w-full tw-items-center tw-justify-between tw-gap-1.5 tw-px-2 tw-py-1 tw-text-sm">
            <span className="tw-font-normal tw-text-iron-500">Creator</span>
            <div className="tw-flex tw-items-center tw-gap-x-1">
              <WaveAuthor wave={wave} />
            </div>
          </div>

          <WaveIdentitySubmissionSpecsRows wave={wave} />
        </div>
      </div>
    </div>
  );
}
