/**
 * Constants for the file upload system
 */

export const FILE_SIZE_LIMIT: number = 200 * 1024 * 1024;

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
