/**
 * Format Helper Utilities
 *
 * Utility functions for handling file formats, extensions, and sizes.
 */

import { detectBrowser } from "./browserDetection";

/**
 * Get file extension from File object
 * @param file The file to get extension from
 * @returns Uppercase file extension
 */
export const getFileExtension = (file: File): string => {
  return file.name.split(".").pop()?.toUpperCase() ?? "Unknown";
};

/**
 * Format file size to human-readable string
 * @param bytes File size in bytes
 * @returns Formatted size string (e.g., "5.25 MB")
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return "0 Bytes";

  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};

/**
 * Generate browser-specific feedback for different video formats
 * @param file The file to generate message for
 * @returns User-friendly message about format compatibility
 */
export const getBrowserSpecificMessage = (file: File): string => {
  const browser = detectBrowser();
  const extension = getFileExtension(file).toLowerCase();

  switch (extension) {
    case "mov":
      return `${browser} cannot preview QuickTime (.MOV) files. The file will still upload correctly.`;
    case "mp4":
      return `This MP4 might be using a codec ${browser} doesn't support (like HEVC/H.265). The file will still upload correctly.`;
    case "webm":
      if (browser === "Safari") {
        return `Safari has limited support for WebM videos. The file will still upload correctly.`;
      }
      return `This WebM video can't be previewed but will upload correctly.`;
    case "mkv":
      return `MKV containers aren't supported for preview in most browsers. The file will still upload correctly.`;
    default:
      return `This video format can't be previewed in ${browser}, but will still upload correctly.`;
  }
};
