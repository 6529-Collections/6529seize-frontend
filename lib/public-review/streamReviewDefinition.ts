import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import type {
  PublicReviewDefinition,
  PublicReviewPageDefinition,
  PublicReviewVersionDefinition,
} from "@/lib/public-review/publicReviewTypes";

export const STREAM_REVIEW_VERSION = "2026-07-26.1";
export const STREAM_REVIEW_SLUG = "6529-stream";
export const STREAM_REVIEW_SOURCE_COMMIT =
  "e73d4b9cb15c3c868a76b99aa3f438d4e9e75cb8";

type PageInput = Omit<
  PublicReviewPageDefinition,
  "editorialFile" | "title" | "summary"
>;

function definePage(page: PageInput): PublicReviewPageDefinition {
  return {
    ...page,
    title: t(DEFAULT_LOCALE, page.titleKey),
    summary: t(DEFAULT_LOCALE, page.summaryKey),
    editorialFile: `${page.slug}.md`,
  };
}

export const STREAM_REVIEW_PAGES = [
  definePage({
    id: "overview",
    slug: "overview",
    titleKey: "publicReview.pages.overview.title",
    summaryKey: "publicReview.pages.overview.summary",
    audiences: ["community", "artists", "technical", "auditors"],
    evidenceStates: [
      "IMPLEMENTED",
      "TESTED",
      "OPEN_FOR_FEEDBACK",
      "AUDIT_PENDING",
      "KNOWN_LIMITATION",
    ],
  }),
  definePage({
    id: "artwork-lifecycle",
    slug: "artwork-lifecycle",
    titleKey: "publicReview.pages.artworkLifecycle.title",
    summaryKey: "publicReview.pages.artworkLifecycle.summary",
    audiences: ["community", "artists", "technical"],
    evidenceStates: ["IMPLEMENTED", "OPEN_FOR_FEEDBACK", "AUDIT_PENDING"],
  }),
  definePage({
    id: "for-artists",
    slug: "for-artists",
    titleKey: "publicReview.pages.forArtists.title",
    summaryKey: "publicReview.pages.forArtists.summary",
    audiences: ["artists", "community"],
    evidenceStates: [
      "IMPLEMENTED",
      "PROPOSED",
      "OPEN_FOR_FEEDBACK",
      "AUDIT_PENDING",
    ],
  }),
  definePage({
    id: "roles-and-trust",
    slug: "roles-and-trust",
    titleKey: "publicReview.pages.rolesAndTrust.title",
    summaryKey: "publicReview.pages.rolesAndTrust.summary",
    audiences: ["community", "artists", "technical", "auditors"],
    evidenceStates: [
      "IMPLEMENTED",
      "OPEN_FOR_FEEDBACK",
      "AUDIT_PENDING",
      "KNOWN_LIMITATION",
    ],
  }),
  definePage({
    id: "curation-and-tdh-authorization",
    slug: "curation-and-tdh-authorization",
    titleKey: "publicReview.pages.curationAndTdhAuthorization.title",
    summaryKey: "publicReview.pages.curationAndTdhAuthorization.summary",
    audiences: ["community", "artists", "technical", "auditors"],
    evidenceStates: [
      "IMPLEMENTED",
      "PROPOSED",
      "OPEN_FOR_FEEDBACK",
      "AUDIT_PENDING",
    ],
  }),
  definePage({
    id: "tokens-collections-and-minting",
    slug: "tokens-collections-and-minting",
    titleKey: "publicReview.pages.tokensCollectionsAndMinting.title",
    summaryKey: "publicReview.pages.tokensCollectionsAndMinting.summary",
    audiences: ["community", "artists", "technical", "auditors"],
    evidenceStates: ["IMPLEMENTED", "TESTED", "AUDIT_PENDING"],
  }),
  definePage({
    id: "fixed-price-sales-and-auctions",
    slug: "fixed-price-sales-and-auctions",
    titleKey: "publicReview.pages.fixedPriceSalesAndAuctions.title",
    summaryKey: "publicReview.pages.fixedPriceSalesAndAuctions.summary",
    audiences: ["community", "artists", "technical", "auditors"],
    evidenceStates: [
      "IMPLEMENTED",
      "TESTED",
      "OPEN_FOR_FEEDBACK",
      "AUDIT_PENDING",
    ],
  }),
  definePage({
    id: "revenue-splits-and-royalties",
    slug: "revenue-splits-and-royalties",
    titleKey: "publicReview.pages.revenueSplitsAndRoyalties.title",
    summaryKey: "publicReview.pages.revenueSplitsAndRoyalties.summary",
    audiences: ["community", "artists", "technical", "auditors"],
    evidenceStates: [
      "IMPLEMENTED",
      "TESTED",
      "OPEN_FOR_FEEDBACK",
      "AUDIT_PENDING",
    ],
  }),
  definePage({
    id: "randomness",
    slug: "randomness",
    titleKey: "publicReview.pages.randomness.title",
    summaryKey: "publicReview.pages.randomness.summary",
    audiences: ["artists", "technical", "auditors"],
    evidenceStates: [
      "IMPLEMENTED",
      "TESTED",
      "OPEN_FOR_FEEDBACK",
      "AUDIT_PENDING",
    ],
  }),
  definePage({
    id: "metadata-scripts-and-dependencies",
    slug: "metadata-scripts-and-dependencies",
    titleKey: "publicReview.pages.metadataScriptsAndDependencies.title",
    summaryKey: "publicReview.pages.metadataScriptsAndDependencies.summary",
    audiences: ["community", "artists", "technical", "auditors"],
    evidenceStates: [
      "IMPLEMENTED",
      "PROPOSED",
      "OPEN_FOR_FEEDBACK",
      "AUDIT_PENDING",
    ],
  }),
  definePage({
    id: "freezing-preservation-and-artwork-finality",
    slug: "freezing-preservation-and-artwork-finality",
    titleKey: "publicReview.pages.freezingPreservationAndArtworkFinality.title",
    summaryKey:
      "publicReview.pages.freezingPreservationAndArtworkFinality.summary",
    audiences: ["community", "artists", "technical", "auditors"],
    evidenceStates: [
      "IMPLEMENTED",
      "PROPOSED",
      "OPEN_FOR_FEEDBACK",
      "AUDIT_PENDING",
    ],
  }),
  definePage({
    id: "governance-pausing-and-successors",
    slug: "governance-pausing-and-successors",
    titleKey: "publicReview.pages.governancePausingAndSuccessors.title",
    summaryKey: "publicReview.pages.governancePausingAndSuccessors.summary",
    audiences: ["community", "artists", "technical", "auditors"],
    evidenceStates: [
      "IMPLEMENTED",
      "OPEN_FOR_FEEDBACK",
      "AUDIT_PENDING",
      "KNOWN_LIMITATION",
    ],
  }),
  definePage({
    id: "security-testing-and-known-limitations",
    slug: "security-testing-and-known-limitations",
    titleKey: "publicReview.pages.securityTestingAndKnownLimitations.title",
    summaryKey: "publicReview.pages.securityTestingAndKnownLimitations.summary",
    audiences: ["community", "technical", "auditors"],
    evidenceStates: [
      "TESTED",
      "OPEN_FOR_FEEDBACK",
      "AUDIT_PENDING",
      "KNOWN_LIMITATION",
    ],
  }),
  definePage({
    id: "community-review",
    slug: "community-review",
    titleKey: "publicReview.pages.communityReview.title",
    summaryKey: "publicReview.pages.communityReview.summary",
    audiences: ["community", "artists", "technical", "auditors"],
    evidenceStates: ["OPEN_FOR_FEEDBACK", "AUDIT_PENDING"],
  }),
] as const satisfies readonly PublicReviewPageDefinition[];

export const STREAM_REVIEW_DEFINITION: PublicReviewDefinition = {
  id: "stream",
  slug: STREAM_REVIEW_SLUG,
  title: "6529 Stream Contract Review",
  description:
    "A source-grounded public review of the proposed 6529 Stream protocol before finalization and deployment.",
  activeVersion: STREAM_REVIEW_VERSION,
  versions: [
    {
      version: STREAM_REVIEW_VERSION,
      source: {
        repository: "6529-Collections/6529Stream",
        commit: STREAM_REVIEW_SOURCE_COMMIT,
      },
      pages: STREAM_REVIEW_PAGES,
    },
  ],
  status: "PUBLIC_REVIEW",
  deploymentStatus: "NOT_DEPLOYED",
  auditStatus: "PRE_AUDIT",
  feedbackAvailable: false,
};

export function getStreamReviewPage(
  slug: string,
  version = STREAM_REVIEW_VERSION
): PublicReviewPageDefinition | undefined {
  return getStreamReviewVersion(version)?.pages.find(
    (page) => page.slug === slug
  );
}

export function getStreamReviewVersion(
  version = STREAM_REVIEW_VERSION
): PublicReviewVersionDefinition | undefined {
  return STREAM_REVIEW_DEFINITION.versions.find(
    (candidate) => candidate.version === version
  );
}

export function getStreamReviewPageHref({
  page,
  version,
}: {
  readonly page: PublicReviewPageDefinition;
  readonly version?: string | undefined;
}): string {
  const root = version
    ? `/reviews/${STREAM_REVIEW_SLUG}/versions/${version}`
    : `/reviews/${STREAM_REVIEW_SLUG}`;

  return page.id === "overview" ? root : `${root}/${page.slug}`;
}
