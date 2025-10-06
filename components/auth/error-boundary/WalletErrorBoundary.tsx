import React, { Component, ErrorInfo, ReactNode } from 'react';
import { sanitizeErrorMessage, logError } from '@/src/utils/security-logger';
import { removeAuthJwt } from '@/services/auth/auth.utils';

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
      isMinified: !!(error.message?.includes('Minified React error'))
    });

    // Log using the secure logging system
    logError('wallet_error_boundary', error);
  }

  private readonly handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  private readonly handleReset = async () => {
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
      <div className="tw-flex tw-items-center tw-justify-center tw-min-h-[200px] tw-p-6">
        <div className="tw-max-w-md tw-w-full tw-bg-red-50 tw-border tw-border-red-200 tw-rounded-lg tw-p-6 tw-text-center">
          <h3 className="tw-text-lg tw-font-semibold tw-text-red-800 tw-mb-3">
            Connection Problem
          </h3>
          <p className="tw-text-red-700 tw-mb-6">
            Something went wrong with your wallet connection.
          </p>
          <div className="tw-flex tw-flex-col sm:tw-flex-row tw-gap-3 tw-justify-center">
            <button
              onClick={this.handleRetry}
              className="tw-px-4 tw-py-2 tw-bg-blue-600 tw-text-white tw-rounded-md hover:tw-bg-blue-700 tw-transition-colors"
            >
              Try Again
            </button>
            <button
              onClick={this.handleReset}
              className="tw-px-4 tw-py-2 tw-bg-red-600 tw-text-white tw-rounded-md hover:tw-bg-red-700 tw-transition-colors"
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