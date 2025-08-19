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
    // Enhanced mobile debugging with full error details
    const errorDetails = {
      name: error.name,
      message: error.message,
      stack: error.stack?.substring(0, 400),
      toString: error.toString(),
      isMinified: error.message && error.message.includes('Minified React error'),
      isWalletError: error instanceof WalletInitializationError,
      timestamp: new Date().toISOString()
    };
    
    // Show comprehensive error alert for mobile debugging
    alert(
      `🚨 WALLET ERROR BOUNDARY\n\n` +
      `Error Type: ${errorDetails.name}\n` +
      `Is Wallet Error: ${errorDetails.isWalletError}\n` +
      `Is Minified: ${errorDetails.isMinified}\n\n` +
      `Message: ${errorDetails.message}\n\n` +
      `Stack (first 200 chars):\n${errorDetails.stack?.substring(0, 200) || 'No stack'}...\n\n` +
      `Time: ${errorDetails.timestamp}`
    );
    
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

    // Enhanced mobile debugging for componentDidCatch
    const timestamp = new Date().toISOString();
    const isProduction = process.env.NODE_ENV === 'production';
    
    if (error instanceof WalletInitializationError) {
      // Special mobile alert for wallet initialization errors
      alert(
        `🔧 WALLET INIT ERROR CAUGHT\n\n` +
        `Location: WalletErrorBoundary\n` +
        `Type: WalletInitializationError\n` +
        `Time: ${timestamp}\n\n` +
        `Message: ${error.message}\n\n` +
        `Address Attempt: ${isProduction ? '***REDACTED***' : error.addressAttempt}\n\n` +
        `Component Stack (first 200 chars):\n${errorInfo.componentStack?.substring(0, 200) || 'No stack'}...`
      );
    } else {
      // General mobile alert for other errors
      alert(
        `⚠️ GENERAL ERROR CAUGHT\n\n` +
        `Location: WalletErrorBoundary\n` +
        `Type: ${error.name || 'Unknown'}\n` +
        `Time: ${timestamp}\n\n` +
        `Message: ${error.message}\n\n` +
        `Component Stack (first 200 chars):\n${errorInfo.componentStack?.substring(0, 200) || 'No stack'}...`
      );
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
                  {this.state.errorInfo?.componentStack && (
                    <div>
                      <strong>Component Stack:</strong>
                      <pre>{this.state.errorInfo.componentStack}</pre>
                    </div>
                  )}
                </details>
              )}
              <button 
                onClick={() => {
                  // Enhanced mobile debugging button for wallet errors
                  const debugInfo = {
                    errorName: this.state.error?.name,
                    errorMessage: this.state.error?.message,
                    isWalletError: this.state.error instanceof WalletInitializationError,
                    timestamp: new Date().toISOString(),
                    componentStack: this.state.errorInfo?.componentStack?.substring(0, 300)
                  };
                  
                  alert(
                    `📊 DEBUG INFO FOR WALLET ERROR\n\n` +
                    `Error Name: ${debugInfo.errorName}\n` +
                    `Is Wallet Error: ${debugInfo.isWalletError}\n` +
                    `Time: ${debugInfo.timestamp}\n\n` +
                    `Full Message: ${debugInfo.errorMessage}\n\n` +
                    `Component Stack: ${debugInfo.componentStack || 'None'}\n\n` +
                    `Use this info to debug the wallet initialization issue.`
                  );
                }}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#007bff',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  marginLeft: '10px'
                }}
              >
                Show Debug Info
              </button>
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
                {this.state.errorInfo?.componentStack && (
                  <div>
                    <strong>Component Stack:</strong>
                    <pre>{this.state.errorInfo.componentStack}</pre>
                  </div>
                )}
              </details>
            )}
            <button 
              onClick={() => {
                // Enhanced mobile debugging for general errors
                const debugInfo = {
                  errorName: this.state.error?.name,
                  errorMessage: this.state.error?.message,
                  timestamp: new Date().toISOString(),
                  componentStack: this.state.errorInfo?.componentStack?.substring(0, 300)
                };
                
                alert(
                  `📊 DEBUG INFO FOR GENERAL ERROR\n\n` +
                  `Error Name: ${debugInfo.errorName}\n` +
                  `Time: ${debugInfo.timestamp}\n\n` +
                  `Full Message: ${debugInfo.errorMessage}\n\n` +
                  `Component Stack: ${debugInfo.componentStack || 'None'}\n\n` +
                  `Use this info to debug the application error.`
                );
              }}
              style={{
                padding: '8px 16px',
                backgroundColor: '#007bff',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                marginLeft: '10px'
              }}
            >
              Show Debug Info
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default WalletErrorBoundary;