"use client";

import { useAuth } from "@/components/auth/Auth";
import Button from "@/components/utils/button/Button";
import type { ApiDrop } from "@/generated/models/ApiDrop";
import { ApiContentModerationReportReason } from "@/generated/models/ApiContentModerationReportReason";
import { getToastErrorDetails } from "@/helpers/toast.helpers";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t, type MessageKey } from "@/i18n/messages";
import { reportDrop } from "@/services/api/content-moderation-api";
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
import { XMarkIcon } from "@heroicons/react/24/outline";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useId, useState } from "react";

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
  const descriptionId = useId();
  const [reason, setReason] = useState<ApiContentModerationReportReason>(
    ApiContentModerationReportReason.ScamOrPhishing
  );
  const [notes, setNotes] = useState("");
  const [hidePost, setHidePost] = useState(false);
  const [blockAuthor, setBlockAuthor] = useState(false);

  const closeModal = () => {
    setReason(ApiContentModerationReportReason.ScamOrPhishing);
    setNotes("");
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
      return reportDrop(drop.id, {
        reason,
        notes: notes.trim() || null,
        hide_drop: hidePost,
        block_author: blockAuthor,
      });
    },
    onMutate: () => {
      const viewerProfileId = connectedProfile?.id;
      if (!viewerProfileId || (!hidePost && !blockAuthor)) return undefined;
      const previousHidden = hidePost
        ? getDropHiddenOverride(viewerProfileId, drop.id)
        : undefined;
      const previousBlocked = blockAuthor
        ? getProfileBlockedOverride(viewerProfileId, drop.author.id)
        : undefined;
      if (hidePost) {
        setDropHiddenOverride(viewerProfileId, drop.id, true);
      }
      if (blockAuthor) {
        setProfileBlockedOverride(viewerProfileId, drop.author.id, true);
      }
      return {
        blockAuthor,
        hidePost,
        previousBlocked,
        previousHidden,
        viewerProfileId,
      };
    },
    onSuccess: (response) => {
      setGlobalDropModerationOverride(drop.id, response.drop_status);
      setToast({
        message: t(locale, "contentModeration.report.success"),
        type: "success",
      });
      closeModal();
    },
    onError: (error, _variables, context) => {
      if (context?.hidePost) {
        setDropHiddenOverride(
          context.viewerProfileId,
          drop.id,
          context.previousHidden
        );
      }
      if (context?.blockAuthor) {
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
                <DialogTitle className="tw-m-0 tw-text-xl tw-font-semibold tw-text-iron-50">
                  {t(locale, "contentModeration.report.title")}
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
              <label className="tw-block">
                <span className="tw-text-sm tw-font-semibold tw-text-iron-200">
                  {t(locale, "contentModeration.report.reasonLabel")}
                </span>
                <select
                  value={reason}
                  onChange={(event) =>
                    setReason(
                      event.target.value as ApiContentModerationReportReason
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

              <div className="tw-space-y-3 tw-rounded-xl tw-bg-iron-900/60 tw-p-4">
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
              </div>

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
