/**
 * Error sanitization utility for secure error handling
 * Prevents exposure of sensitive data like JWT tokens, API keys, and secrets
 */

// Patterns that indicate sensitive data in error messages
const SENSITIVE_PATTERNS = [
  /jwt[_-]?token/i,
  /refresh[_-]?token/i,
  /bearer\s+/i,
  /authorization/i,
  /api[_-]?key/i,
  /secret/i,
  /private[_-]?key/i,
  /signature/i,
  /password/i,
  /passwd/i,
  /credentials/i,
  /access[_-]?token/i,
  /auth[_-]?token/i,
  /session[_-]?id/i,
  /cookie/i,
  /x-api-key/i,
  /x-auth-token/i
];

// Patterns for common JWT formats
const JWT_PATTERN = /eyJ[A-Za-z0-9-_]+\.eyJ[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+/g;

// Patterns for common API key formats
const API_KEY_PATTERNS = [
  /sk_[a-zA-Z0-9]{32,}/g,  // Stripe-like secret keys
  /pk_[a-zA-Z0-9]{32,}/g,  // Public keys
  /[a-f0-9]{32,64}/g,      // Hex strings (potential API keys/hashes)
];

/**
 * Checks if a string contains sensitive data patterns
 */
const containsSensitiveData = (text: string): boolean => {
  // Check for JWT tokens
  if (JWT_PATTERN.test(text)) {
    return true;
  }

  // Check for sensitive keyword patterns
  if (SENSITIVE_PATTERNS.some(pattern => pattern.test(text))) {
    return true;
  }

  // Check for API key patterns
  if (API_KEY_PATTERNS.some(pattern => pattern.test(text))) {
    return true;
  }

  return false;
};

/**
 * Sanitizes an error object for safe display to users
 * Removes any sensitive data and returns a user-friendly message
 */
export const sanitizeErrorForUser = (error: unknown): string => {
  if (!error) {
    return "An unexpected error occurred. Please try again.";
  }

  // Handle adapter-specific errors first (imported from @/src/errors/adapter)
  const errorName = (error as any)?.constructor?.name;
  if (errorName === 'AdapterError' || errorName === 'AdapterCacheError' || errorName === 'AdapterCleanupError') {
    const adapterError = error as Error;
    // Map adapter-specific errors to user-friendly messages
    if (adapterError.message.includes('CACHE_')) {
      return 'Wallet connection data needs to be refreshed. Please try connecting again.';
    }
    if (adapterError.message.includes('CLEANUP_')) {
      return 'Wallet disconnection in progress. Please wait a moment before reconnecting.';
    }
    if (adapterError.message.includes('Adapter creation failed')) {
      return 'Unable to initialize wallet connection. Please refresh the page and try again.';
    }
    if (errorName === 'AdapterCacheError') {
      return 'Wallet connection cache needs to be cleared. Please refresh the page.';
    }
    if (errorName === 'AdapterCleanupError') {
      return 'Previous wallet connection is still being cleaned up. Please wait and try again.';
    }
    // Default for unknown adapter errors
    return 'Wallet connection service is temporarily unavailable. Please try again.';
  }

  // Handle different error types
  let message = "";
  let errorString = "";

  if (error instanceof Error) {
    message = error.message;
    errorString = error.toString();
  } else if (typeof error === 'string') {
    message = error;
    errorString = error;
  } else if (typeof error === 'object') {
    try {
      errorString = JSON.stringify(error);
      message = (error as any).message || (error as any).error || "";
    } catch {
      errorString = "Complex error object";
    }
  } else {
    return "An unexpected error occurred. Please try again.";
  }

  // Check if the error contains sensitive data
  if (containsSensitiveData(errorString) || containsSensitiveData(message)) {
    // Return generic message for errors containing sensitive data
    return "Authentication error occurred. Please try again.";
  }

  // For known error types, provide helpful messages
  if (message.toLowerCase().includes('network')) {
    return "Network error. Please check your connection and try again.";
  }
  if (message.toLowerCase().includes('timeout')) {
    return "Request timed out. Please try again.";
  }
  if (message.toLowerCase().includes('unauthorized') || message.toLowerCase().includes('forbidden')) {
    return "Authorization failed. Please reconnect your wallet.";
  }
  if (message.toLowerCase().includes('invalid')) {
    return "Invalid request. Please check your input and try again.";
  }
  if (message.toLowerCase().includes('not found')) {
    return "Requested resource not found.";
  }
  if (message.toLowerCase().includes('rate limit')) {
    return "Too many requests. Please wait a moment and try again.";
  }
  if (message.toLowerCase().includes('wallet') || message.toLowerCase().includes('metamask')) {
    return "Wallet error. Please check your wallet connection.";
  }
  if (message.toLowerCase().includes('signature') || message.toLowerCase().includes('sign')) {
    return "Signature request failed. Please try again.";
  }
  if (message.toLowerCase().includes('rejected') || message.toLowerCase().includes('denied')) {
    return "Request was rejected.";
  }
  if (message.toLowerCase().includes('balance') || message.toLowerCase().includes('insufficient')) {
    return "Insufficient balance for this operation.";
  }

  // If message is safe and informative, return it (but truncate if too long)
  if (message && message.length > 0 && message.length < 200) {
    return message;
  }

  // Default fallback
  return "An error occurred. Please try again.";
};

/**
 * Logs errors securely based on environment
 * In development: logs full error to console
 * In production: should integrate with secure logging service
 */
export const logErrorSecurely = (context: string, error: unknown): void => {
  const timestamp = new Date().toISOString();
  
  if (process.env.NODE_ENV === 'development') {
    // In development, log full error for debugging
    console.error(`[${timestamp}] [${context}]`, error);
    return;
  }

  // In production, we should never log sensitive data to console
  // Instead, log a sanitized version
  const sanitizedMessage = sanitizeErrorForUser(error);
  

  // TODO: Integrate with secure logging service (e.g., Sentry, DataDog, CloudWatch)
  // For now, we'll use console.error with sanitized data only
  if (process.env.NODE_ENV !== 'test') {
    // Avoid console spam in tests
    console.error(`[${timestamp}] [${context}] Error:`, sanitizedMessage);
  }

  // Example integration points for production logging:
  // if (window.Sentry) {
  //   window.Sentry.captureException(new Error(sanitizedMessage), {
  //     tags: { context },
  //     extra: logEntry
  //   });
  // }
};

/**
 * Extracts a safe error code from an error object
 * Useful for displaying error codes without exposing sensitive data
 */
export const getErrorCode = (error: unknown): string | null => {
  if (!error || typeof error !== 'object') {
    return null;
  }

  const errorObj = error as any;
  
  // Check for common error code properties
  const code = errorObj.code || errorObj.errorCode || errorObj.status || errorObj.statusCode;
  
  if (code && (typeof code === 'string' || typeof code === 'number')) {
    // Ensure the code doesn't contain sensitive data
    const codeStr = code.toString();
    if (!containsSensitiveData(codeStr) && codeStr.length < 50) {
      return codeStr;
    }
  }

  return null;
};

/**
 * Creates a user-friendly error message with optional error code
 */
export const formatErrorMessage = (error: unknown, includeCode: boolean = false): string => {
  const message = sanitizeErrorForUser(error);
  
  if (includeCode) {
    const code = getErrorCode(error);
    if (code) {
      return `${message} (Error code: ${code})`;
    }
  }

  return message;
};