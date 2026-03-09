import {
  GRADIENT_CONTRACT,
  MEMELAB_CONTRACT,
  MEMES_CONTRACT,
  NEXTGEN_CONTRACT,
} from "@/constants/constants";
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
  | null
  | undefined;

const getMediaFormat = (
  details: NFTMediaDetails | null | undefined
): string | null => {
  const rawFormat = details?.format;
  if (typeof rawFormat !== "string") {
    return null;
  }

  const format = rawFormat.trim();
  return format ? format : null;
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
  return getMediaFormat(metadata?.animation_details);
}

export function getImageFileTypeFromMetadata(
  metadata: NFTMediaMetadata
): string | null {
  return getMediaFormat(metadata?.image_details);
}

export function getFileTypeFromMetadata(metadata: NFTMediaMetadata) {
  return (
    getAnimationFileTypeFromMetadata(metadata) ??
    getImageFileTypeFromMetadata(metadata)
  );
}

export function getDimensionsFromMetadata(metadata: NFTMediaMetadata) {
  return (
    getMediaDimensions(metadata?.animation_details) ??
    getMediaDimensions(metadata?.image_details)
  );
}

export const isMemesEcosystemContract = (contract: string): boolean => {
  return [MEMES_CONTRACT, GRADIENT_CONTRACT, MEMELAB_CONTRACT, NEXTGEN_CONTRACT]
    .map((c) => c.toLowerCase())
    .includes(contract.toLowerCase());
};
