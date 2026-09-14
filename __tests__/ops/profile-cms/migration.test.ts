/** @jest-environment node */
import fs from "node:fs";
import path from "node:path";

import {
  boundedMetadata,
  extractHtmlParts,
  safeMigrationLink,
} from "@/ops/scripts/profile-cms/html-content";
import {
  buildMigration,
  readMigrationSources,
  type MigrationSource,
} from "@/ops/scripts/profile-cms/migration";
import { parseMigrationArgs } from "@/ops/scripts/profile-cms/migrate-static-pages";
import {
  parseStaticContent,
  type StaticContent,
} from "@/ops/scripts/profile-cms/typed-content";
import { validateCmsPackageV1 } from "@/lib/profile-cms/protocol/v1";

const now = new Date("2026-09-10T00:00:00.000Z");
const base: StaticContent = {
  source: "migrated-wordpress",
  path: "/capital",
  title: "Capital",
  description: "Description",
  section: "Capital",
  blocks: [],
};
const image = {
  src: "https://example.com/art.png",
  alt: "Art",
  width: 400,
  height: 300,
};
const input = (content: StaticContent): MigrationSource => ({
  file: "app/capital/content.tsx",
  content,
  hash: `sha256:${"a".repeat(64)}`,
});
const sourceText = (initializer: string) =>
  `export const content = ${initializer} satisfies MigratedWordPressStaticPageContent;`;

describe("typed content migration", () => {
  it("reads literals and trusted HTML without executing the source module", () => {
    const source = `throw new Error("must not execute");\n${sourceText(JSON.stringify({ ...base, blocks: [{ type: "html", html: "PLACEHOLDER" }] }).replace('"PLACEHOLDER"', 'migratedWordPressTrustedHtml("<p>Text &amp; links</p>")'))}`;
    expect(parseStaticContent(source).blocks).toEqual([
      { type: "html", html: "<p>Text &amp; links</p>" },
    ]);
  });

  it("rejects executable expressions and invalid source instead of importing boilerplate as content", () => {
    expect(() => parseStaticContent(sourceText("fetch('/anything')"))).toThrow(
      "source.unsupported_expression"
    );
    expect(() =>
      parseStaticContent(
        "export default function Page() { return <Component />; }"
      )
    ).toThrow("source.expected_one_typed_content_export");
    expect(() => parseStaticContent(sourceText("{ broken: }"))).toThrow(
      "source.invalid_syntax"
    );
  });

  it("retains DOM reading order, links and text around unsupported embedded media", () => {
    expect(
      extractHtmlParts(
        '<h2>Heading</h2><p>Before <a href="/capital/fund">fund &amp; more</a>.</p><p><iframe src="https://example.com/embed"></iframe>After</p><p>Second</p>'
      )
    ).toEqual([
      { type: "text", level: 2, text: "Heading" },
      { type: "text", text: "Before fund & more." },
      { type: "link", href: "/capital/fund", label: "fund & more" },
      { type: "unsupported", tag: "iframe", uri: "https://example.com/embed" },
      { type: "text", text: "After" },
      { type: "text", text: "Second" },
    ]);
  });

  it("preserves unrecognized text and decodes named entities rather than silently losing the fragment", () => {
    expect(
      extractHtmlParts(
        "Bare &copy; text <custom-tag>and &reg; contents</custom-tag>"
      )
    ).toEqual([{ type: "text", text: "Bare © text and ® contents" }]);
  });

  it.each([
    "//external.example/path",
    "/\\external.example",
    "javascript:alert(1)",
    "http://example.com",
    "https://user:secret@example.com",
    " /capital",
    "/capital\n",
  ])("rejects unsafe link %s", (url) => {
    expect(safeMigrationLink(url)).toBeUndefined();
  });

  it("accepts explicit HTTPS and first-party path links", () => {
    expect(safeMigrationLink("/capital/fund?x=1#more")).toBe(
      "/capital/fund?x=1#more"
    );
    expect(safeMigrationLink("https://example.com/art")).toBe(
      "https://example.com/art"
    );
  });

  it("bounds metadata intentionally on a word boundary without altering full source text", () => {
    expect(boundedMetadata("A complete sentence with more words", 22)).toBe(
      "A complete sentence…"
    );
    expect(boundedMetadata("😀😀😀", 4)).toBe("😀…");
    expect(boundedMetadata("Short", 300)).toBe("Short");
  });

  it("uses explicit captions, preserves paragraphs after images, shares assets and remaps migrated links", () => {
    const home = {
      ...base,
      blocks: [
        {
          type: "image" as const,
          media: { ...image, caption: "Explicit caption" },
        },
        {
          type: "paragraph" as const,
          content: "This prose is not an image caption.",
        },
        {
          type: "html" as const,
          html: '<p>Visit <a href="/capital/fund?x=1#more">the fund</a>.</p>',
        },
      ],
    };
    const fund = {
      ...base,
      path: "/capital/fund",
      blocks: [{ type: "image" as const, media: image }],
    };
    const result = buildMigration("capital", [input(home), input(fund)], now);
    expect(result.validation.valid).toBe(true);
    expect(result.cmsPackage.payload.assets).toHaveLength(1);
    const blocks = result.cmsPackage.payload.pages[0]!.blocks;
    expect(blocks.map((block) => block.block_type)).toEqual([
      "rich_text",
      "heading",
      "rich_text",
      "image",
      "rich_text",
      "rich_text",
      "button_link",
    ]);
    expect(blocks[3]).toMatchObject({ caption: "Explicit caption" });
    expect(blocks[4]).toMatchObject({
      content: "This prose is not an image caption.",
    });
    expect(blocks[6]).toMatchObject({
      url: "/6529capital/fund/index.html?x=1#more",
    });
    expect(result.cmsPackage.payload.source_packets?.[0]).toMatchObject({
      original_content: home,
    });
  });

  it("reports unsupported media and missing dimensions without inventing posters or size", () => {
    const result = buildMigration(
      "capital",
      [
        input({
          ...base,
          blocks: [
            {
              type: "video",
              video: { src: "https://example.com/video.mp4", title: "Artwork" },
            },
            { type: "image", media: { src: image.src, alt: image.alt } },
            {
              type: "html",
              html: '<p><iframe src="https://example.com/embed"></iframe></p>',
            },
          ],
        }),
      ],
      now
    );
    expect(result.diagnostics.map((issue) => issue.code)).toEqual([
      "media.video_requires_poster_and_review",
      "asset.dimensions_unverified",
      "html.unsupported_iframe",
    ]);
    expect(result.validation.valid).toBe(false);
    expect(result.cmsPackage.payload.assets[0]).not.toHaveProperty("width");
    expect(
      result.cmsPackage.payload.pages[0]!.blocks.some(
        (block) =>
          block.block_type === "video" || block.block_type === "html_embed"
      )
    ).toBe(false);
  });

  it("fails closed on duplicate or mismatched routes", () => {
    expect(() =>
      buildMigration("capital", [input(base), input(base)], now)
    ).toThrow("source.duplicate_route");
    expect(() =>
      buildMigration("capital", [input({ ...base, path: "/museum" })], now)
    ).toThrow("source.target_route_mismatch");
  });

  it.each(["garbage", "2026-02-30T00:00:00.000Z", "2026-09-10"])(
    "rejects invalid --now %s with an actionable error code",
    (date) => {
      expect(() =>
        parseMigrationArgs([
          "--target",
          "capital",
          "--out-dir",
          "out",
          "--now",
          date,
        ])
      ).toThrow("cli.invalid_now");
    }
  );

  it("regenerates the current Capital package byte-for-byte and remains a fixture", () => {
    const root = process.cwd();
    const sources = readMigrationSources(root, "capital");
    expect(sources.errors).toEqual([]);
    expect(sources.discoveredFiles).toBe(3);
    const result = buildMigration("capital", sources.sources, now);
    const fixture = fs
      .readFileSync(
        path.join(
          root,
          "ops/workstreams/profile-native-cms-roadmap/migration/6529capital.generated.package.json"
        ),
        "utf8"
      )
      .replaceAll("\r\n", "\n");
    expect(`${JSON.stringify(result.cmsPackage, null, 2)}\n`).toBe(fixture);
    expect(result.validation.valid).toBe(true);
    expect(
      validateCmsPackageV1(result.cmsPackage, {
        allowFixtureSignatures: false,
        allowFixtureStorage: false,
      }).valid
    ).toBe(false);
    expect(
      result.cmsPackage.payload.pages.every(
        (page) => page.metadata.robots === "noindex"
      )
    ).toBe(true);
  });
});
