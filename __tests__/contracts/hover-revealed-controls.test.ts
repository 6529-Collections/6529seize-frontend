/**
 * Hover may decorate a control. It must never be the only way to discover one.
 *
 * Tailwind wraps hover rules in `(hover: hover) and (pointer: fine)`. Some
 * hybrid Windows laptops report the negation of that query while their
 * trackpad still moves a mouse cursor. Keyboard focus is useful but does not
 * help that mouse user discover an idle control, and JavaScript touch checks
 * intentionally classify hybrids as desktop so the layout stays desktop.
 *
 * Any class list that pairs an invisible base state with a hover reveal must
 * therefore include the exact CSS-query complement: `touch-only:`. The scan
 * covers group hover and self hover, partial opacity reveals, responsive base
 * gates, and collapsed dimensions. Narrow exemptions below are audited UI
 * that is decorative or has a separate always-available interaction path.
 */
import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import postcss from "postcss";
import tailwindcss from "tailwindcss";
import type { Config } from "tailwindcss";
import ts from "typescript";
import tailwindConfig from "@/tailwind.config";

const projectRoot = path.resolve(__dirname, "../..");
const SCAN_ROOTS = ["components", "app"];

type RevealKind =
  | "display"
  | "visibility"
  | "pointer-events"
  | "opacity"
  | "width"
  | "height"
  | "scale";

interface ClassToken {
  readonly important: boolean;
  readonly variants: readonly string[];
  readonly utility: string;
}

interface GatedLiteral {
  readonly file: string;
  readonly literal: string;
  readonly missingTouchFallbacks: readonly RevealKind[];
}

interface AuditedRevealExemption {
  readonly file: string;
  readonly marker: string;
  readonly literalHash: string;
  readonly reason: string;
}

/**
 * These are literal-level exemptions, not file-wide suppressions. The marker
 * keeps reviews readable while the hash pins the entire normalized class
 * literal; changing or extending that literal invalidates the exemption.
 */
const AUDITED_REVEAL_EXEMPTIONS: readonly AuditedRevealExemption[] = [
  {
    file: "components/home/boosted/BoostedDropCompactChatItem.tsx",
    marker: "tw-items-center tw-overflow-hidden tw-opacity-0",
    literalHash:
      "0f587c25522815d66da60260f1d14df5ea0ad8aadcb8717cde6088300f528df8",
    reason:
      "This pointer-events-none preview replaces already visible summary text as decoration; without hover the original summary remains visible.",
  },
  {
    file: "components/home/now-minting/MemeSubscriptionAwarenessRow.tsx",
    marker: "tw-bg-primary-400/[0.045] tw-opacity-0",
    literalHash:
      "0bc7f096adb69984e6ebd6ba6e6dd42070148782c663d14af10ed4401778e31d",
    reason:
      "This aria-hidden, pointer-events-none surface tint is decorative; the row content and actions are always visible.",
  },
  {
    file: "components/profile-cms/CmsArtLightbox.tsx",
    marker: "tw-uppercase tw-text-white tw-opacity-0",
    literalHash:
      "4b031231747e41907541a19e6b9515d96c7a9fe1a6bc4e5dc20918134f049cfb",
    reason:
      "The Inspect label supplements an already visible and keyboard-focusable artwork control; it is not a separate action.",
  },
  {
    file: "components/drops/view/item/content/media/MediaActionToolbar.tsx",
    marker: "desktop-hover:group-hover/media:tw-pointer-events-auto",
    literalHash:
      "8cdecad1fd55f627ff69f6ef7619a5b3d7ef03bd5a1db6d57408e64563afb848",
    reason:
      "The inline media toolbar is an enhancement; clicking the visible media opens the expanded viewer with the same actions, and keyboard focus also reveals it.",
  },
  {
    file: "components/user/brain/UserPageBrainSidebarWaveItem.tsx",
    marker: "-tw-translate-x-1 tw-text-iron-600 tw-opacity-0",
    literalHash:
      "84c3f14d428c46d315170c5f07e9d8378b9181c690a3bdcb800197561aac948e",
    reason:
      "The faded chevron is decorative; the wave link and label remain visible and operable.",
  },
  {
    file: "components/utils/NewVersionToast.tsx",
    marker: "before:tw-bg-[radial-gradient(circle_at_82%_50%",
    literalHash:
      "05fb46b70c92b159eb60ee7c479153c5c075347054e0fafb70dc484c4765092e",
    reason:
      "This pointer-events-none pseudo-element is a decorative glow on an always visible refresh button.",
  },
  {
    file: "components/waves/drops/ArtistActiveSubmissionContent.tsx",
    marker: "tw-right-3 tw-top-3 tw-opacity-0",
    literalHash:
      "81b51aea26c6c7a7fc1b7df296946a836777339b158ffab0a7d36c051feb5397",
    reason:
      "The eye glyph is decorative feedback on an already visible, fully clickable artwork card.",
  },
  {
    file: "components/waves/drops/ArtistWinningArtworksContent.tsx",
    marker: "tw-right-3 tw-top-3 tw-opacity-0",
    literalHash:
      "81b51aea26c6c7a7fc1b7df296946a836777339b158ffab0a7d36c051feb5397",
    reason:
      "The eye glyph is decorative feedback on an already visible, fully clickable artwork card.",
  },
  {
    file: "components/waves/drops/WaveDropActions.tsx",
    marker: "desktop-hover:group-hover:tw-pointer-events-auto",
    literalHash:
      "cba6ffbd8f3f64aba6310f2306f8d6e0458f8bbe503330f763f99e1e15bf87a7",
    reason:
      "WaveDrop tracks pointerover/out without a hover capability query and passes forceVisible; the CSS hover rule is its no-JS enhancement.",
  },
  {
    file: "components/waves/drops/WaveDrop.helpers.tsx",
    marker: "tw-opacity-0 desktop-hover:group-hover:tw-opacity-100",
    literalHash:
      "dc415d6ed3f1074154a978fff7bea616f299625cfe95d3b0ab2197cefb2768df",
    reason:
      "This is a pointer-events-none timestamp, not a control, and WaveDrop's forceVisible pointer path also drives its opacity.",
  },
  {
    file: "components/waves/FilePreview.tsx",
    marker: "tw-bg-iron-950 tw-opacity-0",
    literalHash:
      "bdd312eefbb552edbd175dea4ef9ec973f12695c3397cfa3af018a5c83b0e0b6",
    reason:
      "This empty overlay is a decorative shade on a file preview; the preview content and interaction remain visible.",
  },
  {
    file: "components/waves/gallery/WaveGalleryItem.tsx",
    marker: "tw-bg-gradient-to-t tw-from-black/80",
    literalHash:
      "f52aeaa5f9b8f281ec5bea860dbbbc783efbcb5982d965ae6ad1f37ac2f047a0",
    reason:
      "The gradient is a pointer-events-none visual treatment; the gallery card remains visible and operable.",
  },
  {
    file: "components/waves/gallery/WaveGalleryItem.tsx",
    marker: "tw-bottom-0 tw-left-0 tw-right-0 tw-translate-y-2",
    literalHash:
      "b635b3b46283c6bb2173c83b6b40e222ba9592626f9cd89b565a21dc6ea57ae1",
    reason:
      "The title and metadata overlay is pointer-events-none supplementary content; the card and author control have independent visible targets.",
  },
  {
    file: "app/join/FocusSections.tsx",
    marker: "tw-bg-[linear-gradient(90deg,transparent_0%",
    literalHash:
      "39d0c8e903fcfd521af6b28b73f571b6666e26e784e31af233a7fddf5f5d6fdb",
    reason:
      "This aria-hidden, pointer-events-none gradient is decorative; the section content remains visible and operable.",
  },
  {
    file: "app/join/JourneyTimelineSection.tsx",
    marker: "tw-bg-[radial-gradient(circle,rgba(132,173,255",
    literalHash:
      "8c3c9fa30ca9f143dbf2c6be91ba35659e2099745f7c019e9a09b4be8d6c052b",
    reason:
      "This empty radial glow is decorative; the timeline icon, copy, and controls remain visible without it.",
  },
];

function sourceFiles(root: string): string[] {
  const absolute = path.join(projectRoot, root);
  if (!fs.existsSync(absolute)) {
    return [];
  }
  const walk = (dir: string): string[] =>
    fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
      const file = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        return walk(file);
      }
      return entry.isFile() && entry.name.endsWith(".tsx") ? [file] : [];
    });
  return walk(absolute);
}

/** Class lists are authored as string literals — check each one on its own. */
function classStringLiterals(source: string): string[] {
  const sourceFile = ts.createSourceFile(
    "hover-audit.tsx",
    source,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TSX
  );
  const literals: string[] = [];
  const visit = (node: ts.Node): void => {
    if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) {
      literals.push(node.getText(sourceFile));
    } else if (ts.isTemplateExpression(node)) {
      const staticClasses = [
        node.head.text,
        ...node.templateSpans.map((span) => span.literal.text),
      ].join(" ");
      literals.push(`\`${staticClasses}\``);
    }
    ts.forEachChild(node, visit);
  };
  visit(sourceFile);
  return literals;
}

function literalContent(literal: string): string {
  const quote = literal.at(0);
  return (
    (quote === '"' || quote === "'" || quote === "`") &&
    literal.at(-1) === quote
      ? literal.slice(1, -1)
      : literal
  );
}

const normalizeLiteral = (literal: string): string =>
  literalContent(literal).trim().split(/\s+/).join(" ");

const literalHash = (literal: string): string =>
  createHash("sha256").update(normalizeLiteral(literal)).digest("hex");

function classTokens(literal: string): ClassToken[] {
  const content = literalContent(literal);

  return content
    .split(/\s+/)
    .filter(Boolean)
    .map((raw) => {
      const parts = raw.split(":");
      const utility = parts.at(-1) ?? "";
      return {
        important: utility.startsWith("!"),
        variants: parts.slice(0, -1),
        utility: utility.replace(/^!/, ""),
      };
    });
}

const hasVariant = (
  token: ClassToken,
  matches: (variant: string) => boolean
): boolean => token.variants.some(matches);

const isHoverToken = (token: ClassToken): boolean =>
  hasVariant(
    token,
    (variant) => variant === "hover" || variant.startsWith("group-hover")
  );

const isTouchOnlyToken = (token: ClassToken): boolean =>
  hasVariant(token, (variant) => variant === "touch-only");

const kindForBaseUtility = (utility: string): RevealKind[] => {
  switch (utility) {
    case "tw-hidden":
      return ["display"];
    case "tw-invisible":
      return ["visibility"];
    case "tw-pointer-events-none":
      return ["pointer-events"];
    case "tw-opacity-0":
      return ["opacity"];
    case "tw-w-0":
    case "tw-max-w-0":
      return ["width"];
    case "tw-h-0":
    case "tw-max-h-0":
      return ["height"];
    case "tw-size-0":
      return ["width", "height"];
    case "tw-scale-0":
      return ["scale"];
    default:
      return [];
  }
};

const POSITIVE_DISPLAY = new Set([
  "tw-block",
  "tw-flex",
  "tw-grid",
  "tw-inline",
  "tw-inline-block",
  "tw-inline-flex",
  "tw-inline-grid",
  "tw-table",
]);

const kindForRevealUtility = (utility: string): RevealKind[] => {
  if (POSITIVE_DISPLAY.has(utility)) return ["display"];
  if (utility === "tw-visible") return ["visibility"];
  if (utility === "tw-pointer-events-auto") return ["pointer-events"];
  if (/^tw-opacity-(?!0(?:$|[/.]))/.test(utility)) return ["opacity"];
  if (/^tw-(?:w|max-w)-(?!0(?:$|[/.]))/.test(utility)) return ["width"];
  if (/^tw-(?:h|max-h)-(?!0(?:$|[/.]))/.test(utility)) return ["height"];
  if (/^tw-size-(?!0(?:$|[/.]))/.test(utility)) {
    return ["width", "height"];
  }
  if (/^tw-scale-(?!0(?:$|[/.]))/.test(utility)) return ["scale"];
  return [];
};

function kindsFor(
  tokens: readonly ClassToken[],
  tokenMatches: (token: ClassToken) => boolean,
  utilityKinds: (utility: string) => readonly RevealKind[]
): Set<RevealKind> {
  return new Set(
    tokens.filter(tokenMatches).flatMap((token) => utilityKinds(token.utility))
  );
}

function missingTouchFallbacks(literal: string): RevealKind[] {
  const tokens = classTokens(literal);
  const baseTokens = tokens.filter(
    (token) => !isHoverToken(token) && !isTouchOnlyToken(token)
  );
  const baseKinds = kindsFor(baseTokens, () => true, kindForBaseUtility);
  const hoverKinds = kindsFor(tokens, isHoverToken, kindForRevealUtility);
  const touchTokens = tokens.filter(isTouchOnlyToken);
  const isResponsiveVariant = (variant: string): boolean =>
    /^(?:sm|md|lg|xl|2xl|min-\[|max-\[|@)/.test(variant);
  const hasEffectiveTouchFallback = (kind: RevealKind): boolean => {
    const candidates = touchTokens.filter((token) =>
      kindForRevealUtility(token.utility).includes(kind)
    );
    if (candidates.length === 0) return false;

    const hasResponsiveGate = baseTokens.some(
      (token) =>
        kindForBaseUtility(token.utility).includes(kind) &&
        token.variants.some(isResponsiveVariant)
    );
    return !hasResponsiveGate || candidates.some((token) => token.important);
  };

  return [...baseKinds]
    .filter((kind) => hoverKinds.has(kind) && !hasEffectiveTouchFallback(kind))
    .sort((a, b) => a.localeCompare(b));
}

function gatedLiterals(): GatedLiteral[] {
  return SCAN_ROOTS.flatMap(sourceFiles).flatMap((file) => {
    const relative = path.relative(projectRoot, file);
    return classStringLiterals(fs.readFileSync(file, "utf8")).flatMap(
      (literal) => {
        const missing = missingTouchFallbacks(literal);
        return missing.length
          ? [
              {
                file: relative,
                literal,
                missingTouchFallbacks: missing,
              },
            ]
          : [];
      }
    );
  });
}

const exemptionFor = (hit: GatedLiteral): AuditedRevealExemption | undefined =>
  AUDITED_REVEAL_EXEMPTIONS.find(
    (exemption) =>
      exemption.file === hit.file &&
      hit.literal.includes(exemption.marker) &&
      literalHash(hit.literal) === exemption.literalHash
  );

describe("hover-revealed controls stay visible without hover", () => {
  const hits = gatedLiterals();

  it("finds no unaudited reveal without the exact touch-only fallback", () => {
    const unaudited = hits
      .filter((hit) => !exemptionFor(hit))
      .map(({ file, missingTouchFallbacks: missing }) => ({ file, missing }));

    expect(unaudited).toEqual([]);
  });

  it("keeps every exemption narrow, explained, and attached to a real gate", () => {
    for (const exemption of AUDITED_REVEAL_EXEMPTIONS) {
      expect(exemption.reason.length).toBeGreaterThan(40);
      expect(fs.existsSync(path.join(projectRoot, exemption.file))).toBe(true);
    }

    const detached = AUDITED_REVEAL_EXEMPTIONS.filter((exemption) => {
      const matchingHits = hits.filter(
        (hit) => exemptionFor(hit) === exemption
      );
      return matchingHits.length !== 1;
    }).map(({ file, marker }) => ({ file, marker }));

    expect(detached).toEqual([]);
  });

  it("does not exempt a longer literal that merely contains the marker", () => {
    const exemption = AUDITED_REVEAL_EXEMPTIONS[0];
    const auditedHit = hits.find((hit) => exemptionFor(hit) === exemption);

    expect(auditedHit).toBeDefined();
    if (!auditedHit) {
      throw new Error("Expected the audited gate to be present");
    }
    const closingQuote = auditedHit.literal.at(-1) ?? '"';
    const longerLiteral = `${auditedHit.literal.slice(0, -1)} tw-sr-only${closingQuote}`;

    expect(
      exemptionFor({
        ...auditedHit,
        literal: longerLiteral,
      })
    ).toBeUndefined();
  });
});

describe("gate detection", () => {
  it("requires touch-only even when keyboard focus also reveals the control", () => {
    const literal =
      "tw-opacity-0 desktop-hover:group-hover:tw-opacity-100 focus-visible:tw-opacity-100";

    expect(missingTouchFallbacks(literal)).toEqual(["opacity"]);
  });

  it("requires each gated property to be restored", () => {
    const literal =
      "tw-pointer-events-none tw-opacity-0 desktop-hover:group-hover:tw-pointer-events-auto desktop-hover:group-hover:tw-opacity-100 touch-only:tw-opacity-100";

    expect(missingTouchFallbacks(literal)).toEqual(["pointer-events"]);
  });

  it("accepts exact touch-only fallbacks for every gated property", () => {
    const literal =
      "tw-pointer-events-none tw-opacity-0 desktop-hover:group-hover:tw-pointer-events-auto desktop-hover:group-hover:tw-opacity-100 touch-only:tw-pointer-events-auto touch-only:tw-opacity-100";

    expect(missingTouchFallbacks(literal)).toEqual([]);
  });

  it("detects self hover, partial opacity, responsive gates, and collapsed width", () => {
    expect(
      missingTouchFallbacks(
        "lg:tw-opacity-0 tw-w-0 hover:tw-opacity-50 desktop-hover:hover:tw-w-7"
      )
    ).toEqual(["opacity", "width"]);
  });

  it("requires a touch fallback to outrank a responsive visibility gate", () => {
    const gated =
      "tw-opacity-100 lg:tw-opacity-0 desktop-hover:group-hover:tw-opacity-100 touch-only:tw-opacity-100";
    const safe =
      "tw-opacity-100 lg:tw-opacity-0 desktop-hover:group-hover:tw-opacity-100 touch-only:!tw-opacity-100";

    expect(missingTouchFallbacks(gated)).toEqual(["opacity"]);
    expect(missingTouchFallbacks(safe)).toEqual([]);
  });

  it("ignores hover decoration on a control without an invisible base", () => {
    expect(missingTouchFallbacks("tw-opacity-80 hover:tw-opacity-100")).toEqual(
      []
    );
  });

  it("detects a gate split around a template interpolation", () => {
    const [literal] = classStringLiterals(
      'const classes = `tw-opacity-0 ${variant} desktop-hover:group-hover:tw-opacity-100`;'
    );

    expect(literal).toBeDefined();
    if (!literal) {
      throw new Error("Expected the template class literal to be extracted");
    }
    expect(missingTouchFallbacks(literal)).toEqual(["opacity"]);
  });
});

/**
 * `touch-only` must be the exact complement of the query tailwind wraps hover
 * in. Two independent approximations drift: `(any-hover: none) and
 * (any-pointer: coarse)` looks like "no hover", but a hybrid can report
 * `any-hover: hover` from an attached trackpad while its primary pointer is
 * coarse — matching neither the hover reveal nor the touch fallback.
 */

describe("touch-only complements the hover reveal exactly", () => {
  type VariantValue = string | readonly string[];

  /** Just the slice of the PostCSS node chain these assertions read. */
  type PostcssAncestor =
    | {
        readonly type: string;
        readonly name?: string | undefined;
        readonly params?: string | undefined;
        readonly parent?: PostcssAncestor;
      }
    | undefined;

  const HOVER_QUERY = "(hover: hover) and (pointer: fine)";
  const COMPLEMENT_QUERY = `not all and ${HOVER_QUERY}`;

  const collectVariants = (): Record<string, VariantValue> => {
    const variants: Record<string, VariantValue> = {};
    const noop = () => undefined;
    const api = new Proxy(
      {
        addVariant: (name: string, value: VariantValue) => {
          variants[name] = value;
        },
      },
      {
        get: (target: Record<string, unknown>, property: string) =>
          property in target ? target[property] : noop,
      }
    );

    for (const item of tailwindConfig.plugins ?? []) {
      const handler = (item as { handler?: (pluginApi: unknown) => void })
        .handler;
      if (typeof handler !== "function") {
        continue;
      }
      try {
        handler(api);
      } catch {
        // Other plugins reach for APIs this stub does not provide; only the
        // repo-local addVariant plugin matters here.
      }
    }

    return variants;
  };

  const atRuleParamsFor = async (
    className: string,
    markup: string
  ): Promise<string[][]> => {
    const css = await postcss([
      tailwindcss({
        ...(tailwindConfig as Config),
        content: [{ raw: markup, extension: "html" }],
      }),
    ]).process("@tailwind utilities;", { from: undefined });

    const matches: string[][] = [];
    css.root.walkRules((rule) => {
      if (!rule.selector.includes(className)) {
        return;
      }
      const params: string[] = [];
      let node = rule.parent as PostcssAncestor;
      while (node) {
        if (node.type === "atrule") {
          params.push(`${node.name ?? ""} ${node.params ?? ""}`.trim());
        }
        node = node.parent;
      }
      matches.push(params);
    });
    return matches;
  };

  it("registers touch-only as the negation, with no capability escape hatch", () => {
    const touchOnly = collectVariants()["touch-only"];

    expect(touchOnly).toBe(`@media ${COMPLEMENT_QUERY}`);
    // A body-attribute condition would reintroduce a state that matches
    // neither side: tagged, yet denied by the hover query.
    expect(String(touchOnly)).not.toContain("data-fine-pointer");
    expect(String(touchOnly)).not.toContain("data-hover-unreliable");
  });

  it("emits reveal and fallback under mutually exclusive queries", async () => {
    const markup =
      '<div class="tw-group"><button class="tw-opacity-0 desktop-hover:group-hover:tw-opacity-100 touch-only:tw-opacity-100"></button></div>';

    const hoverRule = await atRuleParamsFor(
      "desktop-hover\\:group-hover\\:tw-opacity-100",
      markup
    );
    const touchRule = await atRuleParamsFor(
      "touch-only\\:tw-opacity-100",
      markup
    );

    // Every hover reveal sits inside the hover query...
    expect(hoverRule.length).toBeGreaterThan(0);
    for (const params of hoverRule) {
      expect(params).toContain(`media ${HOVER_QUERY}`);
    }
    // ...and the fallback sits inside exactly its negation, so no browser can
    // land outside both.
    expect(touchRule).toEqual([[`media ${COMPLEMENT_QUERY}`]]);
  });

  it("emits an important fallback that can beat responsive base gates", async () => {
    const markup =
      '<div class="tw-opacity-100 lg:tw-opacity-0 touch-only:!tw-opacity-100"></div>';
    const css = await postcss([
      tailwindcss({
        ...(tailwindConfig as Config),
        content: [{ raw: markup, extension: "html" }],
      }),
    ]).process("@tailwind utilities;", { from: undefined });
    const importantDeclarations: boolean[] = [];

    css.root.walkRules((rule) => {
      if (!rule.selector.includes("touch-only\\:\\!tw-opacity-100")) return;
      rule.walkDecls("opacity", (declaration) => {
        importantDeclarations.push(declaration.important);
      });
    });

    expect(importantDeclarations).toEqual([true]);
  });
});
