"use client";

import type { SelectableIdentityOption } from "@/components/utils/input/profile-search/getSelectableIdentity";
import { ApiWaveParticipationIdentitySubmissionWhoCanBeSubmitted } from "@/generated/models/ApiWaveParticipationIdentitySubmissionWhoCanBeSubmitted";
import { ImageScale, getScaledImageUri } from "@/helpers/image.helpers";
import { XMarkIcon } from "@heroicons/react/24/outline";
import Image from "next/image";

interface CreateDropIdentityFieldProps {
  readonly mode: ApiWaveParticipationIdentitySubmissionWhoCanBeSubmitted;
  readonly selectedIdentity: SelectableIdentityOption | null;
  readonly selfIdentity: SelectableIdentityOption | null;
  readonly disabled: boolean;
  readonly errorMessage: string | null;
  readonly onOpenPicker: () => void;
  readonly onClosePanel?: (() => void) | undefined;
}

function IdentityAvatar({
  identity,
}: {
  readonly identity: SelectableIdentityOption;
}) {
  if (!identity.avatarUrl) {
    return (
      <div className="tw-flex tw-size-10 tw-flex-shrink-0 tw-items-center tw-justify-center tw-rounded-xl tw-border tw-border-solid tw-border-white/5 tw-bg-iron-800 tw-text-sm tw-font-semibold tw-uppercase tw-text-iron-100">
        {identity.label.slice(0, 1)}
      </div>
    );
  }

  return (
    <div className="tw-relative tw-size-10 tw-flex-shrink-0 tw-overflow-hidden tw-rounded-xl tw-bg-iron-800 tw-ring-1 tw-ring-inset tw-ring-white/10">
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

function IdentityUnavailable({
  errorMessage,
  disabled,
}: {
  readonly errorMessage: string | null;
  readonly disabled: boolean;
}) {
  return (
    <div
      className={`tw-rounded-xl tw-border tw-border-solid tw-bg-black/40 tw-px-4 tw-py-3 tw-shadow-inner ${
        errorMessage ? "tw-border-error/70" : "tw-border-white/5"
      } ${disabled ? "tw-opacity-60" : ""}`}
    >
      <p className="tw-mb-0 tw-text-sm tw-font-semibold tw-tracking-tight tw-text-iron-50">
        Identity unavailable
      </p>
      <p className="tw-mb-0 tw-mt-1 tw-text-xs tw-leading-5 tw-text-iron-400">
        {errorMessage ??
          "We couldn't determine your identity for this submission."}
      </p>
    </div>
  );
}

function IdentitySelectionCard({
  identity,
  disabled,
  clickable,
  onOpenPicker,
}: {
  readonly identity: SelectableIdentityOption;
  readonly disabled: boolean;
  readonly clickable: boolean;
  readonly onOpenPicker: () => void;
}) {
  const content = (
    <div className="tw-flex tw-min-w-0 tw-flex-1 tw-items-center tw-gap-3">
      <IdentityAvatar identity={identity} />
      <div className="tw-min-w-0 tw-flex-1">
        <p className="tw-mb-0 tw-truncate tw-text-sm tw-font-bold tw-leading-tight tw-text-iron-50">
          {identity.label}
        </p>
        <p className="tw-mb-0 tw-mt-1 tw-truncate tw-text-xs tw-font-medium tw-text-iron-500">
          {identity.secondaryLabel ?? "Selected identity for this drop."}
        </p>
      </div>
    </div>
  );

  let interactionClassName = "";
  if (disabled) {
    interactionClassName = "tw-cursor-not-allowed tw-opacity-60";
  } else if (clickable) {
    interactionClassName =
      "tw-cursor-pointer desktop-hover:hover:tw-border-white/10 desktop-hover:hover:tw-bg-iron-950/80";
  }

  const className = `tw-group tw-flex tw-w-full tw-items-center tw-justify-between tw-gap-4 tw-rounded-xl tw-border tw-border-solid tw-border-white/5 tw-bg-black/40 tw-p-3 tw-pr-4 tw-text-left tw-shadow-inner tw-transition-colors tw-duration-200 ${interactionClassName}`;

  if (!clickable) {
    return <div className={className}>{content}</div>;
  }

  return (
    <button
      type="button"
      onClick={onOpenPicker}
      disabled={disabled}
      className={className}
    >
      {content}
      <span className="desktop-hover:group-hover:tw-text-primary-200 tw-flex-shrink-0 tw-whitespace-nowrap tw-pl-4 tw-text-xs tw-font-semibold tw-text-primary-300 tw-transition-colors">
        Change identity
      </span>
    </button>
  );
}

export default function CreateDropIdentityField({
  mode,
  selectedIdentity,
  selfIdentity,
  disabled,
  errorMessage,
  onOpenPicker,
  onClosePanel,
}: CreateDropIdentityFieldProps) {
  const isOnlyMyself =
    mode === ApiWaveParticipationIdentitySubmissionWhoCanBeSubmitted.OnlyMyself;
  const identity = isOnlyMyself ? selfIdentity : selectedIdentity;
  const showInlineError =
    !!errorMessage && !(isOnlyMyself && selfIdentity === null);

  if (!isOnlyMyself && !selectedIdentity) {
    return null;
  }

  return (
    <div className="tw-mb-3">
      <div
        className={`tw-relative tw-w-full tw-rounded-2xl tw-border tw-border-solid tw-bg-iron-900/80 tw-p-4 tw-shadow-lg ${
          errorMessage ? "tw-border-error/70" : "tw-border-white/5"
        } ${disabled ? "tw-opacity-60" : ""}`}
      >
        {onClosePanel && (
          <button
            type="button"
            onClick={onClosePanel}
            disabled={disabled}
            className="tw-absolute tw-right-4 tw-top-4 tw-flex tw-h-7 tw-w-7 tw-items-center tw-justify-center tw-rounded-full tw-border-0 tw-bg-white/5 tw-p-0 tw-text-iron-400 tw-transition-colors disabled:tw-cursor-not-allowed desktop-hover:hover:tw-bg-white/10 desktop-hover:hover:tw-text-white"
            aria-label="Close identity selection"
            title="Close identity selection"
          >
            <XMarkIcon className="tw-h-4 tw-w-4" aria-hidden="true" />
          </button>
        )}

        <div
          className={`tw-flex tw-flex-col tw-gap-3 ${onClosePanel ? "tw-pr-10" : ""}`}
        >
          <h3 className="tw-mb-0 tw-text-sm tw-font-semibold tw-tracking-tight tw-text-iron-50">
            Identity to nominate
          </h3>

          {identity ? (
            <IdentitySelectionCard
              identity={identity}
              disabled={disabled}
              clickable={!isOnlyMyself}
              onOpenPicker={onOpenPicker}
            />
          ) : (
            <IdentityUnavailable
              errorMessage={errorMessage}
              disabled={disabled}
            />
          )}
        </div>
      </div>

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
