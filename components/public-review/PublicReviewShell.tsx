import Link from "next/link";
import type { ReactNode } from "react";

import { PublicReviewAudiencePaths } from "@/components/public-review/PublicReviewAudiencePaths";
import {
  PublicReviewEvidenceBadge,
  PublicReviewEvidenceLegend,
} from "@/components/public-review/PublicReviewEvidence";
import { PublicReviewMarkdown } from "@/components/public-review/PublicReviewMarkdown";
import { PublicReviewNavigation } from "@/components/public-review/PublicReviewNavigation";
import { PublicReviewStatusBanner } from "@/components/public-review/PublicReviewStatusBanner";
import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import type {
  PublicReviewDefinition,
  PublicReviewPageDefinition,
  PublicReviewSectionDefinition,
} from "@/lib/public-review/publicReviewTypes";
import { getSolidityReferenceRootHref } from "@/lib/public-review/solidityReferenceRoutes";
import { getStreamReviewPageHref } from "@/lib/public-review/streamReviewDefinition";

function PublicReviewPageStepper({
  currentPage,
  pages,
  version,
}: {
  readonly currentPage: PublicReviewPageDefinition;
  readonly pages: readonly PublicReviewPageDefinition[];
  readonly version?: string | undefined;
}) {
  const currentIndex = pages.findIndex((page) => page.id === currentPage.id);
  const previousPage = currentIndex > 0 ? pages[currentIndex - 1] : undefined;
  const nextPage =
    currentIndex < pages.length - 1 ? pages[currentIndex + 1] : undefined;

  return (
    <nav
      aria-label={t(
        DEFAULT_LOCALE,
        "publicReview.navigation.sequenceLabel"
      )}
      className="tw-mt-12 tw-grid tw-gap-3 sm:tw-grid-cols-2">
      {previousPage ? (
        <Link
          href={getStreamReviewPageHref({ page: previousPage, version })}
          className="tw-rounded-xl tw-border tw-border-solid tw-border-iron-700 tw-bg-iron-900 tw-p-4 tw-text-left tw-no-underline hover:tw-border-iron-500 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-white">
          <span className="tw-block tw-text-xs tw-font-semibold tw-uppercase tw-tracking-[0.1em] tw-text-iron-500">
            {t(DEFAULT_LOCALE, "publicReview.navigation.previous")}
          </span>
          <span className="tw-mt-1 tw-block tw-font-semibold tw-text-white">
            {previousPage.title}
          </span>
        </Link>
      ) : (
        <span aria-hidden="true" />
      )}
      {nextPage && (
        <Link
          href={getStreamReviewPageHref({ page: nextPage, version })}
          className="tw-rounded-xl tw-border tw-border-solid tw-border-iron-700 tw-bg-iron-900 tw-p-4 tw-text-left tw-no-underline hover:tw-border-iron-500 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-white sm:tw-text-right">
          <span className="tw-block tw-text-xs tw-font-semibold tw-uppercase tw-tracking-[0.1em] tw-text-iron-500">
            {t(DEFAULT_LOCALE, "publicReview.navigation.next")}
          </span>
          <span className="tw-mt-1 tw-block tw-font-semibold tw-text-white">
            {nextPage.title}
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
  sections,
  routeVersion,
  displayedVersion,
  feedbackSlot,
}: {
  readonly editorialMarkdown: string;
  readonly page: PublicReviewPageDefinition;
  readonly review: PublicReviewDefinition;
  readonly sections: readonly PublicReviewSectionDefinition[];
  readonly routeVersion?: string | undefined;
  readonly displayedVersion: string;
  readonly feedbackSlot: ReactNode;
}) {
  const pageIndex = review.pages.findIndex(
    (candidate) => candidate.id === page.id
  );

  return (
    <main className="tailwind-scope tw-min-h-screen tw-bg-[#0b0b0d] tw-text-white">
      <PublicReviewStatusBanner
        review={review}
        displayedVersion={displayedVersion}
      />
      <div className="tw-mx-auto tw-w-full tw-max-w-[88rem] tw-px-4 tw-pb-20 tw-pt-8 sm:tw-px-6 lg:tw-px-8 lg:tw-pt-12">
        <header className="tw-max-w-4xl">
          <p className="tw-m-0 tw-text-xs tw-font-semibold tw-uppercase tw-tracking-[0.16em] tw-text-amber-300">
            {t(DEFAULT_LOCALE, "publicReview.eyebrow")}
          </p>
          <p className="tw-mb-0 tw-mt-4 tw-font-mono tw-text-xs tw-text-iron-500">
            {t(DEFAULT_LOCALE, "publicReview.navigation.pagePosition", {
              current: pageIndex + 1,
              total: review.pages.length,
            })}
          </p>
          <h1 className="tw-mb-0 tw-mt-3 tw-text-4xl tw-font-semibold tw-tracking-tight tw-text-white sm:tw-text-5xl">
            {page.title}
          </h1>
          <p className="tw-mb-0 tw-mt-5 tw-max-w-3xl tw-text-lg tw-leading-8 tw-text-iron-300">
            {page.summary}
          </p>
          <div
            aria-label={t(DEFAULT_LOCALE, "publicReview.evidence.heading")}
            className="tw-mt-6 tw-flex tw-flex-wrap tw-gap-2">
            {page.evidenceStates.map((state) => (
              <PublicReviewEvidenceBadge key={state} state={state} />
            ))}
          </div>
          <div className="tw-mt-5 tw-flex tw-flex-wrap tw-gap-3">
            <Link
              href={getSolidityReferenceRootHref({
                reviewSlug: review.slug,
                version: routeVersion,
              })}
              className="tw-inline-flex tw-min-h-11 tw-items-center tw-rounded-lg tw-border tw-border-solid tw-border-sky-400/40 tw-bg-sky-400/10 tw-px-4 tw-py-2 tw-font-semibold tw-text-sky-100 tw-no-underline hover:tw-border-sky-300 hover:tw-text-white focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-white">
              {t(DEFAULT_LOCALE, "publicReview.reference.openReference")}
            </Link>
            <Link
              href={`/reviews/${review.slug}/feedback`}
              className="tw-inline-flex tw-min-h-11 tw-items-center tw-rounded-lg tw-border tw-border-solid tw-border-primary-400/40 tw-bg-primary-400/10 tw-px-4 tw-py-2 tw-font-semibold tw-text-primary-100 tw-no-underline hover:tw-border-primary-300 hover:tw-text-white focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-white">
              {t(DEFAULT_LOCALE, "publicReview.ledger.navigation")}
            </Link>
          </div>
        </header>

        {page.id === "overview" && (
          <div className="tw-mt-8">
            <PublicReviewAudiencePaths />
          </div>
        )}

        <div className="tw-mt-8 tw-grid tw-gap-8 lg:tw-grid-cols-[18rem_minmax(0,1fr)] lg:tw-items-start">
          <PublicReviewNavigation
            currentPage={page}
            pages={review.pages}
            sections={sections}
            version={routeVersion}
          />

          <div className="tw-min-w-0">
            <article className="tw-rounded-2xl tw-border tw-border-solid tw-border-iron-800 tw-bg-iron-950 tw-px-5 tw-pb-10 tw-pt-1 sm:tw-px-8 lg:tw-px-10">
              <PublicReviewMarkdown markdown={editorialMarkdown} />
            </article>

            <div className="tw-mt-8">{feedbackSlot}</div>

            <div className="tw-mt-8">
              <PublicReviewEvidenceLegend />
            </div>

            <PublicReviewPageStepper
              currentPage={page}
              pages={review.pages}
              version={routeVersion}
            />
          </div>
        </div>
      </div>
    </main>
  );
}
