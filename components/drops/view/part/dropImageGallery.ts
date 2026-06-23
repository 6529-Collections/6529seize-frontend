import {
  isDirectImageUrl,
  isSafeMarkdownImageSrc,
  parseUrl,
} from "./dropPartMarkdown/linkUtils";
import { normalizeDropMarkdownContent } from "./dropPartMarkdown/normalizeContent";

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

interface DropImageGalleryBodyMarkdownInput {
  readonly content: string | null;
  readonly bodyGalleryKeyPrefix?: string | undefined;
}

interface BuildDropImageGalleryItemsParams {
  readonly partContent: string | null;
  readonly bodyMarkdowns?:
    | readonly DropImageGalleryBodyMarkdownInput[]
    | undefined;
  readonly partMedias: readonly DropImageGalleryMediaInput[];
}

interface DropImageGalleryBodyImage {
  readonly key: number;
  readonly src: string;
}

interface MarkdownLinkMatch {
  readonly start: number;
  readonly end: number;
  readonly label: string;
  readonly destination: string;
  readonly image: boolean;
}

interface MarkdownRange {
  readonly start: number;
  readonly end: number;
}

interface MarkdownReferenceDefinition {
  readonly label: string;
  readonly destination: string;
  readonly range: MarkdownRange;
}

interface MarkdownReferenceImageMatch {
  readonly start: number;
  readonly end: number;
  readonly label: string;
}

interface MarkdownReferenceLinkMatch {
  readonly start: number;
  readonly end: number;
  readonly label: string;
  readonly referenceLabel: string;
}

const MARKDOWN_LINK_REGEX =
  /!?\[([^\]]*)]\(\s*(<[^>\n]+>|[^\s)\n]+)(?:\s+(?:"[^"\n]*"|'[^'\n]*'|\([^)\n]*\)))?\s*\)/g;
const MARKDOWN_REFERENCE_DEFINITION_REGEX =
  /(^|\n)[ \t]{0,3}\[([^\]\n]+)]:[ \t]*(<[^>\n]+>|[^\s\n]+)(?:[ \t]+(?:"[^"\n]*"|'[^'\n]*'|\([^)\n]*\)))?[ \t]*(?=\n|$)/g;
const MARKDOWN_REFERENCE_IMAGE_REGEX = /!\[([^\]\n]*)]\[([^\]\n]*)]/g;
const MARKDOWN_REFERENCE_LINK_REGEX = /\[([^\]\n]+)]\[([^\]\n]*)]/g;
const MARKDOWN_SHORTCUT_REFERENCE_IMAGE_REGEX = /!\[([^\]\n]+)](?![[(])/g;
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

const getBareUrlMatchKey = (
  content: string,
  matchStart: number,
  rawUrl: string
): number => {
  const wrapperStart = matchStart - 1;
  const wrapperEnd = matchStart + rawUrl.length;

  if (
    wrapperStart >= 0 &&
    content[wrapperStart] === "<" &&
    content[wrapperEnd] === ">"
  ) {
    return wrapperStart;
  }

  return matchStart;
};

const isInsideRange = (
  index: number,
  ranges: readonly MarkdownRange[]
): boolean => ranges.some((range) => index >= range.start && index < range.end);

const normalizeReferenceLabel = (label: string): string =>
  label.trim().replace(/\s+/g, " ").toLowerCase();

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
    const rawLabel = match[1] ?? "";
    const rawDestination = match[2] ?? "";
    const matchText = match[0];
    const matchStart = match.index;

    if (isInsideRange(matchStart, ignoredRanges)) {
      match = MARKDOWN_LINK_REGEX.exec(content);
      continue;
    }

    matches.push({
      start: matchStart,
      end: matchStart + matchText.length,
      label: rawLabel,
      destination: stripDestinationWrappers(rawDestination),
      image: matchText.startsWith("!"),
    });

    match = MARKDOWN_LINK_REGEX.exec(content);
  }

  return matches;
};

const getMarkdownReferenceDefinitions = (
  content: string,
  ignoredRanges: readonly MarkdownRange[]
): MarkdownReferenceDefinition[] => {
  const definitions: MarkdownReferenceDefinition[] = [];
  MARKDOWN_REFERENCE_DEFINITION_REGEX.lastIndex = 0;

  let match = MARKDOWN_REFERENCE_DEFINITION_REGEX.exec(content);
  while (match) {
    const rawLabel = match[2] ?? "";
    const rawDestination = match[3] ?? "";
    const matchText = match[0];
    const linePrefix = match[1] ?? "";
    const matchStart = match.index + linePrefix.length;

    if (!isInsideRange(matchStart, ignoredRanges)) {
      definitions.push({
        label: normalizeReferenceLabel(rawLabel),
        destination: stripDestinationWrappers(rawDestination),
        range: {
          start: matchStart,
          end: match.index + matchText.length,
        },
      });
    }

    match = MARKDOWN_REFERENCE_DEFINITION_REGEX.exec(content);
  }

  return definitions;
};

const createMarkdownReferenceDefinitionMap = (
  definitions: readonly MarkdownReferenceDefinition[]
): ReadonlyMap<string, MarkdownReferenceDefinition> => {
  const definitionMap = new Map<string, MarkdownReferenceDefinition>();

  for (const definition of definitions) {
    if (!definitionMap.has(definition.label)) {
      definitionMap.set(definition.label, definition);
    }
  }

  return definitionMap;
};

const getMarkdownReferenceImageMatches = (
  content: string,
  ignoredRanges: readonly MarkdownRange[]
): MarkdownReferenceImageMatch[] => {
  const matches: MarkdownReferenceImageMatch[] = [];
  MARKDOWN_REFERENCE_IMAGE_REGEX.lastIndex = 0;

  let match = MARKDOWN_REFERENCE_IMAGE_REGEX.exec(content);
  while (match) {
    const altText = match[1] ?? "";
    const explicitLabel = match[2] ?? "";
    const label = normalizeReferenceLabel(
      explicitLabel.length > 0 ? explicitLabel : altText
    );
    const matchStart = match.index;

    if (label.length > 0 && !isInsideRange(matchStart, ignoredRanges)) {
      matches.push({
        start: matchStart,
        end: matchStart + (match[0]?.length ?? 0),
        label,
      });
    }

    match = MARKDOWN_REFERENCE_IMAGE_REGEX.exec(content);
  }

  MARKDOWN_SHORTCUT_REFERENCE_IMAGE_REGEX.lastIndex = 0;
  match = MARKDOWN_SHORTCUT_REFERENCE_IMAGE_REGEX.exec(content);
  while (match) {
    const rawLabel = match[1] ?? "";
    const label = normalizeReferenceLabel(rawLabel);
    const matchStart = match.index;

    if (label.length > 0 && !isInsideRange(matchStart, ignoredRanges)) {
      matches.push({
        start: matchStart,
        end: matchStart + (match[0]?.length ?? 0),
        label,
      });
    }

    match = MARKDOWN_SHORTCUT_REFERENCE_IMAGE_REGEX.exec(content);
  }

  return matches;
};

const getMarkdownReferenceLinkMatches = (
  content: string,
  ignoredRanges: readonly MarkdownRange[]
): MarkdownReferenceLinkMatch[] => {
  const matches: MarkdownReferenceLinkMatch[] = [];
  MARKDOWN_REFERENCE_LINK_REGEX.lastIndex = 0;

  let match = MARKDOWN_REFERENCE_LINK_REGEX.exec(content);
  while (match) {
    const matchStart = match.index;
    const isImageReference = content[matchStart - 1] === "!";

    if (isImageReference || isInsideRange(matchStart, ignoredRanges)) {
      match = MARKDOWN_REFERENCE_LINK_REGEX.exec(content);
      continue;
    }

    const label = match[1] ?? "";
    const explicitReferenceLabel = match[2] ?? "";
    const referenceLabel = normalizeReferenceLabel(
      explicitReferenceLabel.length > 0 ? explicitReferenceLabel : label
    );

    if (referenceLabel.length > 0) {
      matches.push({
        start: matchStart,
        end: matchStart + (match[0]?.length ?? 0),
        label,
        referenceLabel,
      });
    }

    match = MARKDOWN_REFERENCE_LINK_REGEX.exec(content);
  }

  return matches;
};

const isInsideMarkdownLink = (
  index: number,
  matches: readonly MarkdownLinkMatch[]
): boolean =>
  matches.some((match) => index >= match.start && index < match.end);

const isBareDirectImageMarkdownLink = (match: MarkdownLinkMatch): boolean => {
  if (match.image || match.label.trim() !== match.destination.trim()) {
    return false;
  }

  return isDirectImageUrl(match.destination, parseUrl(match.destination));
};

export const getDropImageGalleryItemId = (
  source: DropImageGallerySource,
  key: number | string,
  src: string
): string => `drop-image-gallery:${source}:${String(key)}:${src}`;

export const getDropImageGalleryBodyItemKey = (
  key: number | string,
  bodyGalleryKeyPrefix?: string | undefined
): number | string =>
  bodyGalleryKeyPrefix
    ? `${bodyGalleryKeyPrefix}:${String(key)}`
    : key;

const getBodyImageSources = (
  content: string | null
): DropImageGalleryBodyImage[] => {
  if (!content) {
    return [];
  }

  const ignoredCodeRanges = getIgnoredMarkdownRanges(content);
  const referenceDefinitions = getMarkdownReferenceDefinitions(
    content,
    ignoredCodeRanges
  );
  const ignoredRanges = [
    ...ignoredCodeRanges,
    ...referenceDefinitions.map((definition) => definition.range),
  ];
  const markdownMatches = getMarkdownLinkMatches(content, ignoredRanges);
  const referenceDefinitionMap =
    createMarkdownReferenceDefinitionMap(referenceDefinitions);
  const referenceImageMatches = getMarkdownReferenceImageMatches(
    content,
    ignoredRanges
  );
  const referenceLinkMatches = getMarkdownReferenceLinkMatches(
    content,
    ignoredRanges
  );
  const referenceUseRanges = [
    ...referenceImageMatches.map((match) => ({
      start: match.start,
      end: match.end,
    })),
    ...referenceLinkMatches.map((match) => ({
      start: match.start,
      end: match.end,
    })),
  ];
  const bareImageSources: DropImageGalleryBodyImage[] = [];

  BARE_URL_REGEX.lastIndex = 0;
  let match = BARE_URL_REGEX.exec(content);
  while (match) {
    const rawUrl = match[0] ?? "";
    const src = trimBareUrl(rawUrl);

    if (
      src.length > 0 &&
      !isInsideRange(match.index, ignoredRanges) &&
      !isInsideMarkdownLink(match.index, markdownMatches) &&
      !isInsideRange(match.index, referenceUseRanges) &&
      isDirectImageUrl(src, parseUrl(src))
    ) {
      bareImageSources.push({
        key: getBareUrlMatchKey(content, match.index, rawUrl),
        src,
      });
    }

    match = BARE_URL_REGEX.exec(content);
  }

  const markdownImageSources = markdownMatches
    .filter(
      (match) =>
        (match.image && isSafeMarkdownImageSrc(match.destination)) ||
        isBareDirectImageMarkdownLink(match)
    )
    .map((match) => ({ key: match.start, src: match.destination }));
  const referenceImageSources = referenceImageMatches
    .map((match): DropImageGalleryBodyImage | null => {
      const definition = referenceDefinitionMap.get(match.label);
      if (!definition || !isSafeMarkdownImageSrc(definition.destination)) {
        return null;
      }

      return { key: match.start, src: definition.destination };
    })
    .filter((image): image is DropImageGalleryBodyImage => image !== null);
  const referenceLinkImageSources = referenceLinkMatches
    .map((match): DropImageGalleryBodyImage | null => {
      const definition = referenceDefinitionMap.get(match.referenceLabel);
      if (
        !definition ||
        match.label.trim() !== definition.destination.trim() ||
        !isDirectImageUrl(
          definition.destination,
          parseUrl(definition.destination)
        )
      ) {
        return null;
      }

      return { key: match.start, src: definition.destination };
    })
    .filter((image): image is DropImageGalleryBodyImage => image !== null);

  return [
    ...markdownImageSources,
    ...referenceImageSources,
    ...referenceLinkImageSources,
    ...bareImageSources,
  ]
    .sort((left, right) => left.key - right.key);
};

const createGalleryItem = (
  source: DropImageGallerySource,
  key: number | string,
  src: string
): DropImageGalleryItem => ({
  id: getDropImageGalleryItemId(source, key, src),
  src,
  source,
});

const isDropImageGalleryMedia = (media: DropImageGalleryMediaInput): boolean =>
  media.mimeType.toLowerCase().includes("image");

export const buildDropImageGalleryItems = ({
  bodyMarkdowns,
  partContent,
  partMedias,
}: BuildDropImageGalleryItemsParams): DropImageGalleryItem[] => {
  const bodyMarkdownInputs = bodyMarkdowns ?? [{ content: partContent }];
  const bodyImages = bodyMarkdownInputs.flatMap(
    ({ content, bodyGalleryKeyPrefix }) => {
      const normalizedPartContent = normalizeDropMarkdownContent(content);

      return getBodyImageSources(normalizedPartContent).map((image) =>
        createGalleryItem(
          "body",
          getDropImageGalleryBodyItemKey(image.key, bodyGalleryKeyPrefix),
          image.src
        )
      );
    }
  );
  const mediaImages = partMedias
    .map((media, index) =>
      isDropImageGalleryMedia(media)
        ? createGalleryItem("media", index, media.mediaSrc)
        : null
    )
    .filter((item): item is DropImageGalleryItem => item !== null);

  return [...bodyImages, ...mediaImages];
};
