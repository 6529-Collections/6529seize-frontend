/**
 * Hover may decorate a control. It must never be the only way to reach one.
 *
 * `desktop-hover:group-hover:` reveals ride on CSS `:hover`, which tailwind
 * ships wrapped in `(hover: hover) and (pointer: fine)`. Touch devices never
 * match it, and capability-lying hybrids (Surface hardware that reports no
 * hover while a trackpad drives the cursor) do not match it either — so a
 * control whose ONLY reveal is `desktop-hover:group-hover:` cannot be reached
 * by those users. That shipped twice: the wave picture and wave name edit
 * pencils, the latter being the app's only rename entry point.
 *
 * Two tiers, because the failure modes differ:
 *   - Gating `display`, `visibility` or `pointer-events` removes the hit
 *     target entirely. Unreachable, and a hard failure here.
 *   - Gating `opacity` alone leaves the control clickable but invisible.
 *     Undiscoverable rather than unreachable, so the known set is frozen as a
 *     ratchet instead: existing ones may stay, new ones may not appear.
 *
 * Either tier is satisfied by a second, non-hover way in: `touch-only:` or a
 * focus-driven reveal.
 */
import fs from "node:fs";
import path from "node:path";
import postcss from "postcss";
import tailwindcss from "tailwindcss";
import type { Config } from "tailwindcss";
import tailwindConfig from "@/tailwind.config";

const projectRoot = path.resolve(__dirname, "../..");
const SCAN_ROOTS = ["components", "app"];

/** States that restore a hit target — without one, nothing can click it. */
const REACHABLE_STATE =
  "(?:flex|block|inline-flex|inline-block|inline|grid|table|visible|pointer-events-auto)";

/**
 * Group hover, with or without the `desktop-hover:` capability prefix.
 *
 * The lookbehind keeps `desktop-hover:` itself out of it — that variant is a
 * capability switch, not a cursor state, and applies with no cursor present.
 * Self `hover:` is deliberately excluded too: hovering an element requires it
 * to already occupy space and take pointer events, so it can never be the only
 * way to reach a hidden control. Including it only matched opacity *emphasis*
 * on visible controls.
 */
const HOVER_VARIANT =
  "(?:(?<=[\\s\"'`])|(?<=desktop-hover:))group-hover:";

/**
 * Only a class list that starts out hidden is describing a reveal. Without
 * this, every `hover:tw-opacity-100` emphasis on an already-visible control
 * would read as a gate.
 */
const HIDDEN_BASE =
  /(?:^|[\s"'`])tw-(?:hidden|invisible|opacity-0|pointer-events-none)(?=[\s"'`]|$)/;

/** A reveal a finger or the keyboard can trigger. */
const NON_HOVER_VARIANT =
  "(?:[a-z0-9-]+:)*(?:touch-only|group-focus-within|group-focus-visible|focus-within|focus-visible):";

const HOVER_REACHABILITY_REVEAL = new RegExp(
  `${HOVER_VARIANT}tw-${REACHABLE_STATE}`
);
const HOVER_VISIBILITY_REVEAL = new RegExp(`${HOVER_VARIANT}tw-opacity-100`);

const gatesReachability = (literal: string): boolean =>
  HIDDEN_BASE.test(literal) && HOVER_REACHABILITY_REVEAL.test(literal);

const gatesVisibilityOnly = (literal: string): boolean =>
  HIDDEN_BASE.test(literal) &&
  HOVER_VISIBILITY_REVEAL.test(literal) &&
  !HOVER_REACHABILITY_REVEAL.test(literal);

/**
 * A hit-target gate needs a hit-target escape: `opacity` alone leaves the
 * control click-dead, so it does not answer a `pointer-events` gate.
 */
const NON_HOVER_REACHABILITY = new RegExp(
  `${NON_HOVER_VARIANT}tw-${REACHABLE_STATE}`
);
const NON_HOVER_VISIBILITY = new RegExp(
  `${NON_HOVER_VARIANT}tw-(?:${REACHABLE_STATE}|opacity-100)`
);

/**
 * Reveals whose non-hover path lives in JS rather than in the class list. Add
 * an entry only with the mechanism named, never to silence an unreachable
 * control.
 */
const JS_DRIVEN_REVEALS: Readonly<Record<string, string>> = {
  "components/waves/drops/WaveDropActions.tsx":
    "WaveDrop.tsx tracks pointerover/out and forces visibility through the forceVisible prop; CSS :hover is only the no-JS fallback.",
  "components/waves/drops/WaveDrop.helpers.tsx":
    "Hover-revealed grouped timestamp, not a control: permanently pointer-events-none, and the same forceVisible path drives its opacity.",
};

/**
 * Controls that go invisible (but stay clickable) without hover. Frozen so the
 * set can only shrink. Do not add to this list — give the control a
 * `touch-only:` or focus reveal instead.
 */
const VISIBILITY_ONLY_BASELINE: readonly string[] = [
  "components/brain/left-sidebar/waves/BrainLeftSidebarWave.tsx",
  "components/brain/left-sidebar/web/WebBrainLeftSidebarWave/subcomponents/WaveAvatar.tsx",
  "components/brain/left-sidebar/web/WebProfileFeedShortcut.tsx",
  "components/profile-activity/list/items/utils/ProfileActivityLogItemValueWithCopy.tsx",
  "components/user/brain/UserPageBrainSidebarWaveItem.tsx",
  "components/waves/drops/ArtistActiveSubmissionContent.tsx",
  "components/waves/drops/ArtistWinningArtworksContent.tsx",
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
  return source.match(/"[^"]*"|'[^']*'|`[^`]*`/g) ?? [];
}

function filesWhere(
  isGated: (literal: string) => boolean,
  hasEscape: (literal: string) => boolean
): string[] {
  const hits = SCAN_ROOTS.flatMap(sourceFiles).flatMap((file) => {
    const relative = path.relative(projectRoot, file);
    if (JS_DRIVEN_REVEALS[relative]) {
      return [];
    }
    const offending = classStringLiterals(fs.readFileSync(file, "utf8")).some(
      (literal) => isGated(literal) && !hasEscape(literal)
    );
    return offending ? [relative] : [];
  });
  return Array.from(new Set(hits)).sort((a, b) => a.localeCompare(b));
}

describe("hover-revealed controls stay reachable without hover", () => {
  it("finds no control that only a mouse hover can make clickable", () => {
    expect(
      filesWhere(gatesReachability, (literal) =>
        NON_HOVER_REACHABILITY.test(literal)
      )
    ).toEqual([]);
  });

  it("does not grow the set of controls that only a mouse hover makes visible", () => {
    const current = filesWhere(gatesVisibilityOnly, (literal) =>
      NON_HOVER_VISIBILITY.test(literal)
    );
    const added = current.filter(
      (file) => !VISIBILITY_ONLY_BASELINE.includes(file)
    );

    expect(added).toEqual([]);
    expect(current.length).toBeLessThanOrEqual(
      VISIBILITY_ONLY_BASELINE.length
    );
  });

  it("keeps every JS-driven exemption pointed at a real file", () => {
    for (const exempt of Object.keys(JS_DRIVEN_REVEALS)) {
      expect(fs.existsSync(path.join(projectRoot, exempt))).toBe(true);
    }
  });
});

/**
 * The `touch-only` escape hatch for capability-lying browsers must not itself
 * be gated on the capability queries those browsers get wrong. `<body>` is
 * tagged only after real mouse evidence AND denial of the hover query, so the
 * tag is already the precise condition; a hybrid can meet it while still
 * reporting `any-hover: hover` or `any-pointer: fine`.
 */
/** The guard is only worth its green if it separates these cases. */
describe("gate detection", () => {
  const gated = (literal: string) => ({
    reachability: gatesReachability(literal),
    visibilityOnly: gatesVisibilityOnly(literal),
  });

  it("rejects an opacity-only escape from a hit-target gate", () => {
    const literal =
      "tw-pointer-events-none tw-opacity-0 desktop-hover:group-hover:tw-pointer-events-auto focus-visible:tw-opacity-100";

    expect(gated(literal).reachability).toBe(true);
    // Opacity cannot restore a hit target, so this must not count as an escape.
    expect(NON_HOVER_REACHABILITY.test(literal)).toBe(false);
  });

  it("accepts an escape that restores the hit target", () => {
    const literal =
      "tw-pointer-events-none tw-opacity-0 desktop-hover:group-hover:tw-pointer-events-auto touch-only:tw-pointer-events-auto";

    expect(NON_HOVER_REACHABILITY.test(literal)).toBe(true);
  });

  it("ignores the desktop-hover capability variant on its own", () => {
    // Applies with no cursor anywhere near the element — not a reveal.
    expect(gated("tw-hidden desktop-hover:tw-flex")).toEqual({
      reachability: false,
      visibilityOnly: false,
    });
  });

  it("ignores hover emphasis on an already-visible control", () => {
    expect(gated("tw-opacity-80 hover:tw-opacity-100")).toEqual({
      reachability: false,
      visibilityOnly: false,
    });
  });
});

describe("the hover-unreliable escape hatch resolves without media support", () => {
  type VariantValue = string | readonly string[];

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

  it("registers the tag branch unwrapped", () => {
    const touchOnly = collectVariants()["touch-only"];
    const branches = Array.isArray(touchOnly) ? touchOnly : [touchOnly];
    const tagBranches = branches.filter((branch) =>
      String(branch).includes("data-hover-unreliable")
    );

    expect(tagBranches).toEqual(["body[data-hover-unreliable] &"]);
  });

  it("emits a rule that applies with no hover or pointer query matching", async () => {
    const markup = '<div class="touch-only:tw-pointer-events-auto"></div>';
    const css = await postcss([
      tailwindcss({
        ...(tailwindConfig as Config),
        content: [{ raw: markup, extension: "html" }],
      }),
    ]).process("@tailwind utilities;", { from: undefined });

    const tagRuleAncestors: string[][] = [];
    css.root.walkRules((rule) => {
      if (!rule.selector.includes("data-hover-unreliable")) {
        return;
      }
      const ancestors: string[] = [];
      for (let node = rule.parent; node; node = node.parent) {
        if (node.type === "atrule") {
          ancestors.push(`@${node.name} ${node.params}`);
        }
      }
      tagRuleAncestors.push(ancestors);
    });

    // Present at all, and wrapped in no at-rule — a media-gated escape hatch
    // would never match the browsers it exists for.
    expect(tagRuleAncestors).toEqual([[]]);
  });
});
