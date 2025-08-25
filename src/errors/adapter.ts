export class AdapterError extends Error {
  constructor(message: string, public readonly cause?: unknown) {
    super(message);
    this.name = 'AdapterError';
    Object.setPrototypeOf(this, AdapterError.prototype);
  }
}

export class AdapterCacheError extends AdapterError {
  constructor(message: string, cause?: unknown) {
    super(`Adapter cache error: ${message}`, cause);
    this.name = 'AdapterCacheError';
  }
}

export class AdapterCleanupError extends AdapterError {
  constructor(message: string, cause?: unknown) {
    super(`Adapter cleanup error: ${message}`, cause);
    this.name = 'AdapterCleanupError';
  }
}