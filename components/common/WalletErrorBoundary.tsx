"use client";

import React, { Component, ErrorInfo, ReactNode } from "react";
import { WalletInitializationError } from "../../src/errors/wallet";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

/**
 * Error boundary component specifically designed to catch and handle
 * WalletInitializationError and other wallet-related errors.
 * 
 * This prevents the entire application from crashing when wallet
 * initialization fails due to invalid stored addresses or other
 * security issues.
 */
export class WalletErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI
    alert(`[DEBUG 1] error: ${error}`);
    return {
      hasError: true,
      error,
      errorInfo: null,
    };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Update state with error details
    this.setState({
      errorInfo,
    });

    // Log the error for monitoring
    const timestamp = new Date().toISOString();
    const isProduction = process.env.NODE_ENV === 'production';
    
    if (error instanceof WalletInitializationError) {
      // Special handling for wallet initialization errors
      const sanitizedErrorInfo = {
        timestamp,
        errorType: 'WalletInitializationError',
        message: error.message,
        addressAttempt: isProduction ? '***REDACTED***' : error.addressAttempt,
        stack: isProduction ? undefined : error.stack,
        componentStack: isProduction ? undefined : errorInfo.componentStack,
      };
      
      console.error('[WALLET_ERROR_BOUNDARY] WalletInitializationError caught:', sanitizedErrorInfo);
    } else {
      // General error handling
      const sanitizedErrorInfo = {
        timestamp,
        errorType: error.name || 'Unknown',
        message: error.message,
        stack: isProduction ? undefined : error.stack,
        componentStack: isProduction ? undefined : errorInfo.componentStack,
      };
      
      console.error('[WALLET_ERROR_BOUNDARY] Error caught:', sanitizedErrorInfo);
    }

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  private readonly handleRetry = () => {
    // Clear the error state to allow retry
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  public render() {
    if (this.state.hasError) {
      // Use custom fallback UI if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default fallback UI based on error type
      if (this.state.error instanceof WalletInitializationError) {
        return (
          <div className="wallet-error-boundary">
            <div className="error-container">
              <h2>Wallet Connection Error</h2>
              <p>
                We detected an issue with your stored wallet information. 
                For security reasons, we've cleared the invalid data.
              </p>
              <p>
                Please reconnect your wallet to continue using the application.
              </p>
              <div className="error-actions">
                <button 
                  onClick={this.handleRetry}
                  className="retry-button"
                >
                  Retry Connection
                </button>
              </div>
              {process.env.NODE_ENV === 'development' && (
                <details className="error-details">
                  <summary>Error Details (Development Only)</summary>
                  <pre>{this.state.error.message}</pre>
                  {this.state.error.stack && (
                    <pre>{this.state.error.stack}</pre>
                  )}
                </details>
              )}
            </div>
          </div>
        );
      }

      // Default error UI for other errors
      return (
        <div className="wallet-error-boundary">
          <div className="error-container">
            <h2>Application Error</h2>
            <p>
              Something went wrong. Please try refreshing the page.
            </p>
            <div className="error-actions">
              <button 
                onClick={this.handleRetry}
                className="retry-button"
              >
                Try Again
              </button>
              <button 
                onClick={() => window.location.reload()}
                className="refresh-button"
              >
                Refresh Page
              </button>
            </div>
            {process.env.NODE_ENV === 'development' && (
              <details className="error-details">
                <summary>Error Details (Development Only)</summary>
                <pre>{this.state.error?.message}</pre>
                {this.state.error?.stack && (
                  <pre>{this.state.error.stack}</pre>
                )}
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default WalletErrorBoundary;