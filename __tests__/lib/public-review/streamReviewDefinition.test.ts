import {
  STREAM_REVIEW_DEFINITION,
  STREAM_REVIEW_PAGES,
  STREAM_REVIEW_SOURCE_COMMIT,
  STREAM_REVIEW_VERSION,
} from "@/lib/public-review/streamReviewDefinition";

const EXPECTED_PAGE_TITLES = [
  "Overview",
  "Artwork Lifecycle",
  "For Artists",
  "Roles and Trust",
  "Curation and TDH Authorization",
  "Tokens, Collections, and Minting",
  "Fixed-Price Sales and Auctions",
  "Revenue, Splits, and Royalties",
  "Randomness",
  "Metadata, Scripts, and Dependencies",
  "Freezing, Preservation, and Artwork Finality",
  "Governance, Pausing, and Successors",
  "Security, Testing, and Known Limitations",
  "Community Review",
] as const;

describe("6529 Stream public review definition", () => {
  it("pins the initial review version and exact source commit", () => {
    expect(STREAM_REVIEW_VERSION).toBe("2026-07-26.1");
    expect(STREAM_REVIEW_SOURCE_COMMIT).toMatch(/^[a-f0-9]{40}$/);
    expect(STREAM_REVIEW_DEFINITION.versions[0]?.source.commit).toBe(
      STREAM_REVIEW_SOURCE_COMMIT
    );
    expect(STREAM_REVIEW_DEFINITION.versions[0]?.version).toBe(
      STREAM_REVIEW_VERSION
    );
    expect(STREAM_REVIEW_DEFINITION.versions[0]?.pages).toBe(
      STREAM_REVIEW_PAGES
    );
  });

  it("defines fourteen stable, unique editorial pages in order", () => {
    expect(STREAM_REVIEW_PAGES).toHaveLength(14);
    expect(STREAM_REVIEW_PAGES.map((page) => page.title)).toEqual(
      EXPECTED_PAGE_TITLES
    );
    expect(new Set(STREAM_REVIEW_PAGES.map((page) => page.id)).size).toBe(14);
    expect(new Set(STREAM_REVIEW_PAGES.map((page) => page.slug)).size).toBe(14);
    expect(
      new Set(STREAM_REVIEW_PAGES.map((page) => page.editorialFile)).size
    ).toBe(14);
  });

  it("contains no feedback transport identifiers in shared review data", () => {
    const serialized = JSON.stringify(STREAM_REVIEW_DEFINITION);
    expect(serialized).not.toMatch(
      /wave[_-]?id|subwave|discussion[_-]?id|destination[_-]?id/i
    );
    expect(STREAM_REVIEW_DEFINITION.feedbackAvailable).toBe(false);
  });
});
