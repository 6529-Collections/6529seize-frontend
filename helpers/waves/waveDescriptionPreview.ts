import { publicEnv } from "@/config/env";
import type { ApiWave } from "@/generated/models/ApiWave";
import {
  parseSeizeDropLink,
  parseSeizeQuoteLink,
  parseSeizeWaveLink,
} from "@/helpers/SeizeLinkParser";

const DEFAULT_MEDIA_CDN_ORIGIN = "https://d3lqz0a4bldqgf.cloudfront.net";
const MEDIA_PATH_EXTENSION_REGEX =
  /\.(?:avif|gif|jpe?g|m4v|mov|mp4|png|svg|webm|webp)$/i;
const BARE_URL_REGEX = /https?:\/\/[^\s<>"'`]+/gi;
// Sentence punctuation and closing markdown delimiters that can follow a URL.
const URL_TRAILING_CHARACTERS = new Set([
  ".",
  ",",
  "!",
  "?",
  ";",
  ":",
  ")",
  "]",
  "*",
  "_",
  "~",
]);
const NON_CLOSING_DELIMITER_REGEX = /[^)\]*_~]/g;

interface MarkdownLinkMatch {
  readonly isImage: boolean;
  readonly segmentStart: number;
  readonly labelStart: number;
  readonly labelEnd: number;
  readonly urlStart: number;
  readonly urlEnd: number;
}

interface MarkdownToPlainTextOptions {
  readonly includeImageUrls?: boolean;
  readonly includeLinkDestinations?: boolean;
  /** Drops matching bare URLs and link destinations from the text. */
  readonly omitUrl?: ((url: string) => boolean) | undefined;
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
  const includeUrl = !options.omitUrl?.(url);

  if (isImage) {
    return options.includeImageUrls === false || !includeUrl ? "" : url;
  }

  const includeDestination =
    includeUrl && options.includeLinkDestinations !== false;

  if (label && url && includeDestination) {
    return `${label} (${url})`;
  }

  return label || (includeDestination ? url : "");
};

const omitBareUrls = (
  text: string,
  options: MarkdownToPlainTextOptions
): string => {
  const { omitUrl } = options;
  if (!omitUrl) {
    return text;
  }

  return text.replaceAll(BARE_URL_REGEX, (match) => {
    let urlEnd = match.length;
    while (
      urlEnd > 0 &&
      URL_TRAILING_CHARACTERS.has(match.charAt(urlEnd - 1))
    ) {
      urlEnd -= 1;
    }
    const url = match.slice(0, urlEnd);
    // Keep closing brackets and emphasis markers so their openers still pair.
    return omitUrl(url)
      ? match.slice(urlEnd).replaceAll(NON_CLOSING_DELIMITER_REGEX, "")
      : match;
  });
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
      result += omitBareUrls(input.slice(cursor), options);
      break;
    }

    const match = parseMarkdownLinkAt(input, openBracket);
    if (!match) {
      result += omitBareUrls(input.slice(cursor, openBracket + 1), options);
      cursor = openBracket + 1;
      continue;
    }

    result += omitBareUrls(input.slice(cursor, match.segmentStart), options);
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

const isMediaCdnOrigin = (origin: string): boolean => {
  if (origin === DEFAULT_MEDIA_CDN_ORIGIN) {
    return true;
  }

  try {
    return (
      origin === new URL(publicEnv.NEXT_PUBLIC_CLOUDFRONT_DOMAIN ?? "").origin
    );
  } catch {
    return false;
  }
};

// Media and 6529 wave/drop links render as embeds in the full description, so
// as preview text they would only show a raw URL.
const isEmbeddedContentUrl = (href: string): boolean => {
  let url: URL;
  try {
    url = new URL(href);
  } catch {
    return false;
  }

  return (
    isMediaCdnOrigin(url.origin) ||
    MEDIA_PATH_EXTENSION_REGEX.test(url.pathname) ||
    parseSeizeQuoteLink(href) !== null ||
    parseSeizeDropLink(href) !== null ||
    parseSeizeWaveLink(href) !== null
  );
};

export const getWaveDescriptionPreviewText = (
  wave: Partial<ApiWave> | null | undefined
): string | null => {
  const rawContent = wave?.description_drop?.parts[0]?.content ?? "";
  const plainText = markdownToPlainText(rawContent, {
    includeImageUrls: false,
    omitUrl: isEmbeddedContentUrl,
  });
  return plainText.length > 0 ? plainText : null;
};
