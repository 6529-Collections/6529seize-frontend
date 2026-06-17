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
class TokenRefreshError extends Error {
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
