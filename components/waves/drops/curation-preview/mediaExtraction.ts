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

const getImageFormat = (format: string | null | undefined): string | null => {
  const normalized = format?.trim().toLowerCase();
  return normalized && DIRECT_IMAGE_FORMATS.has(normalized) ? normalized : null;
};

const getPathImageFormat = (pathname: string): string | null => {
  const dotIndex = pathname.lastIndexOf(".");
  return dotIndex === -1 ? null : getImageFormat(pathname.slice(dotIndex + 1));
};

const getUrlPathEndIndex = (url: string): number => {
  const indexes = [url.indexOf("?"), url.indexOf("#")].filter(
    (index) => index >= 0
  );
  return indexes.length > 0 ? Math.min(...indexes) : url.length;
};

const getDirectImageFormat = (url: string): string | null => {
  try {
    const parsed = new URL(url);
    return (
      getPathImageFormat(parsed.pathname) ??
      getImageFormat(parsed.searchParams.get("format"))
    );
  } catch {
    return getPathImageFormat(url.slice(0, getUrlPathEndIndex(url)));
  }
};

const inferImageMimeType = (url: string): string | null => {
  const hasDirectImageFormat = Boolean(getDirectImageFormat(url));
  return hasDirectImageFormat ? "image/*" : null;
};

const isImageLikeMedia = (url: string, mimeType: string | null): boolean =>
  mimeType?.toLowerCase().startsWith("image/") === true ||
  getDirectImageFormat(url) !== null;

export const getDropMedia = (
  drop: PreviewDropContent,
  urls: readonly string[]
): PreviewMedia[] => {
  const attachedMedia = drop.parts
    .flatMap((part) => part.media)
    .filter((media) => media.url.length > 0)
    .filter((media) => isImageLikeMedia(media.url, media.mime_type))
    .map(
      (media): PreviewMedia => ({
        url: media.url,
        width: null,
        height: null,
        isVideo: false,
      })
    );

  const linkPreviewMedia =
    drop.nft_links?.flatMap((link): PreviewMedia[] => {
      const preview = link.data?.media_preview ?? null;
      const previewUrl =
        getTrimmedText(preview?.card_url) ??
        getTrimmedText(preview?.small_url) ??
        getTrimmedText(preview?.thumb_url) ??
        getTrimmedText(link.data?.media_uri);

      if (previewUrl === null) {
        return [];
      }

      const previewStatus = preview?.status ?? null;
      if (previewStatus !== null && previewStatus !== "READY") {
        return [];
      }

      const mimeType =
        getTrimmedText(preview?.mime_type) ??
        inferImageMimeType(previewUrl) ??
        "";

      if (
        previewStatus !== "READY" &&
        !isImageLikeMedia(previewUrl, mimeType)
      ) {
        return [];
      }

      return [
        {
          url: previewUrl,
          width: preview?.width ?? null,
          height: preview?.height ?? null,
          isVideo: preview?.kind?.toLowerCase() === "video",
        },
      ];
    }) ?? [];

  const directMedia = urls
    .filter((url) => getDirectImageFormat(url) !== null)
    .map(
      (url): PreviewMedia => ({
        url,
        width: null,
        height: null,
        isVideo: false,
      })
    );

  const uniqueMedia = new Map<string, PreviewMedia>();
  for (const media of [...attachedMedia, ...linkPreviewMedia, ...directMedia]) {
    if (!uniqueMedia.has(media.url)) {
      uniqueMedia.set(media.url, media);
    }
  }

  return [...uniqueMedia.values()];
};
