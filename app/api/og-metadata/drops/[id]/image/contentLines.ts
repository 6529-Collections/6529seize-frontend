import type { ApiOgMetadataDrop } from "@/generated/models/ApiOgMetadataDrop";
import { getUsableText } from "@/app/api/og-metadata/_lib/imageUtils";
import {
  ATTACHMENT_GROUP_TOP_MARGIN,
  ATTACHMENT_ROW_TOP_MARGIN,
  CANVAS_HEIGHT,
  CONTENT_FONT_SIZE,
  CONTENT_LINE_HEIGHT,
  CONTENT_REFERENCE_PATTERN,
  CONTENT_TOP,
  FILE_TEXT,
  LINK_DISPLAY_MAX_LINES,
  LINK_TEXT,
  MEDIA_BOTTOM_MARGIN,
  MUTED_TEXT,
  VIDEO_TEXT,
} from "./constants";
import {
  addHardWrappedTokenLines,
  addTrailingContentEllipsis,
  fitsContentLine,
  getDisplayLinkText,
  isUrlToken,
} from "./textMetrics";
import type {
  DropContentLine,
  DropContentLineKind,
  DropContentLineSegment,
  DropContentWord,
} from "./types";

const getNonBlankContentLineCount = (
  contentLines: readonly DropContentLine[]
): number => contentLines.filter((line) => line.text !== "").length;

const getContentLineColor = (kind: DropContentLineKind): string => {
  if (kind === "link") {
    return LINK_TEXT;
  }

  if (kind === "video") {
    return VIDEO_TEXT;
  }

  if (kind === "file") {
    return FILE_TEXT;
  }

  if (kind === "attachment-summary") {
    return MUTED_TEXT;
  }

  return "#ffffff";
};

const isAttachmentLine = (line: DropContentLine): boolean =>
  line.kind === "video" ||
  line.kind === "file" ||
  line.kind === "attachment-summary";

const shouldSeparateAttachmentLine = (
  currentLine: DropContentLine,
  previousLine: DropContentLine | undefined
): boolean =>
  isAttachmentLine(currentLine) &&
  previousLine !== undefined &&
  !isAttachmentLine(previousLine);

const getAttachmentLineTopMargin = (
  currentLine: DropContentLine,
  previousLine: DropContentLine | undefined
): number => {
  if (shouldSeparateAttachmentLine(currentLine, previousLine)) {
    return ATTACHMENT_GROUP_TOP_MARGIN;
  }

  if (
    isAttachmentLine(currentLine) &&
    previousLine !== undefined &&
    isAttachmentLine(previousLine)
  ) {
    return ATTACHMENT_ROW_TOP_MARGIN;
  }

  return 0;
};

const getDropText = (
  drop: ApiOgMetadataDrop | undefined,
  id: string
): string => {
  const content = getUsableText(drop?.content);
  if (content) {
    return content;
  }

  return (
    getUsableText(drop?.description) ??
    getUsableText(drop?.title) ??
    `Drop #${drop?.serial_no ?? id}`
  );
};

type ContentLineBuildContext = {
  lines: DropContentLine[];
  currentLine: string;
  currentSegments: DropContentLineSegment[];
  readonly maxLines: number;
};

const hasReferenceSegment = (
  segments: readonly DropContentLineSegment[]
): boolean => segments.some((segment) => segment.kind === "reference");

const flushCurrentContentLine = (context: ContentLineBuildContext): void => {
  if (!context.currentLine || context.lines.length >= context.maxLines) {
    return;
  }

  context.lines.push(
    hasReferenceSegment(context.currentSegments)
      ? {
          kind: "text",
          segments: context.currentSegments,
          text: context.currentLine,
        }
      : {
          kind: "text",
          text: context.currentLine,
        }
  );
  context.currentLine = "";
  context.currentSegments = [];
};

const addEllipsisIfMoreWordsRemain = ({
  context,
  index,
  words,
}: {
  readonly context: ContentLineBuildContext;
  readonly index: number;
  readonly words: readonly DropContentWord[];
}): void => {
  if (context.lines.length === context.maxLines && index < words.length - 1) {
    addTrailingContentEllipsis(context.lines);
  }
};

const appendUrlContentLine = ({
  context,
  index,
  word,
  words,
}: {
  readonly context: ContentLineBuildContext;
  readonly index: number;
  readonly word: string;
  readonly words: readonly DropContentWord[];
}): void => {
  flushCurrentContentLine(context);
  addHardWrappedTokenLines({
    lines: context.lines,
    token: getDisplayLinkText(word),
    kind: "link",
    maxLines: Math.min(
      context.maxLines,
      context.lines.length + LINK_DISPLAY_MAX_LINES
    ),
  });
  addEllipsisIfMoreWordsRemain({ context, index, words });
};

const appendLongContentWord = ({
  context,
  index,
  word,
  words,
}: {
  readonly context: ContentLineBuildContext;
  readonly index: number;
  readonly word: DropContentWord;
  readonly words: readonly DropContentWord[];
}): void => {
  addHardWrappedTokenLines({
    lines: context.lines,
    token: word.text,
    kind: "text",
    segmentKind: word.kind,
    maxLines: context.maxLines,
  });
  addEllipsisIfMoreWordsRemain({ context, index, words });
};

const appendCurrentContentWord = (
  context: ContentLineBuildContext,
  word: DropContentWord
): void => {
  if (context.currentLine) {
    context.currentLine = `${context.currentLine} ${word.text}`;
    context.currentSegments.push({ kind: "text", text: " " });
  } else {
    context.currentLine = word.text;
  }

  context.currentSegments.push(word);
};

const appendTextContentLine = ({
  context,
  index,
  word,
  words,
}: {
  readonly context: ContentLineBuildContext;
  readonly index: number;
  readonly word: DropContentWord;
  readonly words: readonly DropContentWord[];
}): void => {
  const nextLine = context.currentLine
    ? `${context.currentLine} ${word.text}`
    : word.text;
  if (fitsContentLine(nextLine)) {
    appendCurrentContentWord(context, word);
    return;
  }

  flushCurrentContentLine(context);
  if (fitsContentLine(word.text)) {
    appendCurrentContentWord(context, word);
    return;
  }

  appendLongContentWord({ context, index, word, words });
};

const getNormalizedContentParagraph = (value: string): string =>
  value.replace(/[^\S\r\n]+/g, " ").trim();

const getContentParagraphs = (value: string): readonly string[] =>
  value.split(/\r\n|\n|\r/);

const getTextContentWords = (value: string): readonly DropContentWord[] =>
  value
    .split(" ")
    .filter(Boolean)
    .map((text) => ({ kind: "text" as const, text }));

const getReferenceContentWord = (
  marker: string,
  label: string
): DropContentWord | null => {
  const text = getUsableText(label)?.replace(/\s+/g, " ");
  return text ? { kind: "reference", text: `${marker}${text}` } : null;
};

const getContentWords = (paragraph: string): readonly DropContentWord[] => {
  const words: DropContentWord[] = [];
  let lastIndex = 0;

  for (const match of paragraph.matchAll(CONTENT_REFERENCE_PATTERN)) {
    const matchIndex = match.index ?? 0;
    words.push(...getTextContentWords(paragraph.slice(lastIndex, matchIndex)));

    const marker = match[1];
    const label = match[2];
    const referenceWord =
      marker && label ? getReferenceContentWord(marker, label) : null;
    if (referenceWord) {
      words.push(referenceWord);
    }

    lastIndex = matchIndex + match[0].length;
  }

  words.push(...getTextContentWords(paragraph.slice(lastIndex)));
  return words;
};

const hasRemainingContentParagraph = ({
  paragraphs,
  paragraphIndex,
}: {
  readonly paragraphs: readonly string[];
  readonly paragraphIndex: number;
}): boolean =>
  paragraphs
    .slice(paragraphIndex + 1)
    .some((paragraph) => getNormalizedContentParagraph(paragraph).length > 0);

const addBlankContentLine = (context: ContentLineBuildContext): void => {
  flushCurrentContentLine(context);
  if (context.lines.length >= context.maxLines || context.lines.length === 0) {
    return;
  }

  context.lines.push({ kind: "text", text: "" });
};

const appendContentParagraph = ({
  context,
  paragraph,
}: {
  readonly context: ContentLineBuildContext;
  readonly paragraph: string;
}): void => {
  const words = getContentWords(paragraph);

  for (const [index, word] of words.entries()) {
    if (context.lines.length === context.maxLines) {
      addTrailingContentEllipsis(context.lines);
      break;
    }

    if (word.kind === "text" && isUrlToken(word.text)) {
      appendUrlContentLine({ context, index, word: word.text, words });
      continue;
    }

    appendTextContentLine({ context, index, word, words });
  }
};

const getContentLines = ({
  value,
  maxLines,
}: {
  readonly value: string;
  readonly maxLines: number;
}): readonly DropContentLine[] => {
  const content = getUsableText(value);
  if (!content) {
    return [];
  }

  const context: ContentLineBuildContext = {
    lines: [],
    currentLine: "",
    currentSegments: [],
    maxLines,
  };

  const paragraphs = getContentParagraphs(content);
  for (const [paragraphIndex, paragraph] of paragraphs.entries()) {
    if (context.lines.length === maxLines) {
      addTrailingContentEllipsis(context.lines);
      break;
    }

    const normalizedParagraph = getNormalizedContentParagraph(paragraph);
    if (!normalizedParagraph) {
      const hasRemainingContent = hasRemainingContentParagraph({
        paragraphs,
        paragraphIndex,
      });
      if (context.lines.length === maxLines - 1 && hasRemainingContent) {
        addTrailingContentEllipsis(context.lines);
        break;
      }

      addBlankContentLine(context);
      continue;
    }

    appendContentParagraph({
      context,
      paragraph: normalizedParagraph,
    });
    flushCurrentContentLine(context);

    if (
      context.lines.length === maxLines &&
      hasRemainingContentParagraph({ paragraphs, paragraphIndex })
    ) {
      addTrailingContentEllipsis(context.lines);
      break;
    }
  }

  flushCurrentContentLine(context);
  return context.lines;
};

const getContentTop = ({
  lineCount,
  showMedia,
}: {
  readonly lineCount: number;
  readonly showMedia: boolean;
}): number => {
  if (showMedia || lineCount === 0) {
    return CONTENT_TOP;
  }

  const contentHeight = lineCount * CONTENT_FONT_SIZE * CONTENT_LINE_HEIGHT;
  const availableHeight = CANVAS_HEIGHT - MEDIA_BOTTOM_MARGIN - CONTENT_TOP;

  return CONTENT_TOP + Math.max(0, (availableHeight - contentHeight) / 2);
};

export {
  getAttachmentLineTopMargin,
  getContentLineColor,
  getContentLines,
  getContentTop,
  getDropText,
  getNonBlankContentLineCount,
  isAttachmentLine,
};
