import type { MessageKey } from "@/i18n/messages";
import type { PublicReviewPageDefinition } from "./publicReviewTypes";
import { STREAM_REVIEW_PAGES } from "./streamReviewDefinition";

export const STREAM_REVIEW_ENTRY_GUIDE_VERSION = "2026-09-09.1";

function entryPage(id: string, stem: string): PublicReviewPageDefinition {
  return {
    id,
    slug: id,
    titleKey: `publicReview.pages.${stem}.title` as MessageKey,
    summaryKey: `publicReview.pages.${stem}.summary` as MessageKey,
    editorialFile: `${id}.md`,
    audiences: ["community", "artists", "technical", "auditors"],
    evidenceStates: [],
  };
}

export const STREAM_REVIEW_ENTRY_PAGES = [
  entryPage("overview", "startHere"),
  entryPage("for-artists", "artistEntry"),
  entryPage("for-collectors", "collectorEntry"),
  entryPage("review-the-code", "codeEntry"),
] as const;

export const STREAM_REVIEW_CURRENT_PAGES = [
  ...STREAM_REVIEW_ENTRY_PAGES,
  ...STREAM_REVIEW_PAGES.filter(
    (page) => !STREAM_REVIEW_ENTRY_PAGES.some((entry) => entry.id === page.id)
  ),
];

const RELATED_TOPICS: Readonly<Record<string, readonly string[]>> = {
  overview: ["for-artists", "for-collectors", "review-the-code"],
  "for-artists": [
    "roles-and-trust",
    "revenue-splits-and-royalties",
    "freezing-preservation-and-artwork-finality",
  ],
  "for-collectors": [
    "fixed-price-sales-and-auctions",
    "tokens-collections-and-minting",
    "metadata-scripts-and-dependencies",
  ],
  "review-the-code": [
    "security-testing-and-known-limitations",
    "roles-and-trust",
    "governance-pausing-and-successors",
  ],
};

export function getStreamReviewRelatedPages(pageId: string) {
  const ids = RELATED_TOPICS[pageId] ?? [
    "for-artists",
    "for-collectors",
    "review-the-code",
  ];
  return ids.flatMap((id) => {
    const page = STREAM_REVIEW_CURRENT_PAGES.find(
      (candidate) => candidate.id === id
    );
    return page ? [page] : [];
  });
}
