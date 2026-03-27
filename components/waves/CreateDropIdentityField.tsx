"use client";

import IdentitySearch, {
  IdentitySearchSize,
} from "@/components/utils/input/identity/IdentitySearch";
import { ApiWaveParticipationIdentitySubmissionWhoCanBeSubmitted } from "@/generated/models/ApiWaveParticipationIdentitySubmissionWhoCanBeSubmitted";

interface CreateDropIdentityFieldProps {
  readonly mode: ApiWaveParticipationIdentitySubmissionWhoCanBeSubmitted;
  readonly selectedIdentity: string | null;
  readonly selfIdentityDisplay: string | null;
  readonly disabled: boolean;
  readonly errorMessage: string | null;
  readonly onChange: (identity: string | null) => void;
}

const getHelperText = (
  mode: ApiWaveParticipationIdentitySubmissionWhoCanBeSubmitted
) => {
  switch (mode) {
    case ApiWaveParticipationIdentitySubmissionWhoCanBeSubmitted.OnlyMyself:
      return "Your identity will be used automatically for this submission.";
    case ApiWaveParticipationIdentitySubmissionWhoCanBeSubmitted.OnlyOthers:
      return "Select someone else to nominate.";
    case ApiWaveParticipationIdentitySubmissionWhoCanBeSubmitted.Everyone:
      return "Select the identity to nominate.";
  }
};

export default function CreateDropIdentityField({
  mode,
  selectedIdentity,
  selfIdentityDisplay,
  disabled,
  errorMessage,
  onChange,
}: CreateDropIdentityFieldProps) {
  const helperText = getHelperText(mode);

  return (
    <div className="tw-mb-3">
      <div className="tw-mb-2">
        <p className="tw-mb-0 tw-text-sm tw-font-semibold tw-text-iron-100">
          Identity to nominate
        </p>
        <p className="tw-mb-0 tw-mt-1 tw-text-xs tw-font-medium tw-text-iron-400">
          {helperText}
        </p>
      </div>

      {mode ===
      ApiWaveParticipationIdentitySubmissionWhoCanBeSubmitted.OnlyMyself ? (
        <div
          className={`tw-rounded-lg tw-bg-iron-900 tw-px-4 tw-py-3 tw-ring-1 tw-ring-inset ${
            errorMessage ? "tw-ring-error" : "tw-ring-iron-700"
          } ${disabled ? "tw-opacity-60" : ""}`}
        >
          <p className="tw-mb-0 tw-text-sm tw-font-medium tw-text-iron-100">
            {selfIdentityDisplay ?? "Identity unavailable"}
          </p>
          <p className="tw-mb-0 tw-mt-1 tw-text-xs tw-font-medium tw-text-iron-400">
            Only your identity can be nominated in this wave.
          </p>
        </div>
      ) : (
        <div className={disabled ? "tw-pointer-events-none tw-opacity-60" : ""}>
          <IdentitySearch
            identity={selectedIdentity}
            setIdentity={onChange}
            label="Identity"
            size={IdentitySearchSize.MD}
            error={!!errorMessage}
            errorMessage={errorMessage}
          />
        </div>
      )}

      {mode ===
        ApiWaveParticipationIdentitySubmissionWhoCanBeSubmitted.OnlyMyself &&
        errorMessage && (
          <p
            role="alert"
            className="tw-mb-0 tw-mt-2 tw-text-xs tw-font-medium tw-text-error"
          >
            {errorMessage}
          </p>
        )}
    </div>
  );
}
