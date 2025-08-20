import { ReactNode } from 'react';

/**
 * Error details captured by the error boundary
 * Contains sanitized diagnostic information
 */
export interface ErrorDetails {
  /** Error type name (e.g., 'WalletInitializationError') */
  readonly name: string;
  
  /** Sanitized error message with sensitive data removed */
  readonly message: string;
  
  /** Sanitized stack trace (development only) */
  readonly stack?: string;
  
  /** String representation of the error */
  readonly toString: string;
  
  /** Whether this is a minified React error */
  readonly isMinified: boolean;
  
  /** ISO timestamp when error occurred */
  readonly timestamp: string;
  
  /** React component stack information */
  readonly componentStack?: string;
}

/**
 * State for the error boundary component
 */
export interface ErrorBoundaryState {
  /** Whether an error has been caught */
  hasError: boolean;
  
  /** The original error object */
  error: Error | null;
  
  /** Processed and sanitized error details */
  errorDetails?: ErrorDetails;
}

/**
 * Props for error boundary component
 */
export interface ErrorBoundaryProps {
  /** Child components to render when no error */
  children: ReactNode;
}

/**
 * Props for error display components
 */
export interface ErrorDisplayProps {
  /** Sanitized error details */
  errorDetails: ErrorDetails;
  
  /** Function to retry/recover from error */
  onRetry?: () => void;
  
  /** Function to clear storage and reload */
  onReset?: () => void;
  
  /** Function to copy error details */
  onCopyDetails?: () => void;
}

/**
 * Props for recovery action buttons
 */
export interface RecoveryActionsProps {
  /** Function to retry the operation */
  onRetry?: () => void;
  
  /** Function to reset application state */
  onReset?: () => void;
  
  /** Function to copy error information */
  onCopyDetails?: () => void;
  
  /** Error details for copying */
  errorDetails?: ErrorDetails;
}

/**
 * Common error scenarios for better UX
 */
export enum ErrorScenario {
  WALLET_INITIALIZATION = 'wallet_initialization',
  CONNECTION_FAILED = 'connection_failed',
  INVALID_ADDRESS = 'invalid_address',
  STORAGE_CORRUPTION = 'storage_corruption',
  UNKNOWN = 'unknown'
}

/**
 * User-friendly error information
 */
export interface UserFriendlyError {
  /** Simple title for the error */
  title: string;
  
  /** User-friendly description */
  description: string;
  
  /** Possible causes in simple terms */
  possibleCauses: string[];
  
  /** Recommended actions */
  recommendations: string[];
  
  /** Error scenario category */
  scenario: ErrorScenario;
}