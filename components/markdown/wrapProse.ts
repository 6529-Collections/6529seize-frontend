import type { Plugin } from "unified";

interface TextTree {
  type: string;
  tagName?: string;
  value?: string;
  properties?: Record<string, unknown>;
  children?: TextTree[];
}

/** Decorate only prose. Code and link labels must never become mentions or emoji components. */
function wrapProse(node: TextTree): void {
  if (!node.children || ["code", "pre", "a"].includes(node.tagName ?? ""))
    return;
  node.children = node.children.map((child) => {
    if (child.type === "text" && child.value?.trim()) {
      return {
        type: "element",
        tagName: "span",
        properties: {},
        children: [child],
      };
    }
    wrapProse(child);
    return child;
  });
}

export const rehypeWrapMarkdownProse: Plugin = () => (tree) =>
  wrapProse(tree as TextTree);
