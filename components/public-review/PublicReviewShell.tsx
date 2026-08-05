import { ArrowLeftIcon, ArrowRightIcon } from "@heroicons/react/24/outline";
import Link from "next/link";
import type { ReactNode } from "react";

import { PublicReviewAudiencePaths } from "@/components/public-review/PublicReviewAudiencePaths";
import { PublicReviewEvidenceLegend } from "@/components/public-review/PublicReviewEvidence";
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
          className="tw-group tw-inline-flex tw-min-h-11 tw-items-center tw-gap-3 tw-justify-self-start tw-text-left tw-no-underline focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-4 focus-visible:tw-outline-white"
        >
          <ArrowLeftIcon
            className="tw-size-4 tw-flex-none tw-text-iron-600 tw-transition-colors group-hover:tw-text-primary-300"
            aria-hidden="true"
          />
          <span>
            <span className="tw-block tw-text-[0.65rem] tw-font-semibold tw-uppercase tw-tracking-[0.12em] tw-text-iron-400">
              {t(DEFAULT_LOCALE, "publicReview.navigation.previous")}
            </span>
            <span className="tw-mt-1 tw-block tw-text-[0.95rem] tw-font-medium tw-text-iron-300 tw-transition-colors tw-duration-200 tw-ease-out group-hover:tw-text-primary-300">
              {t(DEFAULT_LOCALE, previousPage.titleKey)}
            </span>
          </span>
        </Link>
      ) : (
        <span aria-hidden="true" />
      )}
      {nextPage && (
        <Link
          href={routes.getPageHref(nextPage, version)}
          className="tw-group tw-inline-flex tw-min-h-11 tw-items-center tw-justify-end tw-gap-3 tw-justify-self-end tw-text-right tw-no-underline focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-4 focus-visible:tw-outline-white"
        >
          <span>
            <span className="tw-block tw-text-[0.65rem] tw-font-semibold tw-uppercase tw-tracking-[0.12em] tw-text-iron-400">
              {t(DEFAULT_LOCALE, "publicReview.navigation.next")}
            </span>
            <span className="tw-mt-1 tw-block tw-text-[0.95rem] tw-font-medium tw-text-iron-300 tw-transition-colors tw-duration-200 tw-ease-out group-hover:tw-text-primary-300">
              {t(DEFAULT_LOCALE, nextPage.titleKey)}
            </span>
          </span>
          <ArrowRightIcon
            className="tw-size-4 tw-flex-none tw-text-iron-600 tw-transition-colors group-hover:tw-text-primary-300"
            aria-hidden="true"
          />
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
  introNotice,
  showAudiencePaths = true,
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
  readonly introNotice?: ReactNode;
  readonly showAudiencePaths?: boolean;
  readonly source: PublicReviewSource;
}) {
  const pageIndex = reviewVersion.pages.findIndex(
    (candidate) => candidate.id === page.id
  );
  const currentPageNumber = pageIndex >= 0 ? pageIndex + 1 : 1;
  const routes = createPublicReviewRouteBuilder(review.slug);

  return (
    <div className="tailwind-scope tw-min-h-screen tw-bg-[#0D0D0F] tw-text-iron-50">
      <div className="tw-w-full lg:tw-grid lg:tw-grid-cols-[17.5rem_minmax(0,1fr)] lg:tw-items-stretch">
        <PublicReviewNavigation
          currentPage={page}
          feedbackHref={routes.getFeedbackHref(routeVersion)}
          pages={reviewVersion.pages}
          referenceHref={getSolidityReferenceRootHref({
            reviewSlug: review.slug,
            version: routeVersion,
          })}
          routes={routes}
          sections={sections}
          version={routeVersion}
        />

        <div className="tw-min-h-screen tw-min-w-0 tw-border-y-0 tw-border-b-0 tw-border-l-0 tw-border-r tw-border-t-0 tw-border-solid tw-border-iron-900 tw-bg-[#0D0D0F]">
          <PublicReviewReadingLayout
            feedbackAvailable={review.feedbackAvailable}
            panel={feedbackSlot}
            toolbar={
              <p
                key="review-page-position"
                className="tw-m-0 tw-font-mono tw-text-[0.68rem] tw-font-medium tw-uppercase tw-tracking-[0.12em] tw-text-iron-400"
              >
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
              <div
                key="review-reading-content"
                className="tw-mx-auto tw-w-full tw-max-w-[68rem] tw-px-4 tw-pb-20 sm:tw-px-7 lg:tw-px-10"
              >
                <div className="tw-pt-6 sm:tw-pt-8">
                  <PublicReviewStatusBanner
                    review={review}
                    displayedVersion={displayedVersion}
                    source={source}
                  />
                </div>

                <header className="tw-mt-12 tw-w-full tw-max-w-[52rem] sm:tw-mt-16">
                  <p className="tw-m-0 tw-text-[0.7rem] tw-font-semibold tw-uppercase tw-tracking-[0.14em] tw-text-primary-300">
                    {t(DEFAULT_LOCALE, "publicReview.eyebrow", {
                      contract: review.contractName,
                    })}
                  </p>
                  <h1 className="tw-mb-0 tw-mt-4 tw-max-w-3xl tw-text-4xl tw-font-semibold tw-leading-[1.05] tw-tracking-[-0.03em] tw-text-white sm:tw-text-5xl">
                    {t(DEFAULT_LOCALE, page.titleKey)}
                  </h1>
                  <p className="tw-mb-0 tw-mt-5 tw-max-w-3xl tw-text-pretty tw-text-lg tw-font-normal tw-leading-8 tw-text-iron-300">
                    {t(DEFAULT_LOCALE, page.summaryKey)}
                  </p>
                </header>

                {introNotice}

                {page.id === "overview" && showAudiencePaths && (
                  <div className="tw-mt-10 tw-w-full">
                    <PublicReviewAudiencePaths
                      entryPageIds={reviewVersion.audienceEntryPageIds}
                      pages={reviewVersion.pages}
                      routes={routes}
                      version={routeVersion}
                    />
                  </div>
                )}

                <div className="tw-mt-12 tw-w-full tw-max-w-[52rem] sm:tw-mt-16">
                  <article className="tw-pb-8">
                    <PublicReviewMarkdown
                      internalLinkBasePath={routes.getRootHref(routeVersion)}
                      markdown={editorialMarkdown}
                    />
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
