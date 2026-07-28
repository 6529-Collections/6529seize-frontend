"use client";

import type { ReactNode } from "react";

import { PublicReviewPageComments } from "@/components/public-review/PublicReviewPageComments";
import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import type {
  PublicReviewDiscussionDestination,
  PublicReviewFeedbackConfig,
  PublicReviewPageContext,
  PublicReviewReferenceSelection,
} from "@/services/api/public-review/types";

const NO_EDITORIAL_SECTIONS = [] as const;

export function PublicReviewTechnicalFeedback({
  children,
  config,
  destination,
  page,
  referenceSelection,
}: {
  readonly children: ReactNode;
  readonly config: PublicReviewFeedbackConfig;
  readonly destination: PublicReviewDiscussionDestination;
  readonly page: PublicReviewPageContext;
  readonly referenceSelection?: PublicReviewReferenceSelection | undefined;
}) {
  return (
    <div className="tw-space-y-6">
      <section
        aria-labelledby="public-review-technical-comments-title"
        className="tw-rounded-xl tw-border tw-border-solid tw-border-white/[0.08] tw-bg-white/[0.018] tw-p-4 sm:tw-p-5"
      >
        <h2
          id="public-review-technical-comments-title"
          className="tw-m-0 tw-text-base tw-font-semibold tw-text-iron-100"
        >
          {t(DEFAULT_LOCALE, "publicReview.comments.title")}
        </h2>
        <PublicReviewPageComments
          config={config}
          destination={destination}
          locale={DEFAULT_LOCALE}
          page={page}
          referenceSelection={referenceSelection}
          sections={NO_EDITORIAL_SECTIONS}
        />
      </section>
      {children}
    </div>
  );
}
