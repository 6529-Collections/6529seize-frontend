import type { MessageKey } from "@/i18n/messages";
import type {
  PublicReviewAudience,
  PublicReviewDefinition,
  PublicReviewEvidenceState,
  PublicReviewPageDefinition,
  PublicReviewVersionDefinition,
} from "@/lib/public-review/publicReviewTypes";

export const STREAM_REVIEW_VERSION = "2026-07-26.1";
export const STREAM_REVIEW_SLUG = "6529-stream";
export const STREAM_REVIEW_SOURCE_COMMIT =
  "018c8788750980e143c38ace0666684bf641ec4f";

type PageMessageStem =
  | "overview"
  | "artworkLifecycle"
  | "forArtists"
  | "rolesAndTrust"
  | "curationAndTdhAuthorization"
  | "tokensCollectionsAndMinting"
  | "fixedPriceSalesAndAuctions"
  | "revenueSplitsAndRoyalties"
  | "randomness"
  | "metadataScriptsAndDependencies"
  | "freezingPreservationAndArtworkFinality"
  | "governancePausingAndSuccessors"
  | "securityTestingAndKnownLimitations"
  | "communityReview";

function definePage(
  id: string,
  messageStem: PageMessageStem,
  audiences: readonly PublicReviewAudience[],
  evidenceStates: readonly PublicReviewEvidenceState[]
): PublicReviewPageDefinition {
  return {
    id,
    slug: id,
    titleKey: `publicReview.pages.${messageStem}.title` as MessageKey,
    summaryKey: `publicReview.pages.${messageStem}.summary` as MessageKey,
    editorialFile: `${id}.md`,
    audiences,
    evidenceStates,
  };
}

const ALL_AUDIENCES = [
  "community",
  "artists",
  "technical",
  "auditors",
] as const;
const COMMUNITY_ARTIST_TECHNICAL = [
  "community",
  "artists",
  "technical",
] as const;
const ARTIST_COMMUNITY = ["artists", "community"] as const;
const ARTIST_TECHNICAL_AUDITOR = ["artists", "technical", "auditors"] as const;
const COMMUNITY_TECHNICAL_AUDITOR = [
  "community",
  "technical",
  "auditors",
] as const;

const IMPLEMENTED_OPEN_AUDIT = [
  "IMPLEMENTED",
  "OPEN_FOR_FEEDBACK",
  "AUDIT_PENDING",
] as const;
const IMPLEMENTED_PROPOSED_OPEN_AUDIT = [
  "IMPLEMENTED",
  "PROPOSED",
  "OPEN_FOR_FEEDBACK",
  "AUDIT_PENDING",
] as const;
const IMPLEMENTED_TESTED_OPEN_AUDIT = [
  "IMPLEMENTED",
  "TESTED",
  "OPEN_FOR_FEEDBACK",
  "AUDIT_PENDING",
] as const;
const IMPLEMENTED_OPEN_AUDIT_LIMITATION = [
  ...IMPLEMENTED_OPEN_AUDIT,
  "KNOWN_LIMITATION",
] as const;

export const STREAM_REVIEW_PAGES = [
  definePage("overview", "overview", ALL_AUDIENCES, [
    "IMPLEMENTED",
    "TESTED",
    "OPEN_FOR_FEEDBACK",
    "AUDIT_PENDING",
    "KNOWN_LIMITATION",
  ]),
  definePage(
    "artwork-lifecycle",
    "artworkLifecycle",
    COMMUNITY_ARTIST_TECHNICAL,
    IMPLEMENTED_OPEN_AUDIT
  ),
  definePage(
    "for-artists",
    "forArtists",
    ARTIST_COMMUNITY,
    IMPLEMENTED_PROPOSED_OPEN_AUDIT
  ),
  definePage(
    "roles-and-trust",
    "rolesAndTrust",
    ALL_AUDIENCES,
    IMPLEMENTED_OPEN_AUDIT_LIMITATION
  ),
  definePage(
    "curation-and-tdh-authorization",
    "curationAndTdhAuthorization",
    ALL_AUDIENCES,
    IMPLEMENTED_PROPOSED_OPEN_AUDIT
  ),
  definePage(
    "tokens-collections-and-minting",
    "tokensCollectionsAndMinting",
    ALL_AUDIENCES,
    ["IMPLEMENTED", "TESTED", "AUDIT_PENDING"]
  ),
  definePage(
    "fixed-price-sales-and-auctions",
    "fixedPriceSalesAndAuctions",
    ALL_AUDIENCES,
    IMPLEMENTED_TESTED_OPEN_AUDIT
  ),
  definePage(
    "revenue-splits-and-royalties",
    "revenueSplitsAndRoyalties",
    ALL_AUDIENCES,
    IMPLEMENTED_TESTED_OPEN_AUDIT
  ),
  definePage(
    "randomness",
    "randomness",
    ARTIST_TECHNICAL_AUDITOR,
    IMPLEMENTED_TESTED_OPEN_AUDIT
  ),
  definePage(
    "metadata-scripts-and-dependencies",
    "metadataScriptsAndDependencies",
    ALL_AUDIENCES,
    IMPLEMENTED_PROPOSED_OPEN_AUDIT
  ),
  definePage(
    "freezing-preservation-and-artwork-finality",
    "freezingPreservationAndArtworkFinality",
    ALL_AUDIENCES,
    IMPLEMENTED_PROPOSED_OPEN_AUDIT
  ),
  definePage(
    "governance-pausing-and-successors",
    "governancePausingAndSuccessors",
    ALL_AUDIENCES,
    IMPLEMENTED_OPEN_AUDIT_LIMITATION
  ),
  definePage(
    "security-testing-and-known-limitations",
    "securityTestingAndKnownLimitations",
    COMMUNITY_TECHNICAL_AUDITOR,
    ["TESTED", "OPEN_FOR_FEEDBACK", "AUDIT_PENDING", "KNOWN_LIMITATION"]
  ),
  definePage("community-review", "communityReview", ALL_AUDIENCES, [
    "OPEN_FOR_FEEDBACK",
    "AUDIT_PENDING",
  ]),
] as const;

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
