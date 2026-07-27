import {
  ArrowRightIcon,
  CodeBracketIcon,
  PaintBrushIcon,
  ShieldCheckIcon,
  UsersIcon,
} from "@heroicons/react/24/outline";
import Link from "next/link";

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

const AUDIENCE_ICONS = {
  community: UsersIcon,
  artists: PaintBrushIcon,
  technical: CodeBracketIcon,
  auditors: ShieldCheckIcon,
} satisfies Record<PublicReviewAudience, typeof UsersIcon>;

const AUDIENCE_ICON_CLASSES: Record<PublicReviewAudience, string> = {
  community: "tw-text-violet-400",
  artists: "tw-text-primary-300",
  technical: "tw-text-iron-500",
  auditors: "tw-text-orange-400",
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
      className="tw-border-x-0 tw-border-b-0 tw-border-t tw-border-solid tw-border-white/[0.06] tw-pt-10"
    >
      <h2
        id="review-audiences-heading"
        className="tw-m-0 tw-text-xl tw-font-semibold tw-tracking-tight tw-text-iron-100 sm:tw-text-2xl"
      >
        {t(DEFAULT_LOCALE, "publicReview.audiences.heading")}
      </h2>
      <p className="tw-mb-0 tw-mt-2 tw-max-w-3xl tw-text-sm tw-font-light tw-leading-6 tw-text-iron-400">
        {t(DEFAULT_LOCALE, "publicReview.audiences.description")}
      </p>
      <div className="tw-mt-6 tw-grid tw-gap-4 sm:tw-grid-cols-2">
        {PUBLIC_REVIEW_AUDIENCES.map((audience) => {
          const copy = AUDIENCE_COPY[audience];
          const AudienceIcon = AUDIENCE_ICONS[audience];
          const firstPage = pages.find(
            (page) =>
              page.id !== "overview" && page.audiences.includes(audience)
          );
          return (
            <article
              key={audience}
              className="tw-group/card tw-flex tw-h-full tw-flex-col tw-rounded-xl tw-border tw-border-solid tw-border-white/[0.05] tw-bg-white/[0.025] tw-p-4 tw-transition-colors tw-duration-200 tw-ease-out hover:tw-border-white/[0.08] hover:tw-bg-white/[0.035] sm:tw-p-5"
            >
              <h3 className="tw-m-0 tw-flex tw-items-center tw-gap-2.5 tw-text-[0.9375rem] tw-font-medium tw-text-iron-200">
                <AudienceIcon
                  className={`tw-size-4 tw-flex-none ${AUDIENCE_ICON_CLASSES[audience]}`}
                  aria-hidden="true"
                />
                {t(DEFAULT_LOCALE, copy.title)}
              </h3>
              <p className="tw-mb-0 tw-mt-2 tw-flex-1 tw-text-[0.8125rem] tw-font-light tw-leading-5 tw-text-iron-400">
                {t(DEFAULT_LOCALE, copy.description)}
              </p>
              {firstPage ? (
                <div className="tw-mt-4 tw-border-x-0 tw-border-b-0 tw-border-t tw-border-solid tw-border-white/[0.05] tw-pt-1">
                  <Link
                    href={routes.getPageHref(firstPage, version)}
                    className="tw-flex tw-min-h-11 tw-items-center tw-justify-between tw-gap-4 tw-rounded-md tw-text-xs tw-font-medium tw-text-iron-300 tw-no-underline tw-transition-colors tw-duration-200 tw-ease-out hover:tw-text-primary-300 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-primary-400"
                  >
                    {t(DEFAULT_LOCALE, "publicReview.audiences.startPath", {
                      audience: t(DEFAULT_LOCALE, copy.title),
                    })}
                    <ArrowRightIcon
                      className="tw-size-3 tw-flex-none tw-text-iron-500 tw-transition-colors tw-duration-200 tw-ease-out group-hover/card:tw-text-primary-300"
                      aria-hidden="true"
                    />
                  </Link>
                </div>
              ) : null}
            </article>
          );
        })}
      </div>
    </section>
  );
}
