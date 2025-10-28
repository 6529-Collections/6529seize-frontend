/**
 * Error sanitization utility for secure error handling
 * Prevents exposure of sensitive data like JWT tokens, API keys, and secrets
 */

import { publicEnv } from "@/config/env";

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
  /x-auth-token/i,
];

// Patterns for common JWT formats
const JWT_PATTERN = /eyJ[A-Za-z0-9-_]+\.eyJ[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+/g;

// Patterns for common API key formats
const API_KEY_PATTERNS = [
  /sk_[a-zA-Z0-9]{32,}/g, // Stripe-like secret keys
  /pk_[a-zA-Z0-9]{32,}/g, // Public keys
  /[a-f0-9]{32,64}/g, // Hex strings (potential API keys/hashes)
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
  if (SENSITIVE_PATTERNS.some((pattern) => pattern.test(text))) {
    return true;
  }

  // Check for API key patterns
  if (API_KEY_PATTERNS.some((pattern) => pattern.test(text))) {
    return true;
  }

  return false;
};

/**
 * Handles adapter-specific error messages
 */
const getAdapterErrorMessage = (error: Error): string | null => {
  const errorName = (error as any)?.constructor?.name;

  if (
    !["AdapterError", "AdapterCacheError", "AdapterCleanupError"].includes(
      errorName
    )
  ) {
    return null;
  }

  // Map adapter-specific errors to user-friendly messages
  if (error.message.includes("CACHE_")) {
    return "Wallet connection data needs to be refreshed. Please try connecting again.";
  }
  if (error.message.includes("CLEANUP_")) {
    return "Wallet disconnection in progress. Please wait a moment before reconnecting.";
  }
  if (error.message.includes("Adapter creation failed")) {
    return "Unable to initialize wallet connection. Please refresh the page and try again.";
  }
  if (errorName === "AdapterCacheError") {
    return "Wallet connection cache needs to be cleared. Please refresh the page.";
  }
  if (errorName === "AdapterCleanupError") {
    return "Previous wallet connection is still being cleaned up. Please wait and try again.";
  }

  // Default for unknown adapter errors
  return "Wallet connection service is temporarily unavailable. Please try again.";
};

/**
 * Extracts error message and string representation from unknown error
 */
const extractErrorMessage = (
  error: unknown
): { message: string; errorString: string } => {
  if (error instanceof Error) {
    return { message: error.message, errorString: error.toString() };
  }

  if (typeof error === "string") {
    return { message: error, errorString: error };
  }

  if (typeof error === "object") {
    try {
      const errorString = JSON.stringify(error);
      const message = (error as any).message || (error as any).error || "";
      return { message, errorString };
    } catch {
      return { message: "", errorString: "Complex error object" };
    }
  }

  return { message: "", errorString: "" };
};

/**
 * Error pattern mappings for common error types
 */
const ERROR_PATTERNS = [
  {
    pattern: /network/i,
    message: "Network error. Please check your connection and try again.",
  },
  { pattern: /timeout/i, message: "Request timed out. Please try again." },
  {
    pattern: /unauthorized|forbidden/i,
    message: "Authorization failed. Please reconnect your wallet.",
  },
  {
    pattern: /invalid/i,
    message: "Invalid request. Please check your input and try again.",
  },
  { pattern: /not found/i, message: "Requested resource not found." },
  {
    pattern: /rate limit/i,
    message: "Too many requests. Please wait a moment and try again.",
  },
  {
    pattern: /wallet|metamask/i,
    message: "Wallet error. Please check your wallet connection.",
  },
  {
    pattern: /signature|sign/i,
    message: "Signature request failed. Please try again.",
  },
  { pattern: /rejected|denied/i, message: "Request was rejected." },
  {
    pattern: /balance|insufficient/i,
    message: "Insufficient balance for this operation.",
  },
];

/**
 * Sanitizes an error object for safe display to users
 * Removes any sensitive data and returns a user-friendly message
 */
export const sanitizeErrorForUser = (error: unknown): string => {
  if (!error) {
    return "An unexpected error occurred. Please try again.";
  }

  // Handle adapter-specific errors first
  if (error instanceof Error) {
    const adapterMessage = getAdapterErrorMessage(error);
    if (adapterMessage) {
      return adapterMessage;
    }
  }

  const { message, errorString } = extractErrorMessage(error);

  if (!message && !errorString) {
    return "An unexpected error occurred. Please try again.";
  }

  // Check if the error contains sensitive data
  if (containsSensitiveData(errorString) || containsSensitiveData(message)) {
    return "Authentication error occurred. Please try again.";
  }

  // Check against known error patterns
  for (const { pattern, message: patternMessage } of ERROR_PATTERNS) {
    if (pattern.test(message.toLowerCase())) {
      return patternMessage;
    }
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

  if (publicEnv.NODE_ENV === "development") {
    // In development, log full error for debugging
    console.error(`[${timestamp}] [${context}]`, error);
    return;
  }

  // In production, we should never log sensitive data to console
  // Instead, log a sanitized version
  const sanitizedMessage = sanitizeErrorForUser(error);

  // TODO: Integrate with secure logging service (e.g., Sentry, DataDog, CloudWatch)
  // For now, we'll use console.error with sanitized data only
  if (publicEnv.NODE_ENV !== "test") {
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
