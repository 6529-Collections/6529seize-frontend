import type { ApiWave } from "@/generated/models/ApiWave";

interface MarkdownLinkMatch {
  readonly isImage: boolean;
  readonly segmentStart: number;
  readonly labelStart: number;
  readonly labelEnd: number;
  readonly urlStart: number;
  readonly urlEnd: number;
}

export interface MarkdownToPlainTextOptions {
  readonly includeImageUrls?: boolean;
  readonly includeLinkDestinations?: boolean;
}

const findBalancedDelimiterEnd = (
  input: string,
  startIndex: number,
  openDelimiter: string,
  closeDelimiter: string
): number | null => {
  let depth = 1;

  for (let cursor = startIndex; cursor < input.length; cursor += 1) {
    const char = input[cursor];
    if (char === "\\") {
      cursor += 1;
      continue;
    }

    if (char === openDelimiter) {
      depth += 1;
      continue;
    }

    if (char === closeDelimiter) {
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
  const closeBracket = findBalancedDelimiterEnd(
    input,
    openBracket + 1,
    "[",
    "]"
  );
  if (closeBracket === null || input[closeBracket + 1] !== "(") {
    return null;
  }

  const urlStart = closeBracket + 2;
  const urlEnd = findBalancedDelimiterEnd(input, urlStart, "(", ")");
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
  isImage: boolean,
  options: MarkdownToPlainTextOptions
): string => {
  if (isImage) {
    return options.includeImageUrls === false ? "" : url;
  }

  if (label && url && options.includeLinkDestinations !== false) {
    return `${label} (${url})`;
  }

  return label || (options.includeLinkDestinations === false ? "" : url);
};

const replaceMarkdownLinks = (
  input: string,
  options: MarkdownToPlainTextOptions
): string => {
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
    result += formatMarkdownLink(label, url, match.isImage, options);
    cursor = match.urlEnd + 1;
  }

  return result;
};

export const markdownToPlainText = (
  markdown: string,
  options: MarkdownToPlainTextOptions = {}
): string => {
  const withoutLinks = replaceMarkdownLinks(markdown, options);

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
