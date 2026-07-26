import fs from "node:fs";
import path from "node:path";

import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import { extractPublicReviewEvidenceStates } from "@/lib/public-review/editorialSections";
import { PUBLIC_REVIEW_EVIDENCE_STATES } from "@/lib/public-review/publicReviewTypes";
import {
  getStreamReviewFeedbackHref,
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
    expect(STREAM_REVIEW_SOURCE_COMMIT).toBe(
      "513bd7e079eafe109df6ae1ae21bfbca6fec6786"
    );
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

  it("keeps active and immutable feedback ledgers version-addressable", () => {
    expect(getStreamReviewFeedbackHref()).toBe(
      "/reviews/6529-stream/feedback"
    );
    expect(getStreamReviewFeedbackHref(STREAM_REVIEW_VERSION)).toBe(
      `/reviews/6529-stream/versions/${STREAM_REVIEW_VERSION}/feedback`
    );
  });

  it("defines fourteen stable, unique editorial pages in order", () => {
    expect(STREAM_REVIEW_PAGES).toHaveLength(14);
    expect(
      STREAM_REVIEW_PAGES.map((page) => t(DEFAULT_LOCALE, page.titleKey))
    ).toEqual(EXPECTED_PAGE_TITLES);
    expect(new Set(STREAM_REVIEW_PAGES.map((page) => page.id)).size).toBe(14);
    expect(new Set(STREAM_REVIEW_PAGES.map((page) => page.slug)).size).toBe(14);
    expect(
      new Set(STREAM_REVIEW_PAGES.map((page) => page.editorialFile)).size
    ).toBe(14);

    for (const page of STREAM_REVIEW_PAGES) {
      const pageStates = new Set(page.evidenceStates);
      expect(page.evidenceStates).toEqual(
        PUBLIC_REVIEW_EVIDENCE_STATES.filter((state) => pageStates.has(state))
      );
    }
  });

  it("contains no feedback transport identifiers in shared review data", () => {
    const serialized = JSON.stringify(STREAM_REVIEW_DEFINITION);
    expect(serialized).not.toMatch(
      /wave[_-]?id|subwave|discussion[_-]?id|destination[_-]?id/i
    );
    expect(STREAM_REVIEW_DEFINITION.feedbackAvailable).toBe(true);
  });

  it("does not understate evidence labels used by an editorial page", () => {
    const editorialRoot = path.join(
      process.cwd(),
      "content",
      "public-reviews",
      "6529-stream",
      "versions",
      STREAM_REVIEW_VERSION,
      "editorial"
    );

    const understatedPages = STREAM_REVIEW_PAGES.flatMap((page) => {
      const markdown = fs.readFileSync(
        path.join(editorialRoot, page.editorialFile),
        "utf8"
      );
      const omittedStates = extractPublicReviewEvidenceStates(markdown).filter(
        (state) => !page.evidenceStates.includes(state)
      );

      return omittedStates.length === 0
        ? []
        : [{ page: page.id, omittedStates }];
    });

    expect(understatedPages).toEqual([]);
  });
});
