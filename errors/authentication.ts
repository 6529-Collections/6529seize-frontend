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
  constructor(
    message: string,
    public override readonly cause?: unknown
  ) {
    super(message);
    this.name = "TokenRefreshError";
    Object.setPrototypeOf(this, TokenRefreshError.prototype);
  }
}

/**
 * Thrown when token refresh operation is cancelled by user or system
 * This is expected during race conditions or user-initiated cancellations
 */
export class TokenRefreshCancelledError extends TokenRefreshError {
  constructor(message: string = "Token refresh operation was cancelled") {
    super(message);
    this.name = "TokenRefreshCancelledError";
    Object.setPrototypeOf(this, TokenRefreshCancelledError.prototype);
  }
}

/**
 * Thrown when token refresh fails due to network issues
 * Includes network timeouts, connection failures, DNS issues, etc.
 */
export class TokenRefreshNetworkError extends TokenRefreshError {
  constructor(message: string, cause?: unknown) {
    super(message, cause);
    this.name = "TokenRefreshNetworkError";
    Object.setPrototypeOf(this, TokenRefreshNetworkError.prototype);
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
    this.name = "TokenRefreshServerError";
    Object.setPrototypeOf(this, TokenRefreshServerError.prototype);
  }
}

/**
 * Base class for authentication role errors
 * All role validation operations should throw subclasses of this error
 */
export class AuthenticationRoleError extends Error {
  constructor(
    message: string,
    public override readonly cause?: unknown
  ) {
    super(message);
    this.name = "AuthenticationRoleError";
    Object.setPrototypeOf(this, AuthenticationRoleError.prototype);
  }
}

/**
 * Thrown when role validation fails due to role mismatch
 * Indicates that expected role does not match actual role received
 */
export class RoleValidationError extends AuthenticationRoleError {
  constructor(
    expectedRole: string | null,
    actualRole: string | null,
    cause?: unknown
  ) {
    super(
      `Role validation failed: expected ${expectedRole}, got ${actualRole}`,
      cause
    );
    this.name = "RoleValidationError";
    Object.setPrototypeOf(this, RoleValidationError.prototype);
  }
}

/**
 * Thrown when active profile proxy is required but is null/undefined
 * This indicates a critical state inconsistency in role-based authentication
 */
export class MissingActiveProfileError extends AuthenticationRoleError {
  constructor() {
    super(
      "Active profile proxy is required for role-based authentication but is null"
    );
    this.name = "MissingActiveProfileError";
    Object.setPrototypeOf(this, MissingActiveProfileError.prototype);
  }
}

/**
 * InvalidRoleStateError - thrown when role authentication fails due to invalid role state
 * This indicates a critical authentication vulnerability that must be addressed immediately
 */
export class InvalidRoleStateError extends Error {
  constructor(
    message: string,
    public override readonly cause?: unknown
  ) {
    super(`Invalid role state: ${message}`);
    this.name = "InvalidRoleStateError";
    Object.setPrototypeOf(this, InvalidRoleStateError.prototype);
  }
}
