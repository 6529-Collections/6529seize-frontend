import type { ExtraProps } from "react-markdown";
import type { Plugin } from "unified";
import { LONG_DROP_PREVIEW_CHARACTER_LIMIT } from "@/helpers/waves/dropContentPreview";

type Element = NonNullable<ExtraProps["node"]>;
type RootContent = Element["children"][number];
type Text = Extract<RootContent, { type: "text" }>;
interface Root {
  type: "root";
  children: RootContent[];
}

const PREVIEW_LINES = 10;
const BLOCK_TAGS = new Set([
  "p",
  "li",
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "pre",
  "tr",
]);
// Keep link labels, destinations and source positions together. The renderer
// uses them to distinguish ordinary links from media and embedded-drop cards.
const ATOMIC_TAGS = new Set(["a", "img", "input", "hr", "tr"]);
const STRUCTURAL_TAGS = new Set([
  "ul",
  "ol",
  "li",
  "blockquote",
  "table",
  "thead",
  "tbody",
  "tfoot",
]);

interface PreviewBudget {
  characters: number;
  lines: number;
  stopped: boolean;
}

function textLength(node: RootContent): number {
  if (node.type === "text") return node.value.length;
  return "children" in node
    ? node.children.reduce((sum, child) => sum + textLength(child), 0)
    : 0;
}

function shortenText(node: Text, budget: PreviewBudget): void {
  // Do not split mentions (which can contain spaces), emoji shortcodes or
  // words. Whitespace stays intact, including authored line breaks.
  const tokens = node.value.match(/[@#$]\[[^\]]*\]|\s+|[^\s]+/gu) ?? [];
  let result = "";
  for (const token of tokens) {
    const lines = (token.match(/\n/g) ?? []).length;
    if (budget.characters <= 0 || budget.lines - lines < 0) {
      budget.stopped = true;
      break;
    }
    result += token;
    budget.characters -= token.length;
    budget.lines -= lines;
  }
  node.value = budget.stopped ? `${result.trimEnd()}…` : result;
}

function shortenElement(node: Element, budget: PreviewBudget): void {
  if (node.tagName === "br") {
    budget.lines -= 1;
  } else if (ATOMIC_TAGS.has(node.tagName)) {
    budget.characters -= textLength(node);
  } else {
    node.children = shortenChildren(
      node.children,
      budget,
      STRUCTURAL_TAGS.has(node.tagName)
    );
  }
  if (
    BLOCK_TAGS.has(node.tagName) &&
    !node.children.some(
      (child) => child.type === "element" && BLOCK_TAGS.has(child.tagName)
    )
  )
    budget.lines -= 1;
}

function shortenChildren<T extends RootContent>(
  nodes: T[],
  budget: PreviewBudget,
  structuralWhitespace = false
): T[] {
  const children: T[] = [];
  for (const child of nodes) {
    if (budget.stopped || budget.characters <= 0 || budget.lines <= 0) {
      budget.stopped = true;
      break;
    }
    // Newlines between block nodes are HTML formatting, not authored lines.
    if (child.type === "text" && !(structuralWhitespace && !child.value.trim()))
      shortenText(child, budget);
    if (child.type === "element") shortenElement(child, budget);
    children.push(child);
  }
  return children;
}

/** Shorten the sanitized tree, retaining the original Markdown structure. */
export const rehypeDropPreview: Plugin<[], Root> = () => (tree) => {
  tree.children = shortenChildren(
    tree.children,
    {
      characters: LONG_DROP_PREVIEW_CHARACTER_LIMIT,
      lines: PREVIEW_LINES,
      stopped: false,
    },
    true
  );
};
