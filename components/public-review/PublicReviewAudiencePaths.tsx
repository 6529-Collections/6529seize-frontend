import Link from "next/link";

import { formatInteger } from "@/i18n/format";
import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t, type MessageKey } from "@/i18n/messages";
import {
  PUBLIC_REVIEW_AUDIENCES,
  type PublicReviewAudience,
  type PublicReviewPageDefinition,
} from "@/lib/public-review/publicReviewTypes";
import type { PublicReviewRouteBuilder } from "@/lib/public-review/publicReviewRoutes";

const AUDIENCE_COPY: Record<
  PublicReviewAudience,
  { readonly title: MessageKey; readonly description: MessageKey }
> = {
  community: {
    title: "publicReview.audiences.community.title",
    description: "publicReview.audiences.community.description",
  },
  artists: {
    title: "publicReview.audiences.artists.title",
    description: "publicReview.audiences.artists.description",
  },
  technical: {
    title: "publicReview.audiences.technical.title",
    description: "publicReview.audiences.technical.description",
  },
  auditors: {
    title: "publicReview.audiences.auditors.title",
    description: "publicReview.audiences.auditors.description",
  },
};

export function PublicReviewAudiencePaths({
  pages,
  routes,
  version,
}: {
  readonly pages: readonly PublicReviewPageDefinition[];
  readonly routes: PublicReviewRouteBuilder;
  readonly version?: string | undefined;
}) {
  return (
    <section
      aria-labelledby="review-audiences-heading"
      className="tw-border-x-0 tw-border-y tw-border-solid tw-border-white/10 tw-bg-white/[0.02] tw-px-0 tw-py-6 sm:tw-px-6"
    >
      <h2
        id="review-audiences-heading"
        className="tw-m-0 tw-text-xl tw-font-semibold tw-text-white"
      >
        {t(DEFAULT_LOCALE, "publicReview.audiences.heading")}
      </h2>
      <p className="tw-mb-0 tw-mt-2 tw-max-w-3xl tw-text-sm tw-leading-6 tw-text-iron-300">
        {t(DEFAULT_LOCALE, "publicReview.audiences.description")}
      </p>
      <div className="tw-mt-5 tw-grid tw-gap-3 sm:tw-grid-cols-2">
        {PUBLIC_REVIEW_AUDIENCES.map((audience) => {
          const copy = AUDIENCE_COPY[audience];
          const audiencePages = pages.filter(
            (page) =>
              page.id !== "overview" && page.audiences.includes(audience)
          );
          const firstPage = audiencePages[0];
          return (
            <article
              key={audience}
              className="tw-rounded-lg tw-border tw-border-solid tw-border-white/[0.08] tw-bg-black/30 tw-p-4"
            >
              <h3 className="tw-m-0 tw-text-base tw-font-semibold tw-text-iron-100">
                {t(DEFAULT_LOCALE, copy.title)}
              </h3>
              <p className="tw-mb-0 tw-mt-1.5 tw-text-sm tw-leading-6 tw-text-iron-300">
                {t(DEFAULT_LOCALE, copy.description)}
              </p>
              {firstPage ? (
                <>
                  <Link
                    href={routes.getPageHref(firstPage, version)}
                    className="tw-text-primary-100 tw-mt-4 tw-inline-flex tw-min-h-11 tw-items-center tw-rounded-lg tw-border tw-border-solid tw-border-primary-400/30 tw-bg-primary-400/[0.07] tw-px-3 tw-py-2 tw-text-sm tw-font-semibold tw-no-underline tw-transition-colors hover:tw-border-primary-300/60 hover:tw-text-white focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-white"
                  >
                    {t(DEFAULT_LOCALE, "publicReview.audiences.startPath", {
                      audience: t(DEFAULT_LOCALE, copy.title),
                    })}
                  </Link>
                  <details className="tw-mt-3 tw-rounded-lg tw-border tw-border-solid tw-border-white/[0.07] tw-bg-white/[0.02] tw-p-3">
                    <summary className="tw-min-h-11 tw-cursor-pointer tw-py-2 tw-text-sm tw-font-semibold tw-text-iron-200 marker:tw-text-iron-500 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-white">
                      {t(DEFAULT_LOCALE, "publicReview.audiences.showPath", {
                        count: formatInteger(
                          DEFAULT_LOCALE,
                          audiencePages.length
                        ),
                      })}
                    </summary>
                    <nav
                      aria-label={t(
                        DEFAULT_LOCALE,
                        "publicReview.audiences.pathLabel",
                        { audience: t(DEFAULT_LOCALE, copy.title) }
                      )}
                    >
                      <ol className="tw-mb-0 tw-mt-2 tw-space-y-2 tw-pl-5 tw-text-sm tw-text-iron-300">
                        {audiencePages.map((page) => (
                          <li key={page.id}>
                            <Link
                              href={routes.getPageHref(page, version)}
                              className="tw-text-sky-300 tw-underline tw-decoration-sky-400/50 tw-underline-offset-4 hover:tw-text-sky-200 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-white"
                            >
                              {t(DEFAULT_LOCALE, page.titleKey)}
                            </Link>
                          </li>
                        ))}
                      </ol>
                    </nav>
                  </details>
                </>
              ) : null}
            </article>
          );
        })}
      </div>
    </section>
  );
}
