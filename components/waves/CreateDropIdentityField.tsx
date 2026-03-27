"use client";

import type { SelectableIdentityOption } from "@/components/utils/input/profile-search/getSelectableIdentity";
import { ApiWaveParticipationIdentitySubmissionWhoCanBeSubmitted } from "@/generated/models/ApiWaveParticipationIdentitySubmissionWhoCanBeSubmitted";
import { ImageScale, getScaledImageUri } from "@/helpers/image.helpers";
import Image from "next/image";

interface CreateDropIdentityFieldProps {
  readonly mode: ApiWaveParticipationIdentitySubmissionWhoCanBeSubmitted;
  readonly selectedIdentity: SelectableIdentityOption | null;
  readonly selfIdentity: SelectableIdentityOption | null;
  readonly disabled: boolean;
  readonly errorMessage: string | null;
  readonly onOpenPicker: () => void;
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

function IdentityAvatar({
  identity,
}: {
  readonly identity: SelectableIdentityOption;
}) {
  if (!identity.avatarUrl) {
    return (
      <div className="tw-flex tw-size-10 tw-flex-shrink-0 tw-items-center tw-justify-center tw-rounded-lg tw-bg-iron-800 tw-text-sm tw-font-semibold tw-uppercase tw-text-iron-100">
        {identity.label.slice(0, 1)}
      </div>
    );
  }

  return (
    <div className="tw-relative tw-size-10 tw-flex-shrink-0 tw-overflow-hidden tw-rounded-lg tw-bg-iron-800 tw-ring-1 tw-ring-inset tw-ring-white/10">
      {/* Profile avatars can come from arbitrary remote hosts, so this stays unoptimized. */}
      <Image
        src={getScaledImageUri(identity.avatarUrl, ImageScale.W_AUTO_H_50)}
        alt={`${identity.label} avatar`}
        fill
        unoptimized
        className="tw-object-cover"
        sizes="40px"
      />
    </div>
  );
}

function IdentitySummary({
  identity,
  description,
  disabled,
  errorMessage,
  allowChange = true,
  onOpenPicker,
}: {
  readonly identity: SelectableIdentityOption | null;
  readonly description: string;
  readonly disabled: boolean;
  readonly errorMessage: string | null;
  readonly allowChange?: boolean | undefined;
  readonly onOpenPicker: () => void;
}) {
  if (!identity) {
    if (!allowChange) {
      return (
        <div
          className={`tw-rounded-lg tw-bg-iron-900 tw-px-4 tw-py-3 tw-ring-1 tw-ring-inset ${
            errorMessage ? "tw-ring-error" : "tw-ring-iron-700"
          } ${disabled ? "tw-opacity-60" : ""}`}
        >
          <p className="tw-mb-0 tw-text-sm tw-font-semibold tw-text-iron-50">
            Identity unavailable
          </p>
          <p className="tw-mb-0 tw-mt-1 tw-text-xs tw-font-medium tw-text-iron-400">
            {errorMessage ??
              "We couldn't determine your identity for this submission."}
          </p>
        </div>
      );
    }

    return (
      <button
        type="button"
        onClick={onOpenPicker}
        disabled={disabled}
        className={`tw-flex tw-w-full tw-items-center tw-justify-between tw-gap-3 tw-rounded-lg tw-border-0 tw-bg-iron-900 tw-px-4 tw-py-3 tw-text-left tw-ring-1 tw-ring-inset tw-transition ${
          errorMessage ? "tw-ring-error" : "tw-ring-iron-700"
        } ${
          disabled
            ? "tw-cursor-not-allowed tw-opacity-60"
            : "desktop-hover:hover:tw-ring-iron-600"
        }`}
      >
        <div>
          <p className="tw-mb-0 tw-text-sm tw-font-semibold tw-text-iron-50">
            Select identity
          </p>
          <p className="tw-mb-0 tw-mt-1 tw-text-xs tw-font-medium tw-text-iron-400">
            Choose an identity before continuing in Drop mode.
          </p>
        </div>
        <span className="tw-text-xs tw-font-semibold tw-text-primary-300">
          Open
        </span>
      </button>
    );
  }

  return (
    <div
      className={`tw-flex tw-items-center tw-justify-between tw-gap-3 tw-rounded-lg tw-bg-iron-900 tw-px-4 tw-py-3 tw-ring-1 tw-ring-inset ${
        errorMessage ? "tw-ring-error" : "tw-ring-iron-700"
      } ${disabled ? "tw-opacity-60" : ""}`}
    >
      <div className="tw-flex tw-min-w-0 tw-items-center tw-gap-3">
        <IdentityAvatar identity={identity} />
        <div className="tw-min-w-0">
          <p className="tw-mb-0 tw-truncate tw-text-sm tw-font-semibold tw-text-iron-50">
            {identity.label}
          </p>
          <p className="tw-mb-0 tw-mt-1 tw-truncate tw-text-xs tw-font-medium tw-text-iron-400">
            {identity.secondaryLabel ?? description}
          </p>
        </div>
      </div>
      {allowChange && (
        <button
          type="button"
          onClick={onOpenPicker}
          disabled={disabled}
          className="tw-flex-shrink-0 tw-rounded-md tw-border-0 tw-bg-iron-800 tw-px-3 tw-py-2 tw-text-xs tw-font-semibold tw-text-primary-300 tw-transition disabled:tw-cursor-not-allowed desktop-hover:hover:tw-bg-iron-700"
        >
          Change identity
        </button>
      )}
    </div>
  );
}

export default function CreateDropIdentityField({
  mode,
  selectedIdentity,
  selfIdentity,
  disabled,
  errorMessage,
  onOpenPicker,
}: CreateDropIdentityFieldProps) {
  const helperText = getHelperText(mode);
  const isOnlyMyself =
    mode === ApiWaveParticipationIdentitySubmissionWhoCanBeSubmitted.OnlyMyself;
  const showInlineError =
    !!errorMessage && !(isOnlyMyself && selfIdentity === null);

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

      {isOnlyMyself ? (
        <IdentitySummary
          identity={selfIdentity}
          description="Only your identity can be nominated in this wave."
          disabled={disabled}
          errorMessage={errorMessage}
          allowChange={false}
          onOpenPicker={onOpenPicker}
        />
      ) : (
        <IdentitySummary
          identity={selectedIdentity}
          description="Selected identity for this drop."
          disabled={disabled}
          errorMessage={errorMessage}
          onOpenPicker={onOpenPicker}
        />
      )}

      {showInlineError && (
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
