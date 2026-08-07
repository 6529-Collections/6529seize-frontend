import { ArrowRightIcon } from "@heroicons/react/24/outline";
import Link from "next/link";

import { formatInteger } from "@/i18n/format";
import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t, type MessageKey } from "@/i18n/messages";
import type { PublicReviewPageDefinition } from "@/lib/public-review/publicReviewTypes";
import { getStreamReviewPageHref } from "@/lib/public-review/streamReviewDefinition";

type ArtistGuideCopyItem = {
  readonly titleKey: MessageKey;
  readonly descriptionKey: MessageKey;
};

type ArtistGuideLinkedItem = ArtistGuideCopyItem & {
  readonly pageId: string;
};

const ARTWORK_PARTS = [
  {
    titleKey: "publicReview.forArtistsGuide.artwork.identity.title",
    descriptionKey: "publicReview.forArtistsGuide.artwork.identity.description",
  },
  {
    titleKey: "publicReview.forArtistsGuide.artwork.editions.title",
    descriptionKey: "publicReview.forArtistsGuide.artwork.editions.description",
  },
  {
    titleKey: "publicReview.forArtistsGuide.artwork.approval.title",
    descriptionKey: "publicReview.forArtistsGuide.artwork.approval.description",
  },
  {
    titleKey: "publicReview.forArtistsGuide.artwork.sales.title",
    descriptionKey: "publicReview.forArtistsGuide.artwork.sales.description",
  },
  {
    titleKey: "publicReview.forArtistsGuide.artwork.control.title",
    descriptionKey: "publicReview.forArtistsGuide.artwork.control.description",
  },
  {
    titleKey: "publicReview.forArtistsGuide.artwork.preservation.title",
    descriptionKey:
      "publicReview.forArtistsGuide.artwork.preservation.description",
  },
] as const satisfies readonly ArtistGuideCopyItem[];

const ARTIST_JOURNEY = [
  {
    titleKey: "publicReview.forArtistsGuide.journey.prepare.title",
    descriptionKey: "publicReview.forArtistsGuide.journey.prepare.description",
  },
  {
    titleKey: "publicReview.forArtistsGuide.journey.review.title",
    descriptionKey: "publicReview.forArtistsGuide.journey.review.description",
  },
  {
    titleKey: "publicReview.forArtistsGuide.journey.approve.title",
    descriptionKey: "publicReview.forArtistsGuide.journey.approve.description",
  },
  {
    titleKey: "publicReview.forArtistsGuide.journey.select.title",
    descriptionKey: "publicReview.forArtistsGuide.journey.select.description",
  },
  {
    titleKey: "publicReview.forArtistsGuide.journey.launch.title",
    descriptionKey: "publicReview.forArtistsGuide.journey.launch.description",
  },
  {
    titleKey: "publicReview.forArtistsGuide.journey.finalize.title",
    descriptionKey: "publicReview.forArtistsGuide.journey.finalize.description",
  },
] as const satisfies readonly ArtistGuideCopyItem[];

const APPROVAL_CHECKLIST = [
  "publicReview.forArtistsGuide.approval.identity",
  "publicReview.forArtistsGuide.approval.materials",
  "publicReview.forArtistsGuide.approval.supply",
  "publicReview.forArtistsGuide.approval.sale",
  "publicReview.forArtistsGuide.approval.payments",
  "publicReview.forArtistsGuide.approval.roles",
  "publicReview.forArtistsGuide.approval.finality",
] as const satisfies readonly MessageKey[];

const CHANGE_STAGES = [
  {
    titleKey: "publicReview.forArtistsGuide.changes.beforeLaunch.title",
    descriptionKey:
      "publicReview.forArtistsGuide.changes.beforeLaunch.description",
  },
  {
    titleKey: "publicReview.forArtistsGuide.changes.afterLaunch.title",
    descriptionKey:
      "publicReview.forArtistsGuide.changes.afterLaunch.description",
  },
  {
    titleKey: "publicReview.forArtistsGuide.changes.afterFinality.title",
    descriptionKey:
      "publicReview.forArtistsGuide.changes.afterFinality.description",
  },
] as const satisfies readonly ArtistGuideCopyItem[];

const OTHER_ACTORS = [
  {
    pageId: "curation-and-tdh-authorization",
    titleKey: "publicReview.forArtistsGuide.actors.community.title",
    descriptionKey: "publicReview.forArtistsGuide.actors.community.description",
  },
  {
    pageId: "roles-and-trust",
    titleKey: "publicReview.forArtistsGuide.actors.operators.title",
    descriptionKey: "publicReview.forArtistsGuide.actors.operators.description",
  },
  {
    pageId: "governance-pausing-and-successors",
    titleKey: "publicReview.forArtistsGuide.actors.guardian.title",
    descriptionKey: "publicReview.forArtistsGuide.actors.guardian.description",
  },
  {
    pageId: "metadata-scripts-and-dependencies",
    titleKey: "publicReview.forArtistsGuide.actors.services.title",
    descriptionKey: "publicReview.forArtistsGuide.actors.services.description",
  },
] as const satisfies readonly ArtistGuideLinkedItem[];

const PERMANENCE_CHECKLIST = [
  "publicReview.forArtistsGuide.permanence.files",
  "publicReview.forArtistsGuide.permanence.fingerprints",
  "publicReview.forArtistsGuide.permanence.supply",
  "publicReview.forArtistsGuide.permanence.delay",
] as const satisfies readonly MessageKey[];

function GuideLink({ page }: { readonly page: PublicReviewPageDefinition }) {
  return (
    <Link
      href={getStreamReviewPageHref({ page })}
      className="tw-group tw-mt-3 tw-inline-flex tw-min-h-11 tw-items-center tw-gap-2 tw-self-start tw-text-xs tw-font-semibold tw-text-primary-300 tw-no-underline focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-primary-400"
    >
      {t(DEFAULT_LOCALE, "publicReview.forArtistsGuide.readPage", {
        page: t(DEFAULT_LOCALE, page.titleKey),
      })}
      <ArrowRightIcon
        aria-hidden="true"
        className="tw-size-3.5 tw-flex-none tw-transition-transform group-hover:tw-translate-x-0.5"
      />
    </Link>
  );
}

export function StreamReviewForArtistsGuide({
  pages,
}: {
  readonly pages: readonly PublicReviewPageDefinition[];
}) {
  const salesPage = pages.find(
    (page) => page.id === "fixed-price-sales-and-auctions"
  );
  const revenuePage = pages.find(
    (page) => page.id === "revenue-splits-and-royalties"
  );
  const finalityPage = pages.find(
    (page) => page.id === "freezing-preservation-and-artwork-finality"
  );

  return (
    <div className="tw-mt-12 tw-w-full tw-max-w-[52rem] sm:tw-mt-16">
      <section aria-labelledby="stream-artist-guide-heading">
        <p className="tw-m-0 tw-text-xs tw-font-semibold tw-uppercase tw-tracking-[0.16em] tw-text-primary-300">
          {t(DEFAULT_LOCALE, "publicReview.forArtistsGuide.eyebrow")}
        </p>
        <h2
          id="stream-artist-guide-heading"
          className="tw-mb-0 tw-mt-3 tw-text-2xl tw-font-semibold tw-tracking-tight tw-text-white sm:tw-text-3xl"
        >
          {t(DEFAULT_LOCALE, "publicReview.forArtistsGuide.heading")}
        </h2>
        <p className="tw-mb-0 tw-mt-5 tw-text-pretty tw-text-lg tw-leading-8 tw-text-iron-200">
          {t(DEFAULT_LOCALE, "publicReview.forArtistsGuide.description")}
        </p>
        <p className="tw-mb-0 tw-mt-3 tw-text-sm tw-leading-6 tw-text-iron-400">
          {t(DEFAULT_LOCALE, "publicReview.forArtistsGuide.reviewContext")}
        </p>
      </section>

      <section
        aria-labelledby="stream-artist-artwork-heading"
        className="tw-mt-14"
      >
        <h2
          id="stream-artist-artwork-heading"
          className="tw-m-0 tw-text-xl tw-font-semibold tw-tracking-tight tw-text-iron-100 sm:tw-text-2xl"
        >
          {t(DEFAULT_LOCALE, "publicReview.forArtistsGuide.artwork.heading")}
        </h2>
        <p className="tw-mb-0 tw-mt-2 tw-text-sm tw-leading-6 tw-text-iron-300">
          {t(
            DEFAULT_LOCALE,
            "publicReview.forArtistsGuide.artwork.description"
          )}
        </p>
        <ul className="tw-mb-0 tw-mt-7 tw-grid tw-list-none tw-gap-y-5 tw-border-x-0 tw-border-y tw-border-solid tw-border-white/[0.08] tw-px-0 tw-py-6">
          {ARTWORK_PARTS.map((part) => (
            <li
              key={part.titleKey}
              className="tw-grid tw-grid-cols-[auto_minmax(0,1fr)] tw-gap-3"
            >
              <span
                aria-hidden="true"
                className="tw-mt-2.5 tw-size-1.5 tw-rounded-full tw-bg-primary-300"
              />
              <div>
                <h3 className="tw-m-0 tw-text-sm tw-font-semibold tw-text-iron-100">
                  {t(DEFAULT_LOCALE, part.titleKey)}
                </h3>
                <p className="tw-mb-0 tw-mt-1 tw-text-sm tw-leading-6 tw-text-iron-400">
                  {t(DEFAULT_LOCALE, part.descriptionKey)}
                </p>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section
        aria-labelledby="stream-artist-journey-heading"
        className="tw-mt-14"
      >
        <h2
          id="stream-artist-journey-heading"
          className="tw-m-0 tw-text-xl tw-font-semibold tw-tracking-tight tw-text-iron-100 sm:tw-text-2xl"
        >
          {t(DEFAULT_LOCALE, "publicReview.forArtistsGuide.journey.heading")}
        </h2>
        <p className="tw-mb-0 tw-mt-2 tw-text-sm tw-leading-6 tw-text-iron-300">
          {t(
            DEFAULT_LOCALE,
            "publicReview.forArtistsGuide.journey.description"
          )}
        </p>
        <ol className="tw-mb-0 tw-mt-7 tw-list-none tw-divide-y tw-divide-white/[0.08] tw-border-x-0 tw-border-y tw-border-solid tw-border-white/[0.08] tw-p-0">
          {ARTIST_JOURNEY.map((step, index) => (
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
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section
        aria-labelledby="stream-artist-approval-heading"
        className="tw-mt-14 tw-rounded-xl tw-border tw-border-solid tw-border-white/[0.09] tw-bg-iron-950/60 tw-p-5 sm:tw-p-7"
      >
        <h2
          id="stream-artist-approval-heading"
          className="tw-m-0 tw-text-xl tw-font-semibold tw-tracking-tight tw-text-iron-100 sm:tw-text-2xl"
        >
          {t(DEFAULT_LOCALE, "publicReview.forArtistsGuide.approval.heading")}
        </h2>
        <p className="tw-mb-0 tw-mt-2 tw-text-sm tw-leading-6 tw-text-iron-300">
          {t(
            DEFAULT_LOCALE,
            "publicReview.forArtistsGuide.approval.description"
          )}
        </p>
        <ul className="tw-mb-0 tw-mt-5 tw-grid tw-gap-3 tw-pl-5 tw-text-sm tw-leading-6 tw-text-iron-300 sm:tw-grid-cols-2">
          {APPROVAL_CHECKLIST.map((item) => (
            <li key={item}>{t(DEFAULT_LOCALE, item)}</li>
          ))}
        </ul>
      </section>

      <section
        aria-labelledby="stream-artist-changes-heading"
        className="tw-mt-14"
      >
        <h2
          id="stream-artist-changes-heading"
          className="tw-m-0 tw-text-xl tw-font-semibold tw-tracking-tight tw-text-iron-100 sm:tw-text-2xl"
        >
          {t(DEFAULT_LOCALE, "publicReview.forArtistsGuide.changes.heading")}
        </h2>
        <p className="tw-mb-0 tw-mt-2 tw-text-sm tw-leading-6 tw-text-iron-300">
          {t(
            DEFAULT_LOCALE,
            "publicReview.forArtistsGuide.changes.description"
          )}
        </p>
        <div className="tw-mt-7 tw-grid tw-gap-3 sm:tw-grid-cols-3">
          {CHANGE_STAGES.map((stage) => (
            <article
              key={stage.titleKey}
              className="tw-rounded-xl tw-border tw-border-solid tw-border-white/[0.09] tw-bg-iron-950/60 tw-p-5"
            >
              <h3 className="tw-m-0 tw-text-sm tw-font-semibold tw-text-iron-100">
                {t(DEFAULT_LOCALE, stage.titleKey)}
              </h3>
              <p className="tw-mb-0 tw-mt-2 tw-text-sm tw-leading-6 tw-text-iron-400">
                {t(DEFAULT_LOCALE, stage.descriptionKey)}
              </p>
            </article>
          ))}
        </div>
        <p className="tw-mb-0 tw-mt-3 tw-text-xs tw-leading-5 tw-text-iron-500">
          {t(DEFAULT_LOCALE, "publicReview.forArtistsGuide.changes.caveat")}
        </p>
      </section>

      <section
        aria-labelledby="stream-artist-actors-heading"
        className="tw-mt-14"
      >
        <h2
          id="stream-artist-actors-heading"
          className="tw-m-0 tw-text-xl tw-font-semibold tw-tracking-tight tw-text-iron-100 sm:tw-text-2xl"
        >
          {t(DEFAULT_LOCALE, "publicReview.forArtistsGuide.actors.heading")}
        </h2>
        <p className="tw-mb-0 tw-mt-2 tw-text-sm tw-leading-6 tw-text-iron-300">
          {t(DEFAULT_LOCALE, "publicReview.forArtistsGuide.actors.description")}
        </p>
        <div className="tw-mt-7 tw-grid tw-gap-3 sm:tw-grid-cols-2">
          {OTHER_ACTORS.map((actor) => {
            const page = pages.find(
              (candidate) => candidate.id === actor.pageId
            );
            if (!page) {
              return null;
            }
            return (
              <article
                key={actor.pageId}
                className="tw-flex tw-h-full tw-flex-col tw-rounded-xl tw-border tw-border-solid tw-border-white/[0.09] tw-bg-iron-950/60 tw-p-5"
              >
                <h3 className="tw-m-0 tw-text-sm tw-font-semibold tw-text-iron-100">
                  {t(DEFAULT_LOCALE, actor.titleKey)}
                </h3>
                <p className="tw-mb-0 tw-mt-2 tw-flex-1 tw-text-sm tw-leading-6 tw-text-iron-400">
                  {t(DEFAULT_LOCALE, actor.descriptionKey)}
                </p>
                <GuideLink page={page} />
              </article>
            );
          })}
        </div>
      </section>

      <div className="tw-mt-14 tw-grid tw-gap-8 sm:tw-grid-cols-2">
        <section aria-labelledby="stream-artist-sales-heading">
          <h2
            id="stream-artist-sales-heading"
            className="tw-m-0 tw-text-xl tw-font-semibold tw-tracking-tight tw-text-iron-100 sm:tw-text-2xl"
          >
            {t(DEFAULT_LOCALE, "publicReview.forArtistsGuide.sales.heading")}
          </h2>
          <p className="tw-mb-0 tw-mt-3 tw-text-sm tw-leading-6 tw-text-iron-300">
            {t(
              DEFAULT_LOCALE,
              "publicReview.forArtistsGuide.sales.description"
            )}
          </p>
          <p className="tw-mb-0 tw-mt-3 tw-text-sm tw-leading-6 tw-text-iron-400">
            {t(DEFAULT_LOCALE, "publicReview.forArtistsGuide.sales.royalties")}
          </p>
          <div className="tw-flex tw-flex-col tw-items-start">
            {salesPage ? <GuideLink page={salesPage} /> : null}
            {revenuePage ? <GuideLink page={revenuePage} /> : null}
          </div>
        </section>

        <section aria-labelledby="stream-artist-permanence-heading">
          <h2
            id="stream-artist-permanence-heading"
            className="tw-m-0 tw-text-xl tw-font-semibold tw-tracking-tight tw-text-iron-100 sm:tw-text-2xl"
          >
            {t(
              DEFAULT_LOCALE,
              "publicReview.forArtistsGuide.permanence.heading"
            )}
          </h2>
          <p className="tw-mb-0 tw-mt-3 tw-text-sm tw-leading-6 tw-text-iron-300">
            {t(
              DEFAULT_LOCALE,
              "publicReview.forArtistsGuide.permanence.description"
            )}
          </p>
          <ul className="tw-mb-0 tw-mt-4 tw-space-y-2 tw-pl-5 tw-text-sm tw-leading-6 tw-text-iron-400">
            {PERMANENCE_CHECKLIST.map((item) => (
              <li key={item}>{t(DEFAULT_LOCALE, item)}</li>
            ))}
          </ul>
          {finalityPage ? <GuideLink page={finalityPage} /> : null}
        </section>
      </div>

      <section
        aria-labelledby="stream-artist-evidence-heading"
        className="tw-mt-16 tw-border-x-0 tw-border-y tw-border-solid tw-border-white/[0.08] tw-py-8"
      >
        <h2
          id="stream-artist-evidence-heading"
          className="tw-m-0 tw-text-xl tw-font-semibold tw-tracking-tight tw-text-iron-100 sm:tw-text-2xl"
        >
          {t(DEFAULT_LOCALE, "publicReview.forArtistsGuide.evidence.heading")}
        </h2>
        <p className="tw-mb-0 tw-mt-2 tw-text-sm tw-leading-6 tw-text-iron-300">
          {t(
            DEFAULT_LOCALE,
            "publicReview.forArtistsGuide.evidence.description"
          )}
        </p>
        <a
          href="#your-collection-has-a-durable-identity"
          className="tw-group tw-mt-4 tw-inline-flex tw-min-h-11 tw-items-center tw-gap-2 tw-text-xs tw-font-semibold tw-text-primary-300 tw-no-underline focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-primary-400"
        >
          {t(DEFAULT_LOCALE, "publicReview.forArtistsGuide.evidence.action")}
          <ArrowRightIcon
            aria-hidden="true"
            className="tw-size-3.5 tw-flex-none tw-rotate-90 tw-transition-transform group-hover:tw-translate-y-0.5"
          />
        </a>
      </section>
    </div>
  );
}
