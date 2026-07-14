import Link from "next/link";
import type { ApiWave } from "@/generated/models/ApiWave";
import { ApiWaveCreditType } from "@/generated/models/ApiWaveCreditType";
import { ApiWaveCreditScope } from "@/generated/models/ApiWaveCreditScope";
import { ApiWaveType } from "@/generated/models/ApiWaveType";
import WaveAuthor from "./WaveAuthor";
import WaveTypeIcon from "./WaveTypeIcon";
import WaveRating from "./WaveRating";
import { WaveIdentitySubmissionSpecsRows } from "./WaveIdentitySubmissionSpecs";
import { getWavePathRoute } from "@/helpers/navigation.helpers";
import { getParentWaveName } from "@/helpers/waves/waves.helpers";
import { waveRightPanelText } from "@/helpers/waves/wave-right-panel.helpers";

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
  const creditScopeLabel = CREDIT_SCOPE_LABELS[wave.voting.credit_scope];
  const hasVotingDetails =
    wave.voting.credit_type === ApiWaveCreditType.CardSetTdh ||
    !!wave.voting.credit_category ||
    !!wave.voting.creditor;
  const votingRowAlignmentClass = hasVotingDetails
    ? "tw-items-start"
    : "tw-items-center";
  const parentWave = wave.parent_wave;
  const parentWaveName = getParentWaveName(parentWave);

  return (
    <div
      className={`tw-relative tw-min-w-0 tw-overflow-hidden tw-bg-iron-950 ${ringClasses}`}
    >
      <div className="tw-pb-4">
        <div className="tw-flex tw-items-center tw-justify-between tw-px-4 tw-pt-6">
          <h2 className="tw-mb-0 !tw-text-[0.6875rem] !tw-font-semibold tw-uppercase !tw-leading-4 tw-tracking-[0.1em] !tw-text-iron-400">
            {waveRightPanelText("waves.sidebar.rightPanel.specs.overview")}
          </h2>
        </div>

        <div className="tw-mt-2.5 tw-flex tw-flex-col tw-gap-y-0.5 tw-px-2">
          <div className="tw-group tw-grid tw-min-h-9 tw-w-full tw-grid-cols-[minmax(5.5rem,0.7fr)_minmax(0,1.3fr)] tw-items-center tw-gap-2 tw-px-2 tw-py-1.5 tw-text-sm">
            <span className="tw-min-w-0 tw-font-normal tw-leading-5 tw-text-iron-500">
              {waveRightPanelText("waves.sidebar.rightPanel.specs.type")}
            </span>
            <div className="tw-flex tw-min-w-0 tw-items-center tw-justify-end tw-gap-x-1 tw-text-right">
              <WaveTypeIcon waveType={wave.wave.type} />
            </div>
          </div>

          {parentWave && parentWaveName && (
            <div className="tw-group tw-grid tw-min-h-9 tw-w-full tw-grid-cols-[minmax(5.5rem,0.7fr)_minmax(0,1.3fr)] tw-items-center tw-gap-2 tw-px-2 tw-py-1.5 tw-text-sm">
              <span className="tw-min-w-0 tw-font-normal tw-leading-5 tw-text-iron-500">
                {waveRightPanelText(
                  "waves.sidebar.rightPanel.specs.parentWave"
                )}
              </span>
              <Link
                href={getWavePathRoute(parentWave.id)}
                title={parentWaveName}
                className="tw-block tw-min-w-0 tw-truncate tw-text-right tw-font-medium tw-leading-5 tw-text-iron-50 tw-no-underline tw-transition tw-duration-200 tw-ease-out hover:tw-text-iron-300 focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400 focus-visible:tw-ring-offset-2 focus-visible:tw-ring-offset-iron-950"
              >
                {parentWaveName}
              </Link>
            </div>
          )}

          {!isChatWave && (
            <>
              <div
                className={`tw-group tw-grid tw-min-h-9 tw-w-full tw-grid-cols-[minmax(5.5rem,0.7fr)_minmax(0,1.3fr)] ${votingRowAlignmentClass} tw-gap-2 tw-px-2 tw-py-1.5 tw-text-sm`}
              >
                <span className="tw-min-w-0 tw-font-normal tw-leading-5 tw-text-iron-500">
                  {waveRightPanelText("waves.sidebar.rightPanel.specs.voting")}
                </span>
                <div className="tw-flex tw-min-w-0 tw-justify-end tw-text-right">
                  <WaveRating wave={wave} />
                </div>
              </div>

              <div className="tw-group tw-grid tw-min-h-9 tw-w-full tw-grid-cols-[minmax(5.5rem,0.7fr)_minmax(0,1.3fr)] tw-items-center tw-gap-2 tw-px-2 tw-py-1.5 tw-text-sm">
                <span className="tw-min-w-0 tw-font-normal tw-leading-5 tw-text-iron-500">
                  {waveRightPanelText(
                    "waves.sidebar.rightPanel.specs.votingPower"
                  )}
                </span>
                <span className="tw-min-w-0 tw-break-words tw-text-right tw-font-medium tw-leading-5 tw-text-iron-50">
                  {creditScopeLabel}
                </span>
              </div>
            </>
          )}

          <div className="tw-group tw-grid tw-min-h-9 tw-w-full tw-grid-cols-[minmax(5.5rem,0.7fr)_minmax(0,1.3fr)] tw-items-center tw-gap-2 tw-px-2 tw-py-1.5 tw-text-sm">
            <span className="tw-min-w-0 tw-font-normal tw-leading-5 tw-text-iron-500">
              {waveRightPanelText("waves.sidebar.rightPanel.specs.creator")}
            </span>
            <div className="tw-flex tw-min-w-0 tw-items-center tw-justify-end tw-gap-x-1 tw-text-right">
              <WaveAuthor wave={wave} />
            </div>
          </div>

          <WaveIdentitySubmissionSpecsRows wave={wave} />
        </div>
      </div>
    </div>
  );
}
