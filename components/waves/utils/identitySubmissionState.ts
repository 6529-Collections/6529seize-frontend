import { ApiWaveParticipationIdentitySubmissionWhoCanBeSubmitted } from "@/generated/models/ApiWaveParticipationIdentitySubmissionWhoCanBeSubmitted";

type ScopedValueState<T> = {
  readonly scopeKey: string;
  readonly value: T;
};

type ScopedIdentitySelectionState = ScopedValueState<string | null>;
type ScopedIdentityAttemptState = ScopedValueState<boolean>;

export const getIdentitySubmissionScopeKey = ({
  waveId,
  isIdentitySubmissionExperience,
  identitySubmissionMode,
}: {
  readonly waveId: string;
  readonly isIdentitySubmissionExperience: boolean;
  readonly identitySubmissionMode: ApiWaveParticipationIdentitySubmissionWhoCanBeSubmitted | null;
}) =>
  `${waveId}:${isIdentitySubmissionExperience ? "identity" : "default"}:${
    identitySubmissionMode ?? "none"
  }`;

export const getEffectiveSelectedIdentity = ({
  isIdentitySubmissionExperience,
  identitySubmissionMode,
  viewerSelectableIdentity,
  selectedIdentityState,
  scopeKey,
}: {
  readonly isIdentitySubmissionExperience: boolean;
  readonly identitySubmissionMode: ApiWaveParticipationIdentitySubmissionWhoCanBeSubmitted | null;
  readonly viewerSelectableIdentity: string | null;
  readonly selectedIdentityState: ScopedIdentitySelectionState | null;
  readonly scopeKey: string;
}): string | null => {
  if (!isIdentitySubmissionExperience) {
    return null;
  }

  if (
    identitySubmissionMode ===
    ApiWaveParticipationIdentitySubmissionWhoCanBeSubmitted.OnlyMyself
  ) {
    return viewerSelectableIdentity ?? null;
  }

  return selectedIdentityState?.scopeKey === scopeKey
    ? selectedIdentityState.value
    : null;
};

export const getEffectiveIdentitySubmitAttempt = ({
  attemptState,
  scopeKey,
}: {
  readonly attemptState: ScopedIdentityAttemptState | null;
  readonly scopeKey: string;
}): boolean =>
  attemptState?.scopeKey === scopeKey ? attemptState.value : false;
