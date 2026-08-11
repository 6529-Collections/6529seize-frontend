import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t, type MessageKey } from "@/i18n/messages";

type ArtistDetailBasis = "code" | "accepted" | "proposed";

type ArtistDetailSection = {
  readonly id: string;
  readonly titleKey: MessageKey;
  readonly basis: readonly ArtistDetailBasis[];
  readonly introKeys: readonly MessageKey[];
  readonly pointKeys?: readonly MessageKey[];
  readonly outroKeys?: readonly MessageKey[];
  readonly ordered?: boolean;
};

const BASIS_COPY: Record<
  ArtistDetailBasis,
  {
    readonly labelKey: MessageKey;
    readonly descriptionKey: MessageKey;
    readonly className: string;
  }
> = {
  code: {
    labelKey: "publicReview.forArtistsDetails.basis.code.label",
    descriptionKey: "publicReview.forArtistsDetails.basis.code.description",
    className:
      "tw-border-primary-400/25 tw-bg-primary-400/[0.08] tw-text-primary-200",
  },
  accepted: {
    labelKey: "publicReview.forArtistsDetails.basis.accepted.label",
    descriptionKey:
      "publicReview.forArtistsDetails.basis.accepted.description",
    className:
      "tw-border-orange-300/25 tw-bg-orange-300/[0.08] tw-text-orange-200",
  },
  proposed: {
    labelKey: "publicReview.forArtistsDetails.basis.proposed.label",
    descriptionKey:
      "publicReview.forArtistsDetails.basis.proposed.description",
    className: "tw-border-white/15 tw-bg-white/[0.04] tw-text-iron-300",
  },
};

const DETAIL_SECTIONS: readonly ArtistDetailSection[] = [
  {
    id: "your-collection-has-a-durable-identity",
    titleKey: "publicReview.forArtistsDetails.identity.title",
    basis: ["code", "accepted"],
    introKeys: ["publicReview.forArtistsDetails.identity.intro"],
    pointKeys: [
      "publicReview.forArtistsDetails.identity.point.artist",
      "publicReview.forArtistsDetails.identity.point.burn",
      "publicReview.forArtistsDetails.identity.point.modules",
    ],
    outroKeys: ["publicReview.forArtistsDetails.identity.outro"],
  },
  {
    id: "approving-a-specific-collection-state",
    titleKey: "publicReview.forArtistsDetails.approval.title",
    basis: ["code"],
    introKeys: ["publicReview.forArtistsDetails.approval.intro"],
    pointKeys: [
      "publicReview.forArtistsDetails.approval.point.artist",
      "publicReview.forArtistsDetails.approval.point.freeze",
      "publicReview.forArtistsDetails.approval.point.purchases",
      "publicReview.forArtistsDetails.approval.point.supply",
      "publicReview.forArtistsDetails.approval.point.delay",
    ],
    outroKeys: ["publicReview.forArtistsDetails.approval.outro"],
  },
  {
    id: "the-scope-of-artist-approval",
    titleKey: "publicReview.forArtistsDetails.scope.title",
    basis: ["code", "proposed"],
    introKeys: ["publicReview.forArtistsDetails.scope.intro"],
    pointKeys: [
      "publicReview.forArtistsDetails.scope.point.files",
      "publicReview.forArtistsDetails.scope.point.supply",
      "publicReview.forArtistsDetails.scope.point.sale",
      "publicReview.forArtistsDetails.scope.point.randomness",
      "publicReview.forArtistsDetails.scope.point.freeze",
      "publicReview.forArtistsDetails.scope.point.finality",
      "publicReview.forArtistsDetails.scope.point.recovery",
    ],
    outroKeys: ["publicReview.forArtistsDetails.scope.outro"],
  },
  {
    id: "statements-made-in-the-artist-s-name",
    titleKey: "publicReview.forArtistsDetails.statements.title",
    basis: ["code"],
    introKeys: [
      "publicReview.forArtistsDetails.statements.intro",
      "publicReview.forArtistsDetails.statements.rules",
    ],
    pointKeys: [
      "publicReview.forArtistsDetails.statements.point.author",
      "publicReview.forArtistsDetails.statements.point.authority",
      "publicReview.forArtistsDetails.statements.point.subject",
      "publicReview.forArtistsDetails.statements.point.change",
    ],
    outroKeys: ["publicReview.forArtistsDetails.statements.outro"],
  },
  {
    id: "artwork-files-scripts-and-token-data",
    titleKey: "publicReview.forArtistsDetails.files.title",
    basis: ["code", "accepted"],
    introKeys: [
      "publicReview.forArtistsDetails.files.intro",
      "publicReview.forArtistsDetails.files.check",
    ],
    pointKeys: [
      "publicReview.forArtistsDetails.files.point.parts",
      "publicReview.forArtistsDetails.files.point.order",
      "publicReview.forArtistsDetails.files.point.versions",
      "publicReview.forArtistsDetails.files.point.locations",
      "publicReview.forArtistsDetails.files.point.hashes",
      "publicReview.forArtistsDetails.files.point.rebuild",
    ],
    outroKeys: ["publicReview.forArtistsDetails.files.outro"],
  },
  {
    id: "one-of-ones-and-editions",
    titleKey: "publicReview.forArtistsDetails.editions.title",
    basis: ["code"],
    introKeys: ["publicReview.forArtistsDetails.editions.intro"],
    pointKeys: [
      "publicReview.forArtistsDetails.editions.point.maximum",
      "publicReview.forArtistsDetails.editions.point.minted",
      "publicReview.forArtistsDetails.editions.point.live",
      "publicReview.forArtistsDetails.editions.point.paths",
      "publicReview.forArtistsDetails.editions.point.control",
      "publicReview.forArtistsDetails.editions.point.close",
    ],
    outroKeys: ["publicReview.forArtistsDetails.editions.outro"],
  },
  {
    id: "choosing-who-can-mint",
    titleKey: "publicReview.forArtistsDetails.mint.title",
    basis: ["code"],
    introKeys: [
      "publicReview.forArtistsDetails.mint.intro",
      "publicReview.forArtistsDetails.mint.authorization",
    ],
    outroKeys: ["publicReview.forArtistsDetails.mint.outro"],
  },
  {
    id: "curation-and-tdh",
    titleKey: "publicReview.forArtistsDetails.curation.title",
    basis: ["code"],
    introKeys: [
      "publicReview.forArtistsDetails.curation.intro",
      "publicReview.forArtistsDetails.curation.signature",
      "publicReview.forArtistsDetails.curation.limit",
    ],
  },
  {
    id: "fixed-price-sales-and-auctions",
    titleKey: "publicReview.forArtistsDetails.sales.title",
    basis: ["code", "accepted"],
    introKeys: ["publicReview.forArtistsDetails.sales.intro"],
    pointKeys: [
      "publicReview.forArtistsDetails.sales.point.fixed",
      "publicReview.forArtistsDetails.sales.point.auction",
      "publicReview.forArtistsDetails.sales.point.cancel",
    ],
    outroKeys: ["publicReview.forArtistsDetails.sales.outro"],
  },
  {
    id: "revenue-collaborators-and-royalties",
    titleKey: "publicReview.forArtistsDetails.revenue.title",
    basis: ["code", "accepted"],
    introKeys: [
      "publicReview.forArtistsDetails.revenue.intro",
      "publicReview.forArtistsDetails.revenue.paths",
    ],
    pointKeys: [
      "publicReview.forArtistsDetails.revenue.point.people",
      "publicReview.forArtistsDetails.revenue.point.profile",
      "publicReview.forArtistsDetails.revenue.point.change",
      "publicReview.forArtistsDetails.revenue.point.rounding",
      "publicReview.forArtistsDetails.revenue.point.royalty",
    ],
    outroKeys: ["publicReview.forArtistsDetails.revenue.outro"],
  },
  {
    id: "randomness",
    titleKey: "publicReview.forArtistsDetails.randomness.title",
    basis: ["code", "accepted"],
    introKeys: ["publicReview.forArtistsDetails.randomness.intro"],
    pointKeys: [
      "publicReview.forArtistsDetails.randomness.point.state",
      "publicReview.forArtistsDetails.randomness.point.result",
      "publicReview.forArtistsDetails.randomness.point.retry",
      "publicReview.forArtistsDetails.randomness.point.control",
    ],
  },
  {
    id: "freezing-the-work",
    titleKey: "publicReview.forArtistsDetails.freeze.title",
    basis: ["code", "accepted"],
    introKeys: ["publicReview.forArtistsDetails.freeze.intro"],
    pointKeys: [
      "publicReview.forArtistsDetails.freeze.point.supply",
      "publicReview.forArtistsDetails.freeze.point.core",
      "publicReview.forArtistsDetails.freeze.point.preservation",
      "publicReview.forArtistsDetails.freeze.point.finality",
    ],
    outroKeys: [
      "publicReview.forArtistsDetails.freeze.separate",
      "publicReview.forArtistsDetails.freeze.check",
      "publicReview.forArtistsDetails.freeze.limit",
    ],
  },
  {
    id: "collaborators-delegation-recovery-and-estates",
    titleKey: "publicReview.forArtistsDetails.lifetime.title",
    basis: ["proposed"],
    introKeys: ["publicReview.forArtistsDetails.lifetime.intro"],
    pointKeys: [
      "publicReview.forArtistsDetails.lifetime.point.collaborators",
      "publicReview.forArtistsDetails.lifetime.point.delegation",
      "publicReview.forArtistsDetails.lifetime.point.recovery",
      "publicReview.forArtistsDetails.lifetime.point.estates",
      "publicReview.forArtistsDetails.lifetime.point.disputes",
    ],
    outroKeys: [
      "publicReview.forArtistsDetails.lifetime.status",
      "publicReview.forArtistsDetails.lifetime.question",
    ],
  },
  {
    id: "design-position",
    titleKey: "publicReview.forArtistsDetails.design.title",
    basis: ["accepted"],
    introKeys: ["publicReview.forArtistsDetails.design.intro"],
    pointKeys: [
      "publicReview.forArtistsDetails.design.point.work",
      "publicReview.forArtistsDetails.design.point.files",
      "publicReview.forArtistsDetails.design.point.sale",
      "publicReview.forArtistsDetails.design.point.randomness",
      "publicReview.forArtistsDetails.design.point.power",
      "publicReview.forArtistsDetails.design.point.permanent",
    ],
    outroKeys: ["publicReview.forArtistsDetails.design.outro"],
  },
  {
    id: "questions-for-artists",
    titleKey: "publicReview.forArtistsDetails.questions.title",
    basis: [],
    introKeys: ["publicReview.forArtistsDetails.questions.intro"],
    pointKeys: [
      "publicReview.forArtistsDetails.questions.point.signature",
      "publicReview.forArtistsDetails.questions.point.shared",
      "publicReview.forArtistsDetails.questions.point.collaborators",
      "publicReview.forArtistsDetails.questions.point.recovery",
      "publicReview.forArtistsDetails.questions.point.preservation",
      "publicReview.forArtistsDetails.questions.point.payments",
      "publicReview.forArtistsDetails.questions.point.finality",
    ],
    ordered: true,
  },
];

function ArtistDetailPoints({
  ordered = false,
  pointKeys,
}: {
  readonly ordered?: boolean | undefined;
  readonly pointKeys: readonly MessageKey[];
}) {
  const List = ordered ? "ol" : "ul";

  return (
    <List
      className={
        ordered
          ? "tw-mb-0 tw-mt-4 tw-space-y-2 tw-pl-6 tw-text-sm tw-leading-6 tw-text-iron-300 marker:tw-font-mono marker:tw-text-primary-300"
          : "tw-mb-0 tw-mt-4 tw-space-y-2 tw-pl-5 tw-text-sm tw-leading-6 tw-text-iron-300 marker:tw-text-primary-300"
      }
    >
      {pointKeys.map((pointKey) => (
        <li key={pointKey} className="tw-pl-1">
          {t(DEFAULT_LOCALE, pointKey)}
        </li>
      ))}
    </List>
  );
}

export function StreamReviewForArtistsDetails() {
  return (
    <div className="tw-mt-16 tw-w-full tw-max-w-[52rem]">
      <section
        aria-labelledby="stream-artist-details-heading"
        className="tw-rounded-xl tw-border tw-border-solid tw-border-white/[0.09] tw-bg-iron-950/60 tw-p-5 sm:tw-p-7"
      >
        <h2
          id="stream-artist-details-heading"
          className="tw-m-0 tw-text-xl tw-font-semibold tw-tracking-tight tw-text-iron-100 sm:tw-text-2xl"
        >
          {t(DEFAULT_LOCALE, "publicReview.forArtistsDetails.heading")}
        </h2>
        <p className="tw-mb-0 tw-mt-2 tw-text-sm tw-leading-6 tw-text-iron-300">
          {t(DEFAULT_LOCALE, "publicReview.forArtistsDetails.description")}
        </p>
        <ul className="tw-mb-0 tw-mt-5 tw-grid tw-list-none tw-gap-3 tw-p-0 sm:tw-grid-cols-3">
          {(Object.keys(BASIS_COPY) as ArtistDetailBasis[]).map((basis) => {
            const item = BASIS_COPY[basis];
            return (
              <li
                key={basis}
                className="tw-rounded-lg tw-border tw-border-solid tw-border-white/[0.08] tw-bg-black/20 tw-p-4"
              >
                <p className="tw-m-0 tw-text-xs tw-font-semibold tw-uppercase tw-tracking-wide tw-text-iron-100">
                  {t(DEFAULT_LOCALE, item.labelKey)}
                </p>
                <p className="tw-mb-0 tw-mt-2 tw-text-xs tw-leading-5 tw-text-iron-400">
                  {t(DEFAULT_LOCALE, item.descriptionKey)}
                </p>
              </li>
            );
          })}
        </ul>
      </section>

      <div className="tw-mt-12">
        {DETAIL_SECTIONS.map((section, index) => (
          <section
            id={section.id}
            key={section.id}
            aria-labelledby={`${section.id}-heading`}
            className={
              index === 0
                ? "scroll-mt-24"
                : "scroll-mt-24 tw-mt-12 tw-border-x-0 tw-border-b-0 tw-border-t tw-border-solid tw-border-white/[0.08] tw-pt-12"
            }
          >
            <div className="tw-flex tw-flex-wrap tw-items-center tw-gap-2">
              {section.basis.map((basis) => {
                const item = BASIS_COPY[basis];
                return (
                  <span
                    key={basis}
                    className={`tw-inline-flex tw-rounded-full tw-border tw-border-solid tw-px-2.5 tw-py-1 tw-text-[0.6875rem] tw-font-semibold tw-uppercase tw-tracking-wide ${item.className}`}
                  >
                    {t(DEFAULT_LOCALE, item.labelKey)}
                  </span>
                );
              })}
            </div>
            <h2
              id={`${section.id}-heading`}
              className="tw-mb-0 tw-mt-3 tw-text-xl tw-font-semibold tw-tracking-tight tw-text-iron-100 sm:tw-text-2xl"
            >
              {t(DEFAULT_LOCALE, section.titleKey)}
            </h2>
            {section.introKeys.map((introKey) => (
              <p
                key={introKey}
                className="tw-mb-0 tw-mt-3 tw-text-sm tw-leading-6 tw-text-iron-300"
              >
                {t(DEFAULT_LOCALE, introKey)}
              </p>
            ))}
            {section.pointKeys ? (
              <ArtistDetailPoints
                ordered={section.ordered}
                pointKeys={section.pointKeys}
              />
            ) : null}
            {section.outroKeys?.map((outroKey) => (
              <p
                key={outroKey}
                className="tw-mb-0 tw-mt-4 tw-text-sm tw-leading-6 tw-text-iron-300"
              >
                {t(DEFAULT_LOCALE, outroKey)}
              </p>
            ))}
          </section>
        ))}
      </div>
    </div>
  );
}
