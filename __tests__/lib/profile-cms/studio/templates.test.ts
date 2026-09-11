import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import path from "node:path";
import {
  canonicalizeJson,
  cmsPackageSchema,
  computeCmsPackageHash,
  computeCmsPayloadHash,
  validateCmsPackageV1,
} from "@/lib/profile-cms/protocol/v1";
import { isValidCmsPageSlug } from "@/lib/profile-cms/runtime/page-slugs";
import { resolveCmsRoute } from "@/lib/profile-cms/runtime/routes";
import { DEMO_ART_ASSETS } from "@/lib/profile-cms/studio/demo-assets";
import { CMS_STUDIO_MEME_WORKS } from "@/lib/profile-cms/studio/meme-assets";
import { defineTemplate } from "@/lib/profile-cms/studio/template-recipes";
import {
  CMS_STUDIO_CORE_TEMPLATES,
  CMS_STUDIO_MEME_TEMPLATES,
  CMS_STUDIO_DEMO_ASSET_BINDINGS,
  CMS_STUDIO_SAMPLE_CONTENT_NOTE,
  CMS_STUDIO_TEMPLATES,
  instantiateCmsStudioTemplate,
} from "@/lib/profile-cms/studio/templates";

const NOW = new Date("2026-09-10T12:00:00.000Z");
const fields = (value: object): Readonly<Record<string, unknown>> => ({
  ...value,
});
const EDITABLE_BLOCKS = new Set([
  "heading",
  "rich_text",
  "image",
  "gallery",
  "button_link",
  "quote",
  "callout",
]);

describe("CMS studio template library", () => {
  it("provides 23 distinct core concepts across all five families", () => {
    expect(CMS_STUDIO_CORE_TEMPLATES).toHaveLength(23);
    expect(new Set(CMS_STUDIO_CORE_TEMPLATES.map((item) => item.id)).size).toBe(
      23
    );
    expect(
      new Set(CMS_STUDIO_CORE_TEMPLATES.map((item) => item.family))
    ).toEqual(
      new Set(["personal", "collector", "artist", "organization", "fund"])
    );
    expect(
      new Set(
        CMS_STUDIO_CORE_TEMPLATES.map((item) => canonicalizeJson(item.pages))
      ).size
    ).toBe(23);
  });

  it("adds 16 separately composed Meme inspirations with preserved artist credit", () => {
    expect(CMS_STUDIO_TEMPLATES).toHaveLength(39);
    expect(new Set(CMS_STUDIO_TEMPLATES.map((item) => item.id)).size).toBe(39);
    expect(
      CMS_STUDIO_MEME_TEMPLATES.map((item) => item.inspiration?.cardId)
    ).toEqual([1, 2, 4, 5, 8, 9, 37, 47, 48, 52, 59, 103, 118, 375, 537, 540]);
    expect(
      new Set(
        CMS_STUDIO_MEME_TEMPLATES.map((item) => canonicalizeJson(item.pages))
      ).size
    ).toBe(16);
    for (const template of CMS_STUDIO_MEME_TEMPLATES) {
      const work = CMS_STUDIO_MEME_WORKS.find(
        (item) => item.cardId === template.inspiration?.cardId
      );
      expect(work).toBeDefined();
      expect(template.inspiration).toEqual({
        kind: "meme",
        cardId: work!.cardId,
        title: work!.title,
        artist: work!.artist,
        url: work!.url,
      });
      const result = instantiateCmsStudioTemplate(
        template.id,
        "ExampleProfile",
        NOW
      );
      expect(result.site.theme.accent).toBe(template.accent);
      expect(result.payload.assets).toContainEqual(work!.asset);
      expect(result.payload.source_packets?.[0]).toHaveProperty(
        "inspiration",
        template.inspiration
      );
      const blocks = result.payload.pages.flatMap((item) => item.blocks);
      expect(blocks).toContainEqual(
        expect.objectContaining({ block_type: "button_link", href: work!.url })
      );
      expect(blocks).toContainEqual(
        expect.objectContaining({
          block_type: "image",
          asset_id: work!.asset.id,
          caption: expect.stringContaining(work!.artist),
        })
      );
      expect(work!.asset.rights).toContain("CC0");
      expect(work!.asset.rights).toContain(work!.url);
      expect(work!.asset.uri).toMatch(
        /^https:\/\/arweave.net\/[A-Za-z0-9_-]{43}$/
      );
      expect(work!.asset.content_hash).toMatch(/^sha256:[a-f0-9]{64}$/);
    }
  });

  it("rejects a non-hex accent rather than inserting arbitrary theme content", () => {
    expect(() =>
      defineTemplate({
        ...CMS_STUDIO_CORE_TEMPLATES[0]!,
        accent: "url(https://example.com)",
      })
    ).toThrow("Invalid CMS template accent");
  });

  it("keeps concise site branding separate from the homepage headline", () => {
    for (const template of CMS_STUDIO_TEMPLATES) {
      expect(template.siteTitle?.length).toBeGreaterThan(0);
      expect(template.siteTitle?.length).toBeLessThanOrEqual(40);
      const result = instantiateCmsStudioTemplate(
        template.id,
        "ExampleProfile",
        NOW
      );
      expect(result.site.title).toBe(template.siteTitle);
      expect(result.payload.pages[0]?.metadata.title).toBe(
        template.pages[0]?.title
      );
    }
    expect(
      instantiateCmsStudioTemplate("signature", "ExampleProfile", NOW).site
        .title
    ).toBe("Mira");
    expect(
      instantiateCmsStudioTemplate("meme-production", "ExampleProfile", NOW)
        .site.title
    ).toBe("Common Press");
  });

  it("populates The Memes Collection with credited actual cards", () => {
    const result = instantiateCmsStudioTemplate(
      "memes-collection",
      "ExampleProfile",
      NOW
    );
    expect(result.payload.assets.map((asset) => asset.id)).toEqual([
      "meme-8",
      "meme-4",
      "meme-37",
      "meme-2",
    ]);
    for (const asset of result.payload.assets) {
      expect(asset.rights).toContain("CC0 artwork");
      expect(asset.rights).toContain("does not claim NFT ownership");
    }
  });

  it.each(CMS_STUDIO_TEMPLATES.map((item) => [item.id] as const))(
    "instantiates %s as a complete, valid, editable V1 document",
    (id) => {
      const result = instantiateCmsStudioTemplate(id, "ExampleProfile", NOW);
      const validation = validateCmsPackageV1(result, {
        allowFixtureSignatures: true,
        allowFixtureStorage: true,
        enforceHashes: true,
      });
      expect(
        validation.issues.filter((issue) => issue.severity === "error")
      ).toEqual([]);
      expect(validation.valid).toBe(true);
      expect(result.profile).toEqual({ handle: "ExampleProfile" });
      expect(result.payload.pages.length).toBeGreaterThanOrEqual(3);
      expect(result.site.base_path).toBe("/ExampleProfile/index.html");
      expect(result.payload.routes[0]).toEqual({
        path: result.site.base_path,
        kind: "alias",
        target: result.payload.pages[0]?.path,
      });
      expect(resolveCmsRoute(result, result.site.base_path)).toEqual(
        expect.objectContaining({ kind: "page", page: result.payload.pages[0] })
      );
      expect(result.site.theme.tokens?.["studio_revision"]).toBe(1);
      expect(result.provenance.notes).toBe(CMS_STUDIO_SAMPLE_CONTENT_NOTE);
      expect(result.payload.source_packets?.[0]).toHaveProperty(
        "content_status",
        "fictional_example"
      );
      const pageIds = new Set(result.payload.pages.map((item) => item.id));
      const blockIds = result.payload.pages.flatMap((item) =>
        item.blocks.map((block) => block.id)
      );
      expect(new Set(blockIds).size).toBe(blockIds.length);
      expect(pageIds.size).toBe(result.payload.pages.length);
      expect(new Set(result.payload.routes.map((item) => item.path)).size).toBe(
        result.payload.routes.length
      );
      for (const page of result.payload.pages) {
        const slug = page.path.split("/")[2] ?? "";
        expect(isValidCmsPageSlug(slug)).toBe(true);
        expect(page.metadata.canonical_url).toBe(
          `https://6529.io/ExampleProfile/${slug}`
        );
        expect(page.blocks.length).toBeGreaterThanOrEqual(5);
        expect(
          page.blocks.filter(
            (block) =>
              block.block_type === "heading" && fields(block)["level"] === 1
          )
        ).toHaveLength(1);
        for (const block of page.blocks) {
          const data = fields(block);
          expect(EDITABLE_BLOCKS.has(block.block_type)).toBe(true);
          if (typeof data["page_id"] === "string")
            expect(pageIds.has(data["page_id"])).toBe(true);
          if (typeof data["href"] === "string")
            expect(new URL(data["href"]).protocol).toBe("https:");
        }
      }
      for (const item of result.payload.navigation[0]?.items ?? [])
        expect(pageIds.has(item.page_id ?? "")).toBe(true);
      const roundTrip = cmsPackageSchema.parse(
        JSON.parse(canonicalizeJson(result))
      );
      expect(computeCmsPayloadHash(roundTrip.payload)).toBe(
        result.integrity.payload_hash
      );
      expect(computeCmsPackageHash(roundTrip)).toBe(
        result.integrity.package_hash
      );
      expect(Buffer.byteLength(canonicalizeJson(result))).toBeLessThan(
        2 * 1024 * 1024
      );
    }
  );

  it("binds original example assets to actual checked-in bytes", () => {
    expect(DEMO_ART_ASSETS.map((item) => item.id)).toEqual(
      CMS_STUDIO_DEMO_ASSET_BINDINGS.map((item) => item.id)
    );
    for (const asset of DEMO_ART_ASSETS) {
      const uri = new URL(asset.uri);
      expect(uri.origin).toBe("https://6529.io");
      const bytes = readFileSync(
        path.join(process.cwd(), "public", uri.pathname)
      );
      expect(asset.content_hash).toBe(
        `sha256:${createHash("sha256").update(bytes).digest("hex")}`
      );
      expect(asset.file_size_bytes).toBe(bytes.length);
      expect(asset.width).toBeGreaterThan(0);
      expect(asset.height).toBeGreaterThan(0);
      expect(asset.rights).toContain("example artwork");
    }
  });

  it("keeps separate instantiations independent from the registry and each other", () => {
    const first = instantiateCmsStudioTemplate("signature", "OneProfile", NOW);
    const original = canonicalizeJson(CMS_STUDIO_TEMPLATES);
    Object.assign(first.payload.pages[0]!.blocks[0]!, {
      text: "An edited heading",
    });
    first.payload.assets[0]!.alt_text = "A changed description";
    const second = instantiateCmsStudioTemplate("signature", "TwoProfile", NOW);
    expect(second.payload.pages[0]?.blocks[0]).not.toHaveProperty(
      "text",
      "An edited heading"
    );
    expect(second.payload.assets[0]?.alt_text).not.toBe(
      "A changed description"
    );
    expect(canonicalizeJson(CMS_STUDIO_TEMPLATES)).toBe(original);
  });

  it.each(["../profile", "a", "name/path", " profile "])(
    "rejects invalid profile handle %s instead of silently personalizing another route",
    (handle) => {
      expect(() =>
        instantiateCmsStudioTemplate("signature", handle, NOW)
      ).toThrow("Invalid CMS profile handle");
    }
  );

  it("rejects an unknown template", () => {
    expect(() =>
      instantiateCmsStudioTemplate("missing", "ExampleProfile", NOW)
    ).toThrow("Unknown CMS studio template");
  });
});
