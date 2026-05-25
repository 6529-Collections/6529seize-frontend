import { ensureStableSeizeLink } from "@/helpers/SeizeLinkParser";
import { publicEnv } from "@/config/env";

const DEFAULT_CLOUDFRONT_DOMAIN = "https://d3lqz0a4bldqgf.cloudfront.net";
const TENOR_DOMAIN = "tenor.com";
const ALLOWED_TENOR_PATH_EXTENSIONS = [
  ".mp4",
  ".gif",
  ".jpg",
  ".webp",
] as const;
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

const parseUrl = (href: string): URL | null => {
  try {
    return new URL(href);
  } catch {
    return null;
  }
};

const getUrlOrigin = (href: string): string | null =>
  parseUrl(href)?.origin ?? null;

const getAllowedCloudfrontOrigin = (): string =>
  getUrlOrigin(publicEnv.NEXT_PUBLIC_CLOUDFRONT_DOMAIN ?? "") ??
  DEFAULT_CLOUDFRONT_DOMAIN;

const isAllowedCloudfrontHref = (href: string): boolean => {
  const hrefOrigin = getUrlOrigin(href);
  return hrefOrigin !== null && hrefOrigin === getAllowedCloudfrontOrigin();
};

const isDomainOrSubdomain = (hostname: string, domain: string): boolean =>
  hostname === domain || hostname.endsWith(`.${domain}`);

const isAllowedTenorHref = (href: string): boolean => {
  const url = parseUrl(href);
  if (!url) {
    return false;
  }

  const protocol = url.protocol.toLowerCase();
  if (protocol !== "http:" && protocol !== "https:") {
    return false;
  }

  if (!isDomainOrSubdomain(url.hostname.toLowerCase(), TENOR_DOMAIN)) {
    return false;
  }

  const pathname = url.pathname.toLowerCase();
  return ALLOWED_TENOR_PATH_EXTENSIONS.some((extension) =>
    pathname.endsWith(extension)
  );
};

const isDisallowedLinkHref = (href: string): boolean => {
  const normalizedHref = normalizeHrefCandidate(href);
  if (!normalizedHref) {
    return false;
  }

  const stableHref = ensureStableSeizeLink(normalizedHref);
  if (!parseUrl(stableHref)) {
    return false;
  }

  return (
    !isAllowedCloudfrontHref(stableHref) && !isAllowedTenorHref(stableHref)
  );
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

const extractMarkdownLinkHrefs = (content: string): string[] => {
  const hrefs: string[] = [];
  let searchIndex = 0;

  while (searchIndex < content.length) {
    const closeBracketIndex = content.indexOf("](", searchIndex);
    if (closeBracketIndex === -1) {
      break;
    }

    const openBracketIndex = content.lastIndexOf("[", closeBracketIndex);
    if (openBracketIndex === -1) {
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

export const containsDisallowedLink = (
  content: string | null | undefined
): boolean => {
  if (!content) {
    return false;
  }

  const withoutCode = stripMarkdownCode(content);
  let match: RegExpExecArray | null;

  for (const href of extractMarkdownLinkHrefs(withoutCode)) {
    if (isDisallowedLinkHref(href)) {
      return true;
    }
  }

  RAW_URL_REGEX.lastIndex = 0;
  while ((match = RAW_URL_REGEX.exec(withoutCode)) !== null) {
    const href = match[0];
    if (href && isDisallowedLinkHref(href)) {
      return true;
    }
  }

  return false;
};
