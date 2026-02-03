import { getFileExtension } from "@/components/waves/memes/file-upload/utils/formatHelpers";

const ACCEPTED_FORMATS = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/gif",
  "image/webp",
];

export const ACCEPTED_FORMATS_DISPLAY = ACCEPTED_FORMATS.map(
  (format) => `.${format.replace("image/", "")}`
).join(", ");

const ALLOWED_EXTENSIONS = new Set(["JPG", "JPEG", "PNG", "GIF", "WEBP"]);

export const isValidImageType = (file: File): boolean => {
  // Primary check: MIME type
  if (ACCEPTED_FORMATS.includes(file.type)) {
    return true;
  }
  // Fallback: extension check when MIME is empty (some OS/browser combos)
  if (file.type === "") {
    return ALLOWED_EXTENSIONS.has(getFileExtension(file));
  }
  return false;
};
