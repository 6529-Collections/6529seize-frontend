import type { Plugin } from "unified";

export const PARENTHESIZED_ORDERED_LIST_CLASS_NAME =
  "drop-markdown-ordered-list-paren";

const ORDERED_LIST_MARKER_PATTERN = /^[\t ]*\d{1,9}([.)])(?:[\t ]+|$)/;

interface MarkdownHastNode {
  readonly type?: unknown;
  readonly tagName?: unknown;
  readonly position?: {
    readonly start?: {
      readonly offset?: number | undefined;
    };
  };
  properties?: Record<string, unknown> | undefined;
  readonly children?: readonly MarkdownHastNode[] | undefined;
}

const normalizeClassNames = (className: unknown): string[] => {
  if (typeof className === "string") {
    return className.split(/\s+/).filter(Boolean);
  }

  if (!Array.isArray(className)) {
    return [];
  }

  return className.filter(
    (value: unknown): value is string => typeof value === "string"
  );
};

const addParenthesizedListClass = (node: MarkdownHastNode): void => {
  const properties = node.properties ?? {};
  const classNames = normalizeClassNames(properties["className"]);

  if (!classNames.includes(PARENTHESIZED_ORDERED_LIST_CLASS_NAME)) {
    classNames.push(PARENTHESIZED_ORDERED_LIST_CLASS_NAME);
  }

  node.properties = {
    ...properties,
    className: classNames,
  };
};

const preserveOrderedListDelimiter = (
  node: MarkdownHastNode,
  source: string
): void => {
  if (node.type === "element" && node.tagName === "ol") {
    const offset = node.position?.start?.offset;
    if (typeof offset === "number") {
      const marker = ORDERED_LIST_MARKER_PATTERN.exec(source.slice(offset));
      if (marker?.[1] === ")") {
        addParenthesizedListClass(node);
      }
    }
  }

  node.children?.forEach((child) => {
    preserveOrderedListDelimiter(child, source);
  });
};

export const rehypePreserveOrderedListDelimiter: Plugin = () => {
  return (tree, file) => {
    preserveOrderedListDelimiter(tree as MarkdownHastNode, String(file.value));
  };
};
