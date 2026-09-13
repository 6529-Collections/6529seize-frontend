import { posix } from "node:path";
import {
  cmsPackageSchema,
  validateCmsPackageV1,
  type CmsBlockV1,
} from "@/lib/profile-cms/protocol/v1";
import { applyCmsDocumentOperation } from "@/lib/profile-cms/studio/document";
import { instantiateCmsStudioTemplate } from "@/lib/profile-cms/studio/templates";
import {
  cmsRecoveryFilePath,
  renderRecoveredCmsSite,
} from "@/lib/profile-cms/recovery/static-site";

const TEMPLATES = [
  ["personal-v2", 1],
  ["artist-v2", 17],
  ["collector-v2", 28],
  ["meme-v2", 1],
  ["organization-v2", 1],
  ["fund-v2", 23],
] as const;

function fields(block: CmsBlockV1): CmsBlockV1 & Record<string, unknown> {
  return block as CmsBlockV1 & Record<string, unknown>;
}

function rowFallback(block: CmsBlockV1): string | null {
  const rows = fields(block)["rows"];
  if (block.block_type !== "callout" || !Array.isArray(rows) || !rows.length)
    return null;
  return (rows as { label: string; value: string }[])
    .map((row) => (row.label ? `${row.label}: ${row.value}` : row.value))
    .join("\n");
}

describe.each(TEMPLATES)(
  "%s complete native document",
  (templateId, pageCount) => {
    it("survives canonical package parsing with every page, artwork and native field intact", () => {
      const original = instantiateCmsStudioTemplate(
        templateId,
        "ExampleProfile",
        new Date("2026-09-12T12:00:00Z")
      );
      const reopened = cmsPackageSchema.parse(
        JSON.parse(JSON.stringify(original))
      );
      expect(reopened).toEqual(original);
      expect(reopened.payload.pages).toHaveLength(pageCount);
      const validation = validateCmsPackageV1(reopened, {
        enforceHashes: true,
      });
      expect(
        validation.issues.filter((issue) => issue.severity === "error")
      ).toEqual([]);
      expect(validation.valid).toBe(true);
      expect(
        new TextEncoder().encode(JSON.stringify(reopened)).length
      ).toBeLessThan(1024 * 1024);

      const selectedPage = reopened.payload.pages.at(-1)!;
      const selectedBlock =
        selectedPage.blocks.find((block) => block.block_type === "rich_text") ??
        selectedPage.blocks[0]!;
      const result = applyCmsDocumentOperation(
        reopened,
        reopened.integrity.package_hash,
        {
          type: "update_block",
          pageId: selectedPage.id,
          blockId: selectedBlock.id,
          patch: { title: "A title edited in the full document" },
        }
      );
      expect(result.ok).toBe(true);
      if (!result.ok) throw new Error(JSON.stringify(result.error));
      expect(
        result.document.payload.pages.filter(
          (page) => page.id !== selectedPage.id
        )
      ).toEqual(
        original.payload.pages.filter((page) => page.id !== selectedPage.id)
      );
      expect(result.document.payload.assets).toEqual(original.payload.assets);
      expect(result.document.payload.navigation).toEqual(
        original.payload.navigation
      );
      expect(
        cmsPackageSchema.parse(JSON.parse(JSON.stringify(result.document)))
      ).toEqual(result.document);
      expect(original.payload.pages.at(-1)!.blocks).toEqual(
        selectedPage.blocks
      );
    });

    it("recovers every authored page, work title, record and internal destination without the app", () => {
      const original = instantiateCmsStudioTemplate(
        templateId,
        "ExampleProfile",
        new Date("2026-09-12T12:00:00Z")
      );
      const files = renderRecoveredCmsSite(original);
      expect(files.size).toBe(original.payload.routes.length);
      for (const page of original.payload.pages) {
        const path = cmsRecoveryFilePath(page.path);
        const html = files.get(path)!;
        expect(html).toBeDefined();
        const parsed = new DOMParser().parseFromString(html, "text/html");
        expect(parsed.body.dataset["design"]).toBe(templateId);
        expect(parsed.head.querySelectorAll("style").length).toBeGreaterThan(0);
        expect(
          parsed.body.querySelector("style, script, iframe, form")
        ).toBeNull();
        expect(html).not.toContain("api.6529.io");
        for (const block of page.blocks) {
          const section = parsed.getElementById(block.id)!;
          expect(section).not.toBeNull();
          const value = fields(block);
          if (typeof value["block_id"] === "string") {
            expect(section.querySelector("a")?.getAttribute("href")).toContain(
              `#${encodeURIComponent(value["block_id"])}`
            );
          }
          for (const key of ["title", "content", "description"] as const) {
            // Project illustrations recover their current authored fields, not
            // the preserved prose fallback from before those fields were edited.
            if (key === "content" && value["mockup_style"]) continue;
            if (
              key === "content" &&
              typeof value[key] === "string" &&
              value[key].trim() === rowFallback(block)
            ) {
              // Labels and values are checked individually below; duplicate
              // fallback prose must not be required in addition to the record.
              expect(section.querySelector("dl")).not.toBeNull();
              continue;
            }
            if (typeof value[key] === "string" && value[key]) {
              if (key === "title") {
                expect(section.textContent).toContain(value[key]);
              } else {
                const renderedParagraphs = Array.from(
                  section.querySelectorAll("p"),
                  (paragraph) => paragraph.textContent
                );
                for (const authoredParagraph of value[key].split(/\n{2,}/)) {
                  expect(renderedParagraphs).toContain(authoredParagraph);
                }
              }
            }
          }
          for (const key of [
            "mockup_kicker",
            "mockup_heading",
            "mockup_period",
            "mockup_description",
            "mockup_footer",
          ]) {
            if (typeof value[key] === "string")
              expect(section.textContent).toContain(value[key]);
          }
          for (const key of ["items", "rows"] as const) {
            const entries = value[key];
            if (!Array.isArray(entries)) continue;
            for (const entry of entries as Record<string, unknown>[]) {
              for (const field of ["title", "subtitle", "label", "value"]) {
                if (typeof entry[field] === "string")
                  expect(section.textContent).toContain(entry[field]);
              }
            }
          }
        }
        for (const link of parsed.querySelectorAll("a[href]")) {
          const href = link.getAttribute("href")!;
          if (/^(https:|mailto:)/.test(href)) continue;
          const rawPath = href.split(/[?#]/, 1)[0]!;
          const target = rawPath
            ? posix.normalize(
                posix.join(posix.dirname(path), decodeURIComponent(rawPath))
              )
            : path;
          expect(files.has(target)).toBe(true);
          const fragment = href.split("#", 2)[1];
          if (fragment) {
            const targetDocument = new DOMParser().parseFromString(
              files.get(target)!,
              "text/html"
            );
            expect(
              targetDocument.getElementById(decodeURIComponent(fragment))
            ).not.toBeNull();
          }
        }
      }
    });
  }
);
