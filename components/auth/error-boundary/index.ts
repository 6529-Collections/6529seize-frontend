/**
 * Barrel export for wallet error boundary components
 * Provides clean imports for the error handling system
 */

// Main components
export { WalletErrorBoundary } from './WalletErrorBoundary';
export { UserErrorDisplay } from './UserErrorDisplay';
export { DeveloperErrorPanel } from './DeveloperErrorPanel';
export { ErrorRecoveryActions } from './ErrorRecoveryActions';

// Types
export type {
  ErrorDetails,
  ErrorBoundaryState,
  ErrorBoundaryProps,
  ErrorDisplayProps,
  RecoveryActionsProps,
  UserFriendlyError
} from './types';

export { ErrorScenario } from './types';

// Default export for convenience
export { WalletErrorBoundary as default } from './WalletErrorBoundary';