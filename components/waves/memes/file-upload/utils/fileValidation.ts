/**
 * File Validation Utilities
 *
 * Functions for validating files, checking formats, and testing compatibility.
 */

import { COMPATIBILITY_CHECK_TIMEOUT_MS, FILE_SIZE_LIMIT } from "./constants";
import { getFileExtension, getBrowserSpecificMessage } from "./formatHelpers";
import type {
  FileValidationResult,
  VideoCompatibilityResult,
} from "../reducers/types";

/**
 * Comprehensive file validation with proper typing
 * @param file File to validate
 * @returns Validation result with validity and optional error
 */
export const validateFile = (file: File): FileValidationResult => {
  // Check if file exists
  if (!file) {
    return {
      valid: false,
      error: "No file selected.",
    };
  }

  // Check file type with support for generic video types
  const isImageType =
    file.type.startsWith("image/") &&
    (file.type === "image/png" ||
      file.type === "image/jpeg" ||
      file.type === "image/jpg" ||
      file.type === "image/gif");

  const isVideoType = file.type.startsWith("video/");

  if (!isImageType && !isVideoType) {
    return {
      valid: false,
      error: `File type not supported. Please upload PNG, JPG or video files.`,
    };
  }

  // Check file size
  if (file.size > FILE_SIZE_LIMIT) {
    const sizeMB = Math.round(FILE_SIZE_LIMIT / (1024 * 1024));
    return {
      valid: false,
      error: `File size exceeds ${sizeMB}MB limit.`,
    };
  }

  return { valid: true };
};

/**
 * Comprehensive video compatibility test
 *
 * Checks if a video file can be previewed in the current browser environment
 * with detailed error reporting and clean resource management.
 *
 * @param file The video file to test
 * @returns Promise resolving to a compatibility result
 */
export const testVideoCompatibility = (
  file: File
): Promise<VideoCompatibilityResult> => {
  return new Promise((resolve) => {
    // Early exit if not video
    if (!file || !file.type.startsWith("video/")) {
      return resolve({ canPlay: true, tested: false });
    }

    // Set up a timeout for long-running tests
    let timeoutId: number | undefined = window.setTimeout(() => {
      timeoutId = undefined;
      resolve({
        canPlay: false,
        tested: true,
        errorMessage: "Video preview timed out",
        technicalReason: "Metadata loading timeout exceeded",
      });
    }, COMPATIBILITY_CHECK_TIMEOUT_MS);

    try {
      // Create test video element
      const video = document.createElement("video");
      const objectUrl = URL.createObjectURL(file);

      // Setup cleanup function to prevent memory leaks
      const cleanup = () => {
        if (timeoutId) {
          window.clearTimeout(timeoutId);
          timeoutId = undefined;
        }
        URL.revokeObjectURL(objectUrl);
        video.removeAttribute("src");
        video.load();
      };

      // First try with canPlayType API
      const mimeGuess =
        file.type || `video/${getFileExtension(file).toLowerCase()}`;
      const canPlayTypeResult = video.canPlayType(mimeGuess);

      // If definitely not supported, don't even try loading it
      if (canPlayTypeResult === "") {
        cleanup();
        return resolve({
          canPlay: false,
          tested: true,
          errorMessage: getBrowserSpecificMessage(file),
          technicalReason: `MIME type ${mimeGuess} reported as not supported by canPlayType`,
        });
      }

      // Setup event handlers for testing actual compatibility
      video.onloadedmetadata = () => {
        cleanup();
        resolve({
          canPlay: true,
          tested: true,
          codecInfo: `${video.videoWidth}x${video.videoHeight}`,
        });
      };

      video.onerror = () => {
        const error = video.error;
        let technicalReason = "Unknown error";

        if (error) {
          // Map MediaError codes to meaningful messages
          switch (error.code) {
            case MediaError.MEDIA_ERR_ABORTED:
              technicalReason = "The user aborted the download";
              break;
            case MediaError.MEDIA_ERR_NETWORK:
              technicalReason = "A network error occurred";
              break;
            case MediaError.MEDIA_ERR_DECODE:
              technicalReason = "The media could not be decoded";
              break;
            case MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED:
              technicalReason = "The media format is not supported";
              break;
            default:
              technicalReason = `Unknown error, code: ${error.code}`;
          }

          if (error.message) {
            technicalReason += `, message: ${error.message}`;
          }
        }

        cleanup();
        resolve({
          canPlay: false,
          tested: true,
          errorMessage: getBrowserSpecificMessage(file),
          technicalReason,
        });
      };

      // Set source and start loading
      video.muted = true;
      video.preload = "metadata";
      video.src = objectUrl;
      video.load();
    } catch (error) {
      if (timeoutId) {
        window.clearTimeout(timeoutId);
      }
      resolve({
        canPlay: false,
        tested: true,
        errorMessage: getBrowserSpecificMessage(file),
        technicalReason: error instanceof Error ? error.message : String(error),
      });
    }
  });
};
