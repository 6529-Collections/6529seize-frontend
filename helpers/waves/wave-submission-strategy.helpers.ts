import { ApiWaveParticipationIdentitySubmissionAllowDuplicates } from "@/generated/models/ApiWaveParticipationIdentitySubmissionAllowDuplicates";
import { ApiWaveParticipationIdentitySubmissionWhoCanBeSubmitted } from "@/generated/models/ApiWaveParticipationIdentitySubmissionWhoCanBeSubmitted";

type WaveIdentitySubmissionOptionCopy = {
  readonly label: string;
  readonly summary: string;
  readonly description: string;
};

export const WAVE_IDENTITY_WHO_CAN_BE_SUBMITTED_COPY: Record<
  ApiWaveParticipationIdentitySubmissionWhoCanBeSubmitted,
  WaveIdentitySubmissionOptionCopy
> = {
  [ApiWaveParticipationIdentitySubmissionWhoCanBeSubmitted.OnlyMyself]: {
    label: "Own identity only",
    summary: "Own only",
    description: "A participant can submit only themselves.",
  },
  [ApiWaveParticipationIdentitySubmissionWhoCanBeSubmitted.OnlyOthers]: {
    label: "Other identities only",
    summary: "Others only",
    description: "A participant can submit someone else, but not themselves.",
  },
  [ApiWaveParticipationIdentitySubmissionWhoCanBeSubmitted.Everyone]: {
    label: "Own or other identities",
    summary: "Own or others",
    description: "A participant can submit themselves or someone else.",
  },
};

export const WAVE_IDENTITY_DUPLICATES_COPY: Record<
  ApiWaveParticipationIdentitySubmissionAllowDuplicates,
  WaveIdentitySubmissionOptionCopy
> = {
  [ApiWaveParticipationIdentitySubmissionAllowDuplicates.NeverAllow]: {
    label: "Never again",
    summary: "Never again",
    description:
      "The same identity can be submitted only once, even after a win.",
  },
  [ApiWaveParticipationIdentitySubmissionAllowDuplicates.AllowAfterWin]: {
    label: "After it wins",
    summary: "After it wins",
    description:
      "The same identity can have only one active submission; it can be submitted again after that submission wins.",
  },
  [ApiWaveParticipationIdentitySubmissionAllowDuplicates.AlwaysAllow]: {
    label: "At any time",
    summary: "At any time",
    description:
      "The same identity can be submitted repeatedly, even if another submission is already active.",
  },
};
