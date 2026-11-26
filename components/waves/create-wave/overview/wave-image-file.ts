export const WAVE_IMAGE_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/gif",
  "image/webp",
];

export function getWaveImageFileError(file: File): string | null {
  if (!WAVE_IMAGE_TYPES.includes(file.type))
    return "This file type is not supported.";
  if (file.size > 10485760) return "Use a file smaller than 10 MB.";
  return null;
}
