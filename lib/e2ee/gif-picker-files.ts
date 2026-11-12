/**
 * GIFs downloaded from the GIF picker. They are public images, not the
 * sender's own photos, so they are sent byte for byte under their own name
 * instead of going through photo metadata cleaning (media.ts).
 */
const pickerGifs = new WeakSet<File>();

export function markGifPickerFile(file: File): File {
  pickerGifs.add(file);
  return file;
}

export const isGifPickerFile = (file: File): boolean => pickerGifs.has(file);
