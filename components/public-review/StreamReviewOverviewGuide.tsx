import { ArrowRightIcon } from "@heroicons/react/24/outline";
import Link from "next/link";

import { PublicReviewGuidePointList } from "@/components/public-review/PublicReviewGuidePointList";
import { StreamArtworkConceptPreview } from "@/components/public-review/StreamArtworkConceptPreview";
import { formatInteger } from "@/i18n/format";
import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t, type MessageKey } from "@/i18n/messages";
import { getStreamReviewPageHref } from "@/lib/public-review/streamReviewDefinition";
import type { PublicReviewPageDefinition } from "@/lib/public-review/publicReviewTypes";

type LinkedOverviewItem = {
  readonly pageId: string;
  readonly sectionId?: string;
  readonly linkLabelKey?: MessageKey;
  readonly titleKey: MessageKey;
  readonly descriptionKey: MessageKey;
};

type OverviewCopyItem = {
  readonly titleKey: MessageKey;
  readonly descriptionKey: MessageKey;
};

const ARTWORK_PARTS = [
  {
    titleKey: "publicReview.overviewGuide.artworkParts.identity.title",
    descriptionKey:
      "publicReview.overviewGuide.artworkParts.identity.description",
  },
  {
    titleKey: "publicReview.overviewGuide.artworkParts.materials.title",
    descriptionKey:
      "publicReview.overviewGuide.artworkParts.materials.description",
  },
  {
    titleKey: "publicReview.overviewGuide.artworkParts.approval.title",
    descriptionKey:
      "publicReview.overviewGuide.artworkParts.approval.description",
  },
  {
    titleKey: "publicReview.overviewGuide.artworkParts.rules.title",
    descriptionKey: "publicReview.overviewGuide.artworkParts.rules.description",
  },
  {
    titleKey: "publicReview.overviewGuide.artworkParts.preservation.title",
    descriptionKey:
      "publicReview.overviewGuide.artworkParts.preservation.description",
  },
] as const satisfies readonly OverviewCopyItem[];

const ARTWORK_JOURNEY: readonly LinkedOverviewItem[] = [
  {
    pageId: "for-artists",
    linkLabelKey: "publicReview.overviewGuide.journey.prepare.linkLabel",
    titleKey: "publicReview.overviewGuide.journey.prepare.title",
    descriptionKey: "publicReview.overviewGuide.journey.prepare.description",
  },
  {
    pageId: "artwork-lifecycle",
    linkLabelKey: "publicReview.overviewGuide.journey.approve.linkLabel",
    titleKey: "publicReview.overviewGuide.journey.approve.title",
    descriptionKey: "publicReview.overviewGuide.journey.approve.description",
  },
  {
    pageId: "curation-and-tdh-authorization",
    linkLabelKey: "publicReview.overviewGuide.journey.authorize.linkLabel",
    titleKey: "publicReview.overviewGuide.journey.authorize.title",
    descriptionKey: "publicReview.overviewGuide.journey.authorize.description",
  },
  {
    pageId: "fixed-price-sales-and-auctions",
    linkLabelKey: "publicReview.overviewGuide.journey.sell.linkLabel",
    titleKey: "publicReview.overviewGuide.journey.sell.title",
    descriptionKey: "publicReview.overviewGuide.journey.sell.description",
  },
  {
    pageId: "revenue-splits-and-royalties",
    linkLabelKey: "publicReview.overviewGuide.journey.pay.linkLabel",
    titleKey: "publicReview.overviewGuide.journey.pay.title",
    descriptionKey: "publicReview.overviewGuide.journey.pay.description",
  },
  {
    pageId: "freezing-preservation-and-artwork-finality",
    sectionId: "core-freeze-fixes-a-defined-boundary",
    linkLabelKey: "publicReview.overviewGuide.journey.preserve.linkLabel",
    titleKey: "publicReview.overviewGuide.journey.preserve.title",
    descriptionKey: "publicReview.overviewGuide.journey.preserve.description",
  },
  {
    pageId: "freezing-preservation-and-artwork-finality",
    sectionId: "terminal-finality-is-delayed-for-a-reason",
    linkLabelKey: "publicReview.overviewGuide.journey.finality.linkLabel",
    titleKey: "publicReview.overviewGuide.journey.finality.title",
    descriptionKey: "publicReview.overviewGuide.journey.finality.description",
  },
];

const AUDIENCE_PATHS = [
  {
    pageId: "for-artists",
    titleKey: "publicReview.overviewGuide.audiences.artists.title",
    descriptionKey: "publicReview.overviewGuide.audiences.artists.description",
  },
  {
    pageId: "artwork-lifecycle",
    titleKey: "publicReview.overviewGuide.audiences.collectors.title",
    descriptionKey:
      "publicReview.overviewGuide.audiences.collectors.description",
  },
  {
    pageId: "security-testing-and-known-limitations",
    titleKey: "publicReview.overviewGuide.audiences.auditors.title",
    descriptionKey: "publicReview.overviewGuide.audiences.auditors.description",
  },
] as const satisfies readonly LinkedOverviewItem[];

/** Introduces the current Stream review through a concept and guided paths. */
export function StreamReviewOverviewGuide({
  pages,
}: {
  readonly pages: readonly PublicReviewPageDefinition[];
}) {
  return (
    <div className="tw-w-full tw-max-w-[68rem]">
      <StreamArtworkConceptPreview />

      <div className="tw-mt-14 tw-w-full tw-max-w-[52rem]">
        <section aria-labelledby="stream-artwork-parts-heading">
          <h2
            id="stream-artwork-parts-heading"
            className="tw-m-0 tw-text-xl tw-font-semibold tw-tracking-tight tw-text-iron-100 sm:tw-text-2xl"
          >
            {t(
              DEFAULT_LOCALE,
              "publicReview.overviewGuide.artworkParts.heading"
            )}
          </h2>
          <p className="tw-mb-0 tw-mt-2 tw-text-sm tw-leading-6 tw-text-iron-300">
            {t(
              DEFAULT_LOCALE,
              "publicReview.overviewGuide.artworkParts.description"
            )}
          </p>
          <PublicReviewGuidePointList points={ARTWORK_PARTS} />
        </section>

        <section
          aria-labelledby="stream-artist-control-heading"
          className="tw-mt-8 tw-rounded-xl tw-border tw-border-solid tw-border-primary-400/20 tw-bg-primary-500/[0.06] tw-p-5 sm:tw-p-7"
        >
          <h2
            id="stream-artist-control-heading"
            className="tw-m-0 tw-text-lg tw-font-semibold tw-tracking-tight tw-text-iron-100 sm:tw-text-xl"
          >
            {t(DEFAULT_LOCALE, "publicReview.overviewGuide.control.heading")}
          </h2>
          <p className="tw-mb-0 tw-mt-2 tw-text-sm tw-leading-6 tw-text-iron-300">
            {t(
              DEFAULT_LOCALE,
              "publicReview.overviewGuide.control.description"
            )}
          </p>
        </section>

        <section
          aria-labelledby="stream-artwork-journey-heading"
          className="tw-mt-14"
        >
          <h2
            id="stream-artwork-journey-heading"
            className="tw-m-0 tw-text-xl tw-font-semibold tw-tracking-tight tw-text-iron-100 sm:tw-text-2xl"
          >
            {t(DEFAULT_LOCALE, "publicReview.overviewGuide.journey.heading")}
          </h2>
          <p className="tw-mb-0 tw-mt-2 tw-text-sm tw-leading-6 tw-text-iron-300">
            {t(
              DEFAULT_LOCALE,
              "publicReview.overviewGuide.journey.description"
            )}
          </p>
          <ol className="tw-mb-0 tw-mt-7 tw-list-none tw-divide-y tw-divide-white/[0.08] tw-border-x-0 tw-border-y tw-border-solid tw-border-white/[0.08] tw-p-0">
            {ARTWORK_JOURNEY.map((step, index) => {
              const page = pages.find(
                (candidate) => candidate.id === step.pageId
              );
              if (!page) {
                return null;
              }
              const pageHref = getStreamReviewPageHref({ page });
              const stepHref = step.sectionId
                ? `${pageHref}#${step.sectionId}`
                : pageHref;
              return (
                <li
                  key={step.titleKey}
                  className="tw-grid tw-grid-cols-[2rem_minmax(0,1fr)] tw-gap-3 tw-py-5 sm:tw-grid-cols-[2.5rem_minmax(0,1fr)] sm:tw-gap-5"
                >
                  <span className="tw-flex tw-size-8 tw-items-center tw-justify-center tw-rounded-full tw-bg-primary-400/10 tw-font-mono tw-text-xs tw-font-semibold tw-text-primary-300">
                    {formatInteger(DEFAULT_LOCALE, index + 1)}
                  </span>
                  <div>
                    <h3 className="tw-m-0 tw-text-base tw-font-semibold tw-text-iron-100">
                      {t(DEFAULT_LOCALE, step.titleKey)}
                    </h3>
                    <p className="tw-mb-0 tw-mt-1 tw-text-sm tw-leading-6 tw-text-iron-400">
                      {t(DEFAULT_LOCALE, step.descriptionKey)}
                    </p>
                    <Link
                      href={stepHref}
                      className="tw-group tw-mt-1 tw-inline-flex tw-min-h-11 tw-items-center tw-gap-2 tw-text-xs tw-font-semibold tw-text-iron-300 tw-no-underline tw-transition-colors hover:tw-text-primary-300 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-primary-400"
                    >
                      {step.linkLabelKey
                        ? t(DEFAULT_LOCALE, step.linkLabelKey)
                        : t(DEFAULT_LOCALE, page.titleKey)}
                      <ArrowRightIcon
                        aria-hidden="true"
                        className="tw-size-3.5 tw-flex-none tw-text-iron-600 tw-transition-colors group-hover:tw-text-primary-300"
                      />
                    </Link>
                  </div>
                </li>
              );
            })}
          </ol>
        </section>

        <section
          aria-labelledby="stream-audience-paths-heading"
          className="tw-mt-14"
        >
          <h2
            id="stream-audience-paths-heading"
            className="tw-m-0 tw-text-xl tw-font-semibold tw-tracking-tight tw-text-iron-100 sm:tw-text-2xl"
          >
            {t(DEFAULT_LOCALE, "publicReview.overviewGuide.audiences.heading")}
          </h2>
          <p className="tw-mb-0 tw-mt-2 tw-text-sm tw-leading-6 tw-text-iron-300">
            {t(
              DEFAULT_LOCALE,
              "publicReview.overviewGuide.audiences.description"
            )}
          </p>
          <div className="tw-mt-7 tw-grid tw-gap-3 sm:tw-grid-cols-3">
            {AUDIENCE_PATHS.map((audience) => {
              const page = pages.find(
                (candidate) => candidate.id === audience.pageId
              );
              if (!page) {
                return null;
              }
              return (
                <article
                  key={audience.pageId}
                  className="tw-flex tw-h-full tw-flex-col tw-rounded-xl tw-border tw-border-solid tw-border-white/[0.09] tw-bg-iron-950/60 tw-p-5"
                >
                  <h3 className="tw-m-0 tw-text-base tw-font-semibold tw-text-iron-100">
                    {t(DEFAULT_LOCALE, audience.titleKey)}
                  </h3>
                  <p className="tw-mb-0 tw-mt-2 tw-flex-1 tw-text-sm tw-leading-6 tw-text-iron-400">
                    {t(DEFAULT_LOCALE, audience.descriptionKey)}
                  </p>
                  <Link
                    href={getStreamReviewPageHref({ page })}
                    className="tw-group tw-mt-4 tw-inline-flex tw-min-h-11 tw-items-center tw-gap-2 tw-self-start tw-text-xs tw-font-semibold tw-text-primary-300 tw-no-underline focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-primary-400"
                  >
                    {t(DEFAULT_LOCALE, "publicReview.overviewGuide.startPage", {
                      page: t(DEFAULT_LOCALE, page.titleKey),
                    })}
                    <ArrowRightIcon
                      aria-hidden="true"
                      className="tw-size-3.5 tw-flex-none tw-transition-transform group-hover:tw-translate-x-0.5"
                    />
                  </Link>
                </article>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
}
