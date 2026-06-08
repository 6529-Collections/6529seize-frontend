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
    <div className="tw-group tw-flex tw-min-h-8 tw-w-full tw-items-start tw-justify-between tw-gap-2 tw-px-2 tw-py-1 tw-text-sm">
      <span className="tw-font-normal tw-text-iron-500">{label}</span>
      <span className="tw-flex-1 tw-text-right tw-font-medium tw-text-iron-50">
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
