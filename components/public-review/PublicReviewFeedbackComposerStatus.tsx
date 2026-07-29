"use client";

import type { SupportedLocale } from "@/i18n/locales";
import { t } from "@/i18n/messages";

export type PublicReviewReferenceIntegrityStatus =
  | "pending"
  | "ready"
  | "unavailable";

function getConnectButtonLabel({
  connected,
  connecting,
  locale,
}: {
  readonly connected: boolean;
  readonly connecting: boolean;
  readonly locale: SupportedLocale;
}): string {
  if (connecting) {
    return t(locale, "publicReview.feedback.connecting");
  }
  return t(
    locale,
    connected
      ? "publicReview.feedback.reconnect"
      : "publicReview.feedback.connect"
  );
}

function ReviewFeedbackConnectionStatus({
  connecting,
  locale,
}: {
  readonly connecting: boolean;
  readonly locale: SupportedLocale;
}) {
  return (
    <output className="tw-sr-only" aria-live="polite" aria-atomic="true">
      {connecting ? t(locale, "publicReview.feedback.connecting") : ""}
    </output>
  );
}

export function ReferenceIntegrityNotice({
  id,
  locale,
  message,
  status,
}: {
  readonly id: string;
  readonly locale: SupportedLocale;
  readonly message: string | undefined;
  readonly status: PublicReviewReferenceIntegrityStatus;
}) {
  if (status === "ready") {
    return null;
  }
  const statusClasses =
    status === "unavailable"
      ? "tw-border-red-500/40 tw-bg-red-950/30 tw-text-red-100"
      : "tw-border-sky-400/30 tw-bg-sky-400/5 tw-text-sky-100";
  return (
    <output
      id={id}
      aria-atomic="true"
      aria-live="polite"
      className={`tw-mb-0 tw-mt-4 tw-block tw-rounded-lg tw-border tw-border-solid tw-p-3 tw-text-sm tw-leading-6 ${statusClasses}`}
    >
      {message ?? t(locale, "publicReview.feedback.hashUnavailable")}
    </output>
  );
}

export function FeedbackConnectPrompt({
  busy,
  connected,
  connecting,
  handleConnect,
  locale,
  visible,
}: {
  readonly busy: boolean;
  readonly connected: boolean;
  readonly connecting: boolean;
  readonly handleConnect: () => Promise<void>;
  readonly locale: SupportedLocale;
  readonly visible: boolean;
}) {
  if (!visible) {
    return null;
  }
  return (
    <>
      <button
        type="button"
        aria-busy={connecting}
        data-public-review-feedback-primary
        disabled={busy}
        onClick={() => void handleConnect()}
        className="tw-inline-flex tw-min-h-11 tw-w-full tw-items-center tw-justify-center tw-rounded-lg tw-border-0 tw-bg-primary-600 tw-px-4 tw-py-2 tw-text-sm tw-font-semibold tw-text-white tw-transition hover:tw-ring-2 hover:tw-ring-inset hover:tw-ring-primary-300/60 focus:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-300 disabled:tw-cursor-wait disabled:tw-opacity-60"
      >
        {getConnectButtonLabel({ connected, connecting, locale })}
      </button>
      <ReviewFeedbackConnectionStatus connecting={connecting} locale={locale} />
    </>
  );
}

export function FeedbackPreview({
  formId,
  locale,
  preview,
}: {
  readonly formId: string;
  readonly locale: SupportedLocale;
  readonly preview: string | null;
}) {
  if (preview === null) {
    return null;
  }
  return (
    <section
      aria-labelledby={`${formId}-preview`}
      aria-atomic="true"
      aria-live="polite"
      role="status"
      className="tw-rounded-lg tw-border tw-border-solid tw-border-iron-700 tw-bg-iron-950 tw-p-4"
    >
      <h3
        id={`${formId}-preview`}
        className="tw-m-0 tw-text-base tw-font-semibold tw-text-iron-100"
      >
        {t(locale, "publicReview.feedback.previewHeading")}
      </h3>
      <div className="tw-mb-0 tw-mt-3 tw-whitespace-pre-wrap tw-break-words tw-font-sans tw-text-sm tw-leading-6 tw-text-iron-300">
        {preview}
      </div>
    </section>
  );
}

export function FeedbackResultMessages({
  feedbackGate,
  formError,
}: {
  readonly feedbackGate: string | null;
  readonly formError: string | null;
}) {
  return (
    <>
      {feedbackGate ? (
        <output
          className="tw-mb-0 tw-mt-4 tw-block tw-rounded-lg tw-bg-iron-950 tw-p-3 tw-text-sm tw-text-iron-300"
          aria-live="polite"
          aria-atomic="true"
        >
          {feedbackGate}
        </output>
      ) : null}
      {formError ? (
        <p
          className="tw-border-red-500/40 tw-bg-red-950/30 tw-text-red-200 tw-mb-0 tw-mt-4 tw-rounded-lg tw-border tw-border-solid tw-p-3 tw-text-sm"
          role="alert"
        >
          {formError}
        </p>
      ) : null}
    </>
  );
}
