import type { MessageKey } from "@/i18n/messages";
import type {
  PublicReviewAudience,
  PublicReviewDefinition,
  PublicReviewEvidenceState,
  PublicReviewPageDefinition,
  PublicReviewVersionDefinition,
} from "@/lib/public-review/publicReviewTypes";
import { getPublicReviewLifecycleCapabilities } from "@/lib/public-review/publicReviewLifecycle";
import { createPublicReviewRouteBuilder } from "@/lib/public-review/publicReviewRoutes";
import {
  getStreamReviewVersionLifecycleState,
  getStreamReviewVersionSourceCommit,
  STREAM_REVIEW_LIFECYCLE_STATE,
} from "@/lib/public-review/streamReviewPublication";

export const STREAM_REVIEW_VERSION = "2026-07-27.1";
export const STREAM_REVIEW_PREVIOUS_VERSION = "2026-07-26.1";
export const STREAM_REVIEW_SLUG = "6529-stream";
export const STREAM_REVIEW_SOURCE_COMMIT = getStreamReviewVersionSourceCommit(
  STREAM_REVIEW_VERSION
);
const STREAM_REVIEW_VERSION_LIFECYCLE_STATE =
  getStreamReviewVersionLifecycleState(STREAM_REVIEW_VERSION);

if (STREAM_REVIEW_VERSION_LIFECYCLE_STATE !== STREAM_REVIEW_LIFECYCLE_STATE) {
  throw new Error(
    "The active Stream review lifecycle does not match its version."
  );
}

type PageMessageStem =
  | "overview"
  | "overviewNarrative"
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
  | "currentImplementationAndReadiness"
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
const IMPLEMENTED_OPEN_AUDIT_LIMITATION = [
  ...IMPLEMENTED_OPEN_AUDIT,
  "KNOWN_LIMITATION",
] as const;

const STREAM_REVIEW_2026_07_26_PAGES = [
  definePage("overview", "overview", ALL_AUDIENCES, [
    "IMPLEMENTED",
    "TESTED",
    "PROPOSED",
    "OPEN_FOR_FEEDBACK",
    "AUDIT_PENDING",
    "DEFERRED",
    "KNOWN_LIMITATION",
  ]),
  definePage(
    "artwork-lifecycle",
    "artworkLifecycle",
    COMMUNITY_ARTIST_TECHNICAL,
    [
      "IMPLEMENTED",
      "TESTED",
      "OPEN_FOR_FEEDBACK",
      "AUDIT_PENDING",
      "KNOWN_LIMITATION",
    ]
  ),
  definePage("for-artists", "forArtists", ARTIST_COMMUNITY, [
    "IMPLEMENTED",
    "PROPOSED",
    "OPEN_FOR_FEEDBACK",
    "AUDIT_PENDING",
    "DEFERRED",
    "KNOWN_LIMITATION",
  ]),
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
    ["IMPLEMENTED", "TESTED", "PROPOSED", "OPEN_FOR_FEEDBACK", "AUDIT_PENDING"]
  ),
  definePage(
    "tokens-collections-and-minting",
    "tokensCollectionsAndMinting",
    ALL_AUDIENCES,
    [
      "IMPLEMENTED",
      "TESTED",
      "PROPOSED",
      "OPEN_FOR_FEEDBACK",
      "AUDIT_PENDING",
      "KNOWN_LIMITATION",
    ]
  ),
  definePage(
    "fixed-price-sales-and-auctions",
    "fixedPriceSalesAndAuctions",
    ALL_AUDIENCES,
    [
      "IMPLEMENTED",
      "TESTED",
      "PROPOSED",
      "OPEN_FOR_FEEDBACK",
      "AUDIT_PENDING",
      "DEFERRED",
    ]
  ),
  definePage(
    "revenue-splits-and-royalties",
    "revenueSplitsAndRoyalties",
    ALL_AUDIENCES,
    [
      "IMPLEMENTED",
      "TESTED",
      "PROPOSED",
      "OPEN_FOR_FEEDBACK",
      "AUDIT_PENDING",
      "KNOWN_LIMITATION",
    ]
  ),
  definePage("randomness", "randomness", ARTIST_TECHNICAL_AUDITOR, [
    "IMPLEMENTED",
    "TESTED",
    "PROPOSED",
    "OPEN_FOR_FEEDBACK",
    "AUDIT_PENDING",
    "KNOWN_LIMITATION",
  ]),
  definePage(
    "metadata-scripts-and-dependencies",
    "metadataScriptsAndDependencies",
    ALL_AUDIENCES,
    [
      "IMPLEMENTED",
      "TESTED",
      "PROPOSED",
      "OPEN_FOR_FEEDBACK",
      "AUDIT_PENDING",
      "KNOWN_LIMITATION",
    ]
  ),
  definePage(
    "freezing-preservation-and-artwork-finality",
    "freezingPreservationAndArtworkFinality",
    ALL_AUDIENCES,
    [
      "IMPLEMENTED",
      "PROPOSED",
      "OPEN_FOR_FEEDBACK",
      "AUDIT_PENDING",
      "KNOWN_LIMITATION",
    ]
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
    [
      "TESTED",
      "PROPOSED",
      "OPEN_FOR_FEEDBACK",
      "AUDIT_PENDING",
      "KNOWN_LIMITATION",
    ]
  ),
  definePage("community-review", "communityReview", ALL_AUDIENCES, [
    "IMPLEMENTED",
    "OPEN_FOR_FEEDBACK",
    "AUDIT_PENDING",
    "KNOWN_LIMITATION",
  ]),
] as const;

export const STREAM_REVIEW_PAGES = [
  definePage("overview", "overviewNarrative", ALL_AUDIENCES, []),
  definePage(
    "artwork-lifecycle",
    "artworkLifecycle",
    COMMUNITY_ARTIST_TECHNICAL,
    []
  ),
  definePage("for-artists", "forArtists", ARTIST_COMMUNITY, []),
  definePage("roles-and-trust", "rolesAndTrust", ALL_AUDIENCES, []),
  definePage(
    "curation-and-tdh-authorization",
    "curationAndTdhAuthorization",
    ALL_AUDIENCES,
    []
  ),
  definePage(
    "tokens-collections-and-minting",
    "tokensCollectionsAndMinting",
    ALL_AUDIENCES,
    []
  ),
  definePage(
    "fixed-price-sales-and-auctions",
    "fixedPriceSalesAndAuctions",
    ALL_AUDIENCES,
    []
  ),
  definePage(
    "revenue-splits-and-royalties",
    "revenueSplitsAndRoyalties",
    ALL_AUDIENCES,
    []
  ),
  definePage("randomness", "randomness", ARTIST_TECHNICAL_AUDITOR, []),
  definePage(
    "metadata-scripts-and-dependencies",
    "metadataScriptsAndDependencies",
    ALL_AUDIENCES,
    []
  ),
  definePage(
    "freezing-preservation-and-artwork-finality",
    "freezingPreservationAndArtworkFinality",
    ALL_AUDIENCES,
    []
  ),
  definePage(
    "governance-pausing-and-successors",
    "governancePausingAndSuccessors",
    ALL_AUDIENCES,
    []
  ),
  definePage(
    "security-testing-and-known-limitations",
    "currentImplementationAndReadiness",
    COMMUNITY_TECHNICAL_AUDITOR,
    [
      "IMPLEMENTED",
      "TESTED",
      "PROPOSED",
      "OPEN_FOR_FEEDBACK",
      "AUDIT_PENDING",
      "DEFERRED",
      "KNOWN_LIMITATION",
    ]
  ),
  definePage("community-review", "communityReview", ALL_AUDIENCES, []),
] as const;

const STREAM_REVIEW_AUDIENCE_ENTRY_PAGE_IDS = {
  community: "community-review",
  artists: "for-artists",
  technical: "roles-and-trust",
  auditors: "security-testing-and-known-limitations",
} as const;

export const STREAM_REVIEW_DEFINITION: PublicReviewDefinition = {
  id: "stream",
  slug: STREAM_REVIEW_SLUG,
  contractName: "6529 Stream",
  title: "6529 Stream Contract Review",
  description:
    "A source-grounded public review of an artist-centered contract system for serious 1/1 digital art.",
  activeVersion: STREAM_REVIEW_VERSION,
  versions: [
    {
      version: STREAM_REVIEW_VERSION,
      status: STREAM_REVIEW_VERSION_LIFECYCLE_STATE,
      deploymentStatus: "NOT_DEPLOYED",
      auditStatus: "PRE_AUDIT",
      source: {
        repository: "6529-Collections/6529Stream",
        commit: STREAM_REVIEW_SOURCE_COMMIT,
      },
      pages: STREAM_REVIEW_PAGES,
      audienceEntryPageIds: STREAM_REVIEW_AUDIENCE_ENTRY_PAGE_IDS,
    },
    {
      version: STREAM_REVIEW_PREVIOUS_VERSION,
      status: getStreamReviewVersionLifecycleState(
        STREAM_REVIEW_PREVIOUS_VERSION
      ),
      deploymentStatus: "NOT_DEPLOYED",
      auditStatus: "PRE_AUDIT",
      source: {
        repository: "6529-Collections/6529Stream",
        commit: getStreamReviewVersionSourceCommit(
          STREAM_REVIEW_PREVIOUS_VERSION
        ),
      },
      pages: STREAM_REVIEW_2026_07_26_PAGES,
      audienceEntryPageIds: STREAM_REVIEW_AUDIENCE_ENTRY_PAGE_IDS,
    },
  ],
  status: STREAM_REVIEW_LIFECYCLE_STATE,
  deploymentStatus: "NOT_DEPLOYED",
  auditStatus: "PRE_AUDIT",
  feedbackAvailable: true,
};

const STREAM_REVIEW_ROUTES = createPublicReviewRouteBuilder(STREAM_REVIEW_SLUG);

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

export function isStreamReviewVersionPubliclyAvailable(
  version: string
): boolean {
  const reviewVersion = getStreamReviewVersion(version);
  return Boolean(
    reviewVersion &&
    getPublicReviewLifecycleCapabilities(reviewVersion.status)
      .publicRoutesAvailable
  );
}

export function getStreamReviewPageHref({
  page,
  version,
}: {
  readonly page: PublicReviewPageDefinition;
  readonly version?: string | undefined;
}): string {
  return STREAM_REVIEW_ROUTES.getPageHref(page, version);
}

export function getStreamReviewFeedbackHref(version?: string): string {
  return STREAM_REVIEW_ROUTES.getFeedbackHref(version);
}
