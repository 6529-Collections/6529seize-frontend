/**
 * Security event types for monitoring and auditing wallet connection events
 * SECURITY: These events must NEVER contain sensitive data like addresses or user identifiers
 */
export enum SecurityEventType {
  WALLET_CONNECTION_ATTEMPT = 'wallet_connection_attempt',
  WALLET_MODAL_OPENED = 'wallet_modal_opened',
  INVALID_ADDRESS_DETECTED = 'invalid_address_detected',
  ADDRESS_VALIDATION_SUCCESS = 'address_validation_success',
  WALLET_DISCONNECTION = 'wallet_disconnection',
  AUTH_CLEANUP_FAILURE = 'auth_cleanup_failure',
  INITIALIZATION_ERROR = 'initialization_error'
}

/**
 * Security event context - contains ONLY non-sensitive diagnostic data
 * CRITICAL: This interface must NEVER include fields that could contain:
 * - Wallet addresses (full, partial, or hashed)
 * - User identifiers
 * - Session tokens
 * - Any personally identifiable information
 */
export interface SecurityEventContext {
  /** ISO timestamp of when the event occurred */
  readonly timestamp: string;
  
  /** The source component or function that triggered the event */
  readonly source: string;
  
  /** Whether an address validation passed (for validation events) */
  readonly valid?: boolean;
  
  /** Length of address string (for format analysis, not identification) */
  readonly addressLength?: number;
  
  /** Format type of address (for diagnostic purposes) */
  readonly addressFormat?: 'hex_prefixed' | 'other';
  
  /** Name of the wallet connector (e.g., 'MetaMask', 'WalletConnect') */
  readonly walletName?: string;
  
  /** Error type or code for diagnostic purposes */
  readonly errorCode?: string;
  
  /** Browser user agent string for compatibility analysis */
  readonly userAgent?: string;
}