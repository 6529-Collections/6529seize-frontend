"use client";

import { useAuth } from "@/components/auth/Auth";
import Button from "@/components/utils/button/Button";
import type { ApiDrop } from "@/generated/models/ApiDrop";
import { ApiContentModerationReportReason } from "@/generated/models/ApiContentModerationReportReason";
import type { ApiContentModerationReportResponse } from "@/generated/models/ApiContentModerationReportResponse";
import { getToastErrorDetails } from "@/helpers/toast.helpers";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t, type MessageKey } from "@/i18n/messages";
import {
  blockProfile,
  hideDrop,
  reportDrop,
} from "@/services/api/content-moderation-api";
import {
  getDropHiddenOverride,
  getProfileBlockedOverride,
  setDropHiddenOverride,
  setGlobalDropModerationOverride,
  setProfileBlockedOverride,
} from "@/services/content-moderation/content-moderation-state";
import { invalidateContentModerationPresentation } from "@/services/content-moderation/content-moderation-query";
import {
  Dialog,
  DialogBackdrop,
  DialogPanel,
  DialogTitle,
} from "@headlessui/react";
import { FlagIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useId, useState } from "react";
import { useContentModerationDropGateContext } from "./ContentModerationDropGateContext";

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
  const descriptionId = useId();
  const [reason, setReason] = useState<ApiContentModerationReportReason>(
    ApiContentModerationReportReason.ScamOrPhishing
  );
  const [notes, setNotes] = useState("");
  const [reportPost, setReportPost] = useState(false);
  const [hidePost, setHidePost] = useState(false);
  const [blockAuthor, setBlockAuthor] = useState(false);
  const hasSelection = reportPost || hidePost || blockAuthor;

  const closeModal = () => {
    setReason(ApiContentModerationReportReason.ScamOrPhishing);
    setNotes("");
    setReportPost(false);
    setHidePost(false);
    setBlockAuthor(false);
    onClose();
  };

  const mutation = useMutation({
    mutationFn: async () => {
      const { success } = await requestAuth();
      if (!success) {
        throw new Error("Authentication was cancelled");
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
                hide_drop: hidePost,
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
      const rollbackLocalHidden = hidePost
        ? dropGateContext?.setOptimisticHidden(true)
        : undefined;
      const viewerProfileId = connectedProfile?.id;
      if (!hidePost && !blockAuthor) {
        return undefined;
      }
      const previousHidden =
        hidePost && viewerProfileId
          ? getDropHiddenOverride(viewerProfileId, drop.id)
          : undefined;
      const previousBlocked =
        blockAuthor && viewerProfileId
          ? getProfileBlockedOverride(viewerProfileId, drop.author.id)
          : undefined;
      if (hidePost && viewerProfileId) {
        setDropHiddenOverride(viewerProfileId, drop.id, true);
      }
      if (blockAuthor && viewerProfileId) {
        setProfileBlockedOverride(viewerProfileId, drop.author.id, true);
      }
      return {
        blockAuthor,
        hidePost,
        previousBlocked,
        previousHidden,
        rollbackLocalHidden,
        viewerProfileId,
      };
    },
    onSuccess: (results, _variables, context) => {
      const failures = results.filter(
        (result): result is FailedPostActionResult => !result.success
      );
      const failedActions = new Set(failures.map(({ action }) => action));
      const reportResult = results.find(
        (result) => result.action === "report" && result.success
      );
      const reportFailed = failedActions.has("report");
      const hideFailed =
        failedActions.has("hide") || (reportFailed && context?.hidePost);
      const blockFailed =
        failedActions.has("block") || (reportFailed && context?.blockAuthor);
      if (reportResult?.success && reportResult.reportResponse) {
        setGlobalDropModerationOverride(
          drop.id,
          reportResult.reportResponse.drop_status
        );
      }
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
      if (
        error instanceof Error &&
        error.message === "Authentication was cancelled"
      ) {
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

  return (
    <Dialog
      open={isOpen}
      onClose={() => {
        if (!mutation.isPending) closeModal();
      }}
      className="tailwind-scope tw-relative tw-z-[1000]"
      aria-describedby={descriptionId}
    >
      <DialogBackdrop className="tw-fixed tw-inset-0 tw-bg-iron-950/80" />
      <div className="tw-fixed tw-inset-0 tw-overflow-y-auto tw-p-4">
        <div className="tw-flex tw-min-h-full tw-items-end tw-justify-center sm:tw-items-center">
          <DialogPanel className="tw-w-full tw-max-w-xl tw-rounded-2xl tw-border tw-border-solid tw-border-iron-800 tw-bg-iron-950 tw-p-6 tw-shadow-2xl">
            <div className="tw-flex tw-items-start tw-justify-between tw-gap-4">
              <div>
                <DialogTitle className="tw-m-0 tw-flex tw-items-center tw-gap-2 tw-text-xl tw-font-semibold tw-text-iron-50">
                  <FlagIcon aria-hidden="true" className="tw-size-5" />
                  <span>{t(locale, "contentModeration.report.title")}</span>
                </DialogTitle>
                <p
                  id={descriptionId}
                  className="tw-mb-0 tw-mt-2 tw-text-sm tw-leading-6 tw-text-iron-400"
                >
                  {t(locale, "contentModeration.report.description")}
                </p>
              </div>
              <button
                type="button"
                onClick={closeModal}
                disabled={mutation.isPending}
                aria-label={t(locale, "contentModeration.report.close")}
                className="tw-flex tw-size-9 tw-flex-shrink-0 tw-cursor-pointer tw-items-center tw-justify-center tw-rounded-full tw-border-0 tw-bg-transparent tw-text-iron-400 hover:tw-bg-iron-800 hover:tw-text-iron-100 focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400"
              >
                <XMarkIcon aria-hidden="true" className="tw-size-5" />
              </button>
            </div>

            <form
              className="tw-mt-6 tw-space-y-5"
              onSubmit={(event) => {
                event.preventDefault();
                mutation.mutate();
              }}
            >
              <fieldset
                disabled={mutation.isPending}
                className="tw-m-0 tw-space-y-4 tw-rounded-xl tw-border-0 tw-bg-iron-900/60 tw-p-4"
              >
                <legend className="tw-sr-only">
                  {t(locale, "contentModeration.report.actionsLegend")}
                </legend>
                <label className="tw-flex tw-cursor-pointer tw-items-center tw-gap-3 tw-text-sm tw-text-iron-200">
                  <input
                    type="checkbox"
                    checked={reportPost}
                    onChange={(event) => setReportPost(event.target.checked)}
                    className="tw-size-4 tw-rounded tw-border-iron-600 tw-bg-iron-900 tw-text-primary-500 focus:tw-ring-primary-400"
                  />
                  {t(locale, "contentModeration.report.reportLabel")}
                </label>

                {reportPost && (
                  <div className="tw-space-y-4 tw-border-0 tw-border-l tw-border-solid tw-border-iron-700 tw-pl-7">
                    <label className="tw-block">
                      <span className="tw-text-sm tw-font-semibold tw-text-iron-200">
                        {t(locale, "contentModeration.report.reasonLabel")}
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

                <label className="tw-flex tw-cursor-pointer tw-items-center tw-gap-3 tw-text-sm tw-text-iron-200">
                  <input
                    type="checkbox"
                    checked={hidePost}
                    onChange={(event) => setHidePost(event.target.checked)}
                    className="tw-size-4 tw-rounded tw-border-iron-600 tw-bg-iron-900 tw-text-primary-500 focus:tw-ring-primary-400"
                  />
                  {t(locale, "contentModeration.report.hideLabel")}
                </label>
                <label className="tw-flex tw-cursor-pointer tw-items-center tw-gap-3 tw-text-sm tw-text-iron-200">
                  <input
                    type="checkbox"
                    checked={blockAuthor}
                    onChange={(event) => setBlockAuthor(event.target.checked)}
                    className="tw-size-4 tw-rounded tw-border-iron-600 tw-bg-iron-900 tw-text-primary-500 focus:tw-ring-primary-400"
                  />
                  {t(locale, "contentModeration.report.blockLabel")}
                </label>
              </fieldset>

              <div className="tw-flex tw-flex-col-reverse tw-gap-3 sm:tw-flex-row sm:tw-justify-end">
                <Button
                  variant="secondary"
                  size="lg"
                  onClick={closeModal}
                  disabled={mutation.isPending}
                >
                  {t(locale, "contentModeration.report.cancel")}
                </Button>
                <Button
                  type="submit"
                  size="lg"
                  loading={mutation.isPending}
                  disabled={!hasSelection}
                  hideChildrenWhenLoading
                >
                  {t(locale, "contentModeration.report.submit")}
                </Button>
              </div>
            </form>
          </DialogPanel>
        </div>
      </div>
    </Dialog>
  );
}
