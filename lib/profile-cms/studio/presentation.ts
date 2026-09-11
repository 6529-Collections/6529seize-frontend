import { z } from "zod";

import type { CmsBlockV1, CmsPackageV1 } from "@/lib/profile-cms/protocol/v1";

export const CMS_STUDIO_LAYOUTS = [
  "signature",
  "editorial",
  "gallery",
  "journal",
  "organization",
  "fund",
  "dao",
] as const;
export const CMS_STUDIO_PALETTES = ["ink", "paper", "stone", "night"] as const;
export const CMS_STUDIO_TYPES = ["sans", "serif", "mono"] as const;
export const CMS_STUDIO_DENSITIES = ["airy", "balanced", "compact"] as const;
export const CMS_STUDIO_SPANS = [
  "full",
  "half",
  "third",
  "two_thirds",
] as const;
export const CMS_STUDIO_ROLES = ["body", "hero", "kicker", "card"] as const;

export const cmsStudioThemeTokenPatchSchema = z
  .object({
    studio_revision: z.literal(1).optional(),
    studio_layout: z.enum(CMS_STUDIO_LAYOUTS).optional(),
    studio_palette: z.enum(CMS_STUDIO_PALETTES).optional(),
    studio_type: z.enum(CMS_STUDIO_TYPES).optional(),
    studio_density: z.enum(CMS_STUDIO_DENSITIES).optional(),
  })
  .strict();

export interface CmsStudioPresentation {
  readonly studio_revision: 1;
  readonly studio_layout: (typeof CMS_STUDIO_LAYOUTS)[number];
  readonly studio_palette: (typeof CMS_STUDIO_PALETTES)[number];
  readonly studio_type: (typeof CMS_STUDIO_TYPES)[number];
  readonly studio_density: (typeof CMS_STUDIO_DENSITIES)[number];
}

export const DEFAULT_CMS_STUDIO_PRESENTATION: CmsStudioPresentation = {
  studio_revision: 1,
  studio_layout: "editorial",
  studio_palette: "ink",
  studio_type: "sans",
  studio_density: "balanced",
};

/** Only an explicit revision opts a publication into the studio presentation. */
export function getCmsStudioPresentation(
  cmsPackage: CmsPackageV1
): CmsStudioPresentation | null {
  const tokens = cmsPackage.site.theme.tokens;
  if (tokens?.["studio_revision"] !== 1) return null;
  return {
    studio_revision: 1,
    studio_layout: readChoice(
      CMS_STUDIO_LAYOUTS,
      tokens["studio_layout"],
      "editorial"
    ),
    studio_palette: readChoice(
      CMS_STUDIO_PALETTES,
      tokens["studio_palette"],
      "ink"
    ),
    studio_type: readChoice(CMS_STUDIO_TYPES, tokens["studio_type"], "sans"),
    studio_density: readChoice(
      CMS_STUDIO_DENSITIES,
      tokens["studio_density"],
      "balanced"
    ),
  };
}

export function getCmsStudioBlockPresentation(block: CmsBlockV1) {
  const value: unknown = (block as CmsBlockV1 & Record<string, unknown>)[
    "presentation"
  ];
  const presentation: Record<string, unknown> =
    value !== null && typeof value === "object" && !Array.isArray(value)
      ? (value as Record<string, unknown>)
      : {};
  return {
    span: readChoice(CMS_STUDIO_SPANS, presentation["span"], "full"),
    role: readChoice(CMS_STUDIO_ROLES, presentation["role"], "body"),
  };
}

function readChoice<T extends string>(
  choices: readonly T[],
  value: unknown,
  fallback: T
): T {
  return choices.find((choice) => choice === value) ?? fallback;
}
