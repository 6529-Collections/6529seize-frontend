export class WalletAuthenticationError extends Error {
  constructor(message: string, public readonly cause?: unknown) {
    super(message);
    this.name = 'WalletAuthenticationError';
    Object.setPrototypeOf(this, WalletAuthenticationError.prototype);
  }
}

export class InvalidPasswordError extends WalletAuthenticationError {
  constructor(message: string = 'Invalid password provided', cause?: unknown) {
    super(message, cause);
    this.name = 'InvalidPasswordError';
  }
}

export class PrivateKeyDecryptionError extends WalletAuthenticationError {
  constructor(message: string, cause?: unknown) {
    super(`Private key decryption failed: ${message}`, cause);
    this.name = 'PrivateKeyDecryptionError';
  }
}