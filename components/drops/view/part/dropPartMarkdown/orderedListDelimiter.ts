import type { Plugin } from "unified";

export const PARENTHESIZED_ORDERED_LIST_CLASS_NAME =
  "drop-markdown-ordered-list-paren";

const ORDERED_LIST_MARKER_PATTERN = /^[\t ]*\d{1,9}([.)])(?:[\t ]+|$)/;

interface MarkdownAstNode {
  readonly type?: unknown;
  readonly ordered?: unknown;
  readonly position?: {
    readonly start?: {
      readonly offset?: number | undefined;
    };
  };
  data?: {
    hProperties?: Record<string, unknown> | undefined;
  };
  readonly children?: readonly MarkdownAstNode[] | undefined;
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

const addParenthesizedListClass = (node: MarkdownAstNode): void => {
  const hProperties = node.data?.hProperties ?? {};
  const classNames = normalizeClassNames(hProperties["className"]);

  if (!classNames.includes(PARENTHESIZED_ORDERED_LIST_CLASS_NAME)) {
    classNames.push(PARENTHESIZED_ORDERED_LIST_CLASS_NAME);
  }

  node.data = {
    ...node.data,
    hProperties: {
      ...hProperties,
      className: classNames,
    },
  };
};

const preserveOrderedListDelimiter = (
  node: MarkdownAstNode,
  source: string
): void => {
  if (node.type === "list" && node.ordered === true) {
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

export const remarkPreserveOrderedListDelimiter: Plugin = () => {
  return (tree, file) => {
    preserveOrderedListDelimiter(tree as MarkdownAstNode, String(file.value));
  };
};
