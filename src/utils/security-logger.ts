import { publicEnv } from "@/config/env";
import { SecurityEventContext, SecurityEventType } from "../types/security";

/**
 * CRITICAL SECURITY NOTICE:
 * This logger is designed to prevent information disclosure vulnerabilities.
 *
 * SECURITY REQUIREMENTS:
 * 1. NO sensitive data (addresses, tokens, user IDs) in ANY logs
 * 2. Production logging DISABLED by default
 * 3. Development logging requires explicit opt-in via environment variable
 * 4. All data must be sanitized before logging
 * 5. Error messages must not contain sensitive information
 */

/**
 * Checks if security logging is enabled
 * SECURITY: Defaults to FALSE - logging must be explicitly enabled
 */
const isSecurityLoggingEnabled = (): boolean => {
  // Production: ALWAYS disabled for security
  if (publicEnv.NODE_ENV === "production") {
    return false;
  }

  // Development: Require explicit opt-in
  return publicEnv.ENABLE_SECURITY_LOGGING === "true";
};

/**
 * Sanitizes error messages to remove sensitive data
 * Removes wallet addresses, tokens, and other potential PII
 */
export const sanitizeErrorMessage = (message: string): string => {
  return (
    message
      // Remove Ethereum addresses (0x followed by 40 hex chars)
      .replace(/0x[a-fA-F0-9]{40}/g, "0x***REDACTED***")
      // Remove potential private keys or tokens (long hex strings)
      .replace(/\b[a-fA-F0-9]{32,}\b/g, "***TOKEN***")
      // Remove potential JWT tokens
      .replace(
        /eyJ[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]*/g,
        "***JWT***"
      )
      // Remove any remaining potential sensitive hex data
      .replaceAll(/\b0x[a-fA-F0-9]{8,}\b/g, "0x***HEX***")
  );
};

/**
 * Validates that security event context contains no sensitive data
 * Throws error if sensitive data is detected
 */
const validateSecurityEventContext = (context: SecurityEventContext): void => {
  // Convert context to JSON for thorough scanning
  const contextJson = JSON.stringify(context);

  // Check for Ethereum addresses (full 40 hex chars)
  if (/0x[a-fA-F0-9]{40}/.test(contextJson)) {
    throw new Error(
      "SECURITY VIOLATION: SecurityEventContext contains wallet address"
    );
  }

  // Check for partial addresses that could be used for fingerprinting (0x + 20+ hex chars)
  if (/0x[a-fA-F0-9]{20,39}/.test(contextJson)) {
    throw new Error(
      "SECURITY VIOLATION: SecurityEventContext contains potential token/key"
    );
  }

  // Check for potential tokens or keys (32+ hex chars without 0x prefix)
  if (/\b[a-fA-F0-9]{32,}\b/.test(contextJson)) {
    throw new Error(
      "SECURITY VIOLATION: SecurityEventContext contains potential token/key"
    );
  }

  // Check for JWT tokens
  if (/eyJ[A-Za-z0-9-_]+/.test(contextJson)) {
    throw new Error(
      "SECURITY VIOLATION: SecurityEventContext contains JWT token"
    );
  }
};

/**
 * Logs security events with strict data minimization
 * SECURITY: Only logs if explicitly enabled, validates all data for sensitive content
 *
 * @param eventType - Type of security event (from SecurityEventType enum)
 * @param context - Event context with ONLY non-sensitive diagnostic data
 * @throws Error if context contains sensitive data
 */
export const logSecurityEvent = (
  eventType: SecurityEventType,
  context: SecurityEventContext
): void => {
  // SECURITY: Validate that context contains no sensitive data
  validateSecurityEventContext(context);

  // Only log if explicitly enabled
  if (!isSecurityLoggingEnabled()) {
    return;
  }

  // Use console.warn for security event logging - these are important for monitoring
  console.warn("[SEIZE_SECURITY_EVENT]", {
    eventType,
    ...context,
    // Always include user agent for browser compatibility analysis
    userAgent:
      typeof navigator === "undefined" ? "server-side" : navigator.userAgent,
  });
};

/**
 * Logs errors with sensitive data sanitization
 * Safe for production use - removes all sensitive information
 *
 * @param context - Description of where the error occurred
 * @param error - The error to log
 */
export const logError = (context: string, error: Error): void => {
  const timestamp = new Date().toISOString();

  // Create sanitized error info
  const errorInfo = {
    timestamp,
    context,
    name: error.name,
    message: sanitizeErrorMessage(error.message),
    // Include error code if it's a custom error with code property
    ...(error &&
      typeof error === "object" &&
      "code" in error && { code: error.code }),
  };

  // Helper to safely stringify error causes
  const stringifyCause = (cause: unknown): string => {
    if (typeof cause === "string") {
      return cause;
    } else if (cause && typeof cause === "object") {
      // Check for Error instances or objects with message property
      if ("message" in cause && typeof cause.message === "string") {
        return cause.message;
      }
      // Try JSON stringification for plain objects
      try {
        return JSON.stringify(cause);
      } catch {
        return "Complex error cause";
      }
    }
    return String(cause);
  };

  // Production: Minimal sanitized logging
  if (publicEnv.NODE_ENV === "production") {
    console.error("[SEIZE_CONNECT_ERROR]", {
      ...errorInfo,
      userAgent:
        typeof navigator === "undefined" ? "server-side" : navigator.userAgent,
    });
  } else {
    // Development: Include stack trace but still sanitize sensitive data
    console.error("[SEIZE_CONNECT_ERROR]", {
      ...errorInfo,
      stack: error.stack ? sanitizeErrorMessage(error.stack) : undefined,
      cause: error.cause
        ? sanitizeErrorMessage(stringifyCause(error.cause))
        : undefined,
      userAgent:
        typeof navigator === "undefined" ? "server-side" : navigator.userAgent,
    });
  }
};

/**
 * Creates a minimal security context for connection events
 * Contains ONLY safe diagnostic data
 */
export const createConnectionEventContext = (
  source: string
): SecurityEventContext => ({
  timestamp: new Date().toISOString(),
  source,
  userAgent:
    typeof navigator === "undefined" ? "server-side" : navigator.userAgent,
});

/**
 * Creates a minimal security context for validation events
 * Contains ONLY safe diagnostic data about address format (NOT the address itself)
 */
export const createValidationEventContext = (
  source: string,
  isValid: boolean,
  addressLength?: number,
  addressFormat?: "hex_prefixed" | "other"
): SecurityEventContext => ({
  timestamp: new Date().toISOString(),
  source,
  valid: isValid,
  addressLength,
  addressFormat,
  userAgent:
    typeof navigator === "undefined" ? "server-side" : navigator.userAgent,
});
