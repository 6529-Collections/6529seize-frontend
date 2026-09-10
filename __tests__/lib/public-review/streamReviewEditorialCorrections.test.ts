jest.mock("next/dist/compiled/server-only", () => ({}), { virtual: true });

import fs from "node:fs";
import path from "node:path";

import { SUPPORTED_LOCALES } from "@/i18n/locales";
import { extractPublicReviewSections } from "@/lib/public-review/editorialSections";
import { getCurrentStreamEditorialMarkdown } from "@/lib/public-review/streamReviewEditorialCorrections";

const version = "2026-09-09.1";
const source = {
  repository: "6529-Collections/6529Stream",
  commit: "92ea123380917032f01aae09691141a2a72df935",
};
const pages = [
  "overview",
  "artwork-lifecycle",
  "for-artists",
  "roles-and-trust",
  "curation-and-tdh-authorization",
  "tokens-collections-and-minting",
  "freezing-preservation-and-artwork-finality",
  "revenue-splits-and-royalties",
  "fixed-price-sales-and-auctions",
  "randomness",
  "metadata-scripts-and-dependencies",
  "governance-pausing-and-successors",
  "security-testing-and-known-limitations",
];

/** Reads the saved chapter fixture used to check correction and anchor guards. */
function readPage(pageId: string) {
  return fs.readFileSync(
    path.join(
      process.cwd(),
      "content/public-reviews/6529-stream/versions",
      version,
      "editorial",
      `${pageId}.md`
    ),
    "utf8"
  );
}

describe("Stream current editorial corrections", () => {
  it.each(pages)(
    "corrects %s with locale fallback and stable feedback anchors",
    (pageId) => {
      const markdown = readPage(pageId);
      for (const locale of SUPPORTED_LOCALES) {
        const result = getCurrentStreamEditorialMarkdown({
          pageId,
          markdown,
          version,
          source,
          locale,
        });
        expect(result).not.toBe(markdown);
        expect(extractPublicReviewSections(result).map(({ id }) => id)).toEqual(
          extractPublicReviewSections(markdown).map(({ id }) => id)
        );
        expect(result).not.toContain("in an earlier block");
      }
      expect(
        getCurrentStreamEditorialMarkdown({
          pageId,
          markdown,
          version,
          source,
          routeVersion: version,
        })
      ).toBe(markdown);
    }
  );

  it("does not carry corrections across source, version, or editorial changes", () => {
    const options = {
      pageId: "tokens-collections-and-minting",
      markdown: readPage("tokens-collections-and-minting"),
      version,
      source,
    };
    for (const changed of [
      { ...options, version: "future" },
      { ...options, source: { ...source, repository: "different/repository" } },
      { ...options, source: { ...source, commit: "f".repeat(40) } },
      { ...options, markdown: `${options.markdown}\nChanged source text.` },
    ]) {
      expect(() => getCurrentStreamEditorialMarkdown(changed)).toThrow(
        "must be reviewed"
      );
    }
  });

  it("leaves saved reviews and unaffected chapters unchanged", () => {
    const markdown = readPage("tokens-collections-and-minting");
    expect(
      getCurrentStreamEditorialMarkdown({
        pageId: "tokens-collections-and-minting",
        markdown,
        version: "older",
        routeVersion: "older",
        source,
      })
    ).toBe(markdown);
    expect(
      getCurrentStreamEditorialMarkdown({
        pageId: "community-review",
        markdown,
        version,
        source,
      })
    ).toBe(markdown);
  });
});
