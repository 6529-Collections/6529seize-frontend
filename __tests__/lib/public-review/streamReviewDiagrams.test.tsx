import fs from "node:fs";
import path from "node:path";
import { cleanup, render, screen } from "@testing-library/react";

import { PublicReviewMarkdown } from "@/components/public-review/PublicReviewMarkdown";
import { extractPublicReviewSections } from "@/lib/public-review/editorialSections";
import { getStreamReviewDiagramPresentation } from "@/lib/public-review/streamReviewDiagrams";
import { getStreamReviewEntryMarkdown } from "@/lib/public-review/streamReviewEntryGuides";

const version = "2026-09-09.1";
const source = {
  repository: "6529-Collections/6529Stream",
  commit: "92ea123380917032f01aae09691141a2a72df935",
};
const pages = [
  "overview",
  "for-artists",
  "roles-and-trust",
  "review-the-code",
  "revenue-splits-and-royalties",
  "freezing-preservation-and-artwork-finality",
];

function readPage(pageId: string) {
  return (
    getStreamReviewEntryMarkdown({ pageId, version, source }) ??
    fs.readFileSync(
      path.join(
        process.cwd(),
        "content/public-reviews/6529-stream/versions",
        version,
        "editorial",
        `${pageId}.md`
      ),
      "utf8"
    )
  );
}

afterEach(cleanup);

describe("current Stream diagram presentation", () => {
  it.each(pages)(
    "replaces repeated copy on %s while preserving all feedback anchors",
    (pageId) => {
      const markdown = readPage(pageId);
      const result = getStreamReviewDiagramPresentation({
        pageId,
        markdown,
        version,
        source,
      });
      expect(result.markdown.length).toBeLessThan(markdown.length);
      expect(extractPublicReviewSections(result.markdown)).toEqual(
        extractPublicReviewSections(markdown)
      );
      const { container } = render(<PublicReviewMarkdown {...result} />);
      expect(screen.getAllByRole("figure")).toHaveLength(1);
      expect(screen.getByRole("figure")).toHaveAccessibleName();
      for (const section of extractPublicReviewSections(markdown)) {
        expect(
          container.querySelector(`[id="${section.id}"]`)
        ).toBeInTheDocument();
      }
      if (pageId === "roles-and-trust" || pageId === "review-the-code") {
        const details = container.querySelector("details");
        expect(details).not.toHaveAttribute("open");
        expect(details?.querySelector("table")).toBeInTheDocument();
        expect(details?.querySelector("table")?.textContent).toContain(
          "Artist"
        );
      }
    }
  );

  it.each(["2026-08-01.1", version])(
    "never inserts current diagrams into the saved %s review",
    (routeVersion) => {
      for (const pageId of pages) {
        const markdown = readPage(pageId);
        expect(
          getStreamReviewDiagramPresentation({
            pageId,
            markdown,
            version: routeVersion,
            routeVersion,
            source,
          })
        ).toEqual({ markdown });
      }
    }
  );

  it("leaves other current chapters unchanged", () => {
    const pageId = "randomness";
    const markdown = readPage(pageId);
    expect(
      getStreamReviewDiagramPresentation({ pageId, markdown, version, source })
    ).toEqual({ markdown });
  });

  it("rejects stale diagrams when the source or review changes", () => {
    const options = {
      pageId: "roles-and-trust",
      markdown: readPage("roles-and-trust"),
      version,
      source,
    };
    expect(() =>
      getStreamReviewDiagramPresentation({
        ...options,
        source: { ...source, commit: "f".repeat(40) },
      })
    ).toThrow("must be reviewed");
    expect(() =>
      getStreamReviewDiagramPresentation({ ...options, version: "future" })
    ).toThrow("must be reviewed");
  });

  it("rejects a missing or ambiguous replacement instead of dropping unrelated content", () => {
    const pageId = "roles-and-trust";
    const markdown = readPage(pageId);
    expect(() =>
      getStreamReviewDiagramPresentation({
        pageId,
        markdown: "## Changed heading\n\nOther content.",
        version,
        source,
      })
    ).toThrow("missing or ambiguous");
    expect(() =>
      getStreamReviewDiagramPresentation({
        pageId,
        markdown: markdown + markdown,
        version,
        source,
      })
    ).toThrow("missing or ambiguous");
    expect(() =>
      getStreamReviewDiagramPresentation({
        pageId,
        markdown: "## Who controls what\n\nNo table.",
        version,
        source,
      })
    ).toThrow("replacement is missing");
  });
});
