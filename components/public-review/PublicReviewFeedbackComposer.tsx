"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useId, useRef, useState } from "react";
import { v4 as uuidv4 } from "uuid";

import { useAuth } from "@/components/auth/Auth";
import { useSeizeConnectContext } from "@/components/auth/SeizeConnectContext";
import { QueryKey } from "@/components/react-query-wrapper/query-keys";
import { ApiWaveType } from "@/generated/models/ApiWaveType";
import { getWaveRoute } from "@/helpers/navigation.helpers";
import type { SupportedLocale } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import { fetchWaveById } from "@/services/api/waves-v2-api";
import {
  encodePublicReviewFeedback,
  PublicReviewFeedbackValidationError,
} from "@/services/api/public-review/feedback-codec";
import { submitPublicReviewFeedback } from "@/services/api/public-review/feedback-api";
import { getPublicReviewLedgerQueryKey } from "@/services/api/public-review/ledger";
import type {
  PublicReviewDiscussionDestination,
  PublicReviewFeedbackConfig,
  PublicReviewFeedbackDraft,
  PublicReviewFeedbackSubmitter,
  PublicReviewPageContext,
  PublicReviewReferenceSelection,
} from "@/services/api/public-review/types";

interface PublicReviewFeedbackComposerProps {
  readonly locale: SupportedLocale;
  readonly config: PublicReviewFeedbackConfig;
  readonly destination: PublicReviewDiscussionDestination;
  readonly page: PublicReviewPageContext;
  readonly referenceSelection?: PublicReviewReferenceSelection | undefined;
  readonly submitter?: PublicReviewFeedbackSubmitter | undefined;
}

const EMPTY_TECHNICAL_FIELDS = {
  whyItMatters: "",
  suggestedChange: "",
  preconditions: "",
  expectedBehavior: "",
  observedBehavior: "",
  reproduction: "",
} as const;

function createEmptyDraft(
  config: PublicReviewFeedbackConfig
): PublicReviewFeedbackDraft {
  return {
    category: config.categories[0]?.value ?? "",
    severity: config.severityOptions[0]?.value ?? "",
    comment: "",
    ...EMPTY_TECHNICAL_FIELDS,
  };
}

function createSubmissionId(): string {
  return uuidv4();
}

const INPUT_CLASSES =
  "tw-min-h-11 tw-w-full tw-rounded-lg tw-border tw-border-solid tw-border-iron-700 tw-bg-iron-950 tw-px-3 tw-py-2 tw-text-base tw-text-iron-50 tw-outline-none focus:tw-border-primary-400 focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400/40";

function getFeedbackGate({
  authenticated,
  config,
  isError,
  isPending,
  locale,
  waveCanAcceptFeedback,
}: {
  readonly authenticated: boolean;
  readonly config: PublicReviewFeedbackConfig;
  readonly isError: boolean;
  readonly isPending: boolean;
  readonly locale: SupportedLocale;
  readonly waveCanAcceptFeedback: boolean;
}): string | null {
  if (!config.submissionsOpen) {
    return t(locale, "publicReview.feedback.closed");
  }
  if (!authenticated) {
    return null;
  }
  if (isPending) {
    return t(locale, "publicReview.feedback.checking");
  }
  if (isError) {
    return t(locale, "publicReview.feedback.unavailable");
  }
  return waveCanAcceptFeedback
    ? null
    : t(locale, "publicReview.feedback.ineligible");
}

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

function ReviewFeedbackContext({
  locale,
  page,
  referenceSelection,
}: {
  readonly locale: SupportedLocale;
  readonly page: PublicReviewPageContext;
  readonly referenceSelection: PublicReviewReferenceSelection | undefined;
}) {
  return (
    <div className="tw-mt-4 tw-rounded-lg tw-bg-iron-950/70 tw-p-3 tw-text-sm tw-text-iron-300">
      <p className="tw-m-0">
        {t(locale, "publicReview.feedback.pageContext", {
          page: page.pageTitle,
        })}
      </p>
      {page.sectionTitle ? (
        <p className="tw-mb-0 tw-mt-1">
          {t(locale, "publicReview.feedback.sectionContext", {
            section: page.sectionTitle,
          })}
        </p>
      ) : null}
      {referenceSelection?.kind === "code" ? (
        <p className="tw-mb-0 tw-mt-1 tw-break-all">
          {t(locale, "publicReview.feedback.sourceContext", {
            path: referenceSelection.path,
            lineStart: referenceSelection.lineStart,
            lineEnd: referenceSelection.lineEnd,
          })}
        </p>
      ) : null}
    </div>
  );
}

function useFeedbackComposerState({
  config,
  destination,
  locale,
  page,
  referenceSelection,
  submitter,
}: PublicReviewFeedbackComposerProps & {
  readonly submitter: PublicReviewFeedbackSubmitter;
}) {
  const queryClient = useQueryClient();
  const { connectedProfile, requestAuth } = useAuth();
  const {
    address,
    hasValidWalletAuth,
    isSafeWallet,
    seizeConnectFresh,
    seizeConnectOpen,
  } = useSeizeConnectContext();
  const [draft, setDraft] = useState<PublicReviewFeedbackDraft>(() =>
    createEmptyDraft(config)
  );
  const [submissionId, setSubmissionId] = useState(createSubmissionId);
  const [preview, setPreview] = useState<string | null>(null);
  const [commentError, setCommentError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [successPath, setSuccessPath] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const authenticated = Boolean(
    connectedProfile && hasValidWalletAuth && address
  );
  const waveQuery = useQuery({
    queryKey: [QueryKey.WAVE, { wave_id: destination.waveId }],
    queryFn: () => fetchWaveById({ waveId: destination.waveId }),
    enabled: authenticated && config.submissionsOpen,
    staleTime: 60_000,
  });
  const waveCanAcceptFeedback =
    waveQuery.data?.wave.type === ApiWaveType.Chat &&
    waveQuery.data.chat.enabled &&
    waveQuery.data.chat.authenticated_user_eligible;

  const updateDraft = (
    field: keyof PublicReviewFeedbackDraft,
    value: string
  ): void => {
    setDraft((current) => ({ ...current, [field]: value }));
    setPreview(null);
    setFormError(null);
    if (field === "comment" && value.trim()) {
      setCommentError(null);
    }
  };

  const createPayload = () => {
    if (!draft.comment.trim()) {
      const message = t(locale, "publicReview.feedback.commentRequired");
      setCommentError(message);
      throw new PublicReviewFeedbackValidationError([message]);
    }
    return encodePublicReviewFeedback({
      config,
      destination,
      draft,
      page,
      referenceSelection,
      signer: { address: address ?? "", isSafeWallet },
      submissionId,
    });
  };

  const handlePreview = (): void => {
    setFormError(null);
    try {
      setPreview(createPayload().parts[0]?.content ?? "");
    } catch {
      setFormError(t(locale, "publicReview.feedback.validationError"));
    }
  };

  const handleConnect = async (): Promise<void> => {
    setIsConnecting(true);
    setFormError(null);
    try {
      if (!connectedProfile) {
        await seizeConnectFresh();
        return;
      }
      const result = await requestAuth();
      if (!result.success) {
        throw new Error("Authentication was not completed.");
      }
    } catch {
      setFormError(t(locale, "publicReview.feedback.connectError"));
    } finally {
      setIsConnecting(false);
    }
  };

  const handleSubmit = async (): Promise<boolean> => {
    if (isSubmitting || !authenticated || !waveCanAcceptFeedback) {
      return false;
    }
    setFormError(null);
    setSuccessPath(null);
    let payload;
    try {
      payload = createPayload();
    } catch {
      setFormError(t(locale, "publicReview.feedback.validationError"));
      return false;
    }

    setIsSubmitting(true);
    try {
      const drop = await submitter({ destination, payload });
      setSuccessPath(
        getWaveRoute({
          waveId: destination.waveId,
          serialNo: drop.serial_no,
          isDirectMessage: false,
          isApp: false,
        })
      );
      setDraft(createEmptyDraft(config));
      setPreview(null);
      setCommentError(null);
      setSubmissionId(createSubmissionId());
      await queryClient.invalidateQueries({
        queryKey: getPublicReviewLedgerQueryKey({ config, destination }),
      });
      return true;
    } catch {
      setFormError(t(locale, "publicReview.feedback.submitError"));
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  const connecting = isConnecting || seizeConnectOpen;
  return {
    authenticated,
    busy: isSubmitting || connecting,
    commentError,
    connected: Boolean(connectedProfile),
    connecting,
    draft,
    feedbackGate: getFeedbackGate({
      authenticated,
      config,
      isError: waveQuery.isError,
      isPending: waveQuery.isPending,
      locale,
      waveCanAcceptFeedback,
    }),
    formError,
    handleConnect,
    handlePreview,
    handleSubmit,
    isSubmitting,
    preview,
    successPath,
    updateDraft,
  };
}

export default function PublicReviewFeedbackComposer({
  locale,
  config,
  destination,
  page,
  referenceSelection,
  submitter = submitPublicReviewFeedback,
}: PublicReviewFeedbackComposerProps) {
  const formId = useId();
  const successRef = useRef<HTMLOutputElement>(null);
  const {
    authenticated,
    busy,
    commentError,
    connected,
    connecting,
    draft,
    feedbackGate,
    formError,
    handleConnect,
    handlePreview,
    handleSubmit,
    isSubmitting,
    preview,
    successPath,
    updateDraft,
  } = useFeedbackComposerState({
    locale,
    config,
    destination,
    page,
    referenceSelection,
    submitter,
  });

  const submitAndFocusConfirmation = async () => {
    if (await handleSubmit()) {
      window.setTimeout(() => successRef.current?.focus(), 0);
    }
  };

  return (
    <section
      aria-labelledby={`${formId}-title`}
      className="tw-rounded-xl tw-border tw-border-solid tw-border-iron-800 tw-bg-iron-900/70 tw-p-4 sm:tw-p-6"
    >
      <h2
        id={`${formId}-title`}
        className="tw-m-0 tw-text-xl tw-font-semibold tw-text-iron-50"
      >
        {t(locale, "publicReview.feedback.title")}
      </h2>
      <p className="tw-mb-0 tw-mt-2 tw-text-sm tw-leading-6 tw-text-iron-300">
        {t(locale, "publicReview.feedback.intro")}
      </p>

      <ReviewFeedbackContext
        locale={locale}
        page={page}
        referenceSelection={referenceSelection}
      />

      {!authenticated && config.submissionsOpen ? (
        <>
          <button
            type="button"
            aria-busy={connecting}
            disabled={busy}
            onClick={() => void handleConnect()}
            className="tw-mt-5 tw-inline-flex tw-min-h-11 tw-items-center tw-justify-center tw-rounded-lg tw-border-0 tw-bg-primary-500 tw-px-4 tw-py-2 tw-font-semibold tw-text-white focus:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-300 disabled:tw-cursor-wait disabled:tw-opacity-60"
          >
            {getConnectButtonLabel({ connected, connecting, locale })}
          </button>
          <ReviewFeedbackConnectionStatus
            connecting={connecting}
            locale={locale}
          />
        </>
      ) : null}

      {authenticated && config.submissionsOpen ? (
        <form
          className="tw-mt-5 tw-space-y-4"
          noValidate
          onSubmit={(event) => {
            event.preventDefault();
            void submitAndFocusConfirmation();
          }}
        >
          <div className="tw-grid tw-gap-4 sm:tw-grid-cols-2">
            <label
              htmlFor={`${formId}-category`}
              className="tw-block tw-text-sm tw-font-medium tw-text-iron-200"
            >
              <span className="tw-mb-1.5 tw-block">
                {t(locale, "publicReview.feedback.category")}
              </span>
              <select
                id={`${formId}-category`}
                className={INPUT_CLASSES}
                value={draft.category}
                onChange={(event) =>
                  updateDraft("category", event.target.value)
                }
              >
                {config.categories.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            <label
              htmlFor={`${formId}-severity`}
              className="tw-block tw-text-sm tw-font-medium tw-text-iron-200"
            >
              <span className="tw-mb-1.5 tw-block">
                {t(locale, "publicReview.feedback.severity")}
              </span>
              <select
                id={`${formId}-severity`}
                className={INPUT_CLASSES}
                value={draft.severity}
                onChange={(event) =>
                  updateDraft("severity", event.target.value)
                }
              >
                {config.severityOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div>
            <label
              htmlFor={`${formId}-comment`}
              className="tw-mb-1.5 tw-block tw-text-sm tw-font-medium tw-text-iron-200"
            >
              {t(locale, "publicReview.feedback.comment")}
            </label>
            <textarea
              id={`${formId}-comment`}
              aria-describedby={`${formId}-comment-hint${
                commentError ? ` ${formId}-comment-error` : ""
              }`}
              aria-invalid={Boolean(commentError)}
              className={`${INPUT_CLASSES} tw-min-h-36 tw-resize-y`}
              value={draft.comment}
              onChange={(event) => updateDraft("comment", event.target.value)}
            />
            <span
              id={`${formId}-comment-hint`}
              className="tw-mt-1.5 tw-block tw-font-normal tw-text-iron-400"
            >
              {t(locale, "publicReview.feedback.commentHint")}
            </span>
            {commentError ? (
              <span
                id={`${formId}-comment-error`}
                className="tw-text-red-300 tw-mt-1 tw-block tw-font-normal"
              >
                {commentError}
              </span>
            ) : null}
          </div>

          <details className="tw-rounded-lg tw-border tw-border-solid tw-border-iron-800 tw-bg-iron-950/40 tw-p-3">
            <summary className="tw-min-h-11 tw-cursor-pointer tw-py-2 tw-font-semibold tw-text-iron-100 focus:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400/40">
              {t(locale, "publicReview.feedback.advanced")}
            </summary>
            <div className="tw-grid tw-gap-4 tw-pt-3">
              {(
                [
                  ["whyItMatters", "publicReview.feedback.whyItMatters"],
                  ["suggestedChange", "publicReview.feedback.suggestedChange"],
                  ["preconditions", "publicReview.feedback.preconditions"],
                  [
                    "expectedBehavior",
                    "publicReview.feedback.expectedBehavior",
                  ],
                  [
                    "observedBehavior",
                    "publicReview.feedback.observedBehavior",
                  ],
                  ["reproduction", "publicReview.feedback.reproduction"],
                ] as const
              ).map(([field, messageKey]) => (
                <label
                  key={field}
                  htmlFor={`${formId}-${field}`}
                  className="tw-block tw-text-sm tw-font-medium tw-text-iron-200"
                >
                  <span className="tw-mb-1.5 tw-block">
                    {t(locale, messageKey)}
                  </span>
                  <textarea
                    id={`${formId}-${field}`}
                    className={`${INPUT_CLASSES} tw-min-h-24 tw-resize-y`}
                    value={draft[field]}
                    onChange={(event) => updateDraft(field, event.target.value)}
                  />
                </label>
              ))}
            </div>
          </details>

          {preview !== null ? (
            <section
              aria-labelledby={`${formId}-preview`}
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
          ) : null}

          <div className="tw-flex tw-flex-col tw-gap-3 sm:tw-flex-row">
            <button
              type="button"
              disabled={busy}
              onClick={handlePreview}
              className="tw-inline-flex tw-min-h-11 tw-items-center tw-justify-center tw-rounded-lg tw-border tw-border-solid tw-border-iron-600 tw-bg-transparent tw-px-4 tw-py-2 tw-font-semibold tw-text-iron-100 focus:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-white/30 disabled:tw-opacity-60"
            >
              {t(locale, "publicReview.feedback.preview")}
            </button>
            <button
              type="submit"
              disabled={busy || Boolean(feedbackGate)}
              className="tw-inline-flex tw-min-h-11 tw-items-center tw-justify-center tw-rounded-lg tw-border-0 tw-bg-primary-500 tw-px-4 tw-py-2 tw-font-semibold tw-text-white focus:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-300 disabled:tw-cursor-not-allowed disabled:tw-opacity-60"
            >
              {isSubmitting
                ? t(locale, "publicReview.feedback.submitting")
                : t(locale, "publicReview.feedback.submit")}
            </button>
          </div>
        </form>
      ) : null}

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
      {successPath ? (
        <output
          ref={successRef}
          tabIndex={-1}
          aria-live="polite"
          aria-atomic="true"
          className="tw-border-green-500/40 tw-bg-green-950/30 tw-text-green-100 tw-mb-0 tw-mt-4 tw-block tw-rounded-lg tw-border tw-border-solid tw-p-3 tw-text-sm focus:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-green-300"
        >
          {t(locale, "publicReview.feedback.success")}{" "}
          <Link
            className="tw-text-green-100 focus-visible:tw-ring-green-300 tw-font-semibold tw-underline focus:tw-outline-none focus-visible:tw-ring-2"
            href={successPath}
          >
            {t(locale, "publicReview.feedback.viewWave")}
          </Link>
        </output>
      ) : null}
    </section>
  );
}
