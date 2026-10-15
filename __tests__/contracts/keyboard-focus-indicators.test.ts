/**
 * `focus:tw-outline-none` removes the browser focus ring. Every control that
 * uses it must replace it with its own visible indicator (WCAG 2.2 AA 2.4.7),
 * and that indicator must reach 3:1 against the dark page surface (1.4.11).
 *
 * The scan finds each class list that contains `focus:tw-outline-none`, gathers
 * every class reachable from the same JSX attribute or shared class constant
 * (template parts, `clsx` arguments, and same-file constants and helpers), and
 * requires a focus or focus-visible ring, outline, shadow or border change.
 * Plain containers that never take keyboard focus (no tabIndex, or
 * tabIndex={-1}) are skipped. Audited exceptions are pinned by literal hash.
 *
 * SCAN_ROOTS lists the directories migrated so far; widen it as later batches
 * of the focus-visible sweep land.
 */
import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import resolveConfig from "tailwindcss/resolveConfig";
import ts from "typescript";
import tailwindConfig from "@/tailwind.config";

const projectRoot = path.resolve(__dirname, "../..");
const SCAN_ROOTS = [
  "components/header",
  "components/layout",
  "components/brain",
  "components/waves",
  "components/drops",
  "components/utils",
  "components/common",
];
const OUTLINE_NONE = "focus:tw-outline-none";
const MIN_CONTRAST = 3;

interface AuditedException {
  readonly file: string;
  readonly marker: string;
  readonly literalHash: string;
  readonly reason: string;
}

/** Literal-level exceptions; changing the class literal invalidates them. */
const MENU_CONTAINER_REASON =
  "Headless UI MenuItems container: focus stays on the menu element while the active item is highlighted through focusItemClassName.";
const AUDITED_EXCEPTIONS: readonly AuditedException[] = [
  {
    file: "components/brain/my-stream/tabs/MyStreamWaveCreateActionsMenu.tsx",
    marker: "tw-ring-iron-700/80 focus:tw-outline-none",
    literalHash:
      "249ea0bf0f7dbc20147acacfaa7463e8c01b9f7fbb07bc2f7ce20e32ef0208ba",
    reason: MENU_CONTAINER_REASON,
  },
  {
    file: "components/common/TabToggleWithOverflow.tsx",
    marker: "tw-shadow-lg tw-ring-1 focus:tw-outline-none",
    literalHash:
      "f4e4cbd54777b1e6872a0eaa61f6c0cfd07b9e59fb478187b3deb41d7db9e450",
    reason: MENU_CONTAINER_REASON,
  },
  {
    file: "components/waves/specs/wave-notification-settings/WaveNotificationPreferenceButtons.tsx",
    marker: "tw-ring-white/10 focus:tw-outline-none",
    literalHash:
      "a908df2dc19dfa7d6083f72e8f56f77ce69648e86ed5a5cb93d675cf2e0f429f",
    reason:
      "Headless UI MenuItems container: focus stays on the menu element while the active item is highlighted through its data-[focus] background.",
  },
];

// ---------------------------------------------------------------- colour ----

const themeColors: Readonly<Record<string, unknown>> = {
  ...resolveConfig(tailwindConfig).theme.colors,
};

function colorHex(name: string): string | null {
  const arbitrary = /^\[(#[0-9a-fA-F]{3,6})\]$/.exec(name);
  if (arbitrary?.[1]) return arbitrary[1];
  const direct = themeColors[name];
  if (typeof direct === "string") return direct;
  const shade = /^([a-z]+)-(\d{2,3})$/.exec(name);
  if (!shade?.[1] || !shade[2]) return null;
  const family = themeColors[shade[1]];
  if (!family || typeof family !== "object") return null;
  const value: unknown = Reflect.get(family, shade[2]);
  return typeof value === "string" ? value : null;
}

const SURFACE = colorHex("iron-950") ?? "#131316";

function rgb(hex: string): [number, number, number] {
  const digits = hex.slice(1);
  const full =
    digits.length === 3
      ? digits.replaceAll(/./g, (d) => d + d)
      : digits.slice(0, 6);
  const value = Number.parseInt(full, 16);
  return [(value >> 16) & 255, (value >> 8) & 255, value & 255];
}

function luminance([r, g, b]: readonly number[]): number {
  const channel = (c = 0) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

/** Contrast of a utility colour such as `white/20` over the iron-950 surface. */
function contrastOnSurface(color: string): number | null {
  if (color === "transparent") return 1;
  const match = /^(.+?)(?:\/(\d+)|\/\[(0?\.\d+)\])?$/.exec(color);
  const hex = match?.[1] ? colorHex(match[1]) : null;
  if (!match || !hex) return null;
  let alpha = 1;
  if (match[2]) alpha = Number(match[2]) / 100;
  else if (match[3]) alpha = Number(match[3]);
  const bg = rgb(SURFACE);
  const mixed = rgb(hex).map((c, i) => c * alpha + (bg[i] ?? 0) * (1 - alpha));
  const [hi = 0, lo = 0] = [luminance(mixed), luminance(bg)].sort(
    (a, b) => b - a
  );
  return (hi + 0.05) / (lo + 0.05);
}

// ----------------------------------------------------------- indicators ----

interface ClassToken {
  readonly variants: readonly string[];
  readonly utility: string;
}

const toTokens = (classes: string): ClassToken[] =>
  classes
    .split(/\s+/)
    .filter(Boolean)
    .map((raw) => {
      const parts = raw.split(":");
      return {
        variants: parts.slice(0, -1),
        utility: (parts.at(-1) ?? "").replace(/^!/, ""),
      };
    });

const isFocusToken = (token: ClassToken): boolean =>
  token.variants.some((v) => v === "focus" || v === "focus-visible");

const ringWidth = (utility: string): number | null => {
  if (utility === "tw-ring") return 3;
  const match = /^tw-ring-(\d+)$/.exec(utility);
  return match ? Number(match[1]) : null;
};

const COLOR_UTILITY = {
  ring: /^tw-ring-(.+)$/,
  outline: /^tw-outline-(.+)$/,
  border: /^tw-border(?:-[xytblr])?-(.+)$/,
} as const;
const NOT_A_COLOR = /^(?:\d|\[\d|offset|inset|none|solid|dashed|dotted|double)/;

const colorsOf = (
  tokens: readonly ClassToken[],
  kind: keyof typeof COLOR_UTILITY
): string[] =>
  tokens.flatMap((t) => {
    const value = COLOR_UTILITY[kind].exec(t.utility)?.[1];
    return value && !NOT_A_COLOR.test(value) ? [value] : [];
  });

/** Why the class list lacks a usable keyboard indicator, or null when fine. */
function indicatorProblem(classes: string): string | null {
  const tokens = toTokens(classes);
  const base = tokens.filter((t) => t.variants.length === 0);
  const focus = tokens.filter(isFocusToken);
  const has = (list: readonly ClassToken[], test: (u: string) => boolean) =>
    list.some((t) => test(t.utility));

  const baseRing = Math.max(0, ...base.map((t) => ringWidth(t.utility) ?? 0));
  const focusRing = Math.max(0, ...focus.map((t) => ringWidth(t.utility) ?? 0));
  const forms = has(base, (u) => /^tw-form-[a-z]+$/.test(u));
  const ringZero = has(focus, (u) => u === "tw-ring-0");
  const baseBorder = has(base, (u) =>
    /^tw-border(?:-[xytblr])?(?:-\d)?$/.test(u)
  );
  const ringColors = colorsOf(focus, "ring");
  const outlineColors = colorsOf(focus, "outline");
  const borderColors = colorsOf(focus, "border");

  // Each available mechanism adds its colours; "unknown" cannot be measured.
  const candidates: string[] = [];
  let mechanism = false;
  let defaultRing = false;
  const ringWidens = focusRing > 0 && focusRing > baseRing;
  if (ringWidens || (ringColors.length > 0 && focusRing + baseRing > 0)) {
    mechanism = true;
    const palette = ringColors.length > 0 ? ringColors : colorsOf(base, "ring");
    if (palette.length > 0) candidates.push(...palette);
    else if (forms) candidates.push("unknown");
    else defaultRing = true;
  }
  const outlineStyle = has(focus, (u) => /^tw-outline(?:-\d)?$/.test(u));
  if (outlineColors.length > 0 || outlineStyle) {
    mechanism = true;
    candidates.push(
      ...(outlineColors.length > 0 ? outlineColors : ["unknown"])
    );
  }
  if (has(focus, (u) => /^tw-shadow/.test(u) && u !== "tw-shadow-none")) {
    mechanism = true;
    candidates.push("unknown");
  }
  // @tailwindcss/forms recolours the ring and border on :focus.
  if (forms && !ringZero) {
    mechanism = true;
    candidates.push("unknown");
  }
  if (borderColors.length > 0 && baseBorder) {
    mechanism = true;
    candidates.push(...borderColors);
  }

  if (!mechanism) return "no focus indicator";
  if (candidates.length === 0) {
    return defaultRing
      ? "ring uses Tailwind's default 50% blue (below 3:1)"
      : null;
  }
  // "unknown" marks mechanisms that cannot be measured. An explicit colour
  // token that does not resolve (e.g. an rgba() arbitrary value) fails, so a
  // faint indicator cannot slip through unmeasured.
  const visible = candidates.some(
    (c) => c === "unknown" || (contrastOnSurface(c) ?? 0) >= MIN_CONTRAST
  );
  return visible
    ? null
    : `faint indicator (${candidates.join(", ")} below ${MIN_CONTRAST}:1 on iron-950)`;
}

// ---------------------------------------------------------- class lists ----

interface Hit {
  readonly file: string;
  readonly literal: string;
  readonly problem: string;
}

const isClassText = (
  node: ts.Node
): node is ts.StringLiteralLike | ts.TemplateLiteralLikeNode =>
  ts.isStringLiteralLike(node) ||
  ts.isTemplateHead(node) ||
  ts.isTemplateMiddle(node) ||
  ts.isTemplateTail(node);

interface ClassOwner {
  readonly node: ts.Node;
  readonly attribute?: ts.JsxAttribute;
}

/** The JSX attribute, constant, assignment or return that owns a class list. */
function ownerOf(literal: ts.Node): ClassOwner {
  let node: ts.Node = literal;
  while (
    node.parent &&
    !ts.isSourceFile(node.parent) &&
    !ts.isBlock(node.parent)
  ) {
    const parent: ts.Node = node.parent;
    if (ts.isJsxAttribute(parent)) return { node, attribute: parent };
    const ownsClassList =
      ts.isVariableDeclaration(parent) ||
      ts.isReturnStatement(parent) ||
      ts.isArrowFunction(parent) ||
      (ts.isBinaryExpression(parent) &&
        parent.operatorToken.kind === ts.SyntaxKind.EqualsToken) ||
      (ts.isPropertyAssignment(parent) &&
        parent.initializer === node &&
        !ts.isCallExpression(parent.parent.parent));
    if (ownsClassList) return { node };
    node = parent;
  }
  return { node };
}

/** All static class text reachable from a node, following same-file names. */
function reachableClasses(
  root: ts.Node,
  declarations: Map<string, ts.Node[]>
): string {
  const seen = new Set<ts.Node>();
  const parts: string[] = [];
  const visit = (node: ts.Node): void => {
    if (seen.has(node)) return;
    seen.add(node);
    if (isClassText(node)) parts.push(node.text);
    const isMemberName =
      ts.isPropertyAccessExpression(node.parent) && node.parent.name === node;
    if (ts.isIdentifier(node) && !isMemberName) {
      for (const declaration of declarations.get(node.text) ?? []) {
        visit(declaration);
      }
    }
    ts.forEachChild(node, visit);
  };
  visit(root);
  return parts.join(" ");
}

function declarationsOf(sourceFile: ts.SourceFile): Map<string, ts.Node[]> {
  const declarations = new Map<string, ts.Node[]>();
  const index = (node: ts.Node): void => {
    const named =
      (ts.isVariableDeclaration(node) || ts.isFunctionDeclaration(node)) &&
      node.name &&
      ts.isIdentifier(node.name);
    if (named) {
      const name = node.name.getText(sourceFile);
      declarations.set(name, [...(declarations.get(name) ?? []), node]);
    }
    ts.forEachChild(node, index);
  };
  index(sourceFile);
  return declarations;
}

const NON_FOCUSABLE_TAGS = new Set([
  "div",
  "span",
  "section",
  "ul",
  "ol",
  "li",
  "nav",
  "aside",
  "main",
  "header",
  "footer",
  "form",
  "label",
  "p",
  "dialog",
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
]);
const INTERACTIVE_ROLE =
  /^(?:button|link|tab|menuitem\w*|option|checkbox|radio|switch|slider|textbox|combobox|treeitem)$/;

/** `focus-within:` indicators that wrapping JSX elements draw for a control. */
function ancestorFocusWithin(
  attribute: ts.JsxAttribute | undefined,
  declarations: Map<string, ts.Node[]>
): string {
  const parts: string[] = [];
  let depth = 0;
  let node: ts.Node | undefined = attribute?.parent.parent.parent;
  for (; node && depth < 8; node = node.parent) {
    if (!ts.isJsxElement(node)) continue;
    depth++;
    const className = node.openingElement.attributes.properties.find(
      (p): p is ts.JsxAttribute =>
        ts.isJsxAttribute(p) && p.name.getText() === "className"
    );
    if (!className?.initializer) continue;
    const classes = reachableClasses(className.initializer, declarations);
    for (const token of classes.split(/\s+/)) {
      if (token.startsWith("focus-within:")) {
        parts.push(token.replace(/^focus-within:/, "focus:"));
      }
    }
  }
  return parts.join(" ");
}

/** Plain containers and tabIndex={-1} targets never show keyboard focus. */
function isKeyboardFocusTarget(
  attribute: ts.JsxAttribute | undefined
): boolean {
  if (!attribute || attribute.name.getText() !== "className") return true;
  const element = attribute.parent.parent;
  const value = (name: string): string | undefined => {
    const attr = element.attributes.properties.find(
      (p): p is ts.JsxAttribute =>
        ts.isJsxAttribute(p) && p.name.getText() === name
    );
    const initializer = attr?.initializer;
    if (!initializer) return undefined;
    if (ts.isStringLiteral(initializer)) return initializer.text;
    return ts.isJsxExpression(initializer)
      ? initializer.expression?.getText()
      : undefined;
  };
  const tabIndex = value("tabIndex")?.trim();
  if (tabIndex === "-1") return false;
  const tag = element.tagName.getText().replace(/^(?:m|motion)\./, "");
  if (!NON_FOCUSABLE_TAGS.has(tag)) return true;
  const role = value("role")?.replace(/["']/g, "");
  return (
    tabIndex !== undefined ||
    (role !== undefined && INTERACTIVE_ROLE.test(role))
  );
}

function findHits(source: string, file = "inline.tsx"): Hit[] {
  const sourceFile = ts.createSourceFile(
    file,
    source,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TSX
  );
  const declarations = declarationsOf(sourceFile);
  const hits: Hit[] = [];
  const checked = new Set<ts.Node>();
  const visit = (node: ts.Node): void => {
    if (isClassText(node) && node.text.split(/\s+/).includes(OUTLINE_NONE)) {
      const owner = ownerOf(node);
      if (!checked.has(owner.node) && isKeyboardFocusTarget(owner.attribute)) {
        checked.add(owner.node);
        const own = reachableClasses(owner.node, declarations);
        const wrapper = ancestorFocusWithin(owner.attribute, declarations);
        const problem = indicatorProblem(`${own} ${wrapper}`);
        if (problem) hits.push({ file, literal: node.text, problem });
      }
    }
    ts.forEachChild(node, visit);
  };
  visit(sourceFile);
  return hits;
}

// ------------------------------------------------------------------ scan ----

function sourceFiles(root: string): string[] {
  const absolute = path.join(projectRoot, root);
  if (!fs.existsSync(absolute)) return [];
  const walk = (dir: string): string[] =>
    fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
      const file = path.join(dir, entry.name);
      if (entry.isDirectory()) return walk(file);
      return /\.tsx?$/.test(entry.name) ? [file] : [];
    });
  return walk(absolute);
}

const normalize = (literal: string): string =>
  literal.trim().split(/\s+/).join(" ");
const literalHash = (literal: string): string =>
  createHash("sha256").update(normalize(literal)).digest("hex");

const exceptionFor = (hit: Hit): AuditedException | undefined =>
  AUDITED_EXCEPTIONS.find(
    (exception) =>
      exception.file === hit.file &&
      hit.literal.includes(exception.marker) &&
      literalHash(hit.literal) === exception.literalHash
  );

describe("controls that remove the focus outline keep a keyboard indicator", () => {
  const hits = SCAN_ROOTS.flatMap(sourceFiles).flatMap((file) => {
    const source = fs.readFileSync(file, "utf8");
    if (!source.includes(OUTLINE_NONE)) return [];
    const relative = path.relative(projectRoot, file).split(path.sep).join("/");
    return findHits(source, relative);
  });

  it("finds no unaudited focus:tw-outline-none without a 3:1 replacement", () => {
    const unaudited = hits
      .filter((hit) => !exceptionFor(hit))
      .map(({ file, problem, literal }) => ({
        file,
        problem,
        literal: normalize(literal),
        hash: literalHash(literal),
      }));

    expect(unaudited).toEqual([]);
  });

  it("keeps every exception explained and attached to exactly one hit", () => {
    for (const exception of AUDITED_EXCEPTIONS) {
      expect(exception.reason.length).toBeGreaterThan(40);
    }
    const detached = AUDITED_EXCEPTIONS.filter(
      (exception) =>
        hits.filter((hit) => exceptionFor(hit) === exception).length !== 1
    ).map(({ file, marker }) => ({ file, marker }));

    expect(detached).toEqual([]);
  });
});

describe("indicator detection", () => {
  const button = (classes: string) =>
    `const A = () => <button className="${classes}" />;`;

  it("flags a control that only removes the outline", () => {
    expect(findHits(button("tw-p-2 focus:tw-outline-none"))).toEqual([
      expect.objectContaining({ problem: "no focus indicator" }),
    ]);
  });

  it("accepts the sweep pattern and any-modality focus rings", () => {
    expect(
      findHits(
        button(
          "focus:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400"
        )
      )
    ).toEqual([]);
    expect(
      findHits(
        button(
          "focus:tw-outline-none focus:tw-ring-1 focus:tw-ring-primary-400"
        )
      )
    ).toEqual([]);
  });

  it("flags faint rings and Tailwind's default ring colour", () => {
    expect(
      findHits(
        button(
          "focus:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-white/20"
        )
      )
    ).toEqual([
      expect.objectContaining({ problem: expect.stringContaining("faint") }),
    ]);
    expect(
      findHits(button("focus:tw-outline-none focus-visible:tw-ring-2"))
    ).toEqual([
      expect.objectContaining({ problem: expect.stringContaining("default") }),
    ]);
  });

  it("fails explicit ring colours it cannot measure", () => {
    expect(
      findHits(
        button(
          "focus:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-[rgba(255,255,255,0.1)]"
        )
      )
    ).toEqual([
      expect.objectContaining({ problem: expect.stringContaining("faint") }),
    ]);
  });

  it("requires a visible change when the resting ring already matches", () => {
    expect(
      findHits(
        button(
          "tw-ring-1 tw-ring-iron-700 focus:tw-outline-none focus:tw-ring-1"
        )
      )
    ).toEqual([expect.objectContaining({ problem: "no focus indicator" })]);
    expect(
      findHits(
        button(
          "tw-ring-1 tw-ring-iron-700 focus:tw-outline-none focus:tw-ring-primary-400"
        )
      )
    ).toEqual([]);
  });

  it("follows same-file class constants and template interpolations", () => {
    const source = `
      const FOCUS = "focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400";
      const A = () => <button className={\`tw-p-2 focus:tw-outline-none \${FOCUS}\`} />;
    `;
    expect(findHits(source)).toEqual([]);
  });

  it("credits a wrapping focus-within ring and the forms plugin", () => {
    const wrapped = `const A = () => (
      <div className="tw-ring-1 focus-within:tw-ring-2 focus-within:tw-ring-primary-400">
        <input className="tw-border-0 focus:tw-outline-none" />
      </div>
    );`;
    expect(findHits(wrapped)).toEqual([]);
    expect(
      findHits(
        button("tw-form-input tw-ring-1 focus:tw-outline-none focus:tw-ring-1")
      )
    ).toEqual([]);
  });

  it("measures white and other 3-digit theme colours", () => {
    expect(
      findHits(
        button("focus:tw-outline-none focus:tw-ring-2 focus:tw-ring-white")
      )
    ).toEqual([]);
  });

  it("skips elements that never take keyboard focus", () => {
    expect(
      findHits(`const A = () => <div className="focus:tw-outline-none" />;`)
    ).toEqual([]);
    expect(
      findHits(
        `const A = () => <button tabIndex={-1} className="focus:tw-outline-none" />;`
      )
    ).toEqual([]);
    expect(
      findHits(
        `const A = () => <div tabIndex={0} className="focus:tw-outline-none" />;`
      )
    ).toHaveLength(1);
  });
});
