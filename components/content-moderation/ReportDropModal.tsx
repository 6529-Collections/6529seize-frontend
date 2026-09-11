"use client";

import { useAuth } from "@/components/auth/Auth";
import Button from "@/components/utils/button/Button";
import type { ApiDrop } from "@/generated/models/ApiDrop";
import { ApiContentModerationReportReason } from "@/generated/models/ApiContentModerationReportReason";
import { ApiContentModerationReportStatus } from "@/generated/models/ApiContentModerationReportStatus";
import type { ApiContentModerationReportResponse } from "@/generated/models/ApiContentModerationReportResponse";
import { getToastErrorDetails } from "@/helpers/toast.helpers";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { useContentModerationReportStatus } from "@/hooks/content-moderation/useContentModerationReportStatus";
import { t, type MessageKey } from "@/i18n/messages";
import {
  blockProfile,
  hideDrop,
  reportDrop,
  withdrawDropReport,
} from "@/services/api/content-moderation-api";
import {
  getDropHiddenOverride,
  getProfileBlockedOverride,
  setDropHiddenOverride,
  setDropReportStatusOverride,
  setGlobalDropModerationOverride,
  setProfileBlockedOverride,
} from "@/services/content-moderation/content-moderation-state";
import {
  invalidateContentModerationPresentation,
  reconcileIdentityFollowingAfterBlockChange,
} from "@/services/content-moderation/content-moderation-query";
import {
  Dialog,
  DialogBackdrop,
  DialogPanel,
  DialogTitle,
} from "@headlessui/react";
import {
  EyeSlashIcon,
  FlagIcon,
  NoSymbolIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { type ReactNode, useId, useState } from "react";
import { useContentModerationDropGateContext } from "./ContentModerationDropGateContext";
import {
  getReportDialogDescriptionKey,
  getReportDialogTitleKey,
  getReportOutcomeLabel,
  ReportDropModalContent,
} from "./ReportDropModalContent";

type PostAction = "report" | "hide" | "block";

type PostActionResult =
  | {
      readonly action: PostAction;
      readonly success: true;
      readonly reportResponse?: ApiContentModerationReportResponse | undefined;
    }
  | {
      readonly action: PostAction;
      readonly success: false;
      readonly error: unknown;
    };

type FailedPostActionResult = Extract<
  PostActionResult,
  { readonly success: false }
>;

type SuccessfulPostActionResult = Extract<
  PostActionResult,
  { readonly success: true }
>;

interface PostActionMutationContext {
  readonly blockAuthor: boolean;
  readonly hidePost: boolean;
  readonly previousBlocked: boolean | undefined;
  readonly previousHidden: boolean | undefined;
  readonly rollbackLocalHidden: (() => void) | undefined;
  readonly viewerProfileId: string | null | undefined;
}

const AUTHENTICATION_CANCELLED_ERROR = "Authentication was cancelled";

const isAuthenticationCancelled = (error: unknown): boolean =>
  error instanceof Error && error.message === AUTHENTICATION_CANCELLED_ERROR;

const getSubmitLabelKey = ({
  isPending,
  reportPost,
}: {
  readonly isPending: boolean;
  readonly reportPost: boolean;
}): MessageKey => {
  if (isPending) {
    return reportPost
      ? "contentModeration.report.submittingReport"
      : "contentModeration.report.submittingActions";
  }
  return reportPost
    ? "contentModeration.report.submitReport"
    : "contentModeration.report.submitActions";
};

const getPostActionOutcome = (
  results: ReadonlyArray<PostActionResult>,
  context: PostActionMutationContext | undefined
) => {
  const failures = results.filter(
    (result): result is FailedPostActionResult => !result.success
  );
  const failedActions = new Set(failures.map(({ action }) => action));
  const reportResult = results.find(
    (result): result is SuccessfulPostActionResult =>
      result.action === "report" && result.success
  );
  const reportFailed = failedActions.has("report");
  const hideFailed =
    failedActions.has("hide") || (reportFailed && context?.hidePost === true);
  const blockFailed =
    failedActions.has("block") ||
    (reportFailed && context?.blockAuthor === true);

  return {
    blockFailed,
    failedActions,
    failures,
    hideFailed,
    reportResult,
  };
};

const getPostActionOptionStateClass = (
  checked: boolean,
  disabled: boolean
): string => {
  if (checked) return "tw-bg-primary-500/[0.07]";
  if (disabled) return "";
  return "hover:tw-bg-white/[0.025]";
};

const runPostAction = async ({
  action,
  request,
}: {
  readonly action: PostAction;
  readonly request: () => Promise<ApiContentModerationReportResponse | void>;
}): Promise<PostActionResult> => {
  try {
    const response = await request();
    return {
      action,
      success: true,
      ...(action === "report" && response ? { reportResponse: response } : {}),
    };
  } catch (error) {
    return { action, error, success: false };
  }
};

const REASONS: ReadonlyArray<{
  readonly value: ApiContentModerationReportReason;
  readonly label: MessageKey;
}> = [
  {
    value: ApiContentModerationReportReason.ScamOrPhishing,
    label: "contentModeration.report.reason.scam",
  },
  {
    value: ApiContentModerationReportReason.PrivateInformationOrDoxxing,
    label: "contentModeration.report.reason.privateInformation",
  },
  {
    value: ApiContentModerationReportReason.ThreatsOrTargetedHarassment,
    label: "contentModeration.report.reason.threats",
  },
  {
    value: ApiContentModerationReportReason.HateOrDiscrimination,
    label: "contentModeration.report.reason.hate",
  },
  {
    value: ApiContentModerationReportReason.SexualExploitationOrIllegalContent,
    label: "contentModeration.report.reason.illegal",
  },
  {
    value: ApiContentModerationReportReason.Spam,
    label: "contentModeration.report.reason.spam",
  },
  {
    value: ApiContentModerationReportReason.Other,
    label: "contentModeration.report.reason.other",
  },
];

function PostActionOption({
  checked,
  description,
  disabled = false,
  icon,
  label,
  onChange,
  status,
}: {
  readonly checked: boolean;
  readonly description: string;
  readonly disabled?: boolean;
  readonly icon: ReactNode;
  readonly label: string;
  readonly onChange: (checked: boolean) => void;
  readonly status?: string | undefined;
}) {
  return (
    <label
      className={`tw-flex tw-items-start tw-gap-3 tw-rounded-lg tw-p-3 tw-transition-colors ${
        disabled ? "tw-cursor-default tw-opacity-80" : "tw-cursor-pointer"
      } ${getPostActionOptionStateClass(checked, disabled)}`}
    >
      <span
        aria-hidden="true"
        className={`tw-mt-0.5 tw-flex tw-size-7 tw-flex-none tw-items-center tw-justify-center tw-rounded-md ${
          checked
            ? "tw-bg-primary-500/10 tw-text-primary-300"
            : "tw-bg-iron-900 tw-text-iron-400"
        }`}
      >
        {icon}
      </span>
      <span className="tw-min-w-0 tw-flex-1">
        <span className="tw-block tw-text-sm tw-font-semibold tw-text-iron-100">
          {label}
        </span>
        {status && (
          <span className="tw-mt-0.5 tw-block tw-text-xs tw-font-semibold tw-text-primary-300">
            {status}
          </span>
        )}
        <span className="tw-mt-0.5 tw-block tw-text-sm tw-leading-5 tw-text-iron-400">
          {description}
        </span>
      </span>
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(event) => onChange(event.target.checked)}
        aria-label={label}
        className="tw-mt-1 tw-size-4 tw-flex-none tw-rounded tw-border-iron-600 tw-bg-iron-900 tw-text-primary-500 focus:tw-ring-primary-400"
      />
    </label>
  );
}

export default function ReportDropModal({
  drop,
  isOpen,
  onClose,
}: {
  readonly drop: ApiDrop;
  readonly isOpen: boolean;
  readonly onClose: () => void;
}) {
  const locale = useBrowserLocale();
  const { connectedProfile, requestAuth, setToast } = useAuth();
  const queryClient = useQueryClient();
  const dropGateContext = useContentModerationDropGateContext();
  const reportStatus = useContentModerationReportStatus(drop);
  const descriptionId = useId();
  const [reason, setReason] = useState<ApiContentModerationReportReason>(
    ApiContentModerationReportReason.ScamOrPhishing
  );
  const [notes, setNotes] = useState("");
  const [reportPost, setReportPost] = useState(false);
  const [hidePost, setHidePost] = useState(false);
  const [blockAuthor, setBlockAuthor] = useState(false);
  const [confirmWithdraw, setConfirmWithdraw] = useState(false);
  const reportIsOpen = reportStatus === ApiContentModerationReportStatus.Open;
  const reportAlreadySubmitted =
    reportStatus !== null &&
    reportStatus !== ApiContentModerationReportStatus.Withdrawn;
  const effectiveHide = reportPost || hidePost;
  const hasSelection = reportPost || hidePost || blockAuthor;
  const outcomeLabel = getReportOutcomeLabel(locale, reportStatus);
  const dialogTitleKey = getReportDialogTitleKey({
    confirmWithdraw,
    reportAlreadySubmitted,
  });
  const dialogDescriptionKey = getReportDialogDescriptionKey({
    confirmWithdraw,
    reportAlreadySubmitted,
    reportIsOpen,
  });

  const closeModal = () => {
    setReason(ApiContentModerationReportReason.ScamOrPhishing);
    setNotes("");
    setReportPost(false);
    setHidePost(false);
    setBlockAuthor(false);
    setConfirmWithdraw(false);
    onClose();
  };

  const applySuccessfulReport = (
    result: PostActionResult | undefined,
    viewerProfileId: string | null | undefined
  ) => {
    if (result?.success !== true || result.reportResponse === undefined) return;
    setGlobalDropModerationOverride(drop.id, result.reportResponse.drop_status);
    if (typeof viewerProfileId === "string") {
      setDropReportStatusOverride(
        viewerProfileId,
        drop.id,
        ApiContentModerationReportStatus.Open
      );
    }
  };

  const applySuccessfulViewerActions = (
    reportResult: SuccessfulPostActionResult | undefined,
    context: PostActionMutationContext | undefined
  ) => {
    applySuccessfulReport(reportResult, context?.viewerProfileId);
    if (reportResult && context?.hidePost) {
      dropGateContext?.setOptimisticHidden(true);
      if (context.viewerProfileId) {
        setDropHiddenOverride(context.viewerProfileId, drop.id, true);
      }
    }
    if (reportResult && context?.blockAuthor && context.viewerProfileId) {
      setProfileBlockedOverride(context.viewerProfileId, drop.author.id, true);
    }
  };

  const rollbackFailedViewerActions = ({
    blockFailed,
    context,
    hideFailed,
  }: {
    readonly blockFailed: boolean;
    readonly context: PostActionMutationContext | undefined;
    readonly hideFailed: boolean;
  }) => {
    if (hideFailed && context?.hidePost) {
      context.rollbackLocalHidden?.();
      if (context.viewerProfileId) {
        setDropHiddenOverride(
          context.viewerProfileId,
          drop.id,
          context.previousHidden
        );
      }
    }
    if (blockFailed && context?.blockAuthor && context.viewerProfileId) {
      setProfileBlockedOverride(
        context.viewerProfileId,
        drop.author.id,
        context.previousBlocked
      );
    }
  };

  const mutation = useMutation({
    mutationFn: async () => {
      const { success } = await requestAuth();
      if (!success) {
        throw new Error(AUTHENTICATION_CANCELLED_ERROR);
      }
      const actions: Array<Promise<PostActionResult>> = [];
      if (reportPost) {
        actions.push(
          runPostAction({
            action: "report",
            request: () =>
              reportDrop(drop.id, {
                reason,
                notes: notes.trim() || null,
                hide_drop: true,
                block_author: blockAuthor,
              }),
          })
        );
      } else {
        if (hidePost) {
          actions.push(
            runPostAction({
              action: "hide",
              request: () => hideDrop(drop.id),
            })
          );
        }
        if (blockAuthor) {
          actions.push(
            runPostAction({
              action: "block",
              request: () => blockProfile(drop.author.id),
            })
          );
        }
      }
      return Promise.all(actions);
    },
    onMutate: () => {
      const optimisticallyHide = effectiveHide && !reportPost;
      const optimisticallyBlock = blockAuthor && !reportPost;
      const rollbackLocalHidden = optimisticallyHide
        ? dropGateContext?.setOptimisticHidden(true)
        : undefined;
      const viewerProfileId = connectedProfile?.id;
      if (!effectiveHide && !blockAuthor) {
        return undefined;
      }
      const previousHidden =
        effectiveHide && viewerProfileId
          ? getDropHiddenOverride(viewerProfileId, drop.id)
          : undefined;
      const previousBlocked =
        blockAuthor && viewerProfileId
          ? getProfileBlockedOverride(viewerProfileId, drop.author.id)
          : undefined;
      if (optimisticallyHide && viewerProfileId) {
        setDropHiddenOverride(viewerProfileId, drop.id, true);
      }
      if (optimisticallyBlock && viewerProfileId) {
        setProfileBlockedOverride(viewerProfileId, drop.author.id, true);
      }
      return {
        blockAuthor,
        hidePost: effectiveHide,
        previousBlocked,
        previousHidden,
        rollbackLocalHidden,
        viewerProfileId,
      };
    },
    onSuccess: (results, _variables, context) => {
      const { blockFailed, failedActions, failures, hideFailed, reportResult } =
        getPostActionOutcome(results, context);
      applySuccessfulViewerActions(reportResult, context);
      rollbackFailedViewerActions({ blockFailed, context, hideFailed });
      if (context?.blockAuthor && !blockFailed) {
        void reconcileIdentityFollowingAfterBlockChange(
          queryClient,
          drop.author.handle
        );
      }
      const [firstFailure] = failures;
      if (firstFailure) {
        setReportPost(failedActions.has("report"));
        setHidePost(Boolean(hideFailed));
        setBlockAuthor(Boolean(blockFailed));
        setToast({
          type: "error",
          title: t(locale, "contentModeration.report.partialError"),
          description: t(locale, "contentModeration.error.retry"),
          details: getToastErrorDetails(firstFailure.error),
        });
        return;
      }
      if (reportResult?.success) {
        setToast({
          message: t(locale, "contentModeration.report.success"),
          type: "success",
        });
      }
      closeModal();
    },
    onError: (error, _variables, context) => {
      context?.rollbackLocalHidden?.();
      if (context?.hidePost && context.viewerProfileId) {
        setDropHiddenOverride(
          context.viewerProfileId,
          drop.id,
          context.previousHidden
        );
      }
      if (context?.blockAuthor && context.viewerProfileId) {
        setProfileBlockedOverride(
          context.viewerProfileId,
          drop.author.id,
          context.previousBlocked
        );
      }
      if (isAuthenticationCancelled(error)) {
        return;
      }
      setToast({
        type: "error",
        title: t(locale, "contentModeration.report.error"),
        description: t(locale, "contentModeration.error.retry"),
        details: getToastErrorDetails(error),
      });
    },
    onSettled: () => {
      void invalidateContentModerationPresentation(queryClient);
    },
  });

  const withdrawMutation = useMutation({
    mutationFn: async () => {
      const { success } = await requestAuth();
      if (!success) throw new Error(AUTHENTICATION_CANCELLED_ERROR);
      return withdrawDropReport(drop.id);
    },
    onSuccess: (response) => {
      if (connectedProfile?.id) {
        setDropReportStatusOverride(connectedProfile.id, drop.id, null);
      }
      setGlobalDropModerationOverride(drop.id, response.drop_status);
      void invalidateContentModerationPresentation(queryClient);
      setToast({
        message: t(locale, "contentModeration.report.withdrawSuccess"),
        type: "success",
      });
      closeModal();
    },
    onError: (error) => {
      if (isAuthenticationCancelled(error)) {
        return;
      }
      setToast({
        type: "error",
        title: t(locale, "contentModeration.report.withdrawError"),
        description: t(locale, "contentModeration.error.retry"),
        details: getToastErrorDetails(error),
      });
    },
  });

  return (
    <Dialog
      open={isOpen}
      onClose={() => {
        if (!mutation.isPending && !withdrawMutation.isPending) closeModal();
      }}
      className="tailwind-scope tw-relative tw-z-[1000]"
      aria-describedby={descriptionId}
    >
      <DialogBackdrop className="tw-fixed tw-inset-0 tw-bg-iron-950/80" />
      <div className="tw-fixed tw-inset-0 tw-overflow-y-auto tw-p-4">
        <div className="tw-flex tw-min-h-full tw-items-end tw-justify-center sm:tw-items-center">
          <DialogPanel className="tw-w-full tw-max-w-4xl tw-rounded-2xl tw-border tw-border-solid tw-border-iron-800 tw-bg-iron-950 tw-p-5 tw-shadow-2xl sm:tw-p-7">
            <div className="tw-flex tw-items-start tw-justify-between tw-gap-4">
              <div>
                <DialogTitle className="tw-m-0 tw-flex tw-items-center tw-gap-2 tw-text-xl tw-font-semibold tw-text-iron-50">
                  <FlagIcon aria-hidden="true" className="tw-size-5" />
                  <span>{t(locale, dialogTitleKey)}</span>
                </DialogTitle>
                <p
                  id={descriptionId}
                  className="tw-mb-0 tw-mt-2 tw-text-sm tw-leading-6 tw-text-iron-400"
                >
                  {t(locale, dialogDescriptionKey)}
                </p>
              </div>
              <button
                type="button"
                onClick={closeModal}
                disabled={mutation.isPending || withdrawMutation.isPending}
                aria-label={t(locale, "contentModeration.report.close")}
                className="tw-flex tw-size-9 tw-flex-shrink-0 tw-cursor-pointer tw-items-center tw-justify-center tw-rounded-full tw-border-0 tw-bg-transparent tw-text-iron-400 hover:tw-bg-iron-800 hover:tw-text-iron-100 focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400"
              >
                <XMarkIcon aria-hidden="true" className="tw-size-5" />
              </button>
            </div>

            <ReportDropModalContent
              confirmWithdraw={confirmWithdraw}
              locale={locale}
              onCancelWithdraw={() => setConfirmWithdraw(false)}
              onClose={closeModal}
              onConfirmWithdraw={() => setConfirmWithdraw(true)}
              onWithdraw={() => withdrawMutation.mutate()}
              outcomeLabel={outcomeLabel}
              reportAlreadySubmitted={reportAlreadySubmitted}
              reportIsOpen={reportIsOpen}
              withdrawPending={withdrawMutation.isPending}
              actionForm={
                <form
                  className="tw-mt-6 tw-space-y-5"
                  onSubmit={(event) => {
                    event.preventDefault();
                    mutation.mutate();
                  }}
                >
                  <fieldset
                    disabled={mutation.isPending || withdrawMutation.isPending}
                    className="tw-m-0 tw-space-y-2 tw-border-0 tw-p-0"
                  >
                    <legend className="tw-sr-only">
                      {t(locale, "contentModeration.report.actionsLegend")}
                    </legend>
                    <div className="tw-space-y-1">
                      <PostActionOption
                        checked={reportPost}
                        description={t(
                          locale,
                          "contentModeration.report.reportDescription"
                        )}
                        icon={<FlagIcon className="tw-size-4" />}
                        label={t(
                          locale,
                          "contentModeration.report.reportLabel"
                        )}
                        onChange={setReportPost}
                      />

                      {reportPost && (
                        <div className="tw-space-y-4 tw-pb-4 tw-pl-16 tw-pr-4">
                          <label className="tw-block">
                            <span className="tw-text-sm tw-font-semibold tw-text-iron-200">
                              {t(
                                locale,
                                "contentModeration.report.reasonLabel"
                              )}
                            </span>
                            <select
                              value={reason}
                              onChange={(event) =>
                                setReason(
                                  event.target
                                    .value as ApiContentModerationReportReason
                                )
                              }
                              className="tw-mt-2 tw-w-full tw-rounded-lg tw-border tw-border-solid tw-border-iron-700 tw-bg-iron-900 tw-px-3 tw-py-2.5 tw-text-sm tw-text-iron-100 focus:tw-border-primary-400 focus:tw-outline-none focus:tw-ring-1 focus:tw-ring-primary-400"
                            >
                              {REASONS.map((item) => (
                                <option key={item.value} value={item.value}>
                                  {t(locale, item.label)}
                                </option>
                              ))}
                            </select>
                          </label>

                          <label className="tw-block">
                            <span className="tw-text-sm tw-font-semibold tw-text-iron-200">
                              {t(locale, "contentModeration.report.notesLabel")}
                            </span>
                            <textarea
                              value={notes}
                              onChange={(event) => setNotes(event.target.value)}
                              maxLength={1000}
                              rows={4}
                              placeholder={t(
                                locale,
                                "contentModeration.report.notesPlaceholder"
                              )}
                              className="tw-mt-2 tw-w-full tw-resize-y tw-rounded-lg tw-border tw-border-solid tw-border-iron-700 tw-bg-iron-900 tw-px-3 tw-py-2.5 tw-text-sm tw-text-iron-100 placeholder:tw-text-iron-500 focus:tw-border-primary-400 focus:tw-outline-none focus:tw-ring-1 focus:tw-ring-primary-400"
                            />
                          </label>
                        </div>
                      )}
                      <PostActionOption
                        checked={effectiveHide}
                        description={t(
                          locale,
                          "contentModeration.report.hideDescription"
                        )}
                        disabled={reportPost}
                        icon={<EyeSlashIcon className="tw-size-4" />}
                        label={t(locale, "contentModeration.report.hideLabel")}
                        onChange={setHidePost}
                        status={
                          reportPost
                            ? t(
                                locale,
                                "contentModeration.report.includedWithReport"
                              )
                            : undefined
                        }
                      />
                      <PostActionOption
                        checked={blockAuthor}
                        description={t(
                          locale,
                          "contentModeration.report.blockDescription"
                        )}
                        icon={<NoSymbolIcon className="tw-size-4" />}
                        label={t(locale, "contentModeration.report.blockLabel")}
                        onChange={setBlockAuthor}
                      />
                    </div>
                  </fieldset>

                  <div className="tw-flex tw-flex-col-reverse tw-gap-3 sm:tw-flex-row sm:tw-justify-end">
                    <Button
                      variant="secondary"
                      size="lg"
                      onClick={closeModal}
                      disabled={
                        mutation.isPending || withdrawMutation.isPending
                      }
                    >
                      {t(locale, "contentModeration.report.cancel")}
                    </Button>
                    <Button
                      type="submit"
                      size="lg"
                      loading={mutation.isPending}
                      disabled={!hasSelection}
                    >
                      {t(
                        locale,
                        getSubmitLabelKey({
                          isPending: mutation.isPending,
                          reportPost,
                        })
                      )}
                    </Button>
                  </div>
                </form>
              }
            />
          </DialogPanel>
        </div>
      </div>
    </Dialog>
  );
}
