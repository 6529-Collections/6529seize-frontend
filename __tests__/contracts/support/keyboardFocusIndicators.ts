/**
 * Shared detection for the keyboard focus indicator contract.
 *
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
 * This is the same detection that batch 1 of the focus-visible sweep carries
 * inline in `keyboard-focus-indicators.test.ts`. Once both land, the two
 * contract tests can be merged onto this helper.
 */
import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import resolveConfig from "tailwindcss/resolveConfig";
import ts from "typescript";
import tailwindConfig from "@/tailwind.config";

const projectRoot = path.resolve(__dirname, "../../..");
/** Class tokens that remove the browser focus outline. */
export const OUTLINE_REMOVALS: readonly string[] = [
  "focus:tw-outline-none",
  "focus:!tw-outline-none",
];

const removesOutline = (
  classes: string,
  removals: readonly string[]
): boolean => classes.split(/\s+/).some((token) => removals.includes(token));
const MIN_CONTRAST = 3;

export interface AuditedException {
  readonly file: string;
  readonly marker: string;
  readonly literalHash: string;
  readonly reason: string;
}

export interface FocusIndicatorHit {
  readonly file: string;
  readonly literal: string;
  readonly problem: string;
}

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
export function indicatorProblem(classes: string): string | null {
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
  // @tailwindcss/forms recolours the ring and border on :focus, unless the
  // class list names its own focus ring colour (measured above).
  if (forms && !ringZero && ringColors.length === 0) {
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
  const visible = candidates.some(
    (c) =>
      c === "unknown" || (contrastOnSurface(c) ?? MIN_CONTRAST) >= MIN_CONTRAST
  );
  return visible
    ? null
    : `faint indicator (${candidates.join(", ")} below ${MIN_CONTRAST}:1 on iron-950)`;
}

// ---------------------------------------------------------- class lists ----

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

const FOCUS_WITHIN_PREFIX = /^(?:focus-within|has-\[:focus-visible\]):/;

/**
 * `focus-within:` and `has-[:focus-visible]:` indicators that wrapping JSX
 * elements draw for a control, rewritten as plain `focus:` utilities.
 */
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
      const within = FOCUS_WITHIN_PREFIX.exec(token);
      if (within) parts.push(`focus:${token.slice(within[0].length)}`);
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

/**
 * The `className` attributes in the same file that use a module-level class
 * constant. A constant's own class list cannot show whether the element that
 * wears it adds a ring or sits inside a `focus-within:` wrapper.
 */
function consumersOf(
  owner: ClassOwner,
  sourceFile: ts.SourceFile
): ts.JsxAttribute[] {
  const declaration = owner.node.parent;
  if (!ts.isVariableDeclaration(declaration)) return [];
  if (!ts.isIdentifier(declaration.name)) return [];
  const name = declaration.name.text;
  const consumers: ts.JsxAttribute[] = [];
  const usesName = (node: ts.Node): boolean =>
    (ts.isIdentifier(node) && node.text === name) ||
    ts.forEachChild(node, usesName) === true;
  const visit = (node: ts.Node): void => {
    if (
      ts.isJsxAttribute(node) &&
      node.name.getText() === "className" &&
      node.initializer &&
      usesName(node.initializer)
    ) {
      consumers.push(node);
    }
    ts.forEachChild(node, visit);
  };
  visit(sourceFile);
  return consumers;
}

/** Indicator problem of the element a `className` attribute styles, if it can be focused. */
function attributeProblem(
  attribute: ts.JsxAttribute,
  classes: ts.Node,
  declarations: Map<string, ts.Node[]>
): string | null {
  if (!isKeyboardFocusTarget(attribute)) return null;
  const own = reachableClasses(classes, declarations);
  const wrapper = ancestorFocusWithin(attribute, declarations);
  return indicatorProblem(`${own} ${wrapper}`);
}

/** Why a class list lacks a keyboard indicator on an element wearing it, or null. */
function ownerProblem(
  owner: ClassOwner,
  sourceFile: ts.SourceFile,
  declarations: Map<string, ts.Node[]>
): string | null {
  if (owner.attribute) {
    return attributeProblem(owner.attribute, owner.node, declarations);
  }
  const consumers = consumersOf(owner, sourceFile);
  if (consumers.length === 0) {
    return indicatorProblem(reachableClasses(owner.node, declarations));
  }
  for (const attribute of consumers) {
    const classes = attribute.initializer ?? owner.node;
    const problem = attributeProblem(attribute, classes, declarations);
    if (problem) return problem;
  }
  return null;
}

/** Every `focus:tw-outline-none` class list in a source file that lacks a 3:1 indicator. */
export function findHits(
  source: string,
  file = "inline.tsx",
  removals: readonly string[] = OUTLINE_REMOVALS
): FocusIndicatorHit[] {
  const sourceFile = ts.createSourceFile(
    file,
    source,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TSX
  );
  const declarations = declarationsOf(sourceFile);
  const hits: FocusIndicatorHit[] = [];
  const checked = new Set<ts.Node>();
  const visit = (node: ts.Node): void => {
    if (isClassText(node) && removesOutline(node.text, removals)) {
      const owner = ownerOf(node);
      if (!checked.has(owner.node)) {
        checked.add(owner.node);
        const problem = ownerProblem(owner, sourceFile, declarations);
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

/**
 * Hits across the given directories (relative to the project root), skipping
 * any file under an excluded directory prefix.
 */
export function scanHits(
  roots: readonly string[],
  excludedPrefixes: readonly string[] = [],
  removals: readonly string[] = OUTLINE_REMOVALS
): FocusIndicatorHit[] {
  return roots.flatMap(sourceFiles).flatMap((file) => {
    const relative = path.relative(projectRoot, file).split(path.sep).join("/");
    if (excludedPrefixes.some((prefix) => relative.startsWith(prefix))) {
      return [];
    }
    const source = fs.readFileSync(file, "utf8");
    if (!removals.some((token) => source.includes(token))) return [];
    return findHits(source, relative, removals);
  });
}

export const normalize = (literal: string): string =>
  literal.trim().split(/\s+/).join(" ");

export const literalHash = (literal: string): string =>
  createHash("sha256").update(normalize(literal)).digest("hex");

export const exceptionFor = (
  hit: FocusIndicatorHit,
  exceptions: readonly AuditedException[]
): AuditedException | undefined =>
  exceptions.find(
    (exception) =>
      exception.file === hit.file &&
      hit.literal.includes(exception.marker) &&
      literalHash(hit.literal) === exception.literalHash
  );
