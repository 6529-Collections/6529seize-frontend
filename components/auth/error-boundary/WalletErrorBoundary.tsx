import React, { Component, ErrorInfo } from 'react';
import { ErrorBoundaryProps, ErrorBoundaryState, ErrorDetails } from './types';
import { UserErrorDisplay } from './UserErrorDisplay';
import { DeveloperErrorPanel } from './DeveloperErrorPanel';
import { sanitizeErrorMessage } from '../../../src/utils/security-logger';
import { logError } from '../../../src/utils/security-logger';

/**
 * Main error boundary component that catches React errors in wallet initialization
 * Provides environment-aware error display with sanitized data
 */
export class WalletErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null, 
      errorDetails: undefined 
    };
  }

  /**
   * Creates sanitized error details from the caught error
   */
  private createSanitizedErrorDetails(error: Error): ErrorDetails {
    return {
      name: error.name,
      message: sanitizeErrorMessage(error.message),
      stack: error.stack ? sanitizeErrorMessage(error.stack) : undefined,
      toString: sanitizeErrorMessage(error.toString()),
      isMinified: !!(error.message && error.message.includes('Minified React error')),
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Static method called when an error is caught
   * Returns new state with sanitized error information
   */
  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    // Create sanitized error details immediately
    const errorDetails: ErrorDetails = {
      name: error.name,
      message: sanitizeErrorMessage(error.message),
      stack: error.stack ? sanitizeErrorMessage(error.stack) : undefined,
      toString: sanitizeErrorMessage(error.toString()),
      isMinified: !!(error.message && error.message.includes('Minified React error')),
      timestamp: new Date().toISOString()
    };
    
    return { 
      hasError: true, 
      error, 
      errorDetails 
    };
  }

  /**
   * Called after an error has been caught
   * Updates state with component stack and logs the error
   */
  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Update state with sanitized component stack information
    this.setState(prevState => ({
      ...prevState,
      errorDetails: prevState.errorDetails ? {
        ...prevState.errorDetails,
        componentStack: errorInfo.componentStack ? 
          sanitizeErrorMessage(errorInfo.componentStack) : undefined
      } : undefined
    }));
    
    // Log the error using the secure logging system
    logError('wallet_error_boundary', error);
  }

  /**
   * Retry handler - resets the error boundary state
   */
  private handleRetry = () => {
    this.setState({ 
      hasError: false, 
      error: null, 
      errorDetails: undefined 
    });
  };

  /**
   * Determines whether to show development or production UI
   * Includes special mobile debugging support for production
   */
  private isDevelopmentMode = (): boolean => {
    // Standard development mode
    if (process.env.NODE_ENV === 'development') {
      return true;
    }
    
    // Mobile production debugging support
    // Enable detailed error display in production for mobile debugging
    if (typeof window !== 'undefined') {
      // Check for mobile debugging flag in localStorage
      const enableMobileDebug = localStorage.getItem('ENABLE_MOBILE_ERROR_DEBUG') === 'true';
      
      // Check for Capacitor (mobile app environment)
      const isCapacitor = window.Capacitor?.isNativePlatform?.();
      
      // Check for mobile user agent as fallback
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      
      // Enable debug mode if:
      // 1. Mobile debug flag is set AND (device is mobile OR is Capacitor app)
      // 2. OR if there's a special debug query parameter
      const urlParams = new URLSearchParams(window.location.search);
      const forceDebug = urlParams.get('debug_errors') === 'true';
      
      return forceDebug || (enableMobileDebug && (isCapacitor || isMobile));
    }
    
    return false;
  };

  render() {
    // If no error, render children normally
    if (!this.state.hasError || !this.state.errorDetails) {
      return this.props.children;
    }

    // Prepare props for error display components
    const errorDisplayProps = {
      errorDetails: this.state.errorDetails,
      onRetry: this.handleRetry,
      onReset: undefined, // Let ErrorRecoveryActions handle default reset
      onCopyDetails: undefined // Let ErrorRecoveryActions handle copying
    };

    // Render appropriate error display based on environment
    if (this.isDevelopmentMode()) {
      return <DeveloperErrorPanel {...errorDisplayProps} />;
    } else {
      return <UserErrorDisplay {...errorDisplayProps} />;
    }
  }
}

export default WalletErrorBoundary;