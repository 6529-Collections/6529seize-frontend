"use client";

import Button from "@/components/utils/button/Button";
import { ApiContentModerationReportStatus } from "@/generated/models/ApiContentModerationReportStatus";
import type { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t, type MessageKey } from "@/i18n/messages";
import type { ReactNode } from "react";

export const getReportOutcomeLabel = (
  locale: ReturnType<typeof useBrowserLocale>,
  reportStatus: ApiContentModerationReportStatus | null
): string => {
  if (reportStatus === ApiContentModerationReportStatus.ResolvedAllowed) {
    return t(locale, "contentModeration.report.outcomeAllowed");
  }
  if (reportStatus === ApiContentModerationReportStatus.ResolvedRemoved) {
    return t(locale, "contentModeration.report.outcomeRemoved");
  }
  return t(locale, "contentModeration.report.outcomePending");
};

export const getReportDialogTitleKey = ({
  confirmWithdraw,
  reportAlreadySubmitted,
}: {
  readonly confirmWithdraw: boolean;
  readonly reportAlreadySubmitted: boolean;
}): MessageKey => {
  if (confirmWithdraw) return "contentModeration.report.withdraw";
  if (reportAlreadySubmitted) return "contentModeration.report.outcomeTitle";
  return "contentModeration.report.title";
};

export const getReportDialogDescriptionKey = ({
  confirmWithdraw,
  reportAlreadySubmitted,
  reportIsOpen,
}: {
  readonly confirmWithdraw: boolean;
  readonly reportAlreadySubmitted: boolean;
  readonly reportIsOpen: boolean;
}): MessageKey => {
  if (confirmWithdraw) return "contentModeration.report.withdrawConfirm";
  if (!reportAlreadySubmitted) return "contentModeration.report.description";
  return reportIsOpen
    ? "contentModeration.report.outcomePendingDescription"
    : "contentModeration.report.outcomeReviewedDescription";
};

export function ReportDropModalContent({
  actionForm,
  confirmWithdraw,
  locale,
  onCancelWithdraw,
  onClose,
  onConfirmWithdraw,
  onWithdraw,
  outcomeLabel,
  reportAlreadySubmitted,
  reportIsOpen,
  withdrawPending,
}: {
  readonly actionForm: ReactNode;
  readonly confirmWithdraw: boolean;
  readonly locale: ReturnType<typeof useBrowserLocale>;
  readonly onCancelWithdraw: () => void;
  readonly onClose: () => void;
  readonly onConfirmWithdraw: () => void;
  readonly onWithdraw: () => void;
  readonly outcomeLabel: string;
  readonly reportAlreadySubmitted: boolean;
  readonly reportIsOpen: boolean;
  readonly withdrawPending: boolean;
}) {
  if (confirmWithdraw) {
    return (
      <div className="tw-mt-7 tw-flex tw-flex-col-reverse tw-gap-3 sm:tw-flex-row sm:tw-justify-end">
        <Button
          type="button"
          variant="secondary"
          onClick={onCancelWithdraw}
          disabled={withdrawPending}
        >
          {t(locale, "contentModeration.report.cancel")}
        </Button>
        <button
          type="button"
          disabled={withdrawPending}
          onClick={onWithdraw}
          className="tw-cursor-pointer tw-rounded-lg tw-border tw-border-solid tw-border-red/50 tw-bg-red/10 tw-px-4 tw-py-2.5 tw-text-sm tw-font-semibold tw-text-red hover:tw-bg-red/15 focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-red disabled:tw-cursor-default disabled:tw-opacity-50"
        >
          {t(
            locale,
            withdrawPending
              ? "contentModeration.report.withdrawing"
              : "contentModeration.report.withdraw"
          )}
        </button>
      </div>
    );
  }

  if (!reportAlreadySubmitted) return actionForm;

  return (
    <div className="tw-mt-6 tw-space-y-6">
      <div className="tw-rounded-xl tw-border tw-border-solid tw-border-iron-800 tw-bg-iron-900/60 tw-p-4">
        <p className="tw-m-0 tw-text-xs tw-font-semibold tw-uppercase tw-tracking-wide tw-text-iron-400">
          {t(
            locale,
            reportIsOpen
              ? "contentModeration.report.outcomePendingLabel"
              : "contentModeration.report.outcomeReviewedLabel"
          )}
        </p>
        <p className="tw-mb-0 tw-mt-2 tw-text-base tw-font-semibold tw-text-iron-100">
          {outcomeLabel}
        </p>
      </div>
      <div className="tw-flex tw-flex-col-reverse tw-gap-3 sm:tw-flex-row sm:tw-justify-end">
        {reportIsOpen && (
          <button
            type="button"
            className="tw-cursor-pointer tw-rounded-lg tw-border tw-border-solid tw-border-red/50 tw-bg-red/10 tw-px-4 tw-py-2.5 tw-text-sm tw-font-semibold tw-text-red hover:tw-bg-red/15 focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-red"
            onClick={onConfirmWithdraw}
          >
            {t(locale, "contentModeration.report.withdraw")}
          </button>
        )}
        <Button type="button" variant="secondary" onClick={onClose}>
          {t(locale, "contentModeration.report.closeButton")}
        </Button>
      </div>
    </div>
  );
}
