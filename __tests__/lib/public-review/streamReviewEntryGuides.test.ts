jest.mock("@/config/publicReviews", () => ({
  isPublicReviewEnabled: () => true,
}));

import { SUPPORTED_LOCALES } from "@/i18n/locales";
import { extractPublicReviewSections } from "@/lib/public-review/editorialSections";
import {
  getStreamReviewVersion,
  STREAM_REVIEW_VERSION,
} from "@/lib/public-review/streamReviewDefinition";
import {
  STREAM_REVIEW_CURRENT_PAGES,
  STREAM_REVIEW_ENTRY_PAGES,
  getStreamReviewEntryMarkdown,
} from "@/lib/public-review/streamReviewEntryGuides";
import { resolveStreamReviewRoute } from "@/lib/public-review/streamReviewRoutes";

const source = {
  repository: "6529-Collections/6529Stream",
  commit: "92ea123380917032f01aae09691141a2a72df935",
};

describe("current Stream entry guides", () => {
  it.each(["for-collectors", "review-the-code"])(
    "resolves %s only on current routes",
    (page) => {
      expect(
        resolveStreamReviewRoute({
          baseEndpoint: "http://localhost:3001",
          params: { review: "6529-stream", page },
        })?.page.id
      ).toBe(page);
      for (const version of [STREAM_REVIEW_VERSION, "2026-07-30.1"]) {
        expect(
          resolveStreamReviewRoute({
            baseEndpoint: "http://localhost:3001",
            params: { review: "6529-stream", page, version },
          })
        ).toBeUndefined();
      }
      expect(getStreamReviewVersion()?.pages).toHaveLength(14);
    }
  );

  it.each(STREAM_REVIEW_ENTRY_PAGES)(
    "keeps $id concise, linkable, and available through locale fallback",
    (page) => {
      for (const locale of SUPPORTED_LOCALES) {
        const markdown = getStreamReviewEntryMarkdown({
          pageId: page.id,
          version: STREAM_REVIEW_VERSION,
          source,
          locale,
        })!;
        expect(markdown.split(/\s+/).length).toBeLessThan(700);
        const sections = extractPublicReviewSections(markdown);
        expect(sections.length).toBeGreaterThan(0);
        expect(new Set(sections.map((section) => section.id)).size).toBe(
          sections.length
        );
        for (const match of markdown.matchAll(
          /\]\((\/reviews\/6529-stream[^)]*)\)/g
        )) {
          const slug = match[1]!.split("/").at(-1);
          expect([
            "6529-stream",
            "reference",
            "feedback",
            ...STREAM_REVIEW_CURRENT_PAGES.map((candidate) => candidate.slug),
          ]).toContain(slug);
        }
      }
    }
  );

  it("requires a new editorial review when the candidate changes", () => {
    expect(() =>
      getStreamReviewEntryMarkdown({
        pageId: "overview",
        version: "future",
        source,
      })
    ).toThrow("must be reviewed");
    expect(() =>
      getStreamReviewEntryMarkdown({
        pageId: "overview",
        version: STREAM_REVIEW_VERSION,
        source: { ...source, commit: "f".repeat(40) },
      })
    ).toThrow("must be reviewed");
  });
});
