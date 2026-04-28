import type { ApiDrop } from "@/generated/models/ApiDrop";
import { ApiNftLinkMediaPreviewStatusEnum } from "@/generated/models/ApiNftLinkMediaPreview";
import { getDropPreviewImageUrl } from "@/helpers/waves/drop.helpers";

export type CommunityCurationsMediaType = "image" | "video" | "audio" | "other";

const toNonEmptyString = (value: string | null | undefined): string | null => {
  const trimmed = value?.trim();
  if (!trimmed) {
    return null;
  }

  return trimmed;
};

const getMediaTypeFromMimeType = (
  mimeType: string | null | undefined
): CommunityCurationsMediaType | null => {
  const normalized = mimeType?.toLowerCase();
  if (!normalized) {
    return null;
  }

  if (normalized.startsWith("image/")) {
    return "image";
  }

  if (normalized.startsWith("video/")) {
    return "video";
  }

  if (normalized.startsWith("audio/")) {
    return "audio";
  }

  return null;
};

const getMediaTypeFromUrl = (
  url: string | null | undefined
): CommunityCurationsMediaType | null => {
  const normalized = url?.split(/[?#]/)[0]?.toLowerCase();
  if (!normalized) {
    return null;
  }

  if (/\.(avif|gif|jpe?g|png|webp|svg)$/.test(normalized)) {
    return "image";
  }

  if (/\.(m3u8|mov|mp4|webm)$/.test(normalized)) {
    return "video";
  }

  if (/\.(aac|flac|m4a|mp3|ogg|wav)$/.test(normalized)) {
    return "audio";
  }

  return null;
};

const getNftLinkMediaType = (
  drop: ApiDrop
): CommunityCurationsMediaType | null => {
  for (const nftLink of drop.nft_links ?? []) {
    const preview = nftLink.data?.media_preview;
    const previewUrl =
      preview?.status === ApiNftLinkMediaPreviewStatusEnum.Ready
        ? (toNonEmptyString(preview.card_url) ??
          toNonEmptyString(preview.small_url) ??
          toNonEmptyString(preview.thumb_url))
        : null;
    const previewMediaType =
      getMediaTypeFromMimeType(preview?.mime_type) ??
      getMediaTypeFromUrl(previewUrl);
    if (previewMediaType) {
      return previewMediaType;
    }

    const mediaUri = toNonEmptyString(nftLink.data?.media_uri);
    const mediaUriType = getMediaTypeFromUrl(mediaUri);
    if (mediaUriType) {
      return mediaUriType;
    }
  }

  return null;
};

export const getCommunityCurationsMediaType = (
  drop: ApiDrop
): CommunityCurationsMediaType => {
  if (getDropPreviewImageUrl(drop.metadata)) {
    return "image";
  }

  const media = drop.parts.flatMap((part) => part.media).at(0);
  if (!media) {
    return getNftLinkMediaType(drop) ?? "other";
  }

  return getMediaTypeFromMimeType(media.mime_type) ?? "other";
};
