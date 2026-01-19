/**
 * Constants for the file upload system
 *
 * Central location for all configuration values and constants.
 */

import {
  SUBMISSION_FILE_INPUT_ACCEPT,
  SUBMISSION_UI_FORMAT_CATEGORIES,
} from "@/constants/submission-media.constants";

/**
 * Simplified format categories for UI display
 */
export const UI_FORMAT_CATEGORIES = SUBMISSION_UI_FORMAT_CATEGORIES;

/**
 * Maximum file size allowed (100MB)
 */
export const FILE_SIZE_LIMIT: number = 200 * 1024 * 1024;

/**
 * Accept string for file input element
 */
export const FILE_INPUT_ACCEPT: string = SUBMISSION_FILE_INPUT_ACCEPT;

/**
 * Maximum number of processing attempts before giving up
 */
export const MAX_PROCESSING_ATTEMPTS = 3;

/**
 * Processing timeout in milliseconds (30 seconds)
 */
export const PROCESSING_TIMEOUT_MS = 30000;

/**
 * Compatibility check timeout in milliseconds (5 seconds)
 */
export const COMPATIBILITY_CHECK_TIMEOUT_MS = 5000;
