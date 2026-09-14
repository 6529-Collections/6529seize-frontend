import {
  CMS_STUDIO_COLORWAYS,
  getCmsColorways,
  resolveCmsColorway,
  type CmsColorwayVariables,
} from "@/lib/profile-cms/studio/palettes";
import {
  CMS_STUDIO_DESIGNS,
  cmsStudioThemeTokenPatchSchema,
  getCmsStudioPresentation,
} from "@/lib/profile-cms/studio/presentation";
import { instantiateCmsStudioTemplate } from "@/lib/profile-cms/studio/templates";
import { applyCmsDocumentOperation } from "@/lib/profile-cms/studio/document";
import {
  cmsPackageSchema,
  validateCmsPackageV1,
  withComputedCmsHashes,
} from "@/lib/profile-cms/protocol/v1";
import tailwindConfig from "@/tailwind.config";

type Role = keyof CmsColorwayVariables extends `--cms-colorway-${infer R}`
  ? R
  : never;

const TEXT_PAIRS: readonly (readonly [Role, Role])[] = [
  ["ink", "paper"],
  ["ink", "panel"],
  ["ink", "card-alt"],
  ["muted", "paper"],
  ["muted", "panel"],
  ["muted", "card-alt"],
  ["panel-ink", "panel"],
  ["panel-muted", "panel"],
  ["accent-ink", "accent"],
  ["accent-text", "paper"],
  ["accent-text", "panel"],
  ["editor-ink", "editor-bg"],
  ["header-ink", "header"],
  ["hero-ink", "hero-panel"],
  ["hero-muted", "hero-panel"],
  ["secondary-ink", "secondary-panel"],
  ["card-alt-ink", "card-alt"],
  ["poster-ink", "poster"],
  ["poster-one-ink", "poster-one"],
  ["poster-two-ink", "poster-two"],
  ["mat-ink", "mat"],
  ["mat-muted", "mat"],
  ["mockup-mat-ink", "mockup-mat"],
  ["mockup-window-ink", "mockup-window"],
  ["mockup-muted", "mockup-window"],
  ["mockup-rail-ink", "mockup-rail"],
  ["mockup-active-ink", "mockup-active"],
  ["mockup-subtle", "mockup-window"],
  ["mockup-status-ink", "mockup-status"],
  ["mockup-status-alt-ink", "mockup-status-alt"],
  ["catalogue-mat-ink", "catalogue-mat"],
  ["catalogue-ink", "catalogue-paper"],
  ["catalogue-muted", "catalogue-paper"],
  ["catalogue-heading", "catalogue-paper"],
  ["catalogue-description", "catalogue-paper"],
  ["catalogue-note", "catalogue-paper"],
  ["book-one-ink", "book-one"],
  ["book-two-ink", "book-two"],
  ["book-three-ink", "book-three"],
];
const UI_PAIRS: readonly (readonly [Role, Role])[] = [
  ["focus", "paper"],
  ["focus", "panel"],
  ["panel-focus", "panel"],
  ["mat-focus", "mat"],
  ["line", "paper"],
  ["line", "panel"],
  ["panel-line", "panel"],
  ["hero-line", "hero-panel"],
  ["header-line", "header"],
  ["header-mark", "header"],
  ["editor-line", "editor-bg"],
  ["mockup-window-border", "mockup-window"],
  ["mockup-line", "mockup-window"],
  ["mockup-dot-one", "mockup-rail"],
  ["mockup-dot-two", "mockup-rail"],
  ["mockup-dot-three", "mockup-rail"],
  ["poster-one-mark", "poster-one"],
  ["poster-two-mark", "poster-two"],
];

// Independent WCAG relative-luminance calculation: no production contrast helper.
function relativeLuminance(hex: string): number {
  const channels = hex
    .slice(1)
    .match(/.{2}/g)!
    .map((part) => parseInt(part, 16) / 255);
  const [r, g, b] = channels.map((channel) =>
    channel <= 0.04045
      ? channel / 12.92
      : Math.pow((channel + 0.055) / 1.055, 2.4)
  );
  return 0.2126 * r! + 0.7152 * g! + 0.0722 * b!;
}
function contrastRatio(first: string, second: string): number {
  const values = [relativeLuminance(first), relativeLuminance(second)].sort(
    (a, b) => a - b
  );
  return (values[1]! + 0.05) / (values[0]! + 0.05);
}
function failingPairs(
  variables: CmsColorwayVariables,
  pairs: typeof TEXT_PAIRS,
  minimum: number
) {
  return pairs.flatMap(([foreground, background]) => {
    const ratio = contrastRatio(
      variables[`--cms-colorway-${foreground}`],
      variables[`--cms-colorway-${background}`]
    );
    return ratio >= minimum ? [] : [{ foreground, background, ratio }];
  });
}

describe.each(CMS_STUDIO_DESIGNS)("%s colourways", (design) => {
  it("offers all eighteen unique choices without changing the original authored accent", () => {
    const choices = getCmsColorways(design);
    expect(choices.map((choice) => choice.id)).toEqual(CMS_STUDIO_COLORWAYS);
    expect(choices).toHaveLength(18);
    expect(choices[0]!.accent).toBe(
      instantiateCmsStudioTemplate(design, "Example").site.theme.accent
    );
    expect(getCmsColorways(design)).toBe(choices);
    expect(Object.isFrozen(choices)).toBe(true);
    for (const choice of choices) {
      const resolved = resolveCmsColorway(design, choice.id)!;
      expect(choice.swatches).toEqual([
        resolved["--cms-colorway-paper"],
        resolved["--cms-colorway-ink"],
        resolved["--cms-colorway-accent"],
        resolved["--cms-colorway-secondary-panel"],
      ]);
      expect(Object.isFrozen(resolved)).toBe(true);
      expect(resolveCmsColorway(design, choice.id)).toBe(resolved);
    }
  });

  it.each(CMS_STUDIO_COLORWAYS)(
    "%s meets AAA text and non-text contrast with preset and extreme custom accents",
    (id) => {
      for (const accent of [
        undefined,
        "#ffffff",
        "#000000",
        "#808080",
        "#406afe",
        "#ff0000",
        "#00ff00",
      ]) {
        const variables = resolveCmsColorway(design, id, accent)!;
        expect(failingPairs(variables, TEXT_PAIRS, 7)).toEqual([]);
        expect(failingPairs(variables, UI_PAIRS, 3)).toEqual([]);
        expect(
          Object.values(variables).every((value) =>
            /^#[0-9a-f]{6}(?:[0-9a-f]{2})?$/.test(value)
          )
        ).toBe(true);
      }
    }
  );

  it("round-trips each atomic colour change with all content, unknown tokens and hashes intact", () => {
    const input = instantiateCmsStudioTemplate(
      design,
      "Example",
      new Date("2026-09-13T00:00:00Z")
    );
    input.site.theme.tokens!["extension_preserved"] = "future-value";
    const original = withComputedCmsHashes(input);
    const originalJson = JSON.stringify(original);
    for (const choice of getCmsColorways(design)) {
      const result = applyCmsDocumentOperation(
        original,
        original.integrity.package_hash,
        {
          type: "update_site",
          patch: {
            theme: {
              accent: choice.accent,
              tokens: { studio_colorway: choice.id },
            },
          },
        }
      );
      expect(result.ok).toBe(true);
      if (!result.ok) throw new Error(JSON.stringify(result.error));
      const reopened = cmsPackageSchema.parse(
        JSON.parse(JSON.stringify(result.document))
      );
      expect(reopened).toEqual(result.document);
      expect(reopened.payload).toEqual(original.payload);
      expect(reopened.site.theme.accent).toBe(choice.accent);
      expect(reopened.site.theme.tokens!["extension_preserved"]).toBe(
        "future-value"
      );
      expect(getCmsStudioPresentation(reopened)?.studio_colorway).toBe(
        choice.id
      );
      expect(
        validateCmsPackageV1(reopened, { enforceHashes: true }).valid
      ).toBe(true);
    }
    expect(JSON.stringify(original)).toBe(originalJson);
  });
});

it("uses actual 6529 iron and primary tokens while deriving a safe text-bearing blue", () => {
  const definition = getCmsColorways("fund-v2").find(
    (choice) => choice.id === "seize"
  )!;
  expect(definition.accent).toBe("#3f69fc");
  const variables = resolveCmsColorway("fund-v2", "seize")!;
  expect(variables["--cms-colorway-paper"]).toBe("#131316");
  expect(variables["--cms-colorway-panel"]).toBe("#1c1c21");
  expect(variables["--cms-colorway-mat"]).toBe("#26272b");
  expect(variables["--cms-colorway-ink"]).toBe("#efeff1");
  expect(variables["--cms-colorway-muted"]).toBe("#cecfd4");
  expect(variables["--cms-colorway-accent"]).toBe("#84adff");
  expect(variables["--cms-colorway-accent-ink"]).toBe("#000000");
  expect(tailwindConfig.theme?.extend?.colors).toMatchObject({
    "primary-500": definition.accent.toUpperCase(),
    "primary-300": variables["--cms-colorway-accent"].toUpperCase(),
    iron: {
      950: variables["--cms-colorway-paper"].toUpperCase(),
      900: variables["--cms-colorway-panel"].toUpperCase(),
      800: variables["--cms-colorway-mat"].toUpperCase(),
      100: variables["--cms-colorway-ink"].toUpperCase(),
      300: variables["--cms-colorway-muted"].toUpperCase(),
    },
  });
  expect(
    contrastRatio(
      variables["--cms-colorway-accent"],
      variables["--cms-colorway-accent-ink"]
    )
  ).toBeGreaterThanOrEqual(7);
});

it("requires explicit safe tokens, and never accepts author CSS as an accent", () => {
  expect(resolveCmsColorway("artist-v2", undefined)).toBeNull();
  expect(resolveCmsColorway("artist-v2", "future-colourway")).toBeNull();
  expect(
    cmsStudioThemeTokenPatchSchema.safeParse({
      studio_colorway: "future-colourway",
    }).success
  ).toBe(false);
  expect(
    resolveCmsColorway(
      "artist-v2",
      "clay",
      "red; background:url(https://example.com)"
    )
  ).toEqual(resolveCmsColorway("artist-v2", "clay"));
  const legacy = instantiateCmsStudioTemplate("artist-v2", "Example");
  delete legacy.site.theme.tokens!["studio_colorway"];
  expect(getCmsStudioPresentation(legacy)).not.toHaveProperty(
    "studio_colorway"
  );
  legacy.site.theme.tokens!["studio_colorway"] = "future-colourway";
  expect(getCmsStudioPresentation(legacy)).not.toHaveProperty(
    "studio_colorway"
  );
});
