/**
 * Constants for the file upload system
 */

// Decimal MB: keep the upload ceiling and its visible label in sync.
export const FILE_SIZE_LIMIT = 250_000_000;
export const FILE_SIZE_LIMIT_LABEL = `${FILE_SIZE_LIMIT / 1_000_000} MB`;

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
