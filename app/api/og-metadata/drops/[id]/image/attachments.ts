import { getSubmissionMediaTypeInfo } from "@/constants/submission-media.constants";
import type { ApiAttachment } from "@/generated/models/ApiAttachment";
import type { ApiOgMediaAsset } from "@/generated/models/ApiOgMediaAsset";
import { getUsableText } from "@/app/api/og-metadata/_lib/imageUtils";
import { isAllowedOgImageSourceUrl } from "@/app/api/og-metadata/_lib/imageProxyPolicy";
import {
  GENERIC_FILENAME_TOKENS,
  HEX_FILENAME_PATTERN,
  IMAGE_URL_PATTERN,
  INTERACTIVE_URL_PATTERN,
  MEDIA_GALLERY_MAX_ITEMS,
  NUMERIC_FILENAME_PATTERN,
  UUID_FILENAME_PATTERN,
  VIDEO_URL_PATTERN,
} from "./constants";
import type {
  DropContentLine,
  DropMediaKind,
  SubmissionMediaStyles,
  SubmissionPreviewMedia,
  SubmissionPreviewMediaCategory,
} from "./types";

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

export {
  getFileLines,
  getImageMediaAssets,
  getSubmissionMediaStyles,
  getSubmissionPreviewMedia,
  getVideoLines,
  getVisibleAttachmentLines,
};
