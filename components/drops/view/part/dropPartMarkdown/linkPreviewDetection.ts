import { ensureStableSeizeLink } from "@/helpers/SeizeLinkParser";

import {
  isDirectImageUrl,
  parseUrl,
  shouldUseOpenGraphPreview,
} from "./linkUtils";

const RAW_URL_REGEX = /\b(?:https?:\/\/|www\.)[^\s<>"'`]+/gi;

const stripMarkdownCode = (content: string): string =>
  content
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/~~~[\s\S]*?~~~/g, " ")
    .replace(/`[^`\n]*(?:`|$)/g, " ");

const trimTrailingUrlPunctuation = (href: string): string => {
  let trimmed = href.trim();

  while (/[.,!?;:'"\]]$/.test(trimmed)) {
    trimmed = trimmed.slice(0, -1);
  }

  while (
    trimmed.endsWith(")") &&
    (trimmed.match(/\)/g)?.length ?? 0) > (trimmed.match(/\(/g)?.length ?? 0)
  ) {
    trimmed = trimmed.slice(0, -1);
  }

  return trimmed;
};

const normalizeHrefCandidate = (href: string): string => {
  const withoutAngles =
    href.startsWith("<") && href.endsWith(">") ? href.slice(1, -1) : href;
  const trimmed = trimTrailingUrlPunctuation(withoutAngles);

  if (/^www\./i.test(trimmed)) {
    return `https://${trimmed}`;
  }

  return trimmed;
};

const isOpenGraphPreviewHref = (href: string): boolean => {
  const normalizedHref = normalizeHrefCandidate(href);
  if (!normalizedHref) {
    return false;
  }

  const stableHref = ensureStableSeizeLink(normalizedHref);
  const parsedUrl = parseUrl(stableHref);

  if (isDirectImageUrl(stableHref, parsedUrl)) {
    return false;
  }

  return shouldUseOpenGraphPreview(stableHref, parsedUrl);
};

const skipWhitespace = (content: string, startIndex: number): number => {
  let index = startIndex;
  while (content[index] === " " || content[index] === "\t") {
    index += 1;
  }

  return index;
};

const getAngleWrappedHrefEnd = (
  content: string,
  hrefStart: number
): number | null => {
  const hrefEnd = content.indexOf(">", hrefStart + 1);
  return hrefEnd === -1 ? null : hrefEnd + 1;
};

const readAngleWrappedHref = (
  content: string,
  hrefStart: number
): string | null => {
  const hrefEnd = getAngleWrappedHrefEnd(content, hrefStart);
  if (hrefEnd === null) {
    return null;
  }

  return content.slice(hrefStart, hrefEnd);
};

const isPlainHrefBreak = (character: string | undefined): boolean =>
  character === " " || character === "\t" || character === "\n";

const getPlainHrefEnd = (content: string, hrefStart: number): number | null => {
  let hrefEnd = hrefStart;
  let parenthesisDepth = 0;

  while (hrefEnd < content.length) {
    const character = content[hrefEnd];
    if (character === ")" && parenthesisDepth === 0) {
      break;
    }

    if (isPlainHrefBreak(character)) {
      break;
    }

    if (character === "(") {
      parenthesisDepth += 1;
    } else if (character === ")") {
      parenthesisDepth -= 1;
    }

    hrefEnd += 1;
  }

  if (hrefEnd <= hrefStart) {
    return null;
  }

  return hrefEnd;
};

const readPlainHref = (content: string, hrefStart: number): string | null => {
  const hrefEnd = getPlainHrefEnd(content, hrefStart);
  if (hrefEnd === null) {
    return null;
  }

  return content.slice(hrefStart, hrefEnd);
};

const readMarkdownHref = (
  content: string,
  closeBracketIndex: number
): string | null => {
  const hrefStart = skipWhitespace(content, closeBracketIndex + 2);

  return content[hrefStart] === "<"
    ? readAngleWrappedHref(content, hrefStart)
    : readPlainHref(content, hrefStart);
};

const isMarkdownImageLink = (
  content: string,
  openBracketIndex: number
): boolean => openBracketIndex > 0 && content[openBracketIndex - 1] === "!";

const getMarkdownImageEnd = (
  content: string,
  imageStartIndex: number
): number | null => {
  const closeBracketIndex = content.indexOf("](", imageStartIndex + 2);
  const newlineIndex = content.indexOf("\n", imageStartIndex + 2);

  if (
    closeBracketIndex === -1 ||
    (newlineIndex !== -1 && newlineIndex < closeBracketIndex)
  ) {
    return null;
  }

  const hrefStart = skipWhitespace(content, closeBracketIndex + 2);
  const hrefEnd =
    content[hrefStart] === "<"
      ? getAngleWrappedHrefEnd(content, hrefStart)
      : getPlainHrefEnd(content, hrefStart);

  if (hrefEnd === null) {
    return null;
  }

  const closeParenIndex = skipWhitespace(content, hrefEnd);
  return content[closeParenIndex] === ")" ? closeParenIndex + 1 : null;
};

const stripMarkdownImages = (content: string): string => {
  let stripped = "";
  let searchIndex = 0;

  while (searchIndex < content.length) {
    const imageStartIndex = content.indexOf("![", searchIndex);
    if (imageStartIndex === -1) {
      stripped += content.slice(searchIndex);
      break;
    }

    stripped += content.slice(searchIndex, imageStartIndex);
    const imageEndIndex = getMarkdownImageEnd(content, imageStartIndex);
    if (imageEndIndex === null) {
      stripped += content.slice(imageStartIndex, imageStartIndex + 2);
      searchIndex = imageStartIndex + 2;
      continue;
    }

    stripped += " ";
    searchIndex = imageEndIndex;
  }

  return stripped;
};

const extractMarkdownLinkHrefs = (content: string): string[] => {
  const hrefs: string[] = [];
  let searchIndex = 0;

  while (searchIndex < content.length) {
    const closeBracketIndex = content.indexOf("](", searchIndex);
    if (closeBracketIndex === -1) {
      break;
    }

    const openBracketIndex = content.lastIndexOf("[", closeBracketIndex);
    if (
      openBracketIndex === -1 ||
      isMarkdownImageLink(content, openBracketIndex)
    ) {
      searchIndex = closeBracketIndex + 2;
      continue;
    }

    const href = readMarkdownHref(content, closeBracketIndex);
    if (href) {
      hrefs.push(href);
    }

    searchIndex = closeBracketIndex + 2;
  }

  return hrefs;
};

export const containsOpenGraphPreviewLink = (
  content: string | null | undefined
): boolean => {
  if (!content) {
    return false;
  }

  const withoutCode = stripMarkdownCode(content);
  let match: RegExpExecArray | null;

  for (const href of extractMarkdownLinkHrefs(withoutCode)) {
    if (isOpenGraphPreviewHref(href)) {
      return true;
    }
  }

  const withoutMarkdownImages = stripMarkdownImages(withoutCode);

  RAW_URL_REGEX.lastIndex = 0;
  while ((match = RAW_URL_REGEX.exec(withoutMarkdownImages)) !== null) {
    const href = match[0];
    if (href && isOpenGraphPreviewHref(href)) {
      return true;
    }
  }

  return false;
};
