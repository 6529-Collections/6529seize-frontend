import type {
  PublicReviewDefinition,
  PublicReviewPageDefinition,
} from "@/lib/public-review/publicReviewTypes";

export const STREAM_REVIEW_VERSION = "2026-07-26.1";
export const STREAM_REVIEW_SLUG = "6529-stream";
export const STREAM_REVIEW_SOURCE_COMMIT =
  "e73d4b9cb15c3c868a76b99aa3f438d4e9e75cb8";

type PageInput = Omit<PublicReviewPageDefinition, "editorialFile">;

function definePage(page: PageInput): PublicReviewPageDefinition {
  return {
    ...page,
    editorialFile: `${page.slug}.md`,
  };
}

export const STREAM_REVIEW_PAGES = [
  definePage({
    id: "overview",
    slug: "overview",
    title: "Overview",
    summary:
      "A map of the full protocol, its present review state, and the decisions the community is being asked to examine.",
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
    title: "Artwork Lifecycle",
    summary:
      "How an artwork moves from preparation through minting, preservation, and finality.",
    audiences: ["community", "artists", "technical"],
    evidenceStates: ["IMPLEMENTED", "OPEN_FOR_FEEDBACK", "AUDIT_PENDING"],
  }),
  definePage({
    id: "for-artists",
    slug: "for-artists",
    title: "For Artists",
    summary:
      "The artist-facing choices, approvals, responsibilities, and irreversible moments.",
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
    title: "Roles and Trust",
    summary:
      "Every role that can act, what it can change, and where trust remains.",
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
    title: "Curation and TDH Authorization",
    summary:
      "How offchain curation and TDH decisions become signed onchain authorization.",
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
    title: "Tokens, Collections, and Minting",
    summary:
      "The shared ERC-721 system for collections, token issuance, supply, and mint controls.",
    audiences: ["community", "artists", "technical", "auditors"],
    evidenceStates: ["IMPLEMENTED", "TESTED", "AUDIT_PENDING"],
  }),
  definePage({
    id: "fixed-price-sales-and-auctions",
    slug: "fixed-price-sales-and-auctions",
    title: "Fixed-Price Sales and Auctions",
    summary:
      "The sale mechanisms, bidding rules, settlement paths, and edge cases.",
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
    title: "Revenue, Splits, and Royalties",
    summary:
      "Where primary-sale funds and secondary royalties go, and how recipients are configured.",
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
    title: "Randomness",
    summary:
      "How unpredictable values enter the protocol and which outcomes depend on them.",
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
    title: "Metadata, Scripts, and Dependencies",
    summary:
      "How token presentation, generative scripts, and external dependencies are stored and referenced.",
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
    title: "Freezing, Preservation, and Artwork Finality",
    summary:
      "The mechanisms that move artwork data from editable to permanently fixed.",
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
    title: "Governance, Pausing, and Successors",
    summary:
      "How governance acts, emergencies are handled, and successor contracts are recognized.",
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
    title: "Security, Testing, and Known Limitations",
    summary:
      "Current engineering evidence, unresolved findings, constraints, and pre-audit caveats.",
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
    title: "Community Review",
    summary:
      "How to examine the proposal, frame actionable feedback, and follow the review record.",
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
  availableVersions: [STREAM_REVIEW_VERSION],
  status: "PUBLIC_REVIEW",
  deploymentStatus: "NOT_DEPLOYED",
  auditStatus: "PRE_AUDIT",
  feedbackAvailable: true,
  source: {
    repository: "6529-Collections/6529Stream",
    commit: STREAM_REVIEW_SOURCE_COMMIT,
  },
  pages: STREAM_REVIEW_PAGES,
};

export function getStreamReviewPage(
  slug: string
): PublicReviewPageDefinition | undefined {
  return STREAM_REVIEW_PAGES.find((page) => page.slug === slug);
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
