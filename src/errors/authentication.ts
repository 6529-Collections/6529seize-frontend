/**
 * Authentication-specific error classes for fail-fast behavior
 * These errors indicate critical authentication state inconsistencies that must halt execution immediately
 */

export class TokenRefreshError extends Error {
  constructor(message: string, public readonly cause?: unknown) {
    super(message);
    this.name = 'TokenRefreshError';
    Object.setPrototypeOf(this, TokenRefreshError.prototype);
  }
}

export class TokenRefreshCancelledError extends TokenRefreshError {
  constructor(message: string, cause?: unknown) {
    super(`Token refresh cancelled: ${message}`, cause);
    this.name = 'TokenRefreshCancelledError';
  }
}

export class TokenRefreshNetworkError extends TokenRefreshError {
  constructor(message: string, cause?: unknown) {
    super(`Token refresh network error: ${message}`, cause);
    this.name = 'TokenRefreshNetworkError';
  }
}

export class TokenRefreshServerError extends TokenRefreshError {
  constructor(
    message: string,
    public readonly statusCode?: number,
    public readonly response?: unknown,
    cause?: unknown
  ) {
    super(`Token refresh server error: ${message}`, cause);
    this.name = 'TokenRefreshServerError';
  }
}

export class AuthenticationRoleError extends Error {
  constructor(message: string, public readonly cause?: unknown) {
    super(message);
    this.name = 'AuthenticationRoleError';
    Object.setPrototypeOf(this, AuthenticationRoleError.prototype);
  }
}

/**
 * RoleValidationError - thrown when server-provided role doesn't match expected role
 * This indicates a critical authentication failure that requires immediate re-authentication
 */
export class RoleValidationError extends Error {
  constructor(
    public readonly expectedRole: string,
    public readonly actualRole: string | null
  ) {
    super(`Role validation failed: expected '${expectedRole}' but got '${actualRole}'`);
    this.name = 'RoleValidationError';
    Object.setPrototypeOf(this, RoleValidationError.prototype);
  }
}

/**
 * MissingActiveProfileError - thrown when authentication requires an active profile proxy but none is set
 * This indicates a critical state inconsistency that must fail immediately
 */
export class MissingActiveProfileError extends Error {
  constructor() {
    super('Authentication requires active profile proxy but activeProfileProxy is null or undefined');
    this.name = 'MissingActiveProfileError';
    Object.setPrototypeOf(this, MissingActiveProfileError.prototype);
  }
}

/**
 * InvalidRoleStateError - thrown when role authentication fails due to invalid role state
 * This indicates a critical authentication vulnerability that must be addressed immediately
 */
export class InvalidRoleStateError extends Error {
  constructor(message: string, public readonly cause?: unknown) {
    super(`Invalid role state: ${message}`);
    this.name = 'InvalidRoleStateError';
    Object.setPrototypeOf(this, InvalidRoleStateError.prototype);
  }
}