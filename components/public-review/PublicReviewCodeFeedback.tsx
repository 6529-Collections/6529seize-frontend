"use client";

import PublicReviewFeedbackComposer from "@/components/public-review/PublicReviewFeedbackComposer";
import { usePublicReviewCodeSelection } from "@/components/public-review/SoliditySourceReview";
import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import type {
  PublicReviewDiscussionDestination,
  PublicReviewFeedbackConfig,
  PublicReviewPageContext,
} from "@/services/api/public-review/types";

export function PublicReviewCodeFeedback({
  config,
  destination,
  page,
}: {
  readonly config: PublicReviewFeedbackConfig;
  readonly destination: PublicReviewDiscussionDestination;
  readonly page: PublicReviewPageContext;
}) {
  const { integrityStatus, selection } = usePublicReviewCodeSelection();

  if (integrityStatus === "pending") {
    return (
      <output
        aria-live="polite"
        aria-atomic="true"
        className="tw-block tw-rounded-xl tw-border tw-border-solid tw-border-sky-400/30 tw-bg-sky-400/5 tw-p-4 tw-text-sm tw-leading-6 tw-text-sky-100"
      >
        {t(DEFAULT_LOCALE, "publicReview.feedback.hashingReference")}
      </output>
    );
  }

  if (integrityStatus === "unavailable" || !selection) {
    return (
      <div
        role="alert"
        className="tw-border-red-500/40 tw-bg-red-950/30 tw-text-red-100 tw-rounded-xl tw-border tw-border-solid tw-p-4 tw-text-sm tw-leading-6"
      >
        {t(DEFAULT_LOCALE, "publicReview.feedback.hashUnavailable")}
      </div>
    );
  }

  return (
    <PublicReviewFeedbackComposer
      locale={DEFAULT_LOCALE}
      config={config}
      destination={destination}
      page={page}
      referenceSelection={selection}
    />
  );
}
