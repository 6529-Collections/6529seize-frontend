import type { Plugin } from "unified";

interface MarkdownNode {
  properties?: Record<string, unknown>;
  children?: MarkdownNode[];
}

function scopeLabel(node: MarkdownNode, prefix: string): void {
  const properties = node.properties;
  if (properties?.["id"] === "footnote-label") {
    properties["id"] = `${prefix}footnote-label`;
  }
  const describedBy = properties?.["ariaDescribedBy"];
  if (properties && describedBy === "footnote-label") {
    properties["ariaDescribedBy"] = `${prefix}footnote-label`;
  }
  if (properties && Array.isArray(describedBy)) {
    properties["ariaDescribedBy"] = describedBy.map((id: unknown) =>
      id === "footnote-label" ? `${prefix}footnote-label` : id
    );
  }
  node.children?.forEach((child) => scopeLabel(child, prefix));
}

/** remark scopes note/reference IDs, but leaves its heading label unscoped. */
export const rehypeScopeFootnoteLabel: Plugin<[string]> = (prefix) => (tree) =>
  scopeLabel(tree as MarkdownNode, prefix);
