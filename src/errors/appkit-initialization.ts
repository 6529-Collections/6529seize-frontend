class AppKitInitializationError extends Error {
  constructor(message: string, public override readonly cause?: unknown) {
    super(message);
    this.name = 'AppKitInitializationError';
    Object.setPrototypeOf(this, AppKitInitializationError.prototype);
  }
}

export class AppKitValidationError extends AppKitInitializationError {
  constructor(message: string, cause?: unknown) {
    super(`AppKit validation failed: ${message}`, cause);
    this.name = 'AppKitValidationError';
    Object.setPrototypeOf(this, AppKitValidationError.prototype);
  }
}
