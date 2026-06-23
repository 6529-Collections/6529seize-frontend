import type { PreviewDropContent, PreviewMedia } from "./types";
import { getTrimmedText } from "./utils";

const DIRECT_IMAGE_FORMATS = new Set([
  "avif",
  "gif",
  "jpg",
  "jpeg",
  "png",
  "webp",
]);
const DIRECT_VIDEO_FORMATS = new Set(["m4v", "mov", "mp4", "ogv", "webm"]);

const getKnownFormat = (
  format: string | null | undefined,
  allowedFormats: ReadonlySet<string>
): string | null => {
  const normalized = format?.trim().toLowerCase();
  return normalized && allowedFormats.has(normalized) ? normalized : null;
};

const getPathFormat = (
  pathname: string,
  allowedFormats: ReadonlySet<string>
): string | null => {
  const dotIndex = pathname.lastIndexOf(".");
  return dotIndex === -1
    ? null
    : getKnownFormat(pathname.slice(dotIndex + 1), allowedFormats);
};

const getUrlPathEndIndex = (url: string): number => {
  const indexes = [url.indexOf("?"), url.indexOf("#")].filter(
    (index) => index >= 0
  );
  return indexes.length > 0 ? Math.min(...indexes) : url.length;
};

const getDirectFormat = (
  url: string,
  allowedFormats: ReadonlySet<string>
): string | null => {
  try {
    const parsed = new URL(url);
    return (
      getPathFormat(parsed.pathname, allowedFormats) ??
      getKnownFormat(parsed.searchParams.get("format"), allowedFormats)
    );
  } catch {
    return getPathFormat(url.slice(0, getUrlPathEndIndex(url)), allowedFormats);
  }
};

const getDirectImageFormat = (url: string): string | null =>
  getDirectFormat(url, DIRECT_IMAGE_FORMATS);

const getDirectVideoFormat = (url: string): string | null =>
  getDirectFormat(url, DIRECT_VIDEO_FORMATS);

const inferImageMimeType = (url: string): string | null => {
  const hasDirectImageFormat = Boolean(getDirectImageFormat(url));
  return hasDirectImageFormat ? "image/*" : null;
};

const isImageLikeMedia = (url: string, mimeType: string | null): boolean =>
  mimeType?.toLowerCase().startsWith("image/") === true ||
  getDirectImageFormat(url) !== null;

const isRenderableImageUrl = (url: string, mimeType: string | null): boolean =>
  getDirectVideoFormat(url) === null && isImageLikeMedia(url, mimeType);

const isVideoLikeMedia = ({
  kind,
  mimeType,
  url,
}: {
  readonly kind: string | null;
  readonly mimeType: string | null;
  readonly url: string;
}): boolean =>
  kind === "video" ||
  mimeType?.toLowerCase().startsWith("video/") === true ||
  getDirectVideoFormat(url) !== null;

const getImageUrl = (
  urls: readonly string[],
  mimeType: string | null
): string | null =>
  urls.find((url) => isRenderableImageUrl(url, mimeType)) ?? null;

const toPreviewMedia = ({
  sourceUrl,
  mimeType,
  kind = null,
  imageUrls = [sourceUrl],
  width = null,
  height = null,
}: {
  readonly sourceUrl: string;
  readonly mimeType: string | null;
  readonly kind?: string | null;
  readonly imageUrls?: readonly string[];
  readonly width?: number | null;
  readonly height?: number | null;
}): PreviewMedia | null => {
  const imageUrl = getImageUrl(
    imageUrls.length > 0 ? imageUrls : [sourceUrl],
    mimeType
  );

  if (isVideoLikeMedia({ kind, mimeType, url: sourceUrl })) {
    return {
      kind: "video",
      sourceUrl,
      imageUrl,
      width,
      height,
    };
  }

  if (imageUrl === null) {
    return null;
  }

  return {
    kind: "image",
    sourceUrl,
    imageUrl,
    width,
    height,
  };
};

const compact = <T>(value: T | null): T[] => (value === null ? [] : [value]);

const uniqueNonNull = <T>(values: readonly (T | null | undefined)[]): T[] => [
  ...new Set(
    values.filter((value): value is T => value !== null && value !== undefined)
  ),
];

export const getDropMedia = (
  drop: PreviewDropContent,
  urls: readonly string[]
): PreviewMedia[] => {
  const attachedMedia = drop.parts
    .flatMap((part) => part.media)
    .filter((media) => media.url.length > 0)
    .flatMap((media) =>
      compact(
        toPreviewMedia({
          sourceUrl: media.url,
          mimeType: media.mime_type,
        })
      )
    );

  const linkPreviewMedia =
    drop.nft_links?.flatMap((link): PreviewMedia[] => {
      const preview = link.data?.media_preview ?? null;
      const previewUrls = uniqueNonNull([
        getTrimmedText(preview?.card_url),
        getTrimmedText(preview?.small_url),
        getTrimmedText(preview?.thumb_url),
      ]);
      const mediaUri = getTrimmedText(link.data?.media_uri);
      const sourceUrl = previewUrls[0] ?? mediaUri;
      const imageUrls = uniqueNonNull([...previewUrls, mediaUri]);

      if (sourceUrl === null) {
        return [];
      }

      const previewStatus = preview?.status ?? null;
      if (previewStatus !== null && previewStatus !== "READY") {
        return [];
      }

      const mimeType =
        getTrimmedText(preview?.mime_type) ??
        inferImageMimeType(sourceUrl) ??
        null;
      const kind = getTrimmedText(preview?.kind)?.toLowerCase() ?? null;
      return compact(
        toPreviewMedia({
          sourceUrl,
          mimeType,
          kind,
          imageUrls,
          width: preview?.width ?? null,
          height: preview?.height ?? null,
        })
      );
    }) ?? [];

  const directMedia = urls
    .filter(
      (url) =>
        getDirectImageFormat(url) !== null || getDirectVideoFormat(url) !== null
    )
    .flatMap((url) =>
      compact(
        toPreviewMedia({
          sourceUrl: url,
          mimeType: inferImageMimeType(url),
        })
      )
    );

  const uniqueMedia = new Map<string, PreviewMedia>();
  for (const media of [...attachedMedia, ...linkPreviewMedia, ...directMedia]) {
    if (!uniqueMedia.has(media.sourceUrl)) {
      uniqueMedia.set(media.sourceUrl, media);
    }
  }

  return [...uniqueMedia.values()];
};
