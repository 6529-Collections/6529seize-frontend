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
  onThisPageLabel,
  pages,
  routes,
  sections,
  version,
}: {
  readonly currentPage: PublicReviewPageDefinition;
  readonly onThisPageLabel: string;
  readonly pages: readonly PublicReviewPageDefinition[];
  readonly routes: PublicReviewRouteBuilder;
  readonly sections: readonly PublicReviewSectionDefinition[];
  readonly version?: string | undefined;
}) {
  return (
    <ol className="tw-m-0 tw-list-none tw-space-y-0.5 tw-p-0">
      {pages.map((page, index) => {
        const isCurrent = page.id === currentPage.id;
        return (
          <li key={page.id}>
            <Link
              href={routes.getPageHref(page, version)}
              aria-current={isCurrent ? "page" : undefined}
              className={`tw-flex tw-min-h-11 tw-items-start tw-gap-3 tw-rounded-r-md tw-border-y-0 tw-border-b-0 tw-border-l-2 tw-border-r-0 tw-border-solid tw-px-3 tw-py-2.5 tw-text-sm tw-leading-5 tw-no-underline tw-transition-colors tw-duration-150 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-white ${
                isCurrent
                  ? "tw-border-primary-300 tw-bg-primary-400/[0.07] tw-font-semibold tw-text-white hover:tw-bg-primary-400/[0.1]"
                  : "tw-border-transparent tw-text-iron-400 hover:tw-border-white/15 hover:tw-bg-white/[0.04] hover:tw-text-iron-100"
              }`}
            >
              <span
                aria-hidden="true"
                className={`tw-w-6 tw-flex-none tw-font-mono tw-text-[0.65rem] ${
                  isCurrent ? "tw-text-primary-300" : "tw-text-iron-600"
                }`}
              >
                {String(index + 1).padStart(2, "0")}
              </span>
              <span>{t(DEFAULT_LOCALE, page.titleKey)}</span>
            </Link>
            {isCurrent && sections.length > 0 ? (
              <nav
                aria-label={onThisPageLabel}
                className="tw-border-y-0 tw-border-b-0 tw-border-l-2 tw-border-r-0 tw-border-solid tw-border-primary-400/25 tw-pb-3 tw-pl-[3.25rem] tw-pr-2 tw-pt-1.5"
              >
                <ReviewSectionLinks sections={sections} />
              </nav>
            ) : null}
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
    <ul className="tw-m-0 tw-list-none tw-space-y-0.5 tw-p-0">
      {sections.map((section) => (
        <li key={section.id}>
          <a
            href={`#${section.id}`}
            className="tw--ml-2 tw-block tw-rounded-md tw-px-2 tw-py-1.5 tw-text-xs tw-leading-5 tw-text-iron-500 tw-no-underline tw-transition-colors tw-duration-150 hover:tw-bg-white/[0.035] hover:tw-text-iron-200 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-white"
          >
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
      <details className="tw-m-4 tw-rounded-lg tw-border tw-border-solid tw-border-white/10 tw-bg-[#08080a] tw-px-4 tw-py-3 sm:tw-mx-7 lg:tw-hidden">
        <summary className="tw-min-h-11 tw-cursor-pointer tw-py-2 tw-text-sm tw-font-semibold tw-text-white marker:tw-text-iron-400 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-white">
          {t(DEFAULT_LOCALE, "publicReview.navigation.contents")}
        </summary>
        <nav
          aria-label={t(
            DEFAULT_LOCALE,
            "publicReview.navigation.contentsLabel"
          )}
          className="tw-mt-4"
        >
          <ReviewPageLinks
            currentPage={currentPage}
            onThisPageLabel={onThisPageLabel}
            pages={pages}
            routes={routes}
            sections={sections}
            version={version}
          />
        </nav>
      </details>

      <aside className="tw-hidden tw-min-w-0 tw-border-y-0 tw-border-b-0 tw-border-l-0 tw-border-r tw-border-solid tw-border-white/[0.08] tw-bg-[#050506] lg:tw-block">
        <div className="tw-sticky tw-top-0 tw-h-[100dvh] tw-overflow-y-auto tw-overscroll-contain tw-px-5 tw-pb-8 tw-pt-7 tw-[scrollbar-gutter:stable] tw-scrollbar-thin tw-scrollbar-track-transparent tw-scrollbar-thumb-iron-700/70 desktop-hover:hover:tw-scrollbar-thumb-iron-500">
          <nav
            aria-label={t(
              DEFAULT_LOCALE,
              "publicReview.navigation.contentsLabel"
            )}
          >
            <p className="tw-mb-4 tw-mt-0 tw-text-[0.68rem] tw-font-semibold tw-uppercase tw-tracking-[0.14em] tw-text-iron-500">
              {t(DEFAULT_LOCALE, "publicReview.navigation.contents")}
            </p>
            <ReviewPageLinks
              currentPage={currentPage}
              onThisPageLabel={onThisPageLabel}
              pages={pages}
              routes={routes}
              sections={sections}
              version={version}
            />
          </nav>
        </div>
      </aside>
    </>
  );
}
