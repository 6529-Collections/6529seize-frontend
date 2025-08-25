export class WalletValidationError extends Error {
  constructor(message: string, public readonly cause?: unknown) {
    super(message);
    this.name = 'WalletValidationError';
    Object.setPrototypeOf(this, WalletValidationError.prototype);
  }
}

export class WalletSecurityError extends WalletValidationError {
  constructor(message: string, cause?: unknown) {
    super(`Wallet security violation: ${message}`, cause);
    this.name = 'WalletSecurityError';
  }
}