"use client";

import { ChevronDownIcon } from "@heroicons/react/24/outline";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  type ReactNode,
  useId,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { v4 as uuidv4 } from "uuid";

import { useAuth } from "@/components/auth/Auth";
import { useSeizeConnectContext } from "@/components/auth/SeizeConnectContext";
import {
  FeedbackConnectPrompt,
  FeedbackPreview,
  FeedbackResultMessages,
  type PublicReviewReferenceIntegrityStatus,
  ReferenceIntegrityNotice,
} from "@/components/public-review/PublicReviewFeedbackComposerStatus";
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
  readonly contextControl?: ReactNode | undefined;
  readonly destination: PublicReviewDiscussionDestination;
  readonly page: PublicReviewPageContext;
  readonly referenceSelection?: PublicReviewReferenceSelection | undefined;
  readonly referenceIntegrityMessage?: string | undefined;
  readonly referenceIntegrityStatus?:
    | PublicReviewReferenceIntegrityStatus
    | undefined;
  readonly submitter?: PublicReviewFeedbackSubmitter | undefined;
}
export type { PublicReviewReferenceIntegrityStatus } from "@/components/public-review/PublicReviewFeedbackComposerStatus";
interface ContextBoundValue<Value> {
  readonly contextFingerprint: string;
  readonly value: Value;
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

function getFeedbackValidationMessage({
  error,
  locale,
}: {
  readonly error: unknown;
  readonly locale: SupportedLocale;
}): string | null {
  if (
    error instanceof PublicReviewFeedbackValidationError &&
    error.issues.length > 0
  ) {
    if (
      error.issues.length === 1 &&
      error.issues[0] === t(locale, "publicReview.feedback.commentRequired")
    ) {
      return null;
    }
    return error.issues.join(" ");
  }
  return t(locale, "publicReview.feedback.validationError");
}

function getFeedbackContextFingerprint({
  page,
  referenceIntegrityStatus,
  referenceSelection,
}: Pick<
  PublicReviewFeedbackComposerProps,
  "page" | "referenceIntegrityStatus" | "referenceSelection"
>): string {
  return JSON.stringify({
    page,
    referenceIntegrityStatus,
    referenceSelection,
  });
}

const INPUT_CLASSES =
  "tw-min-h-11 tw-w-full tw-rounded-lg tw-border-0 tw-bg-iron-950 tw-px-3 tw-py-2 tw-text-sm tw-text-iron-50 tw-outline-none tw-ring-1 tw-ring-inset tw-ring-iron-600 tw-transition focus:tw-bg-black focus:tw-ring-1 focus:tw-ring-primary-400 focus-visible:tw-ring-1 focus-visible:tw-ring-primary-400";

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

function ReviewFeedbackContext({
  className = "",
  locale,
  page,
  referenceSelection,
}: {
  readonly className?: string | undefined;
  readonly locale: SupportedLocale;
  readonly page: PublicReviewPageContext;
  readonly referenceSelection: PublicReviewReferenceSelection | undefined;
}) {
  return (
    <div
      className={`${className} tw-rounded-lg tw-border tw-border-solid tw-border-white/[0.07] tw-bg-white/[0.018] tw-p-3 tw-text-xs tw-leading-5 tw-text-iron-400`}
    >
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
  referenceIntegrityMessage,
  referenceIntegrityStatus,
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
  const [preview, setPreview] = useState<ContextBoundValue<string> | null>(
    null
  );
  const [commentError, setCommentError] = useState<string | null>(null);
  const [formError, setFormError] = useState<ContextBoundValue<string> | null>(
    null
  );
  const [successPath, setSuccessPath] =
    useState<ContextBoundValue<string> | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const draftRevisionRef = useRef(0);
  const contextFingerprint = getFeedbackContextFingerprint({
    page,
    referenceIntegrityStatus,
    referenceSelection,
  });
  const latestContextFingerprintRef = useRef(contextFingerprint);
  useLayoutEffect(() => {
    latestContextFingerprintRef.current = contextFingerprint;
  }, [contextFingerprint]);
  const setCurrentFormError = (message: string | null): void => {
    setFormError(
      message === null ? null : { contextFingerprint, value: message }
    );
  };
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
    draftRevisionRef.current += 1;
    setDraft((current) => ({ ...current, [field]: value }));
    setPreview(null);
    setCurrentFormError(null);
    if (field === "comment" && value.trim()) {
      setCommentError(null);
    }
  };

  const createPayload = () => {
    if (referenceIntegrityStatus !== "ready") {
      throw new PublicReviewFeedbackValidationError([
        referenceIntegrityMessage ??
          t(locale, "publicReview.feedback.hashUnavailable"),
      ]);
    }
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

  const handlePreview = (): boolean => {
    setCurrentFormError(null);
    try {
      setPreview({
        contextFingerprint,
        value: createPayload().parts[0]?.content ?? "",
      });
      return true;
    } catch (error) {
      setCurrentFormError(getFeedbackValidationMessage({ error, locale }));
      return false;
    }
  };

  const handleConnect = async (): Promise<void> => {
    setIsConnecting(true);
    setCurrentFormError(null);
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
      setCurrentFormError(t(locale, "publicReview.feedback.connectError"));
    } finally {
      setIsConnecting(false);
    }
  };

  const handleSubmit = async (): Promise<boolean> => {
    if (isSubmitting || !authenticated || !waveCanAcceptFeedback) {
      return false;
    }
    setCurrentFormError(null);
    setSuccessPath(null);
    const submissionContextFingerprint = contextFingerprint;
    const submittedDraftRevision = draftRevisionRef.current;
    let payload;
    try {
      payload = createPayload();
    } catch (error) {
      setCurrentFormError(getFeedbackValidationMessage({ error, locale }));
      return false;
    }

    setIsSubmitting(true);
    try {
      const drop = await submitter({ destination, payload });
      setSuccessPath({
        contextFingerprint: submissionContextFingerprint,
        value: getWaveRoute({
          waveId: destination.waveId,
          serialNo: drop.serial_no,
          isDirectMessage: false,
          isApp: false,
        }),
      });
      const submittedStateIsCurrent =
        latestContextFingerprintRef.current === submissionContextFingerprint &&
        draftRevisionRef.current === submittedDraftRevision;
      if (submittedStateIsCurrent) {
        draftRevisionRef.current += 1;
        setDraft(createEmptyDraft(config));
        setCommentError(null);
      }
      setPreview(null);
      setSubmissionId(createSubmissionId());
      await queryClient.invalidateQueries({
        queryKey: getPublicReviewLedgerQueryKey({ config, destination }),
      });
      return true;
    } catch {
      setCurrentFormError(t(locale, "publicReview.feedback.submitError"));
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
    formError:
      formError?.contextFingerprint === contextFingerprint
        ? formError.value
        : null,
    handleConnect,
    handlePreview,
    handleSubmit,
    isSubmitting,
    preview:
      preview?.contextFingerprint === contextFingerprint ? preview.value : null,
    successPath:
      successPath?.contextFingerprint === contextFingerprint
        ? successPath.value
        : null,
    updateDraft,
  };
}

export default function PublicReviewFeedbackComposer({
  locale,
  config,
  contextControl,
  destination,
  page,
  referenceIntegrityMessage,
  referenceIntegrityStatus = "ready",
  referenceSelection,
  submitter = submitPublicReviewFeedback,
}: PublicReviewFeedbackComposerProps) {
  const formId = useId();
  const commentRef = useRef<HTMLTextAreaElement>(null);
  const previewRef = useRef<HTMLHeadingElement>(null);
  const successRef = useRef<HTMLOutputElement>(null);
  const referenceStatusId = `${formId}-reference-status`;
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
    referenceIntegrityMessage,
    referenceIntegrityStatus,
    referenceSelection,
    submitter,
  });

  const submitAndFocusConfirmation = async () => {
    if (await handleSubmit()) {
      window.setTimeout(() => successRef.current?.focus(), 0);
    } else if (!draft.comment.trim()) {
      window.setTimeout(() => commentRef.current?.focus(), 0);
    }
  };
  const previewAndFocusError = (): void => {
    if (handlePreview()) {
      window.setTimeout(() => {
        previewRef.current?.focus({ preventScroll: true });
        const reducedMotionQuery =
          typeof window.matchMedia === "function"
            ? window.matchMedia("(prefers-reduced-motion: reduce)")
            : null;
        const prefersReducedMotion = reducedMotionQuery?.matches === true;
        previewRef.current?.scrollIntoView({
          behavior: prefersReducedMotion ? "auto" : "smooth",
          block: "nearest",
        });
      }, 0);
    } else if (!draft.comment.trim()) {
      window.setTimeout(() => commentRef.current?.focus(), 0);
    }
  };
  const referenceReady = referenceIntegrityStatus === "ready";

  return (
    <section
      aria-label={t(locale, "publicReview.feedback.title")}
      className="tw-border-x-0 tw-border-b-0 tw-border-t tw-border-solid tw-border-white/[0.08] tw-pt-5 tw-@container"
    >
      {authenticated ? (
        <ReferenceIntegrityNotice
          id={referenceStatusId}
          locale={locale}
          message={referenceIntegrityMessage}
          status={referenceIntegrityStatus}
        />
      ) : null}

      <FeedbackConnectPrompt
        busy={busy}
        connected={connected}
        connecting={connecting}
        handleConnect={handleConnect}
        locale={locale}
        visible={!authenticated && config.submissionsOpen}
      />

      {authenticated && config.submissionsOpen ? (
        <form
          aria-describedby={!referenceReady ? referenceStatusId : undefined}
          className={`tw-space-y-3 ${referenceReady ? "tw-mt-0" : "tw-mt-4"}`}
          noValidate
          onSubmit={(event) => {
            event.preventDefault();
            void submitAndFocusConfirmation();
          }}
        >
          <div>
            <label htmlFor={`${formId}-comment`} className="tw-sr-only">
              {t(locale, "publicReview.feedback.comment")} (
              {t(locale, "publicReview.feedback.required")})
            </label>
            <textarea
              ref={commentRef}
              data-public-review-feedback-primary
              id={`${formId}-comment`}
              aria-describedby={`${formId}-comment-hint${
                commentError ? ` ${formId}-comment-error` : ""
              }`}
              aria-invalid={Boolean(commentError)}
              className={`${INPUT_CLASSES} aria-[invalid=true]:tw-ring-red-400 aria-[invalid=true]:focus:tw-ring-red-400 aria-[invalid=true]:focus-visible:tw-ring-red-400 tw-min-h-24 tw-resize-y tw-leading-6 placeholder:tw-text-iron-400`}
              placeholder={t(locale, "publicReview.feedback.commentHint")}
              required
              value={draft.comment}
              onChange={(event) => updateDraft("comment", event.target.value)}
            />
            <span id={`${formId}-comment-hint`} className="tw-sr-only">
              {t(locale, "publicReview.feedback.commentHint")}
            </span>
            {commentError ? (
              <span
                id={`${formId}-comment-error`}
                aria-live="polite"
                className="tw-text-red-300 tw-mt-1.5 tw-block tw-text-xs tw-font-medium"
              >
                {commentError}
              </span>
            ) : null}
          </div>

          <details className="tw-group tw-overflow-hidden tw-rounded-lg tw-border tw-border-solid tw-border-white/[0.08] tw-bg-[#0a0a0c] tw-transition-colors open:tw-border-white/[0.11]">
            <summary className="tw-flex tw-min-h-11 tw-cursor-pointer tw-list-none tw-items-center tw-justify-between tw-gap-3 tw-px-3 tw-text-xs tw-font-medium tw-text-iron-400 tw-transition-colors tw-duration-200 hover:tw-bg-white/[0.018] hover:tw-text-iron-200 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-[-2px] focus-visible:tw-outline-primary-400 [&::-webkit-details-marker]:tw-hidden">
              {t(locale, "publicReview.feedback.advanced")}
              <ChevronDownIcon
                className="tw-size-3.5 tw-flex-none tw-text-iron-500 tw-transition-transform tw-duration-200 group-open:tw-rotate-180 motion-reduce:tw-transition-none"
                aria-hidden="true"
              />
            </summary>

            <div className="tw-max-h-[30vh] tw-space-y-4 tw-overflow-y-auto tw-overscroll-contain tw-border-x-0 tw-border-b-0 tw-border-t tw-border-solid tw-border-white/[0.05] tw-bg-white/[0.012] tw-px-3 tw-pb-3 tw-pt-4 tw-scrollbar-thin tw-scrollbar-track-transparent tw-scrollbar-thumb-iron-700/70 desktop-hover:hover:tw-scrollbar-thumb-iron-500">
              {contextControl}

              <div className="tw-grid tw-gap-3 @[340px]:tw-grid-cols-2">
                <label
                  htmlFor={`${formId}-category`}
                  className="tw-block tw-min-w-0 tw-text-[11px] tw-font-medium tw-text-iron-400"
                >
                  <span className="tw-mb-1.5 tw-block">
                    {t(locale, "publicReview.feedback.category")}
                  </span>
                  <span className="tw-relative tw-block">
                    <select
                      id={`${formId}-category`}
                      className={`${INPUT_CLASSES} tw-appearance-none tw-pr-9`}
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
                    <ChevronDownIcon
                      aria-hidden="true"
                      className="tw-pointer-events-none tw-absolute tw-right-3 tw-top-1/2 tw-size-4 tw--translate-y-1/2 tw-text-iron-500"
                    />
                  </span>
                </label>
                <label
                  htmlFor={`${formId}-severity`}
                  className="tw-block tw-min-w-0 tw-text-[11px] tw-font-medium tw-text-iron-400"
                >
                  <span className="tw-mb-1.5 tw-block">
                    {t(locale, "publicReview.feedback.severity")}
                  </span>
                  <span className="tw-relative tw-block">
                    <select
                      id={`${formId}-severity`}
                      className={`${INPUT_CLASSES} tw-appearance-none tw-pr-9`}
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
                    <ChevronDownIcon
                      aria-hidden="true"
                      className="tw-pointer-events-none tw-absolute tw-right-3 tw-top-1/2 tw-size-4 tw--translate-y-1/2 tw-text-iron-500"
                    />
                  </span>
                </label>
              </div>

              <ReviewFeedbackContext
                locale={locale}
                page={page}
                referenceSelection={referenceSelection}
              />

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
                  className="tw-block tw-text-[11px] tw-font-medium tw-text-iron-400"
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

          <div className="tw-space-y-3">
            <button
              type="button"
              disabled={busy || !referenceReady}
              onClick={previewAndFocusError}
              className="tw-inline-flex tw-min-h-11 tw-w-full tw-items-center tw-justify-center tw-rounded-lg tw-border tw-border-solid tw-border-white/10 tw-bg-transparent tw-px-3 tw-py-2 tw-text-xs tw-font-semibold tw-text-iron-200 hover:tw-bg-white/[0.025] hover:tw-text-white focus:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-white/30 disabled:tw-opacity-60"
            >
              {t(locale, "publicReview.feedback.preview")}
            </button>

            <FeedbackPreview
              formId={formId}
              locale={locale}
              preview={preview}
              previewRef={previewRef}
            />
          </div>

          <div className="tw-border-x-0 tw-border-b-0 tw-border-t tw-border-solid tw-border-white/[0.06] tw-bg-[#050506] tw-pb-3 tw-pt-3">
            <button
              type="submit"
              disabled={busy || !referenceReady || Boolean(feedbackGate)}
              className="tw-inline-flex tw-min-h-11 tw-w-full tw-items-center tw-justify-center tw-rounded-lg tw-border-0 tw-bg-primary-600 tw-px-3 tw-py-2 tw-text-xs tw-font-semibold tw-text-white tw-transition hover:tw-ring-2 hover:tw-ring-inset hover:tw-ring-primary-300/60 focus:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-300 disabled:tw-cursor-not-allowed disabled:tw-opacity-60"
            >
              {isSubmitting
                ? t(locale, "publicReview.feedback.submitting")
                : t(locale, "publicReview.feedback.submit")}
            </button>
          </div>
        </form>
      ) : null}

      <FeedbackResultMessages
        feedbackGate={feedbackGate}
        formError={formError}
        locale={locale}
        successPath={successPath}
        successRef={successRef}
      />
    </section>
  );
}
