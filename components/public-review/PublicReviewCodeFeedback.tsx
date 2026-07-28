"use client";

import PublicReviewFeedbackComposer, {
  type PublicReviewReferenceIntegrityStatus,
} from "@/components/public-review/PublicReviewFeedbackComposer";
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
  const referenceReady = integrityStatus === "ready" && selection !== undefined;
  let referenceIntegrityStatus: PublicReviewReferenceIntegrityStatus =
    "unavailable";
  if (referenceReady) {
    referenceIntegrityStatus = "ready";
  } else if (integrityStatus === "pending") {
    referenceIntegrityStatus = "pending";
  }
  let referenceIntegrityMessage: string | undefined;
  if (referenceIntegrityStatus === "pending") {
    referenceIntegrityMessage = t(
      DEFAULT_LOCALE,
      "publicReview.feedback.hashingReference"
    );
  } else if (referenceIntegrityStatus === "unavailable") {
    referenceIntegrityMessage = t(
      DEFAULT_LOCALE,
      "publicReview.feedback.hashUnavailable"
    );
  }

  return (
    <PublicReviewFeedbackComposer
      locale={DEFAULT_LOCALE}
      config={config}
      destination={destination}
      page={page}
      referenceIntegrityMessage={referenceIntegrityMessage}
      referenceIntegrityStatus={referenceIntegrityStatus}
      referenceSelection={referenceReady ? selection : undefined}
    />
  );
}
