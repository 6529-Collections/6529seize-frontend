import Link from "next/link";
import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import type { PublicReviewPageDefinition } from "@/lib/public-review/publicReviewTypes";
import type { PublicReviewRouteBuilder } from "@/lib/public-review/publicReviewRoutes";

export function PublicReviewRelatedTopics({
  pages,
  routes,
}: {
  readonly pages: readonly PublicReviewPageDefinition[];
  readonly routes: PublicReviewRouteBuilder;
}) {
  return (
    <nav
      aria-label={t(DEFAULT_LOCALE, "publicReview.navigation.relatedTopics")}
      className="tw-mt-12 tw-border-x-0 tw-border-b-0 tw-border-t tw-border-solid tw-border-white/10 tw-pt-6"
    >
      <h2 className="tw-m-0 tw-text-base tw-font-semibold tw-text-white">
        {t(DEFAULT_LOCALE, "publicReview.navigation.relatedTopics")}
      </h2>
      <ul className="tw-mb-0 tw-mt-3 tw-list-none tw-space-y-1 tw-p-0">
        {pages.map((page) => (
          <li key={page.id}>
            <Link
              href={routes.getPageHref(page)}
              className="tw-flex tw-min-h-11 tw-items-center tw-py-2 tw-text-sm tw-text-primary-300 tw-underline tw-underline-offset-4 hover:tw-text-white focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-white"
            >
              {t(DEFAULT_LOCALE, page.titleKey)}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
