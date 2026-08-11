import { ArrowRightIcon } from "@heroicons/react/24/outline";
import Link from "next/link";

import { PublicReviewGuidePointList } from "@/components/public-review/PublicReviewGuidePointList";
import { formatInteger } from "@/i18n/format";
import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t, type MessageKey } from "@/i18n/messages";
import type { PublicReviewPageDefinition } from "@/lib/public-review/publicReviewTypes";
import { getStreamReviewPageHref } from "@/lib/public-review/streamReviewDefinition";

type ArtistGuideCopyItem = {
  readonly titleKey: MessageKey;
  readonly descriptionKey: MessageKey;
};

type ArtistGuideActorItem = ArtistGuideCopyItem & {
  readonly pageId?: string;
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
    titleKey: "publicReview.forArtistsGuide.artwork.sales.title",
    descriptionKey: "publicReview.forArtistsGuide.artwork.sales.description",
  },
  {
    titleKey: "publicReview.forArtistsGuide.artwork.payments.title",
    descriptionKey: "publicReview.forArtistsGuide.artwork.payments.description",
  },
  {
    titleKey: "publicReview.forArtistsGuide.artwork.approval.title",
    descriptionKey: "publicReview.forArtistsGuide.artwork.approval.description",
  },
  {
    titleKey: "publicReview.forArtistsGuide.artwork.control.title",
    descriptionKey: "publicReview.forArtistsGuide.artwork.control.description",
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
  {
    titleKey: "publicReview.forArtistsGuide.approval.signing.title",
    descriptionKey: "publicReview.forArtistsGuide.approval.signing.description",
  },
  {
    titleKey: "publicReview.forArtistsGuide.approval.artworkSupply.title",
    descriptionKey:
      "publicReview.forArtistsGuide.approval.artworkSupply.description",
  },
  {
    titleKey: "publicReview.forArtistsGuide.approval.salePayments.title",
    descriptionKey:
      "publicReview.forArtistsGuide.approval.salePayments.description",
  },
  {
    titleKey: "publicReview.forArtistsGuide.approval.powerFinality.title",
    descriptionKey:
      "publicReview.forArtistsGuide.approval.powerFinality.description",
  },
] as const satisfies readonly ArtistGuideCopyItem[];

const SALE_STAGES = [
  {
    titleKey: "publicReview.forArtistsGuide.sales.buy.title",
    descriptionKey: "publicReview.forArtistsGuide.sales.buy.description",
  },
  {
    titleKey: "publicReview.forArtistsGuide.sales.money.title",
    descriptionKey: "publicReview.forArtistsGuide.sales.money.description",
  },
  {
    titleKey: "publicReview.forArtistsGuide.sales.royalties.title",
    descriptionKey: "publicReview.forArtistsGuide.sales.royalties.description",
  },
] as const satisfies readonly ArtistGuideCopyItem[];

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
    pageId: undefined,
    titleKey: "publicReview.forArtistsGuide.actors.signer.title",
    descriptionKey: "publicReview.forArtistsGuide.actors.signer.description",
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
] as const satisfies readonly ArtistGuideActorItem[];

const PERMANENCE_CHECKLIST = [
  {
    titleKey: "publicReview.forArtistsGuide.permanence.files.title",
    descriptionKey:
      "publicReview.forArtistsGuide.permanence.files.description",
  },
  {
    titleKey: "publicReview.forArtistsGuide.permanence.fingerprints.title",
    descriptionKey:
      "publicReview.forArtistsGuide.permanence.fingerprints.description",
  },
  {
    titleKey: "publicReview.forArtistsGuide.permanence.record.title",
    descriptionKey:
      "publicReview.forArtistsGuide.permanence.record.description",
  },
  {
    titleKey: "publicReview.forArtistsGuide.permanence.delay.title",
    descriptionKey:
      "publicReview.forArtistsGuide.permanence.delay.description",
  },
] as const satisfies readonly ArtistGuideCopyItem[];

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
      <section aria-labelledby="stream-artist-artwork-heading">
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
        <PublicReviewGuidePointList points={ARTWORK_PARTS} />
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
        <ol
          aria-label={t(
            DEFAULT_LOCALE,
            "publicReview.forArtistsGuide.journey.listLabel"
          )}
          className="tw-mb-0 tw-mt-7 tw-list-none tw-space-y-3 tw-p-0"
        >
          {ARTIST_JOURNEY.map((step, index) => (
            <li
              key={step.titleKey}
              className="tw-grid tw-grid-cols-[2.5rem_minmax(0,1fr)] tw-gap-4 sm:tw-grid-cols-[3rem_minmax(0,1fr)] sm:tw-gap-5"
            >
              <div
                aria-hidden="true"
                className="tw-flex tw-h-full tw-flex-col tw-items-center"
              >
                <span className="tw-relative tw-z-10 tw-flex tw-size-10 tw-flex-none tw-items-center tw-justify-center tw-rounded-full tw-border tw-border-solid tw-border-primary-400/30 tw-bg-primary-400/10 tw-font-mono tw-text-xs tw-font-semibold tw-text-primary-200 tw-shadow-[0_0_0_5px_rgba(9,9,11,0.9)] sm:tw-size-12">
                  {formatInteger(DEFAULT_LOCALE, index + 1)}
                </span>
                {index < ARTIST_JOURNEY.length - 1 ? (
                  <span className="tw-mt-2 tw-w-px tw-flex-1 tw-bg-gradient-to-b tw-from-primary-400/50 tw-to-white/[0.08]" />
                ) : null}
              </div>
              <div className="tw-rounded-xl tw-border tw-border-solid tw-border-white/[0.09] tw-bg-iron-950/60 tw-p-4 sm:tw-p-5">
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
        <p className="tw-mb-0 tw-mt-5 tw-rounded-xl tw-border tw-border-solid tw-border-primary-400/20 tw-bg-primary-400/[0.06] tw-p-4 tw-text-sm tw-leading-6 tw-text-iron-300 sm:tw-ml-[4.25rem] sm:tw-p-5">
          {t(DEFAULT_LOCALE, "publicReview.forArtistsGuide.journey.important")}
        </p>
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
        <ul
          aria-label={t(
            DEFAULT_LOCALE,
            "publicReview.forArtistsGuide.approval.listLabel"
          )}
          className="tw-mb-0 tw-mt-5 tw-grid tw-list-none tw-gap-3 tw-p-0 sm:tw-grid-cols-2"
        >
          {APPROVAL_CHECKLIST.map((item) => (
            <li
              key={item.titleKey}
              className="tw-rounded-lg tw-border tw-border-solid tw-border-white/[0.08] tw-bg-black/20 tw-p-4"
            >
              <h3 className="tw-m-0 tw-text-sm tw-font-semibold tw-text-iron-100">
                {t(DEFAULT_LOCALE, item.titleKey)}
              </h3>
              <p className="tw-mb-0 tw-mt-2 tw-text-sm tw-leading-6 tw-text-iron-300">
                {t(DEFAULT_LOCALE, item.descriptionKey)}
              </p>
            </li>
          ))}
        </ul>
        <p className="tw-mb-0 tw-mt-5 tw-border-x-0 tw-border-b-0 tw-border-t tw-border-solid tw-border-white/[0.09] tw-pt-4 tw-text-sm tw-font-medium tw-leading-6 tw-text-iron-200">
          {t(DEFAULT_LOCALE, "publicReview.forArtistsGuide.approval.note")}
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
            const page = actor.pageId
              ? pages.find((candidate) => candidate.id === actor.pageId)
              : undefined;
            return (
              <article
                key={actor.titleKey}
                className="tw-flex tw-h-full tw-flex-col tw-rounded-xl tw-border tw-border-solid tw-border-white/[0.09] tw-bg-iron-950/60 tw-p-5"
              >
                <h3 className="tw-m-0 tw-text-sm tw-font-semibold tw-text-iron-100">
                  {t(DEFAULT_LOCALE, actor.titleKey)}
                </h3>
                <p className="tw-mb-0 tw-mt-2 tw-flex-1 tw-text-sm tw-leading-6 tw-text-iron-400">
                  {t(DEFAULT_LOCALE, actor.descriptionKey)}
                </p>
                {page ? <GuideLink page={page} /> : null}
              </article>
            );
          })}
        </div>
      </section>

      <section
        aria-labelledby="stream-artist-sales-heading"
        className="tw-mt-14"
      >
        <h2
          id="stream-artist-sales-heading"
          className="tw-m-0 tw-text-xl tw-font-semibold tw-tracking-tight tw-text-iron-100 sm:tw-text-2xl"
        >
          {t(DEFAULT_LOCALE, "publicReview.forArtistsGuide.sales.heading")}
        </h2>
        <div className="tw-mt-7 tw-grid tw-gap-3 sm:tw-grid-cols-3">
          {SALE_STAGES.map((stage) => (
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
        <div className="tw-flex tw-flex-col tw-items-start sm:tw-flex-row sm:tw-flex-wrap sm:tw-gap-x-5">
          {salesPage ? <GuideLink page={salesPage} /> : null}
          {revenuePage ? <GuideLink page={revenuePage} /> : null}
        </div>
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
      </section>

      <section
        aria-labelledby="stream-artist-permanence-heading"
        className="tw-mt-14"
      >
        <h2
          id="stream-artist-permanence-heading"
          className="tw-m-0 tw-text-xl tw-font-semibold tw-tracking-tight tw-text-iron-100 sm:tw-text-2xl"
        >
          {t(DEFAULT_LOCALE, "publicReview.forArtistsGuide.permanence.heading")}
        </h2>
        <p className="tw-mb-0 tw-mt-2 tw-text-sm tw-leading-6 tw-text-iron-300">
          {t(
            DEFAULT_LOCALE,
            "publicReview.forArtistsGuide.permanence.description"
          )}
        </p>
        <div className="tw-mt-7 tw-grid tw-gap-3 sm:tw-grid-cols-2">
          {PERMANENCE_CHECKLIST.map((item) => (
            <article
              key={item.titleKey}
              className="tw-rounded-xl tw-border tw-border-solid tw-border-white/[0.09] tw-bg-iron-950/60 tw-p-5"
            >
              <h3 className="tw-m-0 tw-text-sm tw-font-semibold tw-text-iron-100">
                {t(DEFAULT_LOCALE, item.titleKey)}
              </h3>
              <p className="tw-mb-0 tw-mt-2 tw-text-sm tw-leading-6 tw-text-iron-400">
                {t(DEFAULT_LOCALE, item.descriptionKey)}
              </p>
            </article>
          ))}
        </div>
        <aside
          aria-labelledby="stream-artist-permanence-review-status-heading"
          className="tw-mt-4 tw-rounded-xl tw-border tw-border-solid tw-border-primary-400/20 tw-bg-primary-400/[0.06] tw-p-4 sm:tw-p-5"
        >
          <h3
            id="stream-artist-permanence-review-status-heading"
            className="tw-m-0 tw-text-sm tw-font-semibold tw-text-iron-100"
          >
            {t(
              DEFAULT_LOCALE,
              "publicReview.forArtistsGuide.permanence.reviewStatus.title"
            )}
          </h3>
          <p className="tw-mb-0 tw-mt-2 tw-text-sm tw-leading-6 tw-text-iron-300">
            {t(
              DEFAULT_LOCALE,
              "publicReview.forArtistsGuide.permanence.reviewStatus.description"
            )}
          </p>
        </aside>
        {finalityPage ? <GuideLink page={finalityPage} /> : null}
      </section>

      <section
        aria-labelledby="stream-artist-next-step-heading"
        className="tw-mt-14 tw-rounded-xl tw-border tw-border-solid tw-border-primary-400/20 tw-bg-primary-400/[0.06] tw-p-5 sm:tw-p-7"
      >
        <h2
          id="stream-artist-next-step-heading"
          className="tw-m-0 tw-text-xl tw-font-semibold tw-tracking-tight tw-text-iron-100 sm:tw-text-2xl"
        >
          {t(DEFAULT_LOCALE, "publicReview.forArtistsGuide.nextStep.heading")}
        </h2>
        <p className="tw-mb-0 tw-mt-2 tw-text-sm tw-leading-6 tw-text-iron-300">
          {t(
            DEFAULT_LOCALE,
            "publicReview.forArtistsGuide.nextStep.description"
          )}
        </p>
      </section>

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
