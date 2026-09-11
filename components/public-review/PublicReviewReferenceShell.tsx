import { ChatBubbleLeftRightIcon } from "@heroicons/react/24/outline";
import type { ReactNode } from "react";

import { PublicReviewStatusBanner } from "@/components/public-review/PublicReviewStatusBanner";
import { PublicReviewSurfaceNavigation } from "@/components/public-review/PublicReviewSurfaceNavigation";
import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import { getPublicReviewLifecycleCapabilities } from "@/lib/public-review/publicReviewLifecycle";
import type {
  PublicReviewDefinition,
  PublicReviewSource,
} from "@/lib/public-review/publicReviewTypes";

export function PublicReviewReferenceShell({
  children,
  description,
  displayedVersion,
  editorialHref,
  feedbackHref,
  referenceHref,
  review,
  source,
  title,
}: {
  readonly children: ReactNode;
  readonly description: string;
  readonly displayedVersion: string;
  readonly editorialHref: string;
  readonly feedbackHref: string;
  readonly referenceHref: string;
  readonly review: PublicReviewDefinition;
  readonly source: PublicReviewSource;
  readonly title: string;
}) {
  const displayedReviewVersion = review.versions.find(
    (candidate) => candidate.version === displayedVersion
  );
  if (!displayedReviewVersion) {
    throw new Error("The displayed public-review version is not configured.");
  }
  const feedbackSubmissionsAvailable =
    review.feedbackAvailable &&
    getPublicReviewLifecycleCapabilities(displayedReviewVersion.status)
      .feedbackSubmissionsOpen;

  return (
    <div className="tailwind-scope tw-min-h-screen tw-bg-[#0D0D0F] tw-text-white">
      <div className="tw-mx-auto tw-w-full tw-max-w-[76rem] tw-px-4 tw-pb-20 tw-pt-6 sm:tw-px-7 lg:tw-px-10">
        <PublicReviewStatusBanner
          review={review}
          displayedVersion={displayedVersion}
          source={source}
        />
        <PublicReviewSurfaceNavigation
          action={
            feedbackSubmissionsAvailable ? (
              <a
                className="tw-group/feedback-link tw-inline-flex tw-min-h-10 tw-items-center tw-gap-2 tw-bg-transparent tw-px-0 tw-text-xs tw-font-semibold tw-text-iron-400 tw-no-underline focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-4 focus-visible:tw-outline-white"
                href="#public-review-feedback"
              >
                <ChatBubbleLeftRightIcon
                  aria-hidden="true"
                  className="tw-size-4 tw-flex-none tw-transition-colors group-hover/feedback-link:tw-text-primary-300"
                />
                <span className="tw-transition-colors group-hover/feedback-link:tw-text-primary-300">
                  {t(DEFAULT_LOCALE, "publicReview.feedback.title")}
                </span>
              </a>
            ) : null
          }
          activeSurface="reference"
          feedbackHref={feedbackHref}
          referenceHref={referenceHref}
          reviewHref={editorialHref}
        />

        <header className="tw-mt-14 tw-max-w-[52rem]">
          <p className="tw-m-0 tw-text-[0.68rem] tw-font-semibold tw-uppercase tw-tracking-[0.14em] tw-text-sky-300">
            {t(DEFAULT_LOCALE, "publicReview.reference.eyebrow")}
          </p>
          <h1 className="tw-[overflow-wrap:anywhere] tw-mb-0 tw-mt-4 tw-min-w-0 tw-break-words tw-text-[2rem] tw-font-semibold tw-leading-[1.05] tw-tracking-[-0.03em] tw-text-white sm:tw-text-5xl">
            {title}
          </h1>
          <p className="tw-mb-0 tw-mt-5 tw-max-w-4xl tw-text-pretty tw-text-base tw-font-light tw-leading-7 tw-text-iron-300 sm:tw-text-lg sm:tw-leading-8">
            {description}
          </p>
          <span className="tw-mt-6 tw-inline-flex tw-items-center tw-gap-2 tw-text-[0.68rem] tw-font-semibold tw-uppercase tw-tracking-[0.12em] tw-text-sky-300">
            <span aria-hidden="true" className="tw-size-1.5 tw-bg-sky-400" />
            {t(DEFAULT_LOCALE, "publicReview.reference.generatedLabel")}
          </span>
        </header>

        <div className="tw-mt-12">{children}</div>
      </div>
    </div>
  );
}
