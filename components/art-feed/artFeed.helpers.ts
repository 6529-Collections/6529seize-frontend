import { resolveIpfsUrlSync } from "@/components/ipfs/IPFSContext";
import { buildProcessedContent } from "@/components/waves/drops/media-utils";
import type { ApiDrop } from "@/generated/models/ApiDrop";
import { ApiNftLinkMediaPreviewStatusEnum } from "@/generated/models/ApiNftLinkMediaPreview";
import { formatAddress } from "@/helpers/Helpers";
import { getWaveRoute } from "@/helpers/navigation.helpers";
import { getDropPreviewImageUrl } from "@/helpers/waves/drop.helpers";

export interface ArtFeedMediaPreview {
  readonly url: string;
  readonly kind: "image" | "video";
}

export type ArtFeedMediaType = "image" | "video" | "audio" | "other";

const getCombinedDropContent = (drop: ApiDrop): string =>
  drop.parts
    .map((part) => part.content?.trim())
    .filter((content): content is string => Boolean(content))
    .join("\n\n");

const toNonEmptyString = (value: string | null | undefined): string | null => {
  const trimmed = value?.trim();
  if (!trimmed) {
    return null;
  }

  return trimmed;
};

const getMediaTypeFromMimeType = (
  mimeType: string | null | undefined
): ArtFeedMediaType | null => {
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
): ArtFeedMediaType | null => {
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

const getNftLinkMediaType = (drop: ApiDrop): ArtFeedMediaType | null => {
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

export const getArtFeedText = (drop: ApiDrop): string | null => {
  const combinedContent = getCombinedDropContent(drop);

  if (!combinedContent) {
    return null;
  }

  const processed = buildProcessedContent(combinedContent, []);
  const text = processed.segments
    .filter((segment) => segment.type === "text")
    .map((segment) => segment.content.trim())
    .filter(Boolean)
    .join(" ");

  return text.length > 0 ? text : null;
};

export const getArtFeedTitle = (drop: ApiDrop): string => {
  const title = drop.title?.trim();
  if (title) {
    return title;
  }

  const text = getArtFeedText(drop);
  if (text) {
    return text.length > 90 ? `${text.slice(0, 87)}...` : text;
  }

  return "Untitled ART drop";
};

export const getArtFeedMediaPreview = (
  drop: ApiDrop
): ArtFeedMediaPreview | null => {
  const previewImageUrl = getDropPreviewImageUrl(drop.metadata);
  if (previewImageUrl) {
    return {
      kind: "image",
      url: resolveIpfsUrlSync(previewImageUrl),
    };
  }

  const media = drop.parts.flatMap((part) => part.media).at(0);
  if (!media) {
    return null;
  }

  const mimeType = media.mime_type.toLowerCase();
  if (mimeType.startsWith("image/")) {
    return {
      kind: "image",
      url: resolveIpfsUrlSync(media.url),
    };
  }

  if (mimeType.startsWith("video/")) {
    return {
      kind: "video",
      url: resolveIpfsUrlSync(media.url),
    };
  }

  return null;
};

export const getArtFeedMediaType = (drop: ApiDrop): ArtFeedMediaType => {
  if (getDropPreviewImageUrl(drop.metadata)) {
    return "image";
  }

  const media = drop.parts.flatMap((part) => part.media).at(0);
  if (!media) {
    return getNftLinkMediaType(drop) ?? "other";
  }

  return getMediaTypeFromMimeType(media.mime_type) ?? "other";
};

export const getArtFeedAuthorLabel = (drop: ApiDrop): string =>
  drop.author.handle
    ? `@${drop.author.handle}`
    : formatAddress(drop.author.primary_address);

export const getArtFeedAuthorHref = (drop: ApiDrop): string =>
  `/${encodeURIComponent(drop.author.handle ?? drop.author.primary_address)}`;

export const getArtFeedDropHref = (drop: ApiDrop): string =>
  getWaveRoute({
    waveId: drop.wave.id,
    extraParams: { drop: drop.id },
    isDirectMessage: false,
    isApp: false,
  });

export const getArtFeedWaveHref = (drop: ApiDrop): string =>
  getWaveRoute({
    waveId: drop.wave.id,
    isDirectMessage: false,
    isApp: false,
  });
