import { publicEnv } from "@/config/env";
import {
  getSubmissionMediaTypeInfo,
  type SubmissionMediaCategory,
} from "@/constants/submission-media.constants";
import type { ApiAttachment } from "@/generated/models/ApiAttachment";
import type { ApiOgMediaAsset } from "@/generated/models/ApiOgMediaAsset";
import type { ApiOgMetadataDrop } from "@/generated/models/ApiOgMetadataDrop";
import type { ApiOgMetadataProfile } from "@/generated/models/ApiOgMetadataProfile";
import type { ApiOgMetadataWave } from "@/generated/models/ApiOgMetadataWave";
import {
  formatInteger,
  getFirstMediaUrl,
  getMediaProxyUrl,
  getUsableText,
  pluralize,
  truncateText,
} from "@/app/api/og-metadata/_lib/imageUtils";
import {
  getProfileDisplayName,
  ProfileAvatar,
  ProfileBadgeRow,
} from "@/app/api/og-metadata/_lib/profileSummary";
import { isAllowedOgImageSourceUrl } from "@/app/api/og-metadata/_lib/imageProxyPolicy";

const CANVAS_WIDTH = 1200;
const CANVAS_HEIGHT = 630;
const HORIZONTAL_MARGIN = 46;
const LOGO_URL = `${publicEnv.BASE_ENDPOINT}/6529.svg`;
const LOGO_SIZE = 42;
const CARD_BACKGROUND = "#1A1A1F";
const CONTENT_BACKGROUND = "#131316";
const MUTED_TEXT = "#93939F";
const LINK_TEXT = "#79B8FF";
const VIDEO_TEXT = "rgba(167, 139, 250, 0.9)";
const VIDEO_ICON_TEXT = "rgba(167, 139, 250, 0.78)";
const VIDEO_ICON_BACKGROUND = "rgba(167, 139, 250, 0.08)";
const VIDEO_ICON_BORDER = "rgba(167, 139, 250, 0.25)";
const FILE_TEXT = "#818CF8";
const FILE_ICON_TEXT = "#818CF8";
const FILE_ICON_BACKGROUND = "rgba(129, 140, 248, 0.08)";
const FILE_ICON_BORDER = "rgba(129, 140, 248, 0.25)";
const AUTHOR_ROW_TOP = 44;
const AUTHOR_AVATAR_SIZE = 70;
const AUTHOR_AVATAR_INNER_SIZE = 64;
const AUTHOR_BADGE_SIZE = 38;
const CONTENT_TOP = 146;
const CONTENT_FONT_SIZE = 42;
const CONTENT_LINE_HEIGHT = 1.2;
const CONTENT_MAX_LINES_WITH_MEDIA = 5;
const CONTENT_MAX_LINES_WITHOUT_MEDIA = 8;
const LONG_TEXT_MEDIA_THRESHOLD_LINES = 5;
const CONTENT_WIDTH = CANVAS_WIDTH - HORIZONTAL_MARGIN * 2;
const MEDIA_GAP = 24;
const MEDIA_BOTTOM_MARGIN = 42;
const MEDIA_MIN_HEIGHT = 140;
const MEDIA_GALLERY_GAP = 12;
const MEDIA_GALLERY_MAX_ITEMS = 4;
const ATTACHMENT_ROWS_WITH_MEDIA = 2;
const ATTACHMENT_ROWS_WITHOUT_MEDIA = 3;
const ATTACHMENT_GROUP_TOP_MARGIN = 18;
const ATTACHMENT_ROW_TOP_MARGIN = 8;
const ATTACHMENT_ROW_BOTTOM_MARGIN = 6;
const LINK_DISPLAY_MAX_LINES = 2;
const LINK_ICON = "🔗";
const SUBMISSION_TITLE_TOP = 138;
const SUBMISSION_TITLE_FONT_SIZE = 40;
const SUBMISSION_TITLE_ICON_SIZE = 40;
const SUBMISSION_TROPHY_ICON_SIZE = 30;
const SUBMISSION_TITLE_GAP = 12;
const ADDITIONAL_ACTION_PROMISE_LABEL = "Additional Action";
const ADDITIONAL_ACTION_PROMISE_TITLE_BADGE_WIDTH = 156;
const ADDITIONAL_ACTION_PROMISE_TITLE_BADGE_HEIGHT = 24;
const ADDITIONAL_ACTION_PROMISE_TITLE_FONT_SIZE = 12;
const ADDITIONAL_ACTION_PROMISE_CONTEXT_FONT_SIZE = 22;
const ADDITIONAL_ACTION_PROMISE_CONTEXT_GAP = 12;
const SUBMISSION_MEDIA_TOP = 206;
const SUBMISSION_MEDIA_HEIGHT = 344;
const SUBMISSION_MEDIA_VERTICAL_PADDING = 18;
const SUBMISSION_MEDIA_CONTENT_HEIGHT =
  SUBMISSION_MEDIA_HEIGHT - SUBMISSION_MEDIA_VERTICAL_PADDING * 2;
const SUBMISSION_STATS_TOP = 566;
const SUBMISSION_STATS_FONT_SIZE = 24;
const SUBMISSION_STATS_GROUP_GAP = 24;
const SUBMISSION_STATS_VALUE_GAP = 8;
const CHAT_CONTENT_BACKGROUND_TOP = CONTENT_TOP - 20;
const SUBMISSION_STATS_TROPHY_ICON_SIZE = 22;
const ADDITIONAL_ACTION_PROMISE_TEXT = "#FCD34D";
const ADDITIONAL_ACTION_PROMISE_BACKGROUND = "rgba(251, 191, 36, 0.1)";
const ADDITIONAL_ACTION_PROMISE_BORDER = "rgba(252, 211, 77, 0.25)";
const TROPHY_COLOR = "#FBBF24";
const SUBMISSION_DATE_FORMATTER = new Intl.DateTimeFormat("en-US", {
  day: "numeric",
  month: "short",
  timeZone: "UTC",
  year: "numeric",
});
const URL_TOKEN_PATTERN = /^(?:https?:\/\/|www\.)\S+$/i;
const CONTENT_REFERENCE_PATTERN = /([@#])\[([^\]\r\n]+)\]/g;
const IMAGE_URL_PATTERN = /\.(?:avif|gif|jpe?g|png|webp)(?:$|[?#])/i;
const INTERACTIVE_URL_PATTERN = /\.(?:glb|gltf|html?)(?:$|[?#])/i;
const VIDEO_URL_PATTERN = /\.(?:m4v|mov|mp4|webm)(?:$|[?#])/i;
const UUID_FILENAME_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const HEX_FILENAME_PATTERN = /^[0-9a-f]{24,}$/i;
const NUMERIC_FILENAME_PATTERN = /^\d{10,}$/;
const GENERIC_FILENAME_TOKENS = new Set([
  "asset",
  "file",
  "image",
  "img",
  "media",
  "upload",
  "untitled",
  "vid",
  "video",
]);

type DropMediaKind = "image" | "video";
type SubmissionPreviewMediaCategory = SubmissionMediaCategory | "unknown";
type DropContentLineKind =
  | "text"
  | "link"
  | "video"
  | "file"
  | "attachment-summary";
type DropContentSegmentKind = "text" | "reference";
type DropContentLineSegment = {
  readonly kind: DropContentSegmentKind;
  readonly text: string;
};
type DropContentLine = {
  readonly kind: DropContentLineKind;
  readonly segments?: readonly DropContentLineSegment[] | undefined;
  readonly text: string;
};
type DropContentWord = {
  readonly kind: DropContentSegmentKind;
  readonly text: string;
};
type DropMediaItem = {
  readonly asset: ApiOgMediaAsset;
  readonly sourceUrl: string | null;
};
type SubmissionPreviewMedia = {
  readonly category: SubmissionPreviewMediaCategory;
  readonly label: string;
  readonly mimeType: string | undefined;
};
type SubmissionMediaStyles = {
  readonly bg: string;
  readonly border: string;
  readonly text: string;
};
type DropMediaLayout = {
  readonly crop: boolean;
  readonly frameHeight: number;
  readonly frameLeft: number;
  readonly frameTop: number;
  readonly frameWidth: number;
  readonly imageHeight: number;
  readonly imageWidth: number;
  readonly proxyWidth: number;
};
type DropMediaTileLayout = {
  readonly borderBottomLeftRadius: number;
  readonly borderBottomRightRadius: number;
  readonly borderTopLeftRadius: number;
  readonly borderTopRightRadius: number;
  readonly frameHeight: number;
  readonly frameLeft: number;
  readonly frameTop: number;
  readonly frameWidth: number;
  readonly objectFit: "contain" | "cover";
  readonly proxyWidth: number;
};
type DropMediaTile = {
  readonly item: DropMediaItem;
  readonly layout: DropMediaTileLayout;
};
type DropMediaPresentation =
  | {
      readonly kind: "single";
      readonly item: DropMediaItem;
      readonly layout: DropMediaLayout;
    }
  | {
      readonly frameHeight: number;
      readonly frameLeft: number;
      readonly frameTop: number;
      readonly frameWidth: number;
      readonly kind: "gallery";
      readonly tiles: readonly DropMediaTile[];
    };
type SingleDropMediaPresentation = Extract<
  DropMediaPresentation,
  { readonly kind: "single" }
>;
type GalleryDropMediaPresentation = Extract<
  DropMediaPresentation,
  { readonly kind: "gallery" }
>;
type KeyedContentLineRow = {
  readonly key: string;
  readonly line: DropContentLine;
  readonly previousLine: DropContentLine | undefined;
};
const getCharacterWidthFactor = (character: string): number => {
  if (character === " ") {
    return 0.34;
  }

  if ("il.,:;|'![]()".includes(character)) {
    return 0.28;
  }

  if ("mwMW@#%&".includes(character)) {
    return 0.9;
  }

  if (character >= "A" && character <= "Z") {
    return 0.72;
  }

  return 0.58;
};

const getEstimatedTextWidth = (value: string, fontSize: number): number =>
  [...value].reduce(
    (width, character) => width + getCharacterWidthFactor(character) * fontSize,
    0
  );

const truncateToWidth = ({
  fontSize,
  value,
  width,
}: {
  readonly fontSize: number;
  readonly value: string;
  readonly width: number;
}): string => {
  const suffix = "...";
  if (getEstimatedTextWidth(value, fontSize) <= width) {
    return value;
  }

  let truncated = value.trimEnd();
  while (
    truncated.length > 0 &&
    getEstimatedTextWidth(`${truncated}${suffix}`, fontSize) > width
  ) {
    truncated = truncated.slice(0, -1).trimEnd();
  }

  return `${truncated}${suffix}`;
};

const fitsContentLine = (value: string): boolean =>
  getEstimatedTextWidth(value, CONTENT_FONT_SIZE) <= CONTENT_WIDTH;

const appendContentEllipsis = (value: string): string => {
  const suffix = "...";
  if (value.endsWith(suffix)) {
    return value;
  }

  let truncated = value.trimEnd();
  while (truncated.length > 0 && !fitsContentLine(`${truncated}${suffix}`)) {
    truncated = truncated.slice(0, -1).trimEnd();
  }

  return `${truncated}${suffix}`;
};

const getFittingTokenPrefix = (value: string): string => {
  let prefix = value;
  while (prefix.length > 0 && !fitsContentLine(prefix)) {
    prefix = prefix.slice(0, -1);
  }

  return prefix || value.slice(0, 1);
};

const addHardWrappedTokenLines = ({
  lines,
  token,
  kind,
  segmentKind,
  maxLines,
}: {
  readonly lines: DropContentLine[];
  readonly token: string;
  readonly kind: DropContentLineKind;
  readonly segmentKind?: DropContentSegmentKind | undefined;
  readonly maxLines: number;
}): void => {
  let remaining = token;

  while (remaining.length > 0 && lines.length < maxLines) {
    const prefix = getFittingTokenPrefix(remaining);
    const isLastAvailableLine = lines.length === maxLines - 1;
    const hasRemainingText = prefix.length < remaining.length;
    const text =
      isLastAvailableLine && hasRemainingText
        ? appendContentEllipsis(prefix)
        : prefix;

    lines.push(
      segmentKind
        ? {
            kind,
            segments: [{ kind: segmentKind, text }],
            text,
          }
        : {
            kind,
            text,
          }
    );

    remaining = remaining.slice(prefix.length);
  }
};

const addTrailingContentEllipsis = (lines: DropContentLine[]): void => {
  const lastLine = lines.at(-1);
  if (!lastLine) {
    return;
  }

  const text = appendContentEllipsis(lastLine.text);
  const segments = lastLine.segments
    ? getSegmentsForLineText(lastLine.segments, text)
    : undefined;

  lines.splice(-1, 1, {
    ...lastLine,
    ...(segments ? { segments } : {}),
    text,
  });
};

const getSegmentsForLineText = (
  segments: readonly DropContentLineSegment[],
  text: string
): readonly DropContentLineSegment[] => {
  const nextSegments: DropContentLineSegment[] = [];
  let cursor = 0;

  for (const segment of segments) {
    if (cursor >= text.length) {
      break;
    }

    const nextCursor = Math.min(cursor + segment.text.length, text.length);
    nextSegments.push({
      ...segment,
      text: text.slice(cursor, nextCursor),
    });
    cursor = nextCursor;
  }

  if (cursor < text.length) {
    const remainingText = text.slice(cursor);
    const lastSegment = nextSegments.at(-1);
    if (lastSegment) {
      nextSegments.splice(-1, 1, {
        ...lastSegment,
        text: `${lastSegment.text}${remainingText}`,
      });
    }
  }

  return nextSegments;
};

const isUrlToken = (value: string): boolean => URL_TOKEN_PATTERN.test(value);

const getDisplayLinkText = (value: string): string => `${LINK_ICON} ${value}`;

const getMediaKind = (asset: ApiOgMediaAsset | null): DropMediaKind | null => {
  const mimeType = getUsableText(asset?.mime_type)?.toLowerCase();
  if (mimeType?.startsWith("image/")) {
    return "image";
  }

  if (mimeType?.startsWith("video/")) {
    return "video";
  }

  const url = getUsableText(asset?.url);
  if (url && VIDEO_URL_PATTERN.test(url)) {
    return "video";
  }

  if (url && IMAGE_URL_PATTERN.test(url)) {
    return "image";
  }

  return null;
};

const getMimeTypeFromUrl = (url: string | null): string | undefined => {
  if (!url) {
    return undefined;
  }

  if (IMAGE_URL_PATTERN.test(url)) {
    const extension = url.split(/[?#]/)[0]?.split(".").pop()?.toLowerCase();
    return extension === "jpg" ? "image/jpeg" : `image/${extension}`;
  }

  if (VIDEO_URL_PATTERN.test(url)) {
    const extension = url.split(/[?#]/)[0]?.split(".").pop()?.toLowerCase();
    return extension === "mov" ? "video/quicktime" : `video/${extension}`;
  }

  if (INTERACTIVE_URL_PATTERN.test(url)) {
    const extension = url.split(/[?#]/)[0]?.split(".").pop()?.toLowerCase();
    return extension === "html" || extension === "htm"
      ? "text/html"
      : `model/${extension}`;
  }

  return undefined;
};

const getFilenameStem = (filename: string): string =>
  filename.replace(/\.[^.]+$/, "");

const hasHumanReadableToken = (stem: string): boolean =>
  stem
    .split(/[^a-z0-9]+/i)
    .some(
      (token) =>
        /[a-z]{4,}/i.test(token) &&
        !/^[a-f0-9]{8,}$/i.test(token) &&
        !GENERIC_FILENAME_TOKENS.has(token.toLowerCase())
    );

const getMeaningfulFilename = (
  value: string | null | undefined
): string | null => {
  const filename = getUsableText(value);
  if (!filename) {
    return null;
  }

  const stem = getFilenameStem(filename);
  if (
    UUID_FILENAME_PATTERN.test(stem) ||
    HEX_FILENAME_PATTERN.test(stem) ||
    NUMERIC_FILENAME_PATTERN.test(stem)
  ) {
    return null;
  }

  return hasHumanReadableToken(stem) ? filename : null;
};

const getFilenameFromUrl = (url: string, fallback: string): string => {
  try {
    const pathname = new URL(url).pathname;
    const filename = decodeURIComponent(pathname.split("/").pop() ?? "");
    return getMeaningfulFilename(filename) ?? fallback;
  } catch {
    return (
      getMeaningfulFilename(url.split("?")[0]?.split("/").pop()) ?? fallback
    );
  }
};

const getSubmissionMediaLabel = (
  category: SubmissionPreviewMediaCategory
): string =>
  category === "unknown"
    ? "Media"
    : `${category[0]?.toUpperCase() ?? ""}${category.slice(1)}`;

const getSubmissionMediaCategory = (
  mimeType: string | undefined
): SubmissionPreviewMediaCategory => {
  if (!mimeType) {
    return "unknown";
  }

  const mediaInfo = getSubmissionMediaTypeInfo(mimeType);
  if (mediaInfo.label === "Unknown") {
    return "unknown";
  }

  return mediaInfo.category;
};

const getSubmissionPreviewMedia = (
  media: readonly ApiOgMediaAsset[] | null | undefined
): SubmissionPreviewMedia => {
  const mediaTypes =
    media?.map((asset) => {
      const url = getUsableText(asset.url);
      const mimeType =
        getUsableText(asset.mime_type)?.toLowerCase() ??
        getMimeTypeFromUrl(url);
      const category = getSubmissionMediaCategory(mimeType);
      return {
        category,
        label: getFilenameFromUrl(url ?? "", getSubmissionMediaLabel(category)),
        mimeType,
      };
    }) ?? [];

  return (
    mediaTypes.find((item) => item.category === "interactive") ??
    mediaTypes.find((item) => item.category === "video") ??
    mediaTypes.find((item) => item.category === "image") ??
    mediaTypes[0] ?? {
      category: "unknown",
      label: getSubmissionMediaLabel("unknown"),
      mimeType: undefined,
    }
  );
};

const getSubmissionMediaStyles = (
  media: SubmissionPreviewMedia
): SubmissionMediaStyles =>
  media.category === "unknown"
    ? getSubmissionMediaTypeInfo(undefined).styles
    : getSubmissionMediaTypeInfo(media.mimeType).styles;

const getImageMediaAssets = (
  media: readonly ApiOgMediaAsset[] | null | undefined
): readonly ApiOgMediaAsset[] =>
  media
    ?.filter(
      (asset) =>
        isAllowedOgImageSourceUrl(getUsableText(asset.url)) &&
        getMediaKind(asset) === "image"
    )
    .slice(0, MEDIA_GALLERY_MAX_ITEMS) ?? [];

const getVideoLines = (
  media: readonly ApiOgMediaAsset[] | null | undefined
): readonly DropContentLine[] =>
  media
    ?.filter(
      (asset) =>
        getUsableText(asset.url) !== null && getMediaKind(asset) === "video"
    )
    .map((asset) => ({
      kind: "video" as const,
      text: getFilenameFromUrl(getUsableText(asset.url) ?? "", "video"),
    })) ?? [];

const getFileLines = (
  files: readonly ApiAttachment[] | null | undefined
): readonly DropContentLine[] =>
  files?.map((file) => ({
    kind: "file" as const,
    text:
      getUsableText(file.file_name) ??
      getFilenameFromUrl(getUsableText(file.url) ?? "", "file"),
  })) ?? [];

const summarizeHiddenAttachmentLines = (
  hiddenLines: readonly DropContentLine[]
): string => {
  const hiddenVideoCount = hiddenLines.filter(
    (line) => line.kind === "video"
  ).length;
  const hiddenFileCount = hiddenLines.filter(
    (line) => line.kind === "file"
  ).length;

  if (hiddenFileCount === 0) {
    return `+${hiddenVideoCount} videos`;
  }

  if (hiddenVideoCount === 0) {
    return `+${hiddenFileCount} files`;
  }

  return `+${hiddenLines.length} attachments`;
};

const getVisibleAttachmentLines = ({
  attachmentLines,
  maxAttachmentRows,
}: {
  readonly attachmentLines: readonly DropContentLine[];
  readonly maxAttachmentRows: number;
}): readonly DropContentLine[] => {
  if (attachmentLines.length <= maxAttachmentRows) {
    return attachmentLines;
  }

  return [
    ...attachmentLines.slice(0, maxAttachmentRows),
    {
      kind: "attachment-summary" as const,
      text: summarizeHiddenAttachmentLines(
        attachmentLines.slice(maxAttachmentRows)
      ),
    },
  ];
};

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

const getMediaItem = (asset: ApiOgMediaAsset): DropMediaItem => ({
  asset,
  sourceUrl: getUsableText(asset.url),
});

const shouldShowMedia = ({
  mediaAssets,
  textLinesWithoutMedia,
  hasText,
}: {
  readonly mediaAssets: readonly ApiOgMediaAsset[];
  readonly textLinesWithoutMedia: readonly DropContentLine[];
  readonly hasText: boolean;
}): boolean =>
  mediaAssets.length > 0 &&
  (!hasText || textLinesWithoutMedia.length <= LONG_TEXT_MEDIA_THRESHOLD_LINES);

const isPositiveDimension = (
  value: number | null | undefined
): value is number =>
  typeof value === "number" && Number.isFinite(value) && value > 0;

const getMediaTop = (textLineCount: number): number =>
  CONTENT_TOP +
  textLineCount * CONTENT_FONT_SIZE * CONTENT_LINE_HEIGHT +
  (textLineCount > 0 ? MEDIA_GAP : 0);

const getAvailableMediaHeight = (top: number): number =>
  Math.max(MEDIA_MIN_HEIGHT, CANVAS_HEIGHT - top - MEDIA_BOTTOM_MARGIN);

const centerMediaLeft = (width: number): number =>
  HORIZONTAL_MARGIN + (CONTENT_WIDTH - width) / 2;

const roundLayoutValue = (value: number): number => Math.round(value);

const getUnknownDimensionMediaLayout = (
  textLineCount: number
): DropMediaLayout => {
  const frameTop = getMediaTop(textLineCount);
  const frameHeight = getAvailableMediaHeight(frameTop);

  return {
    crop: false,
    frameHeight: roundLayoutValue(frameHeight),
    frameLeft: HORIZONTAL_MARGIN,
    frameTop: roundLayoutValue(frameTop),
    frameWidth: CONTENT_WIDTH,
    imageHeight: roundLayoutValue(frameHeight),
    imageWidth: CONTENT_WIDTH,
    proxyWidth: CONTENT_WIDTH,
  };
};

const getContainedSingleMediaLayout = ({
  availableHeight,
  frameTop,
  naturalHeight,
  naturalWidth,
}: {
  readonly availableHeight: number;
  readonly frameTop: number;
  readonly naturalHeight: number;
  readonly naturalWidth: number;
}): DropMediaLayout => {
  if (naturalWidth <= CONTENT_WIDTH && naturalHeight <= availableHeight) {
    return {
      crop: false,
      frameHeight: roundLayoutValue(naturalHeight),
      frameLeft: roundLayoutValue(centerMediaLeft(naturalWidth)),
      frameTop: roundLayoutValue(frameTop),
      frameWidth: roundLayoutValue(naturalWidth),
      imageHeight: roundLayoutValue(naturalHeight),
      imageWidth: roundLayoutValue(naturalWidth),
      proxyWidth: Math.round(naturalWidth),
    };
  }

  const scale = Math.min(
    CONTENT_WIDTH / naturalWidth,
    availableHeight / naturalHeight,
    1
  );
  const imageWidth = naturalWidth * scale;
  const imageHeight = naturalHeight * scale;

  return {
    crop: false,
    frameHeight: roundLayoutValue(imageHeight),
    frameLeft: roundLayoutValue(centerMediaLeft(imageWidth)),
    frameTop: roundLayoutValue(frameTop),
    frameWidth: roundLayoutValue(imageWidth),
    imageHeight: roundLayoutValue(imageHeight),
    imageWidth: roundLayoutValue(imageWidth),
    proxyWidth: Math.round(imageWidth),
  };
};

const getSingleMediaLayout = (
  textLineCount: number,
  mediaAsset: ApiOgMediaAsset
): DropMediaLayout => {
  const frameTop = getMediaTop(textLineCount);
  const availableHeight = getAvailableMediaHeight(frameTop);
  const naturalWidth = mediaAsset.width;
  const naturalHeight = mediaAsset.height;

  if (
    !isPositiveDimension(naturalWidth) ||
    !isPositiveDimension(naturalHeight)
  ) {
    return getUnknownDimensionMediaLayout(textLineCount);
  }

  return getContainedSingleMediaLayout({
    availableHeight,
    frameTop,
    naturalHeight,
    naturalWidth,
  });
};

const getTileObjectFit = (
  tile: Pick<DropMediaTileLayout, "frameHeight" | "frameWidth">,
  asset: ApiOgMediaAsset
): "contain" | "cover" => {
  const naturalWidth = asset.width;
  const naturalHeight = asset.height;

  if (
    !isPositiveDimension(naturalWidth) ||
    !isPositiveDimension(naturalHeight)
  ) {
    return "contain";
  }

  if (naturalWidth <= tile.frameWidth && naturalHeight <= tile.frameHeight) {
    return "contain";
  }

  return "cover";
};

const withTileFit = (
  layout: Omit<DropMediaTileLayout, "objectFit" | "proxyWidth">,
  item: DropMediaItem
): DropMediaTile => ({
  item,
  layout: {
    borderBottomLeftRadius: layout.borderBottomLeftRadius,
    borderBottomRightRadius: layout.borderBottomRightRadius,
    borderTopLeftRadius: layout.borderTopLeftRadius,
    borderTopRightRadius: layout.borderTopRightRadius,
    frameHeight: roundLayoutValue(layout.frameHeight),
    frameLeft: roundLayoutValue(layout.frameLeft),
    frameTop: roundLayoutValue(layout.frameTop),
    frameWidth: roundLayoutValue(layout.frameWidth),
    objectFit: getTileObjectFit(layout, item.asset),
    proxyWidth: Math.round(layout.frameWidth),
  },
});

const getGalleryTiles = ({
  items,
  mediaHeight,
  mediaWidth,
}: {
  readonly items: readonly DropMediaItem[];
  readonly mediaHeight: number;
  readonly mediaWidth: number;
}): readonly DropMediaTile[] => {
  const gap = MEDIA_GALLERY_GAP;

  if (items.length === 2) {
    const tileWidth = (mediaWidth - gap) / 2;
    return items.map((item, index) =>
      withTileFit(
        {
          borderBottomLeftRadius: index === 0 ? 28 : 0,
          borderBottomRightRadius: index === 1 ? 28 : 0,
          borderTopLeftRadius: index === 0 ? 28 : 0,
          borderTopRightRadius: index === 1 ? 28 : 0,
          frameHeight: mediaHeight,
          frameLeft: index * (tileWidth + gap),
          frameTop: 0,
          frameWidth: tileWidth,
        },
        item
      )
    );
  }

  if (items.length === 3) {
    const [first, second, third] = items;
    if (!first || !second || !third) {
      return [];
    }

    const tileWidth = (mediaWidth - gap) / 2;
    const stackedHeight = (mediaHeight - gap) / 2;

    return [
      withTileFit(
        {
          borderBottomLeftRadius: 28,
          borderBottomRightRadius: 0,
          borderTopLeftRadius: 28,
          borderTopRightRadius: 0,
          frameHeight: mediaHeight,
          frameLeft: 0,
          frameTop: 0,
          frameWidth: tileWidth,
        },
        first
      ),
      withTileFit(
        {
          borderBottomLeftRadius: 0,
          borderBottomRightRadius: 0,
          borderTopLeftRadius: 0,
          borderTopRightRadius: 28,
          frameHeight: stackedHeight,
          frameLeft: tileWidth + gap,
          frameTop: 0,
          frameWidth: tileWidth,
        },
        second
      ),
      withTileFit(
        {
          borderBottomLeftRadius: 0,
          borderBottomRightRadius: 28,
          borderTopLeftRadius: 0,
          borderTopRightRadius: 0,
          frameHeight: stackedHeight,
          frameLeft: tileWidth + gap,
          frameTop: stackedHeight + gap,
          frameWidth: tileWidth,
        },
        third
      ),
    ];
  }

  const tileWidth = (mediaWidth - gap) / 2;
  const tileHeight = (mediaHeight - gap) / 2;

  return items.slice(0, MEDIA_GALLERY_MAX_ITEMS).map((item, index) => {
    const column = index % 2;
    const row = Math.floor(index / 2);

    return withTileFit(
      {
        borderBottomLeftRadius: index === 2 ? 28 : 0,
        borderBottomRightRadius: index === 3 ? 28 : 0,
        borderTopLeftRadius: index === 0 ? 28 : 0,
        borderTopRightRadius: index === 1 ? 28 : 0,
        frameHeight: tileHeight,
        frameLeft: column * (tileWidth + gap),
        frameTop: row * (tileHeight + gap),
        frameWidth: tileWidth,
      },
      item
    );
  });
};

const getMediaPresentation = ({
  mediaAssets,
  textLineCount,
}: {
  readonly mediaAssets: readonly ApiOgMediaAsset[];
  readonly textLineCount: number;
}): DropMediaPresentation | null => {
  if (mediaAssets.length === 0) {
    return null;
  }

  const items = mediaAssets.map(getMediaItem);
  if (items.length === 1) {
    const [item] = items;
    if (!item) {
      return null;
    }

    return {
      kind: "single",
      item,
      layout: getSingleMediaLayout(textLineCount, item.asset),
    };
  }

  const frameTop = getMediaTop(textLineCount);
  const frameHeight = getAvailableMediaHeight(frameTop);

  return {
    frameHeight,
    frameLeft: HORIZONTAL_MARGIN,
    frameTop,
    frameWidth: CONTENT_WIDTH,
    kind: "gallery",
    tiles: getGalleryTiles({
      items,
      mediaHeight: frameHeight,
      mediaWidth: CONTENT_WIDTH,
    }),
  };
};

const getDropContext = ({
  wave,
}: {
  readonly wave: ApiOgMetadataWave | undefined;
}): string | null => getUsableText(wave?.name);

const VideoContentIcon = () => (
  <div
    style={{
      alignItems: "center",
      background: VIDEO_ICON_BACKGROUND,
      border: `1px solid ${VIDEO_ICON_BORDER}`,
      borderRadius: 6,
      color: VIDEO_ICON_TEXT,
      display: "flex",
      height: 38,
      justifyContent: "center",
      marginRight: 12,
      width: 38,
    }}
  >
    <svg fill="currentColor" height={18} viewBox="0 0 576 512" width={22}>
      <path d="M0 128C0 92.7 28.7 64 64 64l256 0c35.3 0 64 28.7 64 64l0 256c0 35.3-28.7 64-64 64L64 448c-35.3 0-64-28.7-64-64L0 128zM559.1 99.8c10.4 5.6 16.9 16.4 16.9 28.2l0 256c0 11.8-6.5 22.6-16.9 28.2s-23 5-32.9-1.6l-96-64L416 336l0-48 0-64 0-48 14.2-9.5 96-64c9.8-6.5 22.4-7.2 32.9-1.6z" />
    </svg>
  </div>
);

const FileContentIcon = () => (
  <div
    style={{
      alignItems: "center",
      background: FILE_ICON_BACKGROUND,
      border: `1px solid ${FILE_ICON_BORDER}`,
      borderRadius: 6,
      color: FILE_ICON_TEXT,
      display: "flex",
      height: 38,
      justifyContent: "center",
      marginRight: 12,
      width: 38,
    }}
  >
    <svg fill="currentColor" height={21} viewBox="0 0 384 512" width={16}>
      <path d="M64 0C28.7 0 0 28.7 0 64v384c0 35.3 28.7 64 64 64h256c35.3 0 64-28.7 64-64V160L224 0H64zm192 176c-17.7 0-32-14.3-32-32V48l112 112h-80zM96 280c0-13.3 10.7-24 24-24h144c13.3 0 24 10.7 24 24s-10.7 24-24 24H120c-13.3 0-24-10.7-24-24zm0 80c0-13.3 10.7-24 24-24h144c13.3 0 24 10.7 24 24s-10.7 24-24 24H120c-13.3 0-24-10.7-24-24zm0 80c0-13.3 10.7-24 24-24h96c13.3 0 24 10.7 24 24s-10.7 24-24 24h-96c-13.3 0-24-10.7-24-24z" />
    </svg>
  </div>
);

const SUBMISSION_ICON_BY_CATEGORY: Record<
  SubmissionPreviewMediaCategory,
  { readonly path: string; readonly viewBox: string }
> = {
  image: {
    viewBox: "0 0 512 512",
    path: "M0 96C0 60.7 28.7 32 64 32l384 0c35.3 0 64 28.7 64 64l0 320c0 35.3-28.7 64-64 64L64 480c-35.3 0-64-28.7-64-64L0 96zM323.8 202.5c-4.5-6.6-11.9-10.5-19.8-10.5s-15.4 3.9-19.8 10.5l-87 127.6L170.7 297c-4.6-5.7-11.5-9-18.7-9s-14.2 3.3-18.7 9l-64 80c-5.8 7.2-6.9 17.1-2.9 25.4s12.4 13.6 21.6 13.6l96 0 32 0 208 0c8.9 0 17.1-4.9 21.2-12.8s3.6-17.4-1.4-24.7l-120-176zM112 192a48 48 0 1 0 0-96 48 48 0 1 0 0 96z",
  },
  interactive: {
    viewBox: "20 10 230 240",
    path: "M195.4,107.9c-2.6,0-5,0.4-7.4,1.2c-0.2-0.1-0.5-0.2-0.8-0.3c-4.4-7.1-12-11.4-20.4-11.4c-2.9,0-5.7,0.5-8.4,1.4c-4.4-7.4-12.1-11.9-20.8-11.9c-1.6,0-3.1,0.1-4.6,0.4V73.9c0-14-10.7-24.9-24.4-24.9c-13.8,0-25,11.2-25,24.9v65.8l-3.9-3.9c-4.5-4.4-10.7-6.9-17.5-6.9c-6.9,0-13.6,2.6-17.9,6.9c-9.4,9.4-12.5,25.7-1.5,36.7l56.2,55.9c1.3,1.3,2.8,2.4,4.4,3.4c10.5,8.6,23.1,14.2,49.7,14.2c61.8,0,66.9-36.2,66.9-73.3v-40C220.1,118.8,209.4,107.9,195.4,107.9L195.4,107.9z M210.3,172.8c0,36-4.2,63.5-57.1,63.5c-24,0-34.5-4.7-43.7-12.2l-0.6-0.4c-1.1-0.7-2-1.4-2.9-2.2l-56.2-55.8c-7.3-7.3-3.5-17.8,1.5-22.8c2.5-2.5,6.7-4,10.9-4c4.2,0,8,1.4,10.6,4l20.6,20.5V73.8c0-8.3,6.8-15.1,15.2-15.1c8.2,0,14.6,6.6,14.6,15.1v28.5l0.1-0.1v29.3c0,2.7,2.2,4.9,4.9,4.9c2.7,0,4.9-2.2,4.9-4.9V97.4c1.4-0.4,2.9-0.7,4.5-0.7c6.3,0,11.6,3.9,13.8,10.2l0.6,1.8v32.1c0,2.7,2.2,4.9,4.9,4.9c2.7,0,4.9-2.2,4.9-4.9V108c1.6-0.5,3.3-0.9,4.9-0.9c6.3,0,11.6,3.9,13.8,10.2l0.3,1v32.1c0,2.7,2.2,4.9,4.9,4.9c2.7,0,4.9-2.2,4.9-4.9v-31.8c1.6-0.6,3.2-1,5.2-1c8.2,0,14.4,6.5,14.4,15.1V172.8L210.3,172.8z M68.4,120.1c0.9,0.7,1.9,1,2.9,1c1.5,0,3-0.7,4-2c1.6-2.2,1.2-5.3-1-6.9C61.1,102.4,53.5,87.4,53.5,71c0-28.3,23-51.2,51.2-51.2S156,42.8,156,71c0,3.4-0.3,6.9-1,10.2c-0.5,2.6,1.2,5.3,3.9,5.8c2.6,0.5,5.3-1.2,5.8-3.9c0.8-4,1.2-8.1,1.2-12.1c0-33.6-27.4-61-61-61S43.7,37.4,43.7,71.1C43.7,90.3,52.9,108.6,68.4,120.1L68.4,120.1z",
  },
  unknown: {
    viewBox: "0 0 384 512",
    path: "M64 0C28.7 0 0 28.7 0 64v384c0 35.3 28.7 64 64 64h256c35.3 0 64-28.7 64-64V160L224 0H64zm192 176c-17.7 0-32-14.3-32-32V48l112 112h-80z",
  },
  video: {
    viewBox: "0 0 576 512",
    path: "M0 128C0 92.7 28.7 64 64 64l256 0c35.3 0 64 28.7 64 64l0 256c0 35.3-28.7 64-64 64L64 448c-35.3 0-64-28.7-64-64L0 128zM559.1 99.8c10.4 5.6 16.9 16.4 16.9 28.2l0 256c0 11.8-6.5 22.6-16.9 28.2s-23 5-32.9-1.6l-96-64L416 336l0-48 0-64 0-48 14.2-9.5 96-64c9.8-6.5 22.4-7.2 32.9-1.6z",
  },
};

const TrophyIcon = ({
  size = SUBMISSION_TROPHY_ICON_SIZE,
}: {
  readonly size?: number;
}) => (
  <svg
    fill={TROPHY_COLOR}
    height={size}
    style={{
      display: "flex",
      height: size,
      marginTop: -1,
      width: size,
    }}
    viewBox="0 0 576 512"
    width={size}
  >
    <path d="M400 0L176 0c-26.5 0-48.1 21.8-47.1 48.2c.2 5.3 .4 10.6 .7 15.8L24 64C10.7 64 0 74.7 0 88c0 92.6 33.5 157 78.5 200.7c34.2 33.1 73.7 52.3 105.2 63.4c22.4 26 47 41.8 68.3 49.2L252 464l-64 0c-17.7 0-32 14.3-32 32s14.3 32 32 32l160 0c17.7 0 32-14.3 32-32s-14.3-32-32-32l-64 0l0-62.7c21.3-7.4 45.9-23.2 68.3-49.2c31.5-11.1 70-30.3 105.2-63.4C522.5 245 576 180.6 576 88c0-13.3-10.7-24-24-24l-105.6 0c.3-5.2 .5-10.4 .7-15.8C448.1 21.8 426.5 0 400 0zM48.9 112l84.4 0c8.1 90.1 29.2 150.3 55.1 190.6c-24.9-10.1-52.3-25.4-76.5-48.8C78.4 221.3 54.1 174.9 48.9 112zM464.1 253.8c-24.2 23.4-51.6 38.7-76.5 48.8c25.9-40.3 47-100.5 55.1-190.6l84.4 0c-5.2 62.9-29.5 109.3-63 141.8z" />
  </svg>
);

const SubmissionMediaIcon = ({
  media,
  size = SUBMISSION_TITLE_ICON_SIZE,
}: {
  readonly media: SubmissionPreviewMedia;
  readonly size?: number;
}) => {
  const icon = SUBMISSION_ICON_BY_CATEGORY[media.category];
  const iconSize = Math.round(
    size * (media.category === "interactive" ? 0.5 : 0.55)
  );
  const iconHeight =
    media.category === "video" ? Math.round((iconSize * 512) / 576) : iconSize;
  const styles = getSubmissionMediaStyles(media);

  return (
    <div
      style={{
        alignItems: "center",
        background: styles.bg,
        border: `1px solid ${styles.border}`,
        borderRadius: 8,
        color: styles.text,
        display: "flex",
        height: size,
        justifyContent: "center",
        width: size,
      }}
    >
      <svg
        fill="currentColor"
        height={iconHeight}
        viewBox={icon.viewBox}
        width={iconSize}
      >
        <path d={icon.path} />
      </svg>
    </div>
  );
};

const DropAuthorRow = ({
  author,
  authorAvatarUrl,
  authorName,
  showAdditionalActionText = false,
  wave,
}: {
  readonly author: ApiOgMetadataProfile | undefined;
  readonly authorAvatarUrl: string | null;
  readonly authorName: string;
  readonly showAdditionalActionText?: boolean;
  readonly wave: ApiOgMetadataWave | undefined;
}) => {
  const context = getDropContext({ wave });
  const contextRowWidth =
    CONTENT_WIDTH - LOGO_SIZE - 42 - AUTHOR_AVATAR_SIZE - 16;
  const promiseTextGap =
    showAdditionalActionText && context
      ? ADDITIONAL_ACTION_PROMISE_CONTEXT_GAP
      : 0;
  const promiseTextWidth = showAdditionalActionText
    ? ADDITIONAL_ACTION_PROMISE_TITLE_BADGE_WIDTH + promiseTextGap
    : 0;
  const contextText = context
    ? truncateToWidth({
        fontSize: ADDITIONAL_ACTION_PROMISE_CONTEXT_FONT_SIZE,
        value: context,
        width: Math.max(0, contextRowWidth - promiseTextWidth),
      })
    : null;

  return (
    <div
      style={{
        alignItems: "center",
        display: "flex",
        gap: 16,
        left: HORIZONTAL_MARGIN,
        position: "absolute",
        top: AUTHOR_ROW_TOP,
        width: CONTENT_WIDTH - LOGO_SIZE - 42,
      }}
    >
      <ProfileAvatar
        avatarUrl={authorAvatarUrl}
        borderRadius={14}
        innerBorderRadius={11}
        innerSize={AUTHOR_AVATAR_INNER_SIZE}
        size={AUTHOR_AVATAR_SIZE}
      />
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 3,
        }}
      >
        <div
          style={{
            alignItems: "center",
            display: "flex",
            gap: 10,
          }}
        >
          <div
            style={{
              color: "#ffffff",
              display: "flex",
              fontSize: 34,
              fontWeight: 700,
              lineHeight: 1.15,
              maxWidth: 320,
              overflow: "hidden",
            }}
          >
            {truncateText(authorName, 18)}
          </div>
          <ProfileBadgeRow
            activityBorderRadius={10}
            activityIconSize={18}
            badgeSize={AUTHOR_BADGE_SIZE}
            cicFontSize={24}
            glassesSize={29}
            levelFontSize={15}
            profile={author}
          />
        </div>
        <div
          style={{
            alignItems: "center",
            display: "flex",
            fontSize: ADDITIONAL_ACTION_PROMISE_CONTEXT_FONT_SIZE,
            fontWeight: 500,
            gap: ADDITIONAL_ACTION_PROMISE_CONTEXT_GAP,
            lineHeight: 1.25,
            maxWidth: contextRowWidth,
            overflow: "hidden",
            whiteSpace: "nowrap",
          }}
        >
          {contextText ? (
            <span
              style={{
                color: MUTED_TEXT,
                display: "flex",
                overflow: "hidden",
                whiteSpace: "nowrap",
              }}
            >
              {contextText}
            </span>
          ) : null}
          {showAdditionalActionText ? <AdditionalActionPromiseBadge /> : null}
        </div>
      </div>
    </div>
  );
};

const getSubmissionTitle = (
  drop: ApiOgMetadataDrop | undefined,
  id: string
): string =>
  getUsableText(drop?.title) ??
  getUsableText(drop?.content) ??
  getUsableText(drop?.description) ??
  `Drop #${drop?.serial_no ?? id}`;

const getSubmissionTitleWidth = (): number =>
  CONTENT_WIDTH - SUBMISSION_TITLE_ICON_SIZE - SUBMISSION_TITLE_GAP;

const getSubmissionVisualImage = (
  media: readonly ApiOgMediaAsset[] | null | undefined
): ApiOgMediaAsset | undefined => getImageMediaAssets(media)[0];

const getSubmissionVotes = (
  drop: ApiOgMetadataDrop | undefined
): {
  readonly tdh: string;
  readonly voters: number;
} => ({
  tdh: formatInteger(drop?.votes?.current_calculated_vote) ?? "0",
  voters:
    typeof drop?.votes?.voters_count === "number" &&
    Number.isFinite(drop.votes.voters_count)
      ? drop.votes.voters_count
      : 0,
});

const formatSubmissionDate = (
  timestamp: number | null | undefined
): string | null => {
  if (typeof timestamp !== "number" || !Number.isFinite(timestamp)) {
    return null;
  }

  return SUBMISSION_DATE_FORMATTER.format(new Date(timestamp));
};

const getSubmissionStatDate = ({
  submittedAt,
  wonAt,
}: {
  readonly submittedAt: string | null;
  readonly wonAt: string | null;
}): { readonly label: string; readonly value: string } | null => {
  if (wonAt) {
    return { label: "Winner", value: wonAt };
  }

  if (submittedAt) {
    return { label: "Submitted", value: submittedAt };
  }

  return null;
};

const SubmissionMediaPlaceholder = ({
  media,
}: {
  readonly media: SubmissionPreviewMedia;
}) => (
  <div
    style={{
      alignItems: "center",
      borderRadius: 28,
      display: "flex",
      flexDirection: "column",
      gap: 16,
      height: SUBMISSION_MEDIA_HEIGHT,
      justifyContent: "center",
      width: CONTENT_WIDTH,
    }}
  >
    <SubmissionMediaIcon media={media} size={78} />
    <div
      style={{
        color: MUTED_TEXT,
        display: "flex",
        fontSize: 28,
        fontWeight: 600,
        maxWidth: CONTENT_WIDTH - 160,
        overflow: "hidden",
        textAlign: "center",
        whiteSpace: "nowrap",
      }}
    >
      {truncateText(media.label, 42)}
    </div>
  </div>
);

function AdditionalActionPromiseBadge() {
  return (
    <div
      style={{
        alignItems: "center",
        alignSelf: "center",
        background: ADDITIONAL_ACTION_PROMISE_BACKGROUND,
        border: `1px solid ${ADDITIONAL_ACTION_PROMISE_BORDER}`,
        borderRadius: 999,
        color: ADDITIONAL_ACTION_PROMISE_TEXT,
        display: "flex",
        flexShrink: 0,
        fontSize: ADDITIONAL_ACTION_PROMISE_TITLE_FONT_SIZE,
        fontWeight: 600,
        height: ADDITIONAL_ACTION_PROMISE_TITLE_BADGE_HEIGHT,
        justifyContent: "center",
        lineHeight: 1,
        padding: "0 12px",
        whiteSpace: "nowrap",
        width: ADDITIONAL_ACTION_PROMISE_TITLE_BADGE_WIDTH,
      }}
    >
      {ADDITIONAL_ACTION_PROMISE_LABEL}
    </div>
  );
}

const renderSubmissionDropOgImage = ({
  author,
  authorAvatarUrl,
  authorName,
  drop,
  id,
  origin,
  wave,
}: {
  readonly author: ApiOgMetadataProfile | undefined;
  readonly authorAvatarUrl: string | null;
  readonly authorName: string;
  readonly drop: ApiOgMetadataDrop | undefined;
  readonly id: string;
  readonly origin: string;
  readonly wave: ApiOgMetadataWave | undefined;
}) => {
  const submissionMedia = getSubmissionPreviewMedia(drop?.media);
  const visualImage = getSubmissionVisualImage(drop?.media);
  const visualImageUrl = getMediaProxyUrl({
    sourceUrl: getUsableText(visualImage?.url),
    origin,
    width: CONTENT_WIDTH,
  });
  const rawTitle = getSubmissionTitle(drop, id);
  const votes = getSubmissionVotes(drop);
  const submittedAt = formatSubmissionDate(drop?.submitted_at);
  const wonAt = formatSubmissionDate(drop?.won_at);
  const statDate = getSubmissionStatDate({ submittedAt, wonAt });
  const isAdditionalActionPromised =
    drop?.is_additional_action_promised === true;
  const title = truncateToWidth({
    fontSize: SUBMISSION_TITLE_FONT_SIZE,
    value: rawTitle,
    width: getSubmissionTitleWidth(),
  });

  return (
    <div
      style={{
        background: CARD_BACKGROUND,
        color: "#ffffff",
        display: "flex",
        fontFamily: "Montserrat, sans-serif",
        height: CANVAS_HEIGHT,
        overflow: "hidden",
        position: "relative",
        width: CANVAS_WIDTH,
      }}
    >
      <div
        style={{
          background: CONTENT_BACKGROUND,
          display: "flex",
          height: SUBMISSION_MEDIA_HEIGHT,
          left: 0,
          position: "absolute",
          top: SUBMISSION_MEDIA_TOP,
          width: CANVAS_WIDTH,
        }}
      />
      <div
        style={{
          display: "flex",
          height: LOGO_SIZE,
          position: "absolute",
          right: HORIZONTAL_MARGIN,
          top: HORIZONTAL_MARGIN,
          width: LOGO_SIZE,
        }}
      >
        <img
          alt=""
          height={LOGO_SIZE}
          src={LOGO_URL}
          style={{
            height: LOGO_SIZE,
            objectFit: "contain",
            opacity: 0.75,
            width: LOGO_SIZE,
          }}
          width={LOGO_SIZE}
        />
      </div>

      <DropAuthorRow
        author={author}
        authorAvatarUrl={authorAvatarUrl}
        authorName={authorName}
        showAdditionalActionText={isAdditionalActionPromised}
        wave={wave}
      />

      <div
        style={{
          alignItems: "center",
          display: "flex",
          gap: SUBMISSION_TITLE_GAP,
          justifyContent: "flex-start",
          left: HORIZONTAL_MARGIN,
          position: "absolute",
          top: SUBMISSION_TITLE_TOP,
          width: CONTENT_WIDTH,
        }}
      >
        <SubmissionMediaIcon media={submissionMedia} />
        <div
          style={{
            color: "#ffffff",
            display: "flex",
            fontSize: SUBMISSION_TITLE_FONT_SIZE,
            fontWeight: 700,
            lineHeight: 1.15,
            maxWidth: getSubmissionTitleWidth(),
            overflow: "hidden",
            whiteSpace: "nowrap",
          }}
        >
          {title}
        </div>
      </div>

      <div
        style={{
          alignItems: "center",
          display: "flex",
          height: SUBMISSION_MEDIA_HEIGHT,
          justifyContent: "center",
          left: HORIZONTAL_MARGIN,
          overflow: "hidden",
          position: "absolute",
          top: SUBMISSION_MEDIA_TOP,
          width: CONTENT_WIDTH,
        }}
      >
        {visualImageUrl ? (
          <img
            alt=""
            height={SUBMISSION_MEDIA_CONTENT_HEIGHT}
            src={visualImageUrl}
            style={{
              height: SUBMISSION_MEDIA_CONTENT_HEIGHT,
              objectFit: "contain",
              objectPosition: "center center",
              width: CONTENT_WIDTH,
            }}
            width={CONTENT_WIDTH}
          />
        ) : (
          <SubmissionMediaPlaceholder media={submissionMedia} />
        )}
      </div>

      <div
        style={{
          alignItems: "center",
          display: "flex",
          fontSize: SUBMISSION_STATS_FONT_SIZE,
          fontWeight: 600,
          gap: SUBMISSION_STATS_GROUP_GAP,
          justifyContent: statDate ? "space-between" : "center",
          left: HORIZONTAL_MARGIN,
          position: "absolute",
          top: SUBMISSION_STATS_TOP,
          width: CONTENT_WIDTH,
        }}
      >
        <div
          style={{
            alignItems: "center",
            display: "flex",
            gap: SUBMISSION_STATS_GROUP_GAP,
          }}
        >
          <div
            style={{
              alignItems: "center",
              display: "flex",
              gap: SUBMISSION_STATS_VALUE_GAP,
            }}
          >
            <span style={{ color: "#ffffff" }}>{votes.tdh}</span>
            <span style={{ color: MUTED_TEXT }}>TDH</span>
          </div>
          <div
            style={{
              alignItems: "center",
              display: "flex",
              gap: SUBMISSION_STATS_VALUE_GAP,
            }}
          >
            <span style={{ color: "#ffffff" }}>
              {formatInteger(votes.voters) ?? "0"}
            </span>
            <span style={{ color: MUTED_TEXT }}>
              {pluralize(votes.voters, "Voter", "Voters")}
            </span>
          </div>
        </div>
        {statDate ? (
          <div
            style={{
              alignItems: "center",
              display: "flex",
              gap: SUBMISSION_STATS_VALUE_GAP,
            }}
          >
            {statDate.label === "Winner" ? (
              <TrophyIcon size={SUBMISSION_STATS_TROPHY_ICON_SIZE} />
            ) : null}
            <span style={{ color: MUTED_TEXT }}>{statDate.label}</span>
            <span style={{ color: "#ffffff" }}>{statDate.value}</span>
          </div>
        ) : null}
      </div>
    </div>
  );
};

const getContentLineRows = (
  contentLines: readonly DropContentLine[]
): readonly KeyedContentLineRow[] => {
  const countsByBaseKey = new Map<string, number>();
  return contentLines.map((line, lineIndex) => {
    const baseKey = `${line.kind}-${line.text}`;
    const count = (countsByBaseKey.get(baseKey) ?? 0) + 1;
    countsByBaseKey.set(baseKey, count);

    return {
      key: `${baseKey}-${count}`,
      line,
      previousLine: contentLines[lineIndex - 1],
    };
  });
};

const getContentSegmentColor = (segment: DropContentLineSegment): string =>
  segment.kind === "reference" ? LINK_TEXT : "#ffffff";

const getContentLineSegments = (
  line: DropContentLine
): readonly DropContentLineSegment[] =>
  line.segments ?? [{ kind: "text", text: line.text }];

const DropContentLines = ({
  contentLines,
  contentTop,
  shouldCenterContent,
}: {
  readonly contentLines: readonly DropContentLine[];
  readonly contentTop: number;
  readonly shouldCenterContent: boolean;
}) => {
  if (contentLines.length === 0) {
    return null;
  }

  return (
    <div
      style={{
        color: "#ffffff",
        alignItems: shouldCenterContent ? "center" : "flex-start",
        display: "flex",
        flexDirection: "column",
        fontSize: CONTENT_FONT_SIZE,
        fontWeight: 500,
        left: HORIZONTAL_MARGIN,
        letterSpacing: 0,
        lineHeight: CONTENT_LINE_HEIGHT,
        position: "absolute",
        top: contentTop,
        width: CONTENT_WIDTH,
      }}
    >
      {getContentLineRows(contentLines).map(({ key, line, previousLine }) => (
        <div
          key={key}
          style={{
            alignItems: "center",
            color: getContentLineColor(line.kind),
            display: "flex",
            lineHeight: CONTENT_LINE_HEIGHT,
            marginBottom: isAttachmentLine(line)
              ? ATTACHMENT_ROW_BOTTOM_MARGIN
              : 0,
            marginTop: getAttachmentLineTopMargin(line, previousLine),
            minHeight:
              line.text === "" ? CONTENT_FONT_SIZE * CONTENT_LINE_HEIGHT : 0,
            overflow: "hidden",
            whiteSpace: "nowrap",
            width: shouldCenterContent ? "auto" : CONTENT_WIDTH,
          }}
        >
          {line.kind === "video" ? <VideoContentIcon /> : null}
          {line.kind === "file" ? <FileContentIcon /> : null}
          {line.segments
            ? getContentLineSegments(line).map((segment, segmentIndex) => (
                <span
                  key={`${key}-${segmentIndex}`}
                  style={{ color: getContentSegmentColor(segment) }}
                >
                  {segment.text}
                </span>
              ))
            : line.text}
        </div>
      ))}
    </div>
  );
};

const SingleDropMedia = ({
  mediaPresentation,
  singleMediaUrl,
}: {
  readonly mediaPresentation: DropMediaPresentation | null;
  readonly singleMediaUrl: string | null;
}) => {
  if (mediaPresentation?.kind !== "single") {
    return null;
  }

  const presentation: SingleDropMediaPresentation = mediaPresentation;

  return (
    <div
      style={{
        alignItems: "center",
        background: "transparent",
        borderBottomLeftRadius: presentation.layout.crop ? 0 : 28,
        borderBottomRightRadius: presentation.layout.crop ? 0 : 28,
        borderTopLeftRadius: 28,
        borderTopRightRadius: 28,
        display: "flex",
        height: presentation.layout.frameHeight,
        justifyContent: "center",
        left: presentation.layout.frameLeft,
        overflow: "hidden",
        position: "absolute",
        top: presentation.layout.frameTop,
        width: presentation.layout.frameWidth,
      }}
    >
      {singleMediaUrl ? (
        <img
          alt=""
          height={presentation.layout.imageHeight}
          src={singleMediaUrl}
          style={{
            height: presentation.layout.imageHeight,
            objectFit: presentation.layout.crop ? "cover" : "contain",
            objectPosition: "top center",
            width: presentation.layout.imageWidth,
          }}
          width={presentation.layout.imageWidth}
        />
      ) : (
        <div
          style={{
            alignItems: "center",
            background: "linear-gradient(135deg, #18181B 0%, #27272A 100%)",
            color: MUTED_TEXT,
            display: "flex",
            fontSize: 30,
            fontWeight: 600,
            height: presentation.layout.frameHeight,
            justifyContent: "center",
            width: presentation.layout.frameWidth,
          }}
        >
          Video
        </div>
      )}
    </div>
  );
};

const getMediaTileKey = (tile: DropMediaTile): string =>
  tile.item.sourceUrl ??
  `${tile.layout.frameLeft}-${tile.layout.frameTop}-${tile.layout.frameWidth}-${tile.layout.frameHeight}`;

const DropMediaGallery = ({
  mediaPresentation,
  origin,
}: {
  readonly mediaPresentation: DropMediaPresentation | null;
  readonly origin: string;
}) => {
  if (mediaPresentation?.kind !== "gallery") {
    return null;
  }

  const presentation: GalleryDropMediaPresentation = mediaPresentation;

  return (
    <div
      style={{
        display: "flex",
        height: presentation.frameHeight,
        left: presentation.frameLeft,
        position: "absolute",
        top: presentation.frameTop,
        width: presentation.frameWidth,
      }}
    >
      {presentation.tiles.map((tile) => {
        const tileMediaUrl = tile.item.sourceUrl
          ? getMediaProxyUrl({
              sourceUrl: tile.item.sourceUrl,
              origin,
              width: tile.layout.proxyWidth,
            })
          : null;

        return (
          <div
            key={getMediaTileKey(tile)}
            style={{
              alignItems: "center",
              background: "transparent",
              borderBottomLeftRadius: tile.layout.borderBottomLeftRadius,
              borderBottomRightRadius: tile.layout.borderBottomRightRadius,
              borderTopLeftRadius: tile.layout.borderTopLeftRadius,
              borderTopRightRadius: tile.layout.borderTopRightRadius,
              display: "flex",
              height: tile.layout.frameHeight,
              justifyContent: "center",
              left: tile.layout.frameLeft,
              overflow: "hidden",
              position: "absolute",
              top: tile.layout.frameTop,
              width: tile.layout.frameWidth,
            }}
          >
            {tileMediaUrl ? (
              <img
                alt=""
                height={tile.layout.frameHeight}
                src={tileMediaUrl}
                style={{
                  height: tile.layout.frameHeight,
                  objectFit: tile.layout.objectFit,
                  objectPosition:
                    tile.layout.objectFit === "cover"
                      ? "top center"
                      : "center center",
                  width: tile.layout.frameWidth,
                }}
                width={tile.layout.frameWidth}
              />
            ) : (
              <div
                style={{
                  alignItems: "center",
                  background:
                    "linear-gradient(135deg, #18181B 0%, #27272A 100%)",
                  color: MUTED_TEXT,
                  display: "flex",
                  fontSize: 24,
                  fontWeight: 600,
                  height: tile.layout.frameHeight,
                  justifyContent: "center",
                  width: tile.layout.frameWidth,
                }}
              >
                Video
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

const getChatDropOgImageModel = ({
  drop,
  id,
  origin,
}: {
  readonly drop: ApiOgMetadataDrop | undefined;
  readonly id: string;
  readonly origin: string;
}) => {
  const dropText = getDropText(drop, id);
  const hasText =
    getUsableText(drop?.content ?? drop?.description ?? drop?.title) !== null;
  const attachmentLines = [
    ...getVideoLines(drop?.media),
    ...getFileLines(drop?.files),
  ];
  const textLinesWithoutMedia = getContentLines({
    value: hasText ? dropText : "",
    maxLines: CONTENT_MAX_LINES_WITHOUT_MEDIA,
  });
  const mediaAssets = getImageMediaAssets(drop?.media);
  const showMedia = shouldShowMedia({
    mediaAssets,
    textLinesWithoutMedia,
    hasText,
  });
  const maxContentLines = showMedia
    ? CONTENT_MAX_LINES_WITH_MEDIA
    : CONTENT_MAX_LINES_WITHOUT_MEDIA;
  const visibleAttachmentLines = getVisibleAttachmentLines({
    attachmentLines,
    maxAttachmentRows: showMedia
      ? ATTACHMENT_ROWS_WITH_MEDIA
      : ATTACHMENT_ROWS_WITHOUT_MEDIA,
  });
  const textLineBudget = Math.max(
    0,
    maxContentLines - visibleAttachmentLines.length
  );
  const contentLines = [
    ...getContentLines({
      value: hasText ? dropText : "",
      maxLines: textLineBudget,
    }),
    ...visibleAttachmentLines.slice(0, maxContentLines),
  ];
  const hasAttachments = contentLines.some(isAttachmentLine);
  const shouldCenterContent =
    !showMedia &&
    !hasAttachments &&
    getNonBlankContentLineCount(contentLines) <= 4;
  const mediaPresentation = showMedia
    ? getMediaPresentation({
        mediaAssets,
        textLineCount: contentLines.length,
      })
    : null;
  const singleMediaUrl =
    mediaPresentation?.kind === "single" && mediaPresentation.item.sourceUrl
      ? getMediaProxyUrl({
          sourceUrl: mediaPresentation.item.sourceUrl,
          origin,
          width: mediaPresentation.layout.proxyWidth,
        })
      : null;

  return {
    contentLines,
    contentTop: getContentTop({
      lineCount: contentLines.length,
      showMedia,
    }),
    mediaPresentation,
    shouldCenterContent,
    singleMediaUrl,
  };
};

export const renderDropOgImage = ({
  author,
  drop,
  id,
  origin = publicEnv.BASE_ENDPOINT,
  wave,
}: {
  readonly author: ApiOgMetadataProfile | undefined;
  readonly drop: ApiOgMetadataDrop | undefined;
  readonly id: string;
  readonly origin?: string;
  readonly wave: ApiOgMetadataWave | undefined;
}) => {
  const authorName = getProfileDisplayName(author);
  const authorAvatarUrl = getMediaProxyUrl({
    sourceUrl: getFirstMediaUrl(author?.media),
    origin,
    width: AUTHOR_AVATAR_INNER_SIZE,
  });

  if (drop?.drop_type === "SUBMISSION") {
    return renderSubmissionDropOgImage({
      author,
      authorAvatarUrl,
      authorName,
      drop,
      id,
      origin,
      wave,
    });
  }

  const model = getChatDropOgImageModel({ drop, id, origin });

  return (
    <div
      style={{
        background: CARD_BACKGROUND,
        color: "#ffffff",
        display: "flex",
        fontFamily: "Montserrat, sans-serif",
        height: CANVAS_HEIGHT,
        overflow: "hidden",
        position: "relative",
        width: CANVAS_WIDTH,
      }}
    >
      <div
        style={{
          background: CONTENT_BACKGROUND,
          display: "flex",
          height: CANVAS_HEIGHT - CHAT_CONTENT_BACKGROUND_TOP,
          left: 0,
          position: "absolute",
          top: CHAT_CONTENT_BACKGROUND_TOP,
          width: CANVAS_WIDTH,
        }}
      />
      <div
        style={{
          display: "flex",
          height: LOGO_SIZE,
          position: "absolute",
          right: HORIZONTAL_MARGIN,
          top: HORIZONTAL_MARGIN,
          width: LOGO_SIZE,
        }}
      >
        <img
          alt=""
          height={LOGO_SIZE}
          src={LOGO_URL}
          style={{
            height: LOGO_SIZE,
            objectFit: "contain",
            opacity: 0.75,
            width: LOGO_SIZE,
          }}
          width={LOGO_SIZE}
        />
      </div>

      <DropAuthorRow
        author={author}
        authorAvatarUrl={authorAvatarUrl}
        authorName={authorName}
        wave={wave}
      />

      <DropContentLines
        contentLines={model.contentLines}
        contentTop={model.contentTop}
        shouldCenterContent={model.shouldCenterContent}
      />
      <SingleDropMedia
        mediaPresentation={model.mediaPresentation}
        singleMediaUrl={model.singleMediaUrl}
      />
      <DropMediaGallery
        mediaPresentation={model.mediaPresentation}
        origin={origin}
      />
    </div>
  );
};
