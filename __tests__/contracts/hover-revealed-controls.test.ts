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

const projectRoot = path.resolve(__dirname, "../..");
const SCAN_ROOTS = ["components", "app"];

const REVEALED_STATE = "(?:flex|block|inline-flex|inline-block|inline|grid|table|visible)";

/** Reveals that restore a hit target — without one, nothing can click it. */
const REACHABILITY_REVEAL = new RegExp(
  `desktop-hover:group-hover:tw-(?:${REVEALED_STATE}|pointer-events-auto)`
);

/** Reveals that only restore visibility; the control stays clickable. */
const VISIBILITY_REVEAL = /desktop-hover:group-hover:tw-opacity-100/;

/** A reveal a finger or the keyboard can trigger. */
const NON_HOVER_REVEAL = new RegExp(
  `(?:[a-z0-9-]+:)*(?:touch-only|group-focus-within|group-focus-visible|focus-within|focus-visible):tw-(?:${REVEALED_STATE}|opacity-100|pointer-events-auto)`
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

function filesWhere(matches: (literal: string) => boolean): string[] {
  const hits = SCAN_ROOTS.flatMap(sourceFiles).flatMap((file) => {
    const relative = path.relative(projectRoot, file);
    if (JS_DRIVEN_REVEALS[relative]) {
      return [];
    }
    const offending = classStringLiterals(fs.readFileSync(file, "utf8")).some(
      (literal) => matches(literal) && !NON_HOVER_REVEAL.test(literal)
    );
    return offending ? [relative] : [];
  });
  return Array.from(new Set(hits)).sort((a, b) => a.localeCompare(b));
}

describe("hover-revealed controls stay reachable without hover", () => {
  it("finds no control that only a mouse hover can make clickable", () => {
    expect(filesWhere((literal) => REACHABILITY_REVEAL.test(literal))).toEqual(
      []
    );
  });

  it("does not grow the set of controls that only a mouse hover makes visible", () => {
    const current = filesWhere(
      (literal) =>
        VISIBILITY_REVEAL.test(literal) && !REACHABILITY_REVEAL.test(literal)
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
