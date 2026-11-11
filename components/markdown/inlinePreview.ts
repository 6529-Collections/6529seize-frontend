import type { ExtraProps } from "react-markdown";
import type { Plugin } from "unified";

type Element = NonNullable<ExtraProps["node"]>;
type Content = Element["children"][number];
interface Root {
  type: "root";
  children: Content[];
}

const INLINE_TAGS = new Set(["strong", "em", "del", "code", "span"]);
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
  "th",
  "td",
]);
const MAX_CHARACTERS = 120;
const space = (): Content => ({ type: "text", value: " " });

function flatten(node: Content, imageLabel: string): Content[] {
  if (node.type === "text") return [node];
  if (node.type !== "element") return [];
  // Footnote definitions and reference controls do not belong in a chat row.
  if (node.properties["dataFootnotes"] !== undefined || node.tagName === "sup")
    return [];
  if (node.tagName === "img") {
    const alt = node.properties["alt"];
    return [
      {
        type: "text",
        value:
          typeof alt === "string" && alt.trim().length > 0 ? alt : imageLabel,
      },
    ];
  }
  if (node.tagName === "input") {
    return [
      {
        type: "text",
        value: node.properties["checked"] === true ? "☑ " : "☐ ",
      },
    ];
  }
  if (node.tagName === "br" || node.tagName === "hr") return [space()];
  const children = node.children.flatMap((child) => flatten(child, imageLabel));
  if (INLINE_TAGS.has(node.tagName)) {
    return [{ ...node, properties: {}, children }];
  }
  return BLOCK_TAGS.has(node.tagName) ? [...children, space()] : children;
}

interface Budget {
  remaining: number;
  whitespace: boolean;
  stopped: boolean;
}

function shortenText(value: string, budget: Budget): string {
  let text = value.replaceAll(/\s+/gu, " ");
  if (budget.whitespace) text = text.trimStart();
  if (text.length === 0) return "";
  if (Array.from(text.trimEnd()).length > budget.remaining) {
    budget.stopped = true;
    return `${Array.from(text).slice(0, budget.remaining).join("").trimEnd()}…`;
  }
  if (Array.from(text).length > budget.remaining) text = text.trimEnd();
  budget.remaining -= Array.from(text).length;
  budget.whitespace = text.endsWith(" ");
  return text;
}

function shorten(nodes: Content[], budget: Budget): Content[] {
  const result: Content[] = [];
  for (const node of nodes) {
    if (budget.stopped) break;
    if (node.type === "text") {
      node.value = shortenText(node.value, budget);
    } else if (node.type === "element") {
      node.children = shorten(node.children, budget);
    }
    result.push(node);
  }
  return result;
}

/** Parse and sanitize first, then keep a bounded, non-interactive inline tree. */
export const rehypeInlinePreview: Plugin<[string], Root> =
  (imageLabel) => (tree) => {
    tree.children = shorten(
      tree.children.flatMap((node) => flatten(node, imageLabel)),
      { remaining: MAX_CHARACTERS, whitespace: true, stopped: false }
    );
  };
