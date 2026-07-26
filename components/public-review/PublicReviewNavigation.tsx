import Link from "next/link";

import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import type {
  PublicReviewPageDefinition,
  PublicReviewSectionDefinition,
} from "@/lib/public-review/publicReviewTypes";
import type { PublicReviewRouteBuilder } from "@/lib/public-review/publicReviewRoutes";

function ReviewPageLinks({
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
  return (
    <ol className="tw-m-0 tw-list-none tw-space-y-1 tw-p-0">
      {pages.map((page, index) => {
        const isCurrent = page.id === currentPage.id;
        return (
          <li key={page.id}>
            <Link
              href={routes.getPageHref(page, version)}
              aria-current={isCurrent ? "page" : undefined}
              className={`tw-flex tw-gap-3 tw-rounded-lg tw-px-3 tw-py-2.5 tw-text-sm tw-leading-5 tw-no-underline focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-white ${
                isCurrent
                  ? "tw-bg-iron-700 tw-font-semibold tw-text-white"
                  : "tw-text-iron-300 hover:tw-bg-iron-800 hover:tw-text-white"
              }`}>
              <span
                aria-hidden="true"
                className="tw-w-6 tw-flex-none tw-font-mono tw-text-xs tw-text-iron-500">
                {String(index + 1).padStart(2, "0")}
              </span>
              <span>{t(DEFAULT_LOCALE, page.titleKey)}</span>
            </Link>
          </li>
        );
      })}
    </ol>
  );
}

function ReviewSectionLinks({
  sections,
}: {
  readonly sections: readonly PublicReviewSectionDefinition[];
}) {
  return (
    <ul className="tw-m-0 tw-list-none tw-space-y-2 tw-border-y-0 tw-border-b-0 tw-border-r-0 tw-border-l tw-border-solid tw-border-iron-700 tw-p-0 tw-pl-4">
      {sections.map((section) => (
        <li key={section.id}>
          <a
            href={`#${section.id}`}
            className="tw-text-sm tw-leading-5 tw-text-iron-400 tw-no-underline hover:tw-text-white focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-white">
            {section.title}
          </a>
        </li>
      ))}
    </ul>
  );
}

export function PublicReviewNavigation({
  currentPage,
  pages,
  routes,
  sections,
  version,
}: {
  readonly currentPage: PublicReviewPageDefinition;
  readonly pages: readonly PublicReviewPageDefinition[];
  readonly routes: PublicReviewRouteBuilder;
  readonly sections: readonly PublicReviewSectionDefinition[];
  readonly version?: string | undefined;
}) {
  const onThisPageLabel = t(
    DEFAULT_LOCALE,
    "publicReview.navigation.onThisPage"
  );
  return (
    <>
      <details className="tw-rounded-xl tw-border tw-border-solid tw-border-iron-700 tw-bg-iron-900 tw-p-4 lg:tw-hidden">
        <summary className="tw-min-h-11 tw-cursor-pointer tw-py-2 tw-text-sm tw-font-semibold tw-text-white marker:tw-text-iron-400 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-white">
          {t(DEFAULT_LOCALE, "publicReview.navigation.contents")}
        </summary>
        <nav
          aria-label={t(
            DEFAULT_LOCALE,
            "publicReview.navigation.contentsLabel"
          )}
          className="tw-mt-4">
          <ReviewPageLinks
            currentPage={currentPage}
            pages={pages}
            routes={routes}
            version={version}
          />
        </nav>
        {sections.length > 0 && (
          <nav
            aria-label={onThisPageLabel}
            className="tw-mt-6">
            <p className="tw-mb-3 tw-mt-0 tw-text-xs tw-font-semibold tw-uppercase tw-tracking-[0.12em] tw-text-iron-400">
              {onThisPageLabel}
            </p>
            <ReviewSectionLinks sections={sections} />
          </nav>
        )}
      </details>

      <aside className="tw-hidden lg:tw-block">
        <div className="tw-sticky tw-top-28 tw-max-h-[calc(100vh-8rem)] tw-space-y-6 tw-overflow-y-auto tw-pr-2">
          <nav
            aria-label={t(
              DEFAULT_LOCALE,
              "publicReview.navigation.contentsLabel"
            )}>
            <p className="tw-mb-3 tw-mt-0 tw-text-xs tw-font-semibold tw-uppercase tw-tracking-[0.12em] tw-text-iron-400">
              {t(DEFAULT_LOCALE, "publicReview.navigation.contents")}
            </p>
            <ReviewPageLinks
              currentPage={currentPage}
              pages={pages}
              routes={routes}
              version={version}
            />
          </nav>
          {sections.length > 0 && (
            <nav aria-label={onThisPageLabel}>
              <p className="tw-mb-3 tw-mt-0 tw-text-xs tw-font-semibold tw-uppercase tw-tracking-[0.12em] tw-text-iron-400">
                {onThisPageLabel}
              </p>
              <ReviewSectionLinks sections={sections} />
            </nav>
          )}
        </div>
      </aside>
    </>
  );
}
