"use client";

import { ChevronDownIcon } from "@heroicons/react/24/outline";
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
    <div className="tw-flex tw-min-h-0 tw-flex-col @[960px]:tw-h-full">
      <div className="tw-min-h-0 tw-flex-1 tw-overflow-y-auto tw-overscroll-contain tw-bg-iron-950/40 tw-px-5 tw-py-4 tw-scrollbar-thin tw-scrollbar-track-transparent tw-scrollbar-thumb-iron-700/70 desktop-hover:hover:tw-scrollbar-thumb-iron-500">
        <PublicReviewPageComments
          config={config}
          destination={destination}
          locale={DEFAULT_LOCALE}
          page={page}
        />
      </div>
      <div className="tw-max-h-[65vh] tw-flex-none tw-overflow-y-auto tw-overscroll-contain tw-border-x-0 tw-border-b-0 tw-border-t tw-border-solid tw-border-white/[0.08] tw-bg-[#08080a] tw-px-5 tw-pb-5 tw-scrollbar-thin tw-scrollbar-track-transparent tw-scrollbar-thumb-iron-700/70 desktop-hover:hover:tw-scrollbar-thumb-iron-500 [&>section]:tw-border-t-0">
        <PublicReviewFeedbackComposer
          locale={DEFAULT_LOCALE}
          config={config}
          contextControl={
            <label
              id="public-review-editorial-feedback-context"
              htmlFor="public-review-feedback-section"
              className="tw-block tw-text-[11px] tw-font-medium tw-text-iron-400"
            >
              <span className="tw-mb-1.5 tw-block">
                {t(DEFAULT_LOCALE, "publicReview.feedback.sectionSelector")}
              </span>
              <span className="tw-relative tw-block">
                <select
                  id="public-review-feedback-section"
                  value={sectionId}
                  onChange={(event) => setSectionId(event.target.value)}
                  className="tw-min-h-11 tw-w-full tw-appearance-none tw-rounded-lg tw-border-0 tw-bg-iron-950 tw-px-3 tw-py-2 tw-pr-9 tw-text-sm tw-text-iron-50 tw-outline-none tw-ring-1 tw-ring-inset tw-ring-iron-700 tw-transition focus:tw-bg-black focus:tw-ring-1 focus:tw-ring-primary-400 focus-visible:tw-ring-1 focus-visible:tw-ring-primary-400"
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
                <ChevronDownIcon
                  aria-hidden="true"
                  className="tw-pointer-events-none tw-absolute tw-right-3 tw-top-1/2 tw-size-4 tw--translate-y-1/2 tw-text-iron-500"
                />
              </span>
            </label>
          }
          destination={destination}
          page={pageContext}
        />
      </div>
    </div>
  );
}
