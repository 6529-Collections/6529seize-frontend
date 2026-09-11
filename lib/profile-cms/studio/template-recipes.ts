import { blockSchema, type CmsBlockV1 } from "@/lib/profile-cms/protocol/v1";
import type { CmsStudioPresentation } from "./presentation";
import type {
  CmsStudioTemplate,
  CmsStudioTemplatePage,
} from "./template-types";

type Span = "full" | "half" | "third" | "two_thirds";

export const ART = {
  signal: "demo-quiet-signal",
  afterimage: "demo-afterimage",
  grid: "demo-night-grid",
} as const;

export const ART_CAPTIONS = {
  signal: "Quiet Signal — original example artwork.",
  afterimage: "Afterimage — original example artwork.",
  grid: "Night Grid — original example artwork.",
} as const;

export const SOURCE_LINKS = {
  about: "https://6529.io/about",
  memes: "https://6529.io/the-memes",
  licenses: "https://creativecommons.org/share-your-work/cclicenses/",
  ethereum: "https://ethereum.org/developers/docs/",
  ipfs: "https://docs.ipfs.tech/",
  wikipedia: "https://www.wikipedia.org/",
} as const;

export function style(
  studio_layout: CmsStudioPresentation["studio_layout"],
  studio_palette: CmsStudioPresentation["studio_palette"],
  studio_type: CmsStudioPresentation["studio_type"] = "sans",
  studio_density: CmsStudioPresentation["studio_density"] = "balanced"
): CmsStudioPresentation {
  return {
    studio_revision: 1,
    studio_layout,
    studio_palette,
    studio_type,
    studio_density,
  };
}

export function defineTemplate(template: CmsStudioTemplate): CmsStudioTemplate {
  if (template.accent && !/^#[a-fA-F0-9]{6}$/.test(template.accent)) {
    throw new Error("Invalid CMS template accent");
  }
  return {
    ...template,
    pages: template.pages.map((templatePage) => ({
      ...templatePage,
      blocks: templatePage.blocks.map((block, index) => ({
        ...block,
        id: `${template.id}-${templatePage.slug}-${index + 1}`,
      })),
    })),
  };
}

export function heading(content: string, level = 2): CmsBlockV1 {
  return blockSchema.parse({
    id: "pending",
    block_type: "heading",
    text: content,
    level,
    presentation: { span: "full", role: level === 1 ? "hero" : "body" },
  });
}

export function text(content: string, span: Span = "full"): CmsBlockV1 {
  return blockSchema.parse({
    id: "pending",
    block_type: "rich_text",
    content,
    presentation: { span, role: "body" },
  });
}

export function kicker(content: string): CmsBlockV1 {
  return blockSchema.parse({
    id: "pending",
    block_type: "rich_text",
    content,
    presentation: { span: "full", role: "kicker" },
  });
}

export function card(
  title: string,
  content: string,
  span: Span = "half"
): CmsBlockV1 {
  return blockSchema.parse({
    id: "pending",
    block_type: "callout",
    title,
    content,
    presentation: { span, role: "card" },
  });
}

export function quote(content: string, citation: string): CmsBlockV1 {
  return blockSchema.parse({
    id: "pending",
    block_type: "quote",
    quote: content,
    citation,
    presentation: { span: "full", role: "body" },
  });
}

export function image(
  asset_id: string,
  caption: string,
  span: Span = "full"
): CmsBlockV1 {
  return blockSchema.parse({
    id: "pending",
    block_type: "image",
    asset_id,
    caption,
    presentation: { span, role: "body" },
  });
}

export function gallery(
  title: string,
  asset_ids: string[],
  mode = "clean"
): CmsBlockV1 {
  return blockSchema.parse({
    id: "pending",
    block_type: "gallery",
    title,
    asset_ids,
    mode,
    description:
      "Original example artwork generated for the 6529 template library.",
    presentation: { span: "full", role: "body" },
  });
}

export function pageLink(label: string, slug: string): CmsBlockV1 {
  return blockSchema.parse({
    id: "pending",
    block_type: "button_link",
    label,
    page_id: `page-${slug}`,
    presentation: { span: "half", role: "body" },
  });
}

export function externalLink(label: string, href: string): CmsBlockV1 {
  return blockSchema.parse({
    id: "pending",
    block_type: "button_link",
    label,
    href,
    presentation: { span: "half", role: "body" },
  });
}

export function page(
  slug: string,
  title: string,
  description: string,
  ...blocks: CmsBlockV1[]
): CmsStudioTemplatePage {
  return {
    slug,
    title,
    description,
    blocks: [heading(title, 1), text(description), ...blocks],
  };
}
