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