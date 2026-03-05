import type { ApiWave } from "@/generated/models/ApiWave";

interface MarkdownLinkMatch {
  readonly isImage: boolean;
  readonly segmentStart: number;
  readonly labelStart: number;
  readonly labelEnd: number;
  readonly urlStart: number;
  readonly urlEnd: number;
}

const findBalancedParenthesisEnd = (
  input: string,
  startIndex: number
): number | null => {
  let depth = 1;

  for (let cursor = startIndex; cursor < input.length; cursor += 1) {
    const char = input[cursor];
    if (char === "(") {
      depth += 1;
      continue;
    }

    if (char === ")") {
      depth -= 1;
      if (depth === 0) {
        return cursor;
      }
    }
  }

  return null;
};

const parseMarkdownLinkAt = (
  input: string,
  openBracket: number
): MarkdownLinkMatch | null => {
  const closeBracket = input.indexOf("]", openBracket + 1);
  if (closeBracket === -1 || input[closeBracket + 1] !== "(") {
    return null;
  }

  const urlStart = closeBracket + 2;
  const urlEnd = findBalancedParenthesisEnd(input, urlStart);
  if (urlEnd === null) {
    return null;
  }

  const isImage = openBracket > 0 && input[openBracket - 1] === "!";

  return {
    isImage,
    segmentStart: isImage ? openBracket - 1 : openBracket,
    labelStart: openBracket + 1,
    labelEnd: closeBracket,
    urlStart,
    urlEnd,
  };
};

const formatMarkdownLink = (
  label: string,
  url: string,
  isImage: boolean
): string => {
  if (isImage) {
    return url;
  }

  if (label && url) {
    return `${label} (${url})`;
  }

  return label || url;
};

const replaceMarkdownLinks = (input: string): string => {
  let result = "";
  let cursor = 0;

  while (cursor < input.length) {
    const openBracket = input.indexOf("[", cursor);
    if (openBracket === -1) {
      result += input.slice(cursor);
      break;
    }

    const match = parseMarkdownLinkAt(input, openBracket);
    if (!match) {
      result += input.slice(cursor, openBracket + 1);
      cursor = openBracket + 1;
      continue;
    }

    result += input.slice(cursor, match.segmentStart);
    const label = input.slice(match.labelStart, match.labelEnd);
    const url = input.slice(match.urlStart, match.urlEnd);
    result += formatMarkdownLink(label, url, match.isImage);
    cursor = match.urlEnd + 1;
  }

  return result;
};

const markdownToPlainText = (markdown: string): string => {
  const withoutLinks = replaceMarkdownLinks(markdown);

  return withoutLinks
    .replaceAll(/```([\s\S]*?)```/g, "$1")
    .replaceAll(/`([^`]+)`/g, "$1")
    .replaceAll(/(\*\*|__)(.*?)\1/g, "$2")
    .replaceAll(/([*_])(.*?)\1/g, "$2")
    .replaceAll(/~~(.*?)~~/g, "$1")
    .replaceAll(/(^|\n)#{1,6}\s+/g, "$1")
    .replaceAll(/(^|\n)\s*[-*+]\s+/g, "$1")
    .replaceAll(/(^|\n)\s*\d+[.)]\s+/g, "$1")
    .replaceAll(/(^|\n)>\s?/g, "$1")
    .replaceAll(/\s+/g, " ")
    .trim();
};

export const getWaveDescriptionPreviewText = (
  wave: Partial<ApiWave> | null | undefined
): string | null => {
  const rawContent = wave?.description_drop?.parts[0]?.content ?? "";
  const plainText = markdownToPlainText(rawContent);
  return plainText.length > 0 ? plainText : null;
};
