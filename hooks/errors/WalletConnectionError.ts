/**
 * Base error class for wallet connection issues
 */
export class WalletConnectionError extends Error {
  constructor(message: string, public readonly code: string = 'WALLET_CONNECTION_ERROR') {
    super(message);
    this.name = 'WalletConnectionError';
    
    // Ensure proper prototype chain for instanceof checks
    Object.setPrototypeOf(this, WalletConnectionError.prototype);
  }
}

/**
 * Error thrown when deep link connection times out
 */
export class DeepLinkTimeoutError extends WalletConnectionError {
  constructor(timeoutMs: number) {
    super(`Deep link connection timed out after ${timeoutMs}ms`, 'DEEP_LINK_TIMEOUT');
    this.name = 'DeepLinkTimeoutError';
    Object.setPrototypeOf(this, DeepLinkTimeoutError.prototype);
  }
}

/**
 * Error thrown when connection verification fails
 */
export class ConnectionVerificationError extends WalletConnectionError {
  constructor(currentState: string, expectedState: string = 'waiting_for_return') {
    super(
      `Invalid connection state for verification. Expected '${expectedState}', got '${currentState}'`,
      'CONNECTION_VERIFICATION_ERROR'
    );
    this.name = 'ConnectionVerificationError';
    Object.setPrototypeOf(this, ConnectionVerificationError.prototype);
  }
}