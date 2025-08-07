/**
 * Authentication error classes for fail-fast error handling
 * 
 * These classes provide structured error handling for token refresh operations,
 * ensuring that authentication failures are explicit and actionable rather than
 * being silently ignored.
 */

/**
 * Base class for token refresh errors
 * All token refresh operations should throw subclasses of this error
 */
export class TokenRefreshError extends Error {
  constructor(message: string, public readonly cause?: unknown) {
    super(message);
    this.name = 'TokenRefreshError';
  }
}

/**
 * Thrown when token refresh operation is cancelled by user or system
 * This is expected during race conditions or user-initiated cancellations
 */
export class TokenRefreshCancelledError extends TokenRefreshError {
  constructor(message: string = 'Token refresh operation was cancelled') {
    super(message);
    this.name = 'TokenRefreshCancelledError';
  }
}

/**
 * Thrown when token refresh fails due to network issues
 * Includes network timeouts, connection failures, DNS issues, etc.
 */
export class TokenRefreshNetworkError extends TokenRefreshError {
  constructor(message: string, cause?: unknown) {
    super(message, cause);
    this.name = 'TokenRefreshNetworkError';
  }
}

/**
 * Thrown when server responds with error status codes or invalid data
 * Includes 4xx/5xx responses, malformed responses, validation failures
 */
export class TokenRefreshServerError extends TokenRefreshError {
  constructor(
    message: string, 
    public readonly statusCode?: number,
    public readonly serverResponse?: unknown,
    cause?: unknown
  ) {
    super(message, cause);
    this.name = 'TokenRefreshServerError';
  }
}