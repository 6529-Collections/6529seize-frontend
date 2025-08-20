import React, { Component, ErrorInfo, ReactNode } from 'react';
import { sanitizeErrorMessage, logError } from '../../../src/utils/security-logger';
import { removeAuthJwt } from '../../../services/auth/auth.utils';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * Simplified wallet error boundary with minimal UI and console-based debugging
 * Provides essential error recovery without over-engineered complexity
 */
export class WalletErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log detailed error information to console for debugging
    console.error('🚨 Wallet Error Boundary Caught Error:', {
      name: error.name,
      message: sanitizeErrorMessage(error.message),
      stack: error.stack ? sanitizeErrorMessage(error.stack) : undefined,
      componentStack: errorInfo.componentStack ? sanitizeErrorMessage(errorInfo.componentStack) : undefined,
      timestamp: new Date().toISOString(),
      isMinified: !!(error.message && error.message.includes('Minified React error'))
    });

    // Log using the secure logging system
    logError('wallet_error_boundary', error);
  }

  private handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  private handleReset = async () => {
    try {
      removeAuthJwt();
      localStorage.clear();
      window.location.reload();
    } catch (error) {
      console.error('Failed to clear storage:', error);
      window.location.reload();
    }
  };

  render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    return (
      <div className="flex items-center justify-center min-h-[200px] p-6">
        <div className="max-w-md w-full bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <h3 className="text-lg font-semibold text-red-800 mb-3">
            Connection Problem
          </h3>
          <p className="text-red-700 mb-6">
            Something went wrong with your wallet connection.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={this.handleRetry}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Try Again
            </button>
            <button
              onClick={this.handleReset}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
            >
              Clear Storage & Reload
            </button>
          </div>
        </div>
      </div>
    );
  }
}

export default WalletErrorBoundary;