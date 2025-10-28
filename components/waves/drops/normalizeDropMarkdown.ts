import {
  $convertToMarkdownString,
  type Transformer,
} from "@lexical/markdown";
import {
  $isLineBreakNode,
  $isParagraphNode,
  $isTextNode,
  type EditorState,
  type LexicalNode,
} from "lexical";

const ZERO_WIDTH_SPACE_REGEX = /\u200B/g;
const BLANK_PARAGRAPH_MARKER = "__BLANK_PARAGRAPH__";
const SENTINEL_BOUNDARY = "\u2063";
const BLANK_PARAGRAPH_SENTINEL = `${SENTINEL_BOUNDARY}${BLANK_PARAGRAPH_MARKER}${SENTINEL_BOUNDARY}`;
const BLANK_RUN_REGEX = new RegExp(
  `(?:${BLANK_PARAGRAPH_SENTINEL}\\n\\n)+`,
  "g"
);
const BLANK_PARAGRAPH_TOKEN_REGEX = new RegExp(
  `${BLANK_PARAGRAPH_SENTINEL}(\\n?)`,
  "g"
);

const isBlankParagraph = (node: LexicalNode): boolean => {
  if (!$isParagraphNode(node)) {
    return false;
  }

  const children = node.getChildren();
  if (children.length === 0) {
    return true;
  }

  return children.every((child) => {
    if ($isLineBreakNode(child)) {
      return true;
    }

    if ($isTextNode(child)) {
      const text = child
        .getTextContent()
        .replaceAll(ZERO_WIDTH_SPACE_REGEX, "")
        .trim();
      return text.length === 0;
    }

    return false;
  });
};

const blankParagraphTransformer: Transformer = {
  type: "element",
  dependencies: [],
  export: (node) => (isBlankParagraph(node) ? BLANK_PARAGRAPH_SENTINEL : null),
  regExp: /(?:)/,
  replace: () => {},
};

const normalizeLineEndings = (markdown: string): string =>
  markdown.replaceAll(/\r\n/g, "\n");

const collapseBlankParagraphMarkers = (markdown: string): string => {
  if (!markdown) {
    return markdown;
  }

  const collapsedRuns = markdown.replaceAll(BLANK_RUN_REGEX, (match) => {
    const markerCount = match.split(BLANK_PARAGRAPH_SENTINEL).length - 1;
    return "\n".repeat(markerCount);
  });

  return collapsedRuns.replaceAll(
    BLANK_PARAGRAPH_TOKEN_REGEX,
    (_match, trailingNewline: string) => `\n${trailingNewline}`
  );
};

export const exportDropMarkdown = (
  editorState: EditorState,
  transformers: Transformer[]
): string => {
  const rawMarkdown = editorState.read(() =>
    $convertToMarkdownString([blankParagraphTransformer, ...transformers])
  );

  return normalizeLineEndings(collapseBlankParagraphMarkers(rawMarkdown));
};

export const normalizeDropMarkdown = (markdown: string): string => {
  if (!markdown) {
    return markdown;
  }

  return normalizeLineEndings(markdown);
};
