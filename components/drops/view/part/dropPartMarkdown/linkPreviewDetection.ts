import { ensureStableSeizeLink } from "@/helpers/SeizeLinkParser";

import {
  isDirectImageUrl,
  parseUrl,
  shouldUseOpenGraphPreview,
} from "./linkUtils";

const MARKDOWN_IMAGE_REGEX = /!\[[^\]\n]*\]\(\s*(?:<[^>\n]*>|[^)\n]*)\s*\)/g;
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

const readAngleWrappedHref = (
  content: string,
  hrefStart: number
): string | null => {
  const hrefEnd = content.indexOf(">", hrefStart + 1);
  if (hrefEnd === -1) {
    return null;
  }

  return content.slice(hrefStart, hrefEnd + 1);
};

const readPlainHref = (content: string, hrefStart: number): string | null => {
  let hrefEnd = hrefStart;
  while (
    hrefEnd < content.length &&
    content[hrefEnd] !== ")" &&
    content[hrefEnd] !== " " &&
    content[hrefEnd] !== "\t" &&
    content[hrefEnd] !== "\n"
  ) {
    hrefEnd += 1;
  }

  if (hrefEnd <= hrefStart) {
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

  const withoutMarkdownImages = withoutCode.replace(MARKDOWN_IMAGE_REGEX, " ");

  RAW_URL_REGEX.lastIndex = 0;
  while ((match = RAW_URL_REGEX.exec(withoutMarkdownImages)) !== null) {
    const href = match[0];
    if (href && isOpenGraphPreviewHref(href)) {
      return true;
    }
  }

  return false;
};
