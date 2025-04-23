/**
 * Constants for the file upload system
 * 
 * Central location for all configuration values and constants.
 */

/**
 * Supported file types for uploads
 */
const ACCEPTED_FORMATS: readonly string[] = [
  'image/png',
  'image/jpeg', 
  'image/jpg',
  'video/mp4',
  'video/webm',
  'video/ogg',
  'video/quicktime'
] as const;

/**
 * Simplified format categories for UI display
 */
export const UI_FORMAT_CATEGORIES = ['PNG', 'JPG', 'GIF', 'VIDEO'];

/**
 * Maximum file size allowed (100MB)
 */
export const FILE_SIZE_LIMIT: number = 200 * 1024 * 1024;

/**
 * Accept string for file input element
 */
export const FILE_INPUT_ACCEPT: string = 'image/png,image/jpeg,image/jpg,image/gif,video/mp4,video/quicktime';

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
