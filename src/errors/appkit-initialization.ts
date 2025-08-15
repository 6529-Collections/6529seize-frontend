export class AppKitInitializationError extends Error {
  constructor(message: string, public readonly cause?: unknown) {
    super(message);
    this.name = 'AppKitInitializationError';
    Object.setPrototypeOf(this, AppKitInitializationError.prototype);
  }
}

export class AppKitValidationError extends AppKitInitializationError {
  constructor(message: string, cause?: unknown) {
    super(`AppKit validation failed: ${message}`, cause);
    this.name = 'AppKitValidationError';
  }
}

export class AppKitTimeoutError extends AppKitInitializationError {
  constructor(message: string, cause?: unknown) {
    super(`AppKit timeout: ${message}`, cause);
    this.name = 'AppKitTimeoutError';
  }
}

export class AppKitRetryError extends AppKitInitializationError {
  constructor(message: string, public readonly retryCount: number, cause?: unknown) {
    super(`AppKit retry failed after ${retryCount} attempts: ${message}`, cause);
    this.name = 'AppKitRetryError';
  }
}