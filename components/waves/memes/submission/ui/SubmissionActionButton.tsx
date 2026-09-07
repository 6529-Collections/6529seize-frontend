"use client";

import PrimaryButton from "@/components/utils/button/PrimaryButton";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { formatInteger } from "@/i18n/format";
import { t } from "@/i18n/messages";
import type { MemesSubmissionIdentity } from "../hooks/useMemesSubmissionIdentity";
import type { SubmissionPhase } from "./SubmissionProgress";

interface SubmissionActionButtonProps {
  readonly identity: MemesSubmissionIdentity;
  readonly isFormValid: boolean;
  readonly isSubmitting: boolean;
  readonly submissionPhase: SubmissionPhase;
  readonly uploadProgress: number;
  readonly submitLabel: string;
  readonly onSubmit: () => void;
  readonly className?: string | undefined;
}

export function SubmissionActionButton({
  identity,
  isFormValid,
  isSubmitting,
  submissionPhase,
  uploadProgress,
  submitLabel,
  onSubmit,
  className,
}: SubmissionActionButtonProps) {
  const locale = useBrowserLocale();

  let label = submitLabel;
  let onClicked = onSubmit;
  let loading = false;
  let disabled = false;

  if (isSubmitting) {
    loading = true;
    switch (submissionPhase) {
      case "uploading":
        label = t(locale, "memes.submission.action.uploading", {
          progress: formatInteger(locale, Math.round(uploadProgress)),
        });
        break;
      case "signing":
        label = t(locale, "memes.submission.action.signing");
        break;
      case "success":
        label = t(locale, "memes.submission.action.submitted");
        break;
      case "idle":
      case "processing":
      case "error":
        label = t(locale, "memes.submission.action.submitting");
        break;
    }
  } else if (submissionPhase === "success") {
    label = t(locale, "memes.submission.action.submitted");
    disabled = true;
  } else {
    switch (identity.status) {
      case "disconnected":
        label = t(locale, "memes.submission.action.connectWallet");
        onClicked = () => void identity.connectWallet();
        break;
      case "connecting":
        label = t(locale, "memes.submission.action.connecting");
        loading = true;
        disabled = true;
        break;
      case "loading-profile":
        label = t(locale, "memes.submission.action.loadingProfile");
        loading = true;
        disabled = true;
        break;
      case "needs-auth":
        label = t(locale, "memes.submission.action.verifyProfile");
        onClicked = () => void identity.verifyProfile();
        break;
      case "verifying-profile":
        label = t(locale, "memes.submission.action.verifyingProfile");
        loading = true;
        disabled = true;
        break;
      case "checking-eligibility":
        label = t(locale, "memes.submission.action.checkingEligibility");
        loading = true;
        disabled = true;
        break;
      case "eligibility-error":
        label = t(locale, "memes.submission.action.retryEligibility");
        onClicked = () => void identity.retryEligibility();
        break;
      case "needs-profile":
      case "ineligible":
      case "limit-reached":
        label = t(locale, "memes.submission.action.switchWallet");
        onClicked = () => void identity.connectWallet();
        break;
      case "not-started":
        label = t(locale, "memes.submission.action.submissionsNotOpen");
        disabled = true;
        break;
      case "ended":
        label = t(locale, "memes.submission.action.submissionsClosed");
        disabled = true;
        break;
      case "eligible":
        disabled = !isFormValid;
        break;
    }
  }

  const announcedStatus = loading || submissionPhase === "success" ? label : "";

  return (
    <>
      <PrimaryButton
        onClicked={onClicked}
        disabled={disabled}
        loading={loading}
        className={className}
        ariaLabel={label}
      >
        {label}
      </PrimaryButton>
      <span
        className="tw-sr-only"
        role="status"
        aria-live="polite"
        aria-atomic="true"
      >
        {announcedStatus}
      </span>
    </>
  );
}
