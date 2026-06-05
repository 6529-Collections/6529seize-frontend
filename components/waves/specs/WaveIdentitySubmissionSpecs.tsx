import type { ApiWave } from "@/generated/models/ApiWave";
import {
  WAVE_IDENTITY_DUPLICATES_COPY,
  WAVE_IDENTITY_WHO_CAN_BE_SUBMITTED_COPY,
} from "@/helpers/waves/wave-submission-strategy.helpers";

interface WaveIdentitySubmissionSpecsProps {
  readonly wave: ApiWave;
  readonly useRing?: boolean | undefined;
}

function WaveIdentitySubmissionSpecsRow({
  label,
  value,
}: {
  readonly label: string;
  readonly value: string;
}) {
  return (
    <div className="tw-group tw-flex tw-w-full tw-items-start tw-justify-between tw-gap-2 tw-text-sm">
      <span className="tw-font-medium tw-text-iron-400">{label}</span>
      <span className="tw-flex-1 tw-text-right tw-font-medium tw-text-iron-200">
        {value}
      </span>
    </div>
  );
}

export function WaveIdentitySubmissionSpecsRows({
  wave,
}: {
  readonly wave: ApiWave;
}) {
  const submissionStrategy = wave.participation.submission_strategy;

  if (!submissionStrategy) {
    return null;
  }

  return (
    <>
      <WaveIdentitySubmissionSpecsRow
        label="Eligible identities"
        value={
          WAVE_IDENTITY_WHO_CAN_BE_SUBMITTED_COPY[
            submissionStrategy.config.who_can_be_submitted
          ].summary
        }
      />
      <WaveIdentitySubmissionSpecsRow
        label="Repeat submissions"
        value={
          WAVE_IDENTITY_DUPLICATES_COPY[
            submissionStrategy.config.duplicates
          ].summary
        }
      />
    </>
  );
}

export default function WaveIdentitySubmissionSpecs({
  wave,
  useRing = true,
}: WaveIdentitySubmissionSpecsProps) {
  const submissionStrategy = wave.participation.submission_strategy;

  if (!submissionStrategy) {
    return null;
  }

  const ringClasses = useRing
    ? "tw-ring-1 tw-ring-inset tw-ring-iron-800 tw-rounded-xl"
    : "";
  const borderClasses = useRing
    ? ""
    : "tw-border-x-0 tw-border-b-0 tw-border-t tw-border-solid tw-border-iron-800";

  return (
    <div className={borderClasses}>
      <div
        className={`tw-relative tw-overflow-auto tw-bg-iron-950 ${ringClasses}`}
      >
        <div className="tw-pb-4">
          <div className="tw-flex tw-items-center tw-justify-between tw-px-4 tw-pt-3">
            <p className="tw-mb-0 tw-text-base tw-font-semibold tw-tracking-tight tw-text-iron-200">
              Identity submissions
            </p>
          </div>

          <div className="tw-mt-2.5 tw-flex tw-flex-col tw-gap-2 tw-px-4">
            <WaveIdentitySubmissionSpecsRows wave={wave} />
          </div>
        </div>
      </div>
    </div>
  );
}
