/**
 * Validates if a URL is safe for use in media display components
 * @param url - The URL to validate
 * @returns boolean indicating if the URL is safe to use
 */
export const isValidMediaUrl = (url: string | null | undefined): url is string => {
  if (!url || typeof url !== 'string') {
    return false;
  }

  try {
    const urlObj = new URL(url);
    
    // Only allow HTTP and HTTPS protocols
    if (!['http:', 'https:'].includes(urlObj.protocol)) {
      return false;
    }

    // Basic domain validation - reject obviously malicious patterns
    const hostname = urlObj.hostname.toLowerCase();
    if (hostname.includes('javascript') || hostname.includes('data')) {
      return false;
    }

    return true;
  } catch {
    return false;
  }
};

/**
 * Sanitizes a URL for safe use, returns null if invalid
 * @param url - The URL to sanitize
 * @returns Sanitized URL or null if invalid
 */
export const sanitizeMediaUrl = (url: string | null | undefined): string | null => {
  return isValidMediaUrl(url) ? url : null;
};