import {
  buildCmsPackageCandidate,
  createDefaultCmsBuilderState,
} from "@/lib/profile-cms/builder/package";
import {
  assetSchema,
  blockSchema,
  type CmsAssetV1,
  type CmsPackageV1,
  type CmsPageV1,
  withComputedCmsHashes,
} from "@/lib/profile-cms/protocol/v1";
import { isValidCmsPageSlug } from "@/lib/profile-cms/runtime/page-slugs";
import { DEMO_ART_ASSETS } from "./demo-assets";
import { MEME_ART_ASSETS } from "./meme-assets";
import { PERSONAL_TEMPLATES } from "./templates-personal";
import { ART_TEMPLATES } from "./templates-art";
import { ORGANIZATION_TEMPLATES } from "./templates-organizations";
import { CMS_STUDIO_MEME_TEMPLATES } from "./templates-memes";
import type { CmsStudioTemplate } from "./template-types";

export const CMS_STUDIO_CORE_TEMPLATES: readonly CmsStudioTemplate[] = [
  ...PERSONAL_TEMPLATES,
  ...ART_TEMPLATES,
  ...ORGANIZATION_TEMPLATES,
];

export { CMS_STUDIO_MEME_TEMPLATES } from "./templates-memes";

export const CMS_STUDIO_TEMPLATES: readonly CmsStudioTemplate[] = [
  ...CMS_STUDIO_CORE_TEMPLATES,
  ...CMS_STUDIO_MEME_TEMPLATES,
];

export const CMS_STUDIO_DEMO_ASSET_BINDINGS = [
  { id: "demo-quiet-signal", name: "Quiet Signal" },
  { id: "demo-afterimage", name: "Afterimage" },
  { id: "demo-night-grid", name: "Night Grid" },
] as const;

/** Sample content stays explicitly identified until reviewed and replaced. */
export const CMS_STUDIO_SAMPLE_CONTENT_NOTE =
  "This package contains fictional demonstration writing. Images are original example artwork or individually credited CC0 works from The Memes. The profile handle identifies the draft destination, not the subject, creator, or NFT owner of the sample content. Review and replace sample claims before publishing.";

/** A full V1 document, with no projection into the legacy single-page editor. */
export function instantiateCmsStudioTemplate(
  templateId: string,
  handle: string,
  now = new Date()
): CmsPackageV1 {
  if (!/^[A-Za-z0-9][A-Za-z0-9_-]{1,63}$/.test(handle)) {
    throw new Error("Invalid CMS profile handle");
  }
  const template = CMS_STUDIO_TEMPLATES.find((item) => item.id === templateId);
  if (!template) throw new Error("Unknown CMS studio template");
  const createdAt = now.toISOString();
  const base = buildCmsPackageCandidate(
    createDefaultCmsBuilderState(handle),
    now
  );
  const pages = instantiatePages(template, handle, createdAt);
  const home = pages[0];
  if (!home) throw new Error("A CMS template requires a homepage");
  const basePath = `/${handle}/index.html`;
  const routes: CmsPackageV1["payload"]["routes"] = [
    { path: basePath, kind: "alias", target: home.path },
    ...pages.map((item) => ({
      path: item.path,
      kind: "page" as const,
      page_id: item.id,
    })),
  ];
  const assets = referencedTemplateAssets(pages);
  const sourcePacket = {
    id: `source-template-${template.id}`,
    source_type: "import" as const,
    captured_at: createdAt,
    template_id: template.id,
    content_status: "fictional_example",
    notes: CMS_STUDIO_SAMPLE_CONTENT_NOTE,
    ...(template.inspiration
      ? { inspiration: { ...template.inspiration } }
      : {}),
  };
  return withComputedCmsHashes({
    ...base,
    package_id: `pkg-${handle}-studio-${template.id}`,
    profile: { handle },
    site: {
      ...base.site,
      title: template.siteTitle ?? template.name,
      description: home.metadata.description,
      base_path: basePath,
      theme: {
        mode:
          template.presentation.studio_palette === "paper" ||
          template.presentation.studio_palette === "stone"
            ? "light"
            : "dark",
        accent: template.accent ?? "#4768b2",
        tokens: { ...template.presentation },
      },
    },
    payload: {
      ...base.payload,
      routes,
      pages,
      assets,
      navigation: [
        {
          id: "nav-main",
          items: pages.map((item, index) => ({
            page_id: item.id,
            label:
              index === 0
                ? "Home"
                : (item.metadata.navigation_label ?? item.metadata.title),
          })),
        },
      ],
      source_packets: [sourcePacket],
      build_manifest: {
        renderer: "6529-cms-studio",
        renderer_version: "1.0.0",
        route_count: routes.length,
        asset_count: assets.length,
        warnings: ["sample_content_requires_review"],
      },
    },
    provenance: {
      ...base.provenance,
      builder: "6529-cms-studio",
      builder_version: "1.0.0",
      notes: CMS_STUDIO_SAMPLE_CONTENT_NOTE,
    },
  });
}

function instantiatePages(
  template: CmsStudioTemplate,
  handle: string,
  createdAt: string
): CmsPageV1[] {
  const slugs = new Set<string>();
  return template.pages.map((item) => {
    if (!isValidCmsPageSlug(item.slug) || slugs.has(item.slug)) {
      throw new Error("Invalid or duplicate CMS template page slug");
    }
    slugs.add(item.slug);
    return {
      id: `page-${item.slug}`,
      type: "page",
      path: `/${handle}/${item.slug}/index.html`,
      metadata: {
        title: item.title,
        description: item.description,
        locale: "en",
        canonical_url: `https://6529.io/${handle}/${item.slug}`,
        navigation_label: navigationLabel(item.slug),
        search: "include",
        robots: "index",
        last_updated: createdAt,
      },
      blocks: item.blocks.map((block) => blockSchema.parse(block)),
      source: { source_packet_id: `source-template-${template.id}` },
    };
  });
}

function navigationLabel(slug: string): string {
  const words = slug.replaceAll("-", " ");
  return words.charAt(0).toUpperCase() + words.slice(1);
}

function referencedTemplateAssets(pages: readonly CmsPageV1[]): CmsAssetV1[] {
  const assetIds = new Set<string>();
  for (const page of pages) {
    for (const block of page.blocks) {
      const record: Readonly<Record<string, unknown>> = block;
      if (typeof record["asset_id"] === "string")
        assetIds.add(record["asset_id"]);
      const ids = record["asset_ids"];
      if (Array.isArray(ids)) {
        ids.forEach((id) => {
          if (typeof id === "string") assetIds.add(id);
        });
      }
    }
  }
  return [...assetIds].map((id) => {
    const asset = [...DEMO_ART_ASSETS, ...MEME_ART_ASSETS].find(
      (item) => item.id === id
    );
    if (!asset) throw new Error("Missing CMS template artwork binding");
    return assetSchema.parse(asset);
  });
}
