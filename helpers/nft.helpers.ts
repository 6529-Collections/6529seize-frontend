import {
  GRADIENT_CONTRACT,
  MEMELAB_CONTRACT,
  MEMES_CONTRACT,
  NEXTGEN_CONTRACT,
} from "@/constants/constants";
import type { BaseNFT, NFTLite } from "@/entities/INFT";
import { getResolvedAnimationSrc } from "@/components/nft-image/utils/animation-source";
import { getResolvedImageSrc } from "@/components/nft-image/utils/image-source";
import { numberWithCommas } from "./Helpers";

interface NFTMediaDetails {
  readonly format?: string | null | undefined;
  readonly width?: number | null | undefined;
  readonly height?: number | null | undefined;
}

type NFTMediaMetadata =
  | {
      readonly animation_details?: NFTMediaDetails | null | undefined;
      readonly image_details?: NFTMediaDetails | null | undefined;
    }
  | string
  | null
  | undefined;

type ParsedNFTMediaMetadata = Exclude<
  NFTMediaMetadata,
  string | null | undefined
>;

const parseMediaMetadata = (
  metadata: NFTMediaMetadata
): ParsedNFTMediaMetadata | null => {
  if (!metadata) {
    return null;
  }

  if (typeof metadata === "object") {
    return metadata;
  }

  try {
    const parsed = JSON.parse(metadata);
    return parsed !== null && typeof parsed === "object" ? parsed : null;
  } catch {
    return null;
  }
};

const getMediaFormat = (
  details: NFTMediaDetails | null | undefined
): string | null => {
  const rawFormat = details?.format;
  if (typeof rawFormat !== "string") {
    return null;
  }

  const format = rawFormat.trim();
  return format.length > 0 ? format : null;
};

const getFormatMimeKey = (format: string | null | undefined): string | null => {
  if (typeof format !== "string") {
    return null;
  }

  const trimmed = format.trim();
  return trimmed.length > 0 ? trimmed.toUpperCase() : null;
};

const FORMAT_TO_MIME_TYPE: Record<string, string> = {
  PNG: "image/png",
  JPEG: "image/jpeg",
  JPG: "image/jpeg",
  GIF: "image/gif",
  WEBP: "image/webp",
  SVG: "image/svg+xml",
  MP4: "video/mp4",
  WEBM: "video/webm",
  MOV: "video/quicktime",
  QT: "video/quicktime",
  M4V: "video/x-m4v",
  GLB: "model/gltf-binary",
  GLTF: "model/gltf+json",
  HTML: "text/html",
  HTM: "text/html",
};

const isValidDimension = (
  value: number | null | undefined
): value is number => {
  return typeof value === "number" && Number.isFinite(value) && value > 0;
};

const getMediaDimensions = (
  details: NFTMediaDetails | null | undefined
): string | null => {
  const width = details?.width;
  const height = details?.height;

  if (!isValidDimension(width) || !isValidDimension(height)) {
    return null;
  }

  return `${numberWithCommas(width)} x ${numberWithCommas(height)}`;
};

export function getAnimationFileTypeFromMetadata(
  metadata: NFTMediaMetadata
): string | null {
  return getMediaFormat(parseMediaMetadata(metadata)?.animation_details);
}

export function getImageFileTypeFromMetadata(
  metadata: NFTMediaMetadata
): string | null {
  return getMediaFormat(parseMediaMetadata(metadata)?.image_details);
}

export function getAnimationDimensionsFromMetadata(
  metadata: NFTMediaMetadata
): string | null {
  return getMediaDimensions(parseMediaMetadata(metadata)?.animation_details);
}

export function getImageDimensionsFromMetadata(
  metadata: NFTMediaMetadata
): string | null {
  return getMediaDimensions(parseMediaMetadata(metadata)?.image_details);
}

export function getFileTypeFromMetadata(metadata: NFTMediaMetadata) {
  return (
    getAnimationFileTypeFromMetadata(metadata) ??
    getImageFileTypeFromMetadata(metadata)
  );
}

export function getMimeTypeFromFormat(
  format: string | null | undefined
): string | null {
  const normalizedFormat = getFormatMimeKey(format);
  if (!normalizedFormat) {
    return null;
  }

  return FORMAT_TO_MIME_TYPE[normalizedFormat] ?? null;
}

function getUrlExtension(url: string | null | undefined): string | null {
  if (!url) {
    return null;
  }

  const clean = url.split("?")[0]?.split("#")[0] ?? "";
  const parts = clean.split(".");
  if (parts.length < 2) {
    return null;
  }

  const ext = parts.at(-1)?.trim().toUpperCase();
  return ext || null;
}

export function getAnimationMimeTypeFromMetadata(
  metadata: NFTMediaMetadata
): string | null {
  return getMimeTypeFromFormat(getAnimationFileTypeFromMetadata(metadata));
}

export function getImageMimeTypeFromMetadata(
  metadata: NFTMediaMetadata
): string | null {
  return getMimeTypeFromFormat(getImageFileTypeFromMetadata(metadata));
}

export function getFileMimeTypeFromMetadata(metadata: NFTMediaMetadata) {
  return (
    getAnimationMimeTypeFromMetadata(metadata) ??
    getImageMimeTypeFromMetadata(metadata)
  );
}

export function getNftMimeType(
  nft: BaseNFT | NFTLite | undefined
): string | null {
  if (!nft) {
    return null;
  }

  const metadata =
    "metadata" in nft &&
    (typeof nft.metadata === "string" ||
      (nft.metadata !== null && typeof nft.metadata === "object"))
      ? (nft.metadata as NFTMediaMetadata)
      : undefined;

  const metadataMimeType = getFileMimeTypeFromMetadata(metadata);
  if (metadataMimeType) {
    return metadataMimeType;
  }

  const animationSrc = getResolvedAnimationSrc(nft);
  const animationMimeType = getMimeTypeFromFormat(
    getUrlExtension(animationSrc)
  );
  if (animationMimeType) {
    return animationMimeType;
  }

  if (animationSrc) {
    return "video/mp4";
  }

  const imageSrc = getResolvedImageSrc(nft);
  const imageMimeType = getMimeTypeFromFormat(getUrlExtension(imageSrc));
  if (imageMimeType) {
    return imageMimeType;
  }

  if (imageSrc) {
    return "image/jpeg";
  }

  return null;
}

export function getDimensionsFromMetadata(metadata: NFTMediaMetadata) {
  return (
    getAnimationDimensionsFromMetadata(metadata) ??
    getImageDimensionsFromMetadata(metadata)
  );
}

export const isMemesEcosystemContract = (contract: string): boolean => {
  return [MEMES_CONTRACT, GRADIENT_CONTRACT, MEMELAB_CONTRACT, NEXTGEN_CONTRACT]
    .map((c) => c.toLowerCase())
    .includes(contract.toLowerCase());
};
