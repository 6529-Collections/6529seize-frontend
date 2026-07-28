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
  entryPageIds,
  pages,
  routes,
  version,
}: {
  readonly entryPageIds: Readonly<Record<PublicReviewAudience, string>>;
  readonly pages: readonly PublicReviewPageDefinition[];
  readonly routes: PublicReviewRouteBuilder;
  readonly version?: string | undefined;
}) {
  return (
    <section
      aria-labelledby="review-audiences-heading"
      className="tw-border-x-0 tw-border-y tw-border-solid tw-border-white/[0.08] tw-py-10"
    >
      <h2
        id="review-audiences-heading"
        className="tw-m-0 tw-text-xl tw-font-semibold tw-tracking-tight tw-text-iron-100 sm:tw-text-2xl"
      >
        {t(DEFAULT_LOCALE, "publicReview.audiences.heading")}
      </h2>
      <p className="tw-mb-0 tw-mt-2 tw-max-w-3xl tw-text-sm tw-font-normal tw-leading-6 tw-text-iron-300">
        {t(DEFAULT_LOCALE, "publicReview.audiences.description")}
      </p>
      <div className="tw-mt-7 tw-divide-y tw-divide-white/[0.08] tw-border-x-0 tw-border-y tw-border-solid tw-border-white/[0.08]">
        {PUBLIC_REVIEW_AUDIENCES.map((audience) => {
          const copy = AUDIENCE_COPY[audience];
          const AudienceIcon = AUDIENCE_ICONS[audience];
          const firstPage = pages.find(
            (page) =>
              page.id === entryPageIds[audience] &&
              page.audiences.includes(audience)
          );
          return (
            <article
              key={audience}
              className="tw-group/row tw-grid tw-gap-3 tw-py-5 sm:tw-grid-cols-[10rem_minmax(0,1fr)_auto] sm:tw-items-center sm:tw-gap-6"
            >
              <h3 className="tw-m-0 tw-flex tw-items-center tw-gap-2.5 tw-text-[0.9375rem] tw-font-medium tw-text-iron-200">
                <AudienceIcon
                  className={`tw-size-4 tw-flex-none ${AUDIENCE_ICON_CLASSES[audience]}`}
                  aria-hidden="true"
                />
                {t(DEFAULT_LOCALE, copy.title)}
              </h3>
              <p className="tw-m-0 tw-text-[0.8125rem] tw-font-normal tw-leading-5 tw-text-iron-300">
                {t(DEFAULT_LOCALE, copy.description)}
              </p>
              {firstPage ? (
                <Link
                  href={routes.getPageHref(firstPage, version)}
                  className="tw-inline-flex tw-min-h-11 tw-items-center tw-gap-2 tw-justify-self-start tw-text-xs tw-font-semibold tw-text-iron-300 tw-no-underline tw-transition-colors hover:tw-text-primary-300 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-primary-400 sm:tw-justify-self-end"
                >
                  {t(DEFAULT_LOCALE, "publicReview.audiences.startPath", {
                    audience: t(DEFAULT_LOCALE, copy.title),
                  })}
                  <ArrowRightIcon
                    className="tw-size-3 tw-flex-none tw-text-iron-600 tw-transition-colors group-hover/row:tw-text-primary-300"
                    aria-hidden="true"
                  />
                </Link>
              ) : null}
            </article>
          );
        })}
      </div>
    </section>
  );
}
