"use client";

import {
  ChevronDownIcon,
  PlusIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { useEffect, useMemo, useRef, useState } from "react";

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
  const composerDisclosureRef = useRef<HTMLDetailsElement>(null);
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

  useEffect(() => {
    const revealComposerForFeedbackHash = (): void => {
      if (window.location.hash === "#public-review-feedback") {
        composerDisclosureRef.current?.setAttribute("open", "");
      }
    };

    const revealTimer = window.setTimeout(revealComposerForFeedbackHash, 0);
    window.addEventListener("hashchange", revealComposerForFeedbackHash);
    return () => {
      window.clearTimeout(revealTimer);
      window.removeEventListener("hashchange", revealComposerForFeedbackHash);
    };
  }, []);

  return (
    <div className="tw-flex tw-min-h-0 tw-flex-col @[760px]:tw-h-full">
      <div className="tw-min-h-0 tw-flex-1 tw-overflow-y-auto tw-overscroll-contain tw-px-5 tw-py-4 tw-scrollbar-thin tw-scrollbar-track-transparent tw-scrollbar-thumb-iron-700/70 desktop-hover:hover:tw-scrollbar-thumb-iron-500">
        <PublicReviewPageComments
          config={config}
          destination={destination}
          locale={DEFAULT_LOCALE}
          page={page}
          sections={sections}
        />
      </div>
      <details
        ref={composerDisclosureRef}
        className="tw-group tw-flex-none tw-overflow-y-auto tw-overscroll-contain tw-border-x-0 tw-border-b-0 tw-border-t tw-border-solid tw-border-transparent tw-bg-transparent tw-scrollbar-thin tw-scrollbar-track-transparent tw-scrollbar-thumb-iron-700/70 open:tw-max-h-[70vh] open:tw-border-white/[0.08] open:tw-bg-[#0D0D0F] desktop-hover:hover:tw-scrollbar-thumb-iron-500"
      >
        <summary className="tw-mx-auto tw-mb-5 tw-mt-3 tw-flex tw-min-h-11 tw-w-fit tw-cursor-pointer tw-list-none tw-items-center tw-justify-center tw-gap-3 tw-rounded-full tw-border-0 tw-bg-primary-600 tw-px-5 tw-py-2 tw-text-xs tw-font-semibold tw-text-white tw-shadow-[0_12px_28px_rgba(0,0,0,0.42)] tw-transition-[transform,background-color,box-shadow,color] tw-duration-200 tw-ease-out desktop-hover:hover:-tw-translate-y-0.5 desktop-hover:hover:tw-bg-primary-500 desktop-hover:hover:tw-shadow-[0_16px_34px_rgba(0,0,0,0.5)] active:tw-translate-y-0 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-primary-300 group-open:tw-mx-5 group-open:tw-mb-3 group-open:tw-mt-4 group-open:tw-w-auto group-open:tw-translate-y-0 group-open:tw-justify-between group-open:tw-rounded-none group-open:tw-bg-transparent group-open:tw-px-0 group-open:tw-py-0 group-open:tw-text-sm group-open:tw-text-iron-100 group-open:tw-shadow-none desktop-hover:group-open:hover:tw-translate-y-0 desktop-hover:group-open:hover:tw-bg-transparent desktop-hover:group-open:hover:tw-shadow-none motion-reduce:tw-transform-none motion-reduce:tw-transition-none [&::-webkit-details-marker]:tw-hidden">
          <span className="tw-flex tw-items-center tw-gap-2">
            <PlusIcon
              className="tw-size-3.5 tw-flex-none group-open:tw-hidden"
              aria-hidden="true"
            />
            {t(DEFAULT_LOCALE, "publicReview.feedback.title")}
          </span>
          <XMarkIcon
            className="tw-hidden tw-size-4 tw-flex-none tw-text-iron-400 group-open:tw-block"
            aria-hidden="true"
          />
        </summary>
        <div className="tw-px-5 tw-pb-5 [&>section]:tw-border-t-0 [&>section]:tw-pt-0">
          <PublicReviewFeedbackComposer
            locale={DEFAULT_LOCALE}
            config={config}
            contextControl={
              <label
                id="public-review-editorial-feedback-context"
                htmlFor="public-review-feedback-section"
                className="tw-block tw-text-[11px] tw-font-medium tw-text-iron-300"
              >
                <span className="tw-mb-1.5 tw-block">
                  {t(DEFAULT_LOCALE, "publicReview.feedback.sectionSelector")}
                </span>
                <span className="tw-relative tw-block">
                  <select
                    id="public-review-feedback-section"
                    value={sectionId}
                    onChange={(event) => setSectionId(event.target.value)}
                    className="tw-min-h-11 tw-w-full tw-appearance-none tw-rounded-lg tw-border-0 tw-bg-iron-950 tw-px-3 tw-py-2 tw-pr-9 tw-text-sm tw-text-iron-50 tw-outline-none tw-ring-1 tw-ring-inset tw-ring-iron-600 tw-transition focus:tw-bg-black focus:tw-ring-1 focus:tw-ring-primary-400 focus-visible:tw-ring-1 focus-visible:tw-ring-primary-400"
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
      </details>
    </div>
  );
}
