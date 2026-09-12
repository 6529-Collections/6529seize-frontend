import { blockSchema } from "@/lib/profile-cms/protocol/v1";
import type { CmsStudioTemplate } from "./template-types";
import type { CmsStudioDesign } from "./presentation";
import personal from "./templates-approved-personal.json";
import artist from "./templates-approved-artist.json";
import collector from "./templates-approved-collector.json";
import meme from "./templates-approved-meme.json";
import organization from "./templates-approved-organization.json";
import fund from "./templates-approved-dao.json";

type ApprovedContent = {
  readonly pages: readonly {
    readonly slug: string;
    readonly title: string;
    readonly description: string;
    readonly navigation: boolean;
    readonly navigationLabel?: string;
    readonly blocks: readonly unknown[];
  }[];
  readonly navigation: NonNullable<CmsStudioTemplate["navigation"]>;
};

type ApprovedOptions = {
  readonly id: CmsStudioDesign;
  readonly name: string;
  readonly siteTitle: string;
  readonly family: CmsStudioTemplate["family"];
  readonly layout: CmsStudioTemplate["presentation"]["studio_layout"];
  readonly palette: CmsStudioTemplate["presentation"]["studio_palette"];
  readonly type: CmsStudioTemplate["presentation"]["studio_type"];
  readonly accent: string;
  readonly description: string;
};

function approved(
  options: ApprovedOptions,
  content: ApprovedContent
): CmsStudioTemplate {
  const {
    id,
    name,
    siteTitle,
    family,
    layout,
    palette,
    type,
    accent,
    description,
  } = options;
  return {
    id,
    name,
    siteTitle,
    family,
    accent,
    description,
    presentation: {
      studio_revision: 1,
      studio_design: id,
      studio_layout: layout,
      studio_palette: palette,
      studio_type: type,
      studio_density: "airy",
    },
    navigation: content.navigation,
    pages: content.pages.map((page) => ({
      ...page,
      blocks: page.blocks.map((block) => blockSchema.parse(block)),
    })),
  };
}

/** Only these six fully populated, approved designs are offered for new sites. */
export const CMS_APPROVED_TEMPLATES: readonly CmsStudioTemplate[] = [
  approved(
    {
      id: "personal-v2",
      name: "Personal",
      siteTitle: "Mara Silva",
      family: "personal",
      layout: "signature",
      palette: "paper",
      type: "sans",
      accent: "#183ddd",
      description:
        "A complete personal portfolio with project case studies, experience, interests and contact details.",
    },
    personal
  ),
  approved(
    {
      id: "artist-v2",
      name: "Artist",
      siteTitle: "Ada Mercer",
      family: "artist",
      layout: "gallery",
      palette: "paper",
      type: "serif",
      accent: "#566747",
      description:
        "An artist portfolio with three bodies of work, nine individual works, studio history, editions and enquiries.",
    },
    artist
  ),
  approved(
    {
      id: "collector-v2",
      name: "Collector",
      siteTitle: "Mara Bell",
      family: "collector",
      layout: "gallery",
      palette: "ink",
      type: "sans",
      accent: "#c3ed91",
      description:
        "A personal collection with nineteen artworks, four curated sets, a searchable archive and collecting notes.",
    },
    collector
  ),
  approved(
    {
      id: "meme-v2",
      name: "Meme",
      siteTitle: "JPG People",
      family: "personal",
      layout: "journal",
      palette: "stone",
      type: "sans",
      accent: "#82d9d9",
      description:
        "A digital art club with a graphic poster, artwork selections, a zine project and a workshop programme.",
    },
    meme
  ),
  approved(
    {
      id: "organization-v2",
      name: "Organization",
      siteTitle: "Assembly House",
      family: "organization",
      layout: "organization",
      palette: "paper",
      type: "sans",
      accent: "#f44b24",
      description:
        "An artist-run organization with an events programme, ongoing projects, people, access and visitor information.",
    },
    organization
  ),
  approved(
    {
      id: "fund-v2",
      name: "Fund / DAO",
      siteTitle: "Common Collection",
      family: "fund",
      layout: "dao",
      palette: "paper",
      type: "serif",
      accent: "#17392a",
      description:
        "A collecting organization with seventeen artworks, exhibition notes, a mandate, members and decision records.",
    },
    fund
  ),
];
