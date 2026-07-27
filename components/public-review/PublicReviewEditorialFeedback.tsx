"use client";

import { useMemo, useState } from "react";

import PublicReviewFeedbackComposer from "@/components/public-review/PublicReviewFeedbackComposer";
import { PublicReviewPageComments } from "@/components/public-review/PublicReviewPageComments";
import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import type { PublicReviewSectionDefinition } from "@/lib/public-review/publicReviewTypes";
import type {
  PublicReviewDiscussionDestination,
  PublicReviewFeedbackConfig,
  PublicReviewPageContext,
} from "@/services/api/public-review/types";

export function PublicReviewEditorialFeedback({
  config,
  destination,
  page,
  sections,
}: {
  readonly config: PublicReviewFeedbackConfig;
  readonly destination: PublicReviewDiscussionDestination;
  readonly page: PublicReviewPageContext;
  readonly sections: readonly PublicReviewSectionDefinition[];
}) {
  const [sectionId, setSectionId] = useState("");
  const selectedSection = sections.find((section) => section.id === sectionId);
  const pageContext = useMemo<PublicReviewPageContext>(
    () => ({
      ...page,
      ...(selectedSection
        ? {
            sectionId: selectedSection.id,
            sectionTitle: selectedSection.title,
          }
        : {}),
    }),
    [page, selectedSection]
  );

  return (
    <div className="tw-space-y-5">
      <PublicReviewPageComments
        config={config}
        destination={destination}
        locale={DEFAULT_LOCALE}
        page={page}
      />
      <div className="tw-border-x-0 tw-border-b-0 tw-border-t tw-border-solid tw-border-white/10 tw-pt-5">
        <label
          id="public-review-editorial-feedback-context"
          htmlFor="public-review-feedback-section"
          className="tw-block tw-text-sm tw-font-semibold tw-text-iron-100"
        >
          {t(DEFAULT_LOCALE, "publicReview.feedback.sectionSelector")}
        </label>
        <select
          id="public-review-feedback-section"
          value={sectionId}
          onChange={(event) => setSectionId(event.target.value)}
          className="tw-mt-2 tw-min-h-11 tw-w-full tw-rounded-lg tw-border tw-border-solid tw-border-white/10 tw-bg-black tw-px-3 tw-py-2 tw-text-base tw-text-iron-50 tw-outline-none focus:tw-border-primary-400 focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400/40"
        >
          <option value="">
            {t(DEFAULT_LOCALE, "publicReview.feedback.wholePage")}
          </option>
          {sections.map((section) => (
            <option key={section.id} value={section.id}>
              {section.title}
            </option>
          ))}
        </select>
      </div>
      <PublicReviewFeedbackComposer
        locale={DEFAULT_LOCALE}
        config={config}
        destination={destination}
        page={pageContext}
      />
    </div>
  );
}
