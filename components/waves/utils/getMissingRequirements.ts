import { ApiWaveParticipationRequirement } from "@/generated/models/ApiWaveParticipationRequirement";
import type { CreateDropMetadataType } from "../CreateDropContent";

export interface MissingRequirements {
  metadata: string[];
  media: ApiWaveParticipationRequirement[];
}

const isRequiredMetadataMissing = (item: CreateDropMetadataType): boolean => {
  return item.required && (item.value === null || item.value === undefined || item.value === "");
};

const isMediaTypeMatching = (file: File, mediaType: ApiWaveParticipationRequirement): boolean => {
  switch (mediaType) {
    case ApiWaveParticipationRequirement.Image:
      return file.type.startsWith("image/");
    case ApiWaveParticipationRequirement.Audio:
      return file.type.startsWith("audio/");
    case ApiWaveParticipationRequirement.Video:
      return file.type.startsWith("video/");
    default:
      return false;
  }
};

export const getMissingRequirements = (
  isDropMode: boolean,
  metadata: CreateDropMetadataType[],
  files: File[],
  requiredMedia: ApiWaveParticipationRequirement[]
): MissingRequirements => {
  if (!isDropMode) {
    return {
      metadata: [],
      media: [],
    };
  }
  const getMissingMetadata = () =>
    metadata.filter(isRequiredMetadataMissing).map((item) => item.key);

  const getMissingMedia = () =>
    requiredMedia.filter((media) => !files.some((file) => isMediaTypeMatching(file, media)));

  return {
    metadata: getMissingMetadata(),
    media: getMissingMedia(),
  };
}; 
