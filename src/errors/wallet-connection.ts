/**
 * Custom error classes for wallet connection management
 * These errors enforce fail-fast behavior and provide clear error messages
 */

/**
 * Base error class for wallet connection issues
 * Extends Error to provide stack traces and proper error handling
 */
export class WalletConnectionError extends Error {
  constructor(message: string, public readonly code?: string) {
    super(message)
    this.name = 'WalletConnectionError'
    
    // Maintain proper stack trace for where error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, WalletConnectionError)
    }
  }
}

/**
 * Specific error class for connection state validation issues
 * Used when connection states are invalid or missing
 */
export class ConnectionStateError extends WalletConnectionError {
  constructor(message: string, public readonly walletAddress?: string, public readonly attemptedState?: string) {
    super(message, 'CONNECTION_STATE_ERROR')
    this.name = 'ConnectionStateError'
    
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ConnectionStateError)
    }
  }
}