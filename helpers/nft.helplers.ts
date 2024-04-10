import { numberWithCommas } from "./Helpers";

export function getFileTypeFromMetadata(metadata: any) {
  return metadata.animation_details?.format ?? metadata.image_details.format;
}

export function getDimensionsFromMetadata(metadata: any) {
  return `${numberWithCommas(
    metadata.animation_details?.width ?? metadata.image_details.width
  )} x ${numberWithCommas(
    metadata.animation_details?.height ?? metadata.image_details.height
  )}`;
}
