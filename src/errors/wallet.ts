export class WalletConnectionError extends Error {
  constructor(message: string, public readonly cause?: unknown) {
    super(message);
    this.name = 'WalletConnectionError';
    Object.setPrototypeOf(this, WalletConnectionError.prototype);
  }
}

export class WalletValidationError extends WalletConnectionError {
  constructor(message: string, cause?: unknown) {
    super(`Wallet validation failed: ${message}`, cause);
    this.name = 'WalletValidationError';
  }
}

export class WalletInitializationError extends Error {
  constructor(
    message: string,
    public readonly cause?: unknown,
    public readonly addressAttempt?: string
  ) {
    super(message);
    this.name = 'WalletInitializationError';
    Object.setPrototypeOf(this, WalletInitializationError.prototype);
  }
}