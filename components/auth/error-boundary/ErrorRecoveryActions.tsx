import React from 'react';
import { RecoveryActionsProps } from './types';
import { removeAuthJwt } from '../../../services/auth/auth.utils';

/**
 * Shared recovery action buttons for error scenarios
 * Provides consistent styling and behavior across error displays
 */
export const ErrorRecoveryActions: React.FC<RecoveryActionsProps> = ({
  onRetry,
  onReset,
  onCopyDetails,
  errorDetails
}) => {
  const handleReset = async () => {
    try {
      // Clear authentication and storage
      removeAuthJwt();
      localStorage.clear();
      
      // Call custom reset handler if provided
      if (onReset) {
        onReset();
      } else {
        // Default behavior: reload the page
        window.location.reload();
      }
    } catch (error) {
      alert(`Failed to clear storage: ${error}`);
    }
  };

  const handleCopyDetails = () => {
    if (!errorDetails) {
      alert('No error details available to copy');
      return;
    }

    // Create sanitized error info for copying
    const errorInfo = {
      timestamp: errorDetails.timestamp,
      type: errorDetails.name,
      message: errorDetails.message,
      isMinified: errorDetails.isMinified,
      ...(errorDetails.stack && { stack: errorDetails.stack }),
      ...(errorDetails.componentStack && { componentStack: errorDetails.componentStack })
    };
    
    const errorText = JSON.stringify(errorInfo, null, 2);
    
    // Try to copy to clipboard, fallback to alert
    if (navigator.clipboard) {
      navigator.clipboard.writeText(errorText).then(() => {
        alert('Error details copied to clipboard!');
      }).catch(() => {
        alert(`Error details:\n\n${errorText}`);
      });
    } else {
      alert(`Error details:\n\n${errorText}`);
    }

    // Call custom copy handler if provided
    if (onCopyDetails) {
      onCopyDetails();
    }
  };

  const handleRetry = () => {
    if (onRetry) {
      onRetry();
    } else {
      // Default retry: reload the page
      window.location.reload();
    }
  };

  const handleToggleMobileDebug = () => {
    const currentValue = localStorage.getItem('ENABLE_MOBILE_ERROR_DEBUG');
    const newValue = currentValue === 'true' ? 'false' : 'true';
    localStorage.setItem('ENABLE_MOBILE_ERROR_DEBUG', newValue);
    
    if (newValue === 'true') {
      alert('Mobile debug mode ENABLED. Refresh the page and trigger the error again to see detailed debug information.');
    } else {
      alert('Mobile debug mode DISABLED. Refresh the page to return to user-friendly error display.');
    }
  };

  // Check if we should show the mobile debug toggle
  const showMobileDebugToggle = () => {
    if (typeof window === 'undefined') return false;
    
    // Show in production on mobile devices
    const isProduction = process.env.NODE_ENV === 'production';
    const isCapacitor = window.Capacitor?.isNativePlatform?.();
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    return isProduction && (isCapacitor || isMobile);
  };

  const buttonBaseStyle: React.CSSProperties = {
    padding: '12px 20px',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500',
    margin: '0 8px 8px 0',
    transition: 'background-color 0.2s ease'
  };

  const primaryButtonStyle: React.CSSProperties = {
    ...buttonBaseStyle,
    backgroundColor: '#1976d2',
    color: 'white'
  };

  const secondaryButtonStyle: React.CSSProperties = {
    ...buttonBaseStyle,
    backgroundColor: '#f5f5f5',
    color: '#333',
    border: '1px solid #ddd'
  };

  const dangerButtonStyle: React.CSSProperties = {
    ...buttonBaseStyle,
    backgroundColor: '#d32f2f',
    color: 'white'
  };

  const debugButtonStyle: React.CSSProperties = {
    ...buttonBaseStyle,
    backgroundColor: '#ff9800',
    color: 'white',
    fontSize: '12px',
    padding: '8px 16px'
  };

  return (
    <div style={{ 
      textAlign: 'center' as const, 
      marginTop: '24px',
      display: 'flex',
      flexWrap: 'wrap',
      justifyContent: 'center',
      alignItems: 'center'
    }}>
      {onRetry && (
        <button
          onClick={handleRetry}
          style={primaryButtonStyle}
          title="Retry the current operation"
        >
          Try Again
        </button>
      )}
      
      {errorDetails && (
        <button
          onClick={handleCopyDetails}
          style={secondaryButtonStyle}
          title="Copy error details for support"
        >
          Copy Error Details
        </button>
      )}
      
      <button
        onClick={handleReset}
        style={dangerButtonStyle}
        title="Clear all data and restart"
      >
        Reset & Reload
      </button>
      
      {showMobileDebugToggle() && (
        <button
          onClick={handleToggleMobileDebug}
          style={debugButtonStyle}
          title="Toggle detailed error information for mobile debugging"
        >
          Debug Mode
        </button>
      )}
    </div>
  );
};

export default ErrorRecoveryActions;