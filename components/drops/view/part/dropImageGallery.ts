import {
  isDirectImageUrl,
  isSafeMarkdownImageSrc,
  parseUrl,
} from "./dropPartMarkdown/linkUtils";

export type DropImageGallerySource = "body" | "media";

export interface DropImageGalleryItem {
  readonly id: string;
  readonly src: string;
  readonly source: DropImageGallerySource;
}

interface DropImageGalleryMediaInput {
  readonly mimeType: string;
  readonly mediaSrc: string;
}

interface BuildDropImageGalleryItemsParams {
  readonly partContent: string | null;
  readonly partMedias: readonly DropImageGalleryMediaInput[];
}

interface MarkdownLinkMatch {
  readonly start: number;
  readonly end: number;
  readonly destination: string;
  readonly image: boolean;
}

interface MarkdownRange {
  readonly start: number;
  readonly end: number;
}

const MARKDOWN_LINK_REGEX =
  /!?\[[^\]]*]\(\s*(<[^>\n]+>|[^\s)\n]+)(?:\s+(?:"[^"\n]*"|'[^'\n]*'|\([^)\n]*\)))?\s*\)/g;
const BARE_URL_REGEX = /https?:\/\/[^\s<>"']+/g;
const FENCED_CODE_REGEX =
  /(^|\n)(`{3,}|~{3,})[^\n]*\n[\s\S]*?(?:\n\2(?=\n|$)|$)/g;
const INLINE_CODE_REGEX = /`[^`\n]+`/g;

const stripDestinationWrappers = (destination: string): string => {
  const trimmed = destination.trim();

  if (trimmed.startsWith("<") && trimmed.endsWith(">")) {
    return trimmed.slice(1, -1);
  }

  return trimmed;
};

const trimBareUrl = (url: string): string =>
  url.replace(/[),.;!?]+$/u, "");

const isInsideRange = (
  index: number,
  ranges: readonly MarkdownRange[]
): boolean => ranges.some((range) => index >= range.start && index < range.end);

const getIgnoredMarkdownRanges = (content: string): MarkdownRange[] => {
  const ranges: MarkdownRange[] = [];

  FENCED_CODE_REGEX.lastIndex = 0;
  let fencedMatch = FENCED_CODE_REGEX.exec(content);
  while (fencedMatch) {
    ranges.push({
      start: fencedMatch.index,
      end: fencedMatch.index + fencedMatch[0].length,
    });
    fencedMatch = FENCED_CODE_REGEX.exec(content);
  }

  INLINE_CODE_REGEX.lastIndex = 0;
  let inlineMatch = INLINE_CODE_REGEX.exec(content);
  while (inlineMatch) {
    if (!isInsideRange(inlineMatch.index, ranges)) {
      ranges.push({
        start: inlineMatch.index,
        end: inlineMatch.index + inlineMatch[0].length,
      });
    }
    inlineMatch = INLINE_CODE_REGEX.exec(content);
  }

  return ranges;
};

const getMarkdownLinkMatches = (
  content: string,
  ignoredRanges: readonly MarkdownRange[]
): MarkdownLinkMatch[] => {
  const matches: MarkdownLinkMatch[] = [];
  MARKDOWN_LINK_REGEX.lastIndex = 0;

  let match = MARKDOWN_LINK_REGEX.exec(content);
  while (match) {
    const rawDestination = match[1] ?? "";
    const matchText = match[0];
    const matchStart = match.index;

    if (isInsideRange(matchStart, ignoredRanges)) {
      match = MARKDOWN_LINK_REGEX.exec(content);
      continue;
    }

    matches.push({
      start: matchStart,
      end: matchStart + matchText.length,
      destination: stripDestinationWrappers(rawDestination),
      image: matchText.startsWith("!"),
    });

    match = MARKDOWN_LINK_REGEX.exec(content);
  }

  return matches;
};

const isInsideMarkdownLink = (
  index: number,
  matches: readonly MarkdownLinkMatch[]
): boolean =>
  matches.some((match) => index >= match.start && index < match.end);

const getBodyImageSources = (content: string | null): string[] => {
  if (!content) {
    return [];
  }

  const ignoredRanges = getIgnoredMarkdownRanges(content);
  const markdownMatches = getMarkdownLinkMatches(content, ignoredRanges);
  const bareImageSources: Array<{ index: number; src: string }> = [];

  BARE_URL_REGEX.lastIndex = 0;
  let match = BARE_URL_REGEX.exec(content);
  while (match) {
    const rawUrl = match[0] ?? "";
    const src = trimBareUrl(rawUrl);

    if (
      src.length > 0 &&
      !isInsideRange(match.index, ignoredRanges) &&
      !isInsideMarkdownLink(match.index, markdownMatches) &&
      isDirectImageUrl(src, parseUrl(src))
    ) {
      bareImageSources.push({ index: match.index, src });
    }

    match = BARE_URL_REGEX.exec(content);
  }

  const markdownImageSources = markdownMatches
    .filter((match) => match.image && isSafeMarkdownImageSrc(match.destination))
    .map((match) => ({ index: match.start, src: match.destination }));

  return [...markdownImageSources, ...bareImageSources]
    .sort((left, right) => left.index - right.index)
    .map((item) => item.src);
};

const createGalleryItem = (
  source: DropImageGallerySource,
  index: number,
  src: string
): DropImageGalleryItem => ({
  id: `drop-image-gallery:${source}:${index}:${src}`,
  src,
  source,
});

const isDropImageGalleryMedia = (media: DropImageGalleryMediaInput): boolean =>
  media.mimeType.toLowerCase().includes("image");

export const buildDropImageGalleryItems = ({
  partContent,
  partMedias,
}: BuildDropImageGalleryItemsParams): DropImageGalleryItem[] => {
  const bodyImages = getBodyImageSources(partContent).map((src, index) =>
    createGalleryItem("body", index, src)
  );
  const mediaImages = partMedias
    .filter(isDropImageGalleryMedia)
    .map((media, index) => createGalleryItem("media", index, media.mediaSrc));

  return [...bodyImages, ...mediaImages];
};
