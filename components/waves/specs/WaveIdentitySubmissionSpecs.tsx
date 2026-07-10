import type { ApiWave } from "@/generated/models/ApiWave";
import { ApiWaveParticipationSubmissionStrategyType } from "@/generated/models/ApiWaveParticipationSubmissionStrategyType";
import {
  WAVE_IDENTITY_DUPLICATES_COPY,
  WAVE_IDENTITY_WHO_CAN_BE_SUBMITTED_COPY,
} from "@/helpers/waves/wave-submission-strategy.helpers";

function WaveIdentitySubmissionSpecsRow({
  label,
  value,
}: {
  readonly label: string;
  readonly value: string;
}) {
  return (
    <div className="tw-group tw-grid tw-min-h-9 tw-w-full tw-grid-cols-[minmax(5.5rem,0.7fr)_minmax(0,1.3fr)] tw-items-start tw-gap-2 tw-px-2 tw-py-1.5 tw-text-sm">
      <span className="tw-min-w-0 tw-font-normal tw-leading-5 tw-text-iron-500">
        {label}
      </span>
      <span className="tw-min-w-0 tw-break-words tw-text-right tw-font-medium tw-leading-5 tw-text-iron-50">
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

  if (
    submissionStrategy.type !==
    ApiWaveParticipationSubmissionStrategyType.Identity
  ) {
    return null;
  }

  const eligibleIdentities =
    WAVE_IDENTITY_WHO_CAN_BE_SUBMITTED_COPY[
      submissionStrategy.config.who_can_be_submitted
    ];
  const repeatSubmissions =
    WAVE_IDENTITY_DUPLICATES_COPY[submissionStrategy.config.duplicates];

  if (!eligibleIdentities || !repeatSubmissions) {
    return null;
  }

  return (
    <>
      <WaveIdentitySubmissionSpecsRow
        label="Eligible identities"
        value={eligibleIdentities.summary}
      />
      <WaveIdentitySubmissionSpecsRow
        label="Repeat submissions"
        value={repeatSubmissions.summary}
      />
    </>
  );
}
