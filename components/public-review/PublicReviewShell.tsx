import Link from "next/link";
import type { ReactNode } from "react";

import { PublicReviewAudiencePaths } from "@/components/public-review/PublicReviewAudiencePaths";
import {
  PublicReviewEvidenceBadge,
  PublicReviewEvidenceLegend,
} from "@/components/public-review/PublicReviewEvidence";
import { PublicReviewMarkdown } from "@/components/public-review/PublicReviewMarkdown";
import { PublicReviewNavigation } from "@/components/public-review/PublicReviewNavigation";
import { PublicReviewReadingLayout } from "@/components/public-review/PublicReviewReadingLayout";
import { PublicReviewStatusBanner } from "@/components/public-review/PublicReviewStatusBanner";
import { formatInteger } from "@/i18n/format";
import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import type {
  PublicReviewDefinition,
  PublicReviewPageDefinition,
  PublicReviewSectionDefinition,
  PublicReviewSource,
  PublicReviewVersionDefinition,
} from "@/lib/public-review/publicReviewTypes";
import { getPublicReviewLifecycleCapabilities } from "@/lib/public-review/publicReviewLifecycle";
import {
  createPublicReviewRouteBuilder,
  type PublicReviewRouteBuilder,
} from "@/lib/public-review/publicReviewRoutes";
import { getSolidityReferenceRootHref } from "@/lib/public-review/solidityReferenceRoutes";

function PublicReviewPageStepper({
  currentPage,
  pages,
  routes,
  version,
}: {
  readonly currentPage: PublicReviewPageDefinition;
  readonly pages: readonly PublicReviewPageDefinition[];
  readonly routes: PublicReviewRouteBuilder;
  readonly version?: string | undefined;
}) {
  const currentIndex = pages.findIndex((page) => page.id === currentPage.id);
  const previousPage = currentIndex > 0 ? pages[currentIndex - 1] : undefined;
  const nextPage =
    currentIndex < pages.length - 1 ? pages[currentIndex + 1] : undefined;

  return (
    <nav
      aria-label={t(DEFAULT_LOCALE, "publicReview.navigation.sequenceLabel")}
      className="tw-mt-14 tw-grid tw-gap-3 tw-border-x-0 tw-border-b-0 tw-border-t tw-border-solid tw-border-white/[0.08] tw-pt-6 sm:tw-grid-cols-2"
    >
      {previousPage ? (
        <Link
          href={routes.getPageHref(previousPage, version)}
          className="tw-group tw-rounded-lg tw-border tw-border-solid tw-border-transparent tw-bg-white/[0.018] tw-px-4 tw-py-3.5 tw-text-left tw-no-underline tw-transition-colors hover:tw-border-white/10 hover:tw-bg-white/[0.04] focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-white"
        >
          <span className="tw-block tw-text-[0.68rem] tw-font-semibold tw-uppercase tw-tracking-[0.1em] tw-text-iron-500">
            {t(DEFAULT_LOCALE, "publicReview.navigation.previous")}
          </span>
          <span className="tw-mt-1 tw-block tw-text-sm tw-font-semibold tw-text-iron-200 group-hover:tw-text-white">
            {t(DEFAULT_LOCALE, previousPage.titleKey)}
          </span>
        </Link>
      ) : (
        <span aria-hidden="true" />
      )}
      {nextPage && (
        <Link
          href={routes.getPageHref(nextPage, version)}
          className="tw-group tw-rounded-lg tw-border tw-border-solid tw-border-transparent tw-bg-white/[0.018] tw-px-4 tw-py-3.5 tw-text-left tw-no-underline tw-transition-colors hover:tw-border-white/10 hover:tw-bg-white/[0.04] focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-white sm:tw-text-right"
        >
          <span className="tw-block tw-text-[0.68rem] tw-font-semibold tw-uppercase tw-tracking-[0.1em] tw-text-iron-500">
            {t(DEFAULT_LOCALE, "publicReview.navigation.next")}
          </span>
          <span className="tw-mt-1 tw-block tw-text-sm tw-font-semibold tw-text-iron-200 group-hover:tw-text-white">
            {t(DEFAULT_LOCALE, nextPage.titleKey)}
          </span>
        </Link>
      )}
    </nav>
  );
}

export function PublicReviewShell({
  editorialMarkdown,
  page,
  review,
  reviewVersion,
  sections,
  routeVersion,
  displayedVersion,
  feedbackSlot,
  source,
}: {
  readonly editorialMarkdown: string;
  readonly page: PublicReviewPageDefinition;
  readonly review: PublicReviewDefinition;
  readonly reviewVersion: PublicReviewVersionDefinition;
  readonly sections: readonly PublicReviewSectionDefinition[];
  readonly routeVersion?: string | undefined;
  readonly displayedVersion: string;
  readonly feedbackSlot: ReactNode;
  readonly source: PublicReviewSource;
}) {
  const pageIndex = reviewVersion.pages.findIndex(
    (candidate) => candidate.id === page.id
  );
  const currentPageNumber = pageIndex >= 0 ? pageIndex + 1 : 1;
  const routes = createPublicReviewRouteBuilder(review.slug);
  const lifecycleCapabilities = getPublicReviewLifecycleCapabilities(
    reviewVersion.status
  );
  const feedbackSubmissionsAvailable =
    review.feedbackAvailable && lifecycleCapabilities.feedbackSubmissionsOpen;

  return (
    <div className="tailwind-scope tw-min-h-screen tw-bg-[#0D0D0F] tw-text-iron-50">
      <div className="tw-w-full lg:tw-grid lg:tw-grid-cols-[17.5rem_minmax(0,1fr)] lg:tw-items-stretch">
        <PublicReviewNavigation
          currentPage={page}
          pages={reviewVersion.pages}
          routes={routes}
          sections={sections}
          version={routeVersion}
        />

        <div className="tw-min-h-screen tw-min-w-0 tw-border-y-0 tw-border-b-0 tw-border-l-0 tw-border-r tw-border-t-0 tw-border-solid tw-border-iron-900 tw-bg-[#0D0D0F]">
          <PublicReviewReadingLayout
            feedbackAvailable={review.feedbackAvailable}
            ledgerHref={routes.getFeedbackHref(routeVersion)}
            panel={feedbackSlot}
            reviewVersion={displayedVersion}
            toolbar={
              <p className="tw-m-0 tw-font-mono tw-text-[0.68rem] tw-font-medium tw-uppercase tw-tracking-[0.12em] tw-text-iron-500">
                {t(DEFAULT_LOCALE, "publicReview.navigation.pagePosition", {
                  current: formatInteger(DEFAULT_LOCALE, currentPageNumber),
                  total: formatInteger(
                    DEFAULT_LOCALE,
                    reviewVersion.pages.length
                  ),
                })}
              </p>
            }
            content={
              <div className="tw-mx-auto tw-w-full tw-max-w-[72rem] tw-px-4 tw-pb-20 sm:tw-px-7 lg:tw-px-10">
                <div className="tw-pt-6 sm:tw-pt-8">
                  <PublicReviewStatusBanner
                    review={review}
                    displayedVersion={displayedVersion}
                    source={source}
                  />
                </div>

                <header className="tw-mx-auto tw-mt-10 tw-max-w-3xl sm:tw-mt-12">
                  <p className="tw-m-0 tw-text-[0.7rem] tw-font-semibold tw-uppercase tw-tracking-[0.14em] tw-text-primary-300">
                    {t(DEFAULT_LOCALE, "publicReview.eyebrow", {
                      contract: review.contractName,
                    })}
                  </p>
                  <h1 className="tw-mb-0 tw-mt-4 tw-max-w-3xl tw-text-[22px] tw-font-semibold tw-leading-tight tw-tracking-tight tw-text-iron-50 sm:tw-text-[26px]">
                    {t(DEFAULT_LOCALE, page.titleKey)}
                  </h1>
                  <p className="tw-mb-0 tw-mt-3 tw-max-w-2xl tw-text-base tw-font-light tw-leading-7 tw-text-iron-400">
                    {t(DEFAULT_LOCALE, page.summaryKey)}
                  </p>
                  <div
                    aria-label={t(
                      DEFAULT_LOCALE,
                      "publicReview.evidence.heading"
                    )}
                    className="tw-mt-6 tw-flex tw-flex-wrap tw-gap-2"
                  >
                    {page.evidenceStates.map((state) => (
                      <PublicReviewEvidenceBadge key={state} state={state} />
                    ))}
                  </div>
                  <div className="tw-mt-6 tw-flex tw-flex-wrap tw-gap-2.5">
                    <Link
                      href={getSolidityReferenceRootHref({
                        reviewSlug: review.slug,
                        version: routeVersion,
                      })}
                      className="tw-inline-flex tw-min-h-11 tw-items-center tw-rounded-lg tw-border tw-border-solid tw-border-white/10 tw-bg-white/[0.025] tw-px-4 tw-py-2 tw-text-sm tw-font-semibold tw-text-iron-200 tw-no-underline tw-transition-colors hover:tw-border-primary-300/40 hover:tw-bg-white/[0.045] hover:tw-text-white focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-white"
                    >
                      {t(
                        DEFAULT_LOCALE,
                        "publicReview.reference.openReference"
                      )}
                    </Link>
                    {review.feedbackAvailable ? (
                      <Link
                        href={routes.getFeedbackHref(routeVersion)}
                        className="tw-inline-flex tw-min-h-11 tw-items-center tw-rounded-lg tw-border tw-border-solid tw-border-white/10 tw-bg-white/[0.025] tw-px-4 tw-py-2 tw-text-sm tw-font-semibold tw-text-iron-200 tw-no-underline tw-transition-colors hover:tw-border-primary-300/40 hover:tw-bg-white/[0.045] hover:tw-text-white focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-white"
                      >
                        {t(DEFAULT_LOCALE, "publicReview.ledger.navigation")}
                      </Link>
                    ) : null}
                    {feedbackSubmissionsAvailable ? (
                      <a
                        href="#public-review-feedback"
                        className="tw-inline-flex tw-min-h-11 tw-items-center tw-rounded-lg tw-border tw-border-solid tw-border-primary-400/25 tw-bg-primary-400/[0.07] tw-px-4 tw-py-2 tw-text-sm tw-font-semibold tw-text-primary-100 tw-no-underline tw-transition-colors hover:tw-border-primary-300/50 hover:tw-bg-primary-400/[0.11] hover:tw-text-white focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-white"
                      >
                        {t(DEFAULT_LOCALE, "publicReview.feedback.jump")}
                      </a>
                    ) : null}
                  </div>
                </header>

                {page.id === "overview" && (
                  <div className="tw-mx-auto tw-mt-10 tw-max-w-3xl">
                    <PublicReviewAudiencePaths
                      pages={reviewVersion.pages}
                      routes={routes}
                      version={routeVersion}
                    />
                  </div>
                )}

                <div className="tw-mx-auto tw-mt-10 tw-max-w-3xl sm:tw-mt-12">
                  <article className="tw-border-x-0 tw-border-b-0 tw-border-t tw-border-solid tw-border-white/[0.08] tw-pb-8 tw-pt-1">
                    <PublicReviewMarkdown markdown={editorialMarkdown} />
                  </article>

                  <div className="tw-mt-8">
                    <PublicReviewEvidenceLegend />
                  </div>

                  <PublicReviewPageStepper
                    currentPage={page}
                    pages={reviewVersion.pages}
                    routes={routes}
                    version={routeVersion}
                  />
                </div>
              </div>
            }
          />
        </div>
      </div>
    </div>
  );
}
