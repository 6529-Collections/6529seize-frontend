import React from 'react';
import { ErrorDisplayProps, ErrorScenario, UserFriendlyError } from './types';
import { ErrorRecoveryActions } from './ErrorRecoveryActions';

/**
 * Determines the error scenario based on error details
 */
const categorizeError = (errorDetails: ErrorDisplayProps['errorDetails']): ErrorScenario => {
  const message = errorDetails.message.toLowerCase();
  const name = errorDetails.name.toLowerCase();
  
  if (name.includes('walletinitialization') || message.includes('initialization')) {
    return ErrorScenario.WALLET_INITIALIZATION;
  }
  
  if (name.includes('connection') || message.includes('connection') || message.includes('connect')) {
    return ErrorScenario.CONNECTION_FAILED;
  }
  
  if (message.includes('address') || message.includes('invalid')) {
    return ErrorScenario.INVALID_ADDRESS;
  }
  
  if (message.includes('storage') || message.includes('corrupted')) {
    return ErrorScenario.STORAGE_CORRUPTION;
  }
  
  return ErrorScenario.UNKNOWN;
};

/**
 * Gets user-friendly error information based on scenario
 */
const getUserFriendlyError = (scenario: ErrorScenario): UserFriendlyError => {
  switch (scenario) {
    case ErrorScenario.WALLET_INITIALIZATION:
      return {
        title: 'Wallet Setup Problem',
        description: 'We encountered an issue while setting up your wallet connection.',
        possibleCauses: [
          'Browser storage data may be corrupted',
          'Wallet extension might need updating',
          'Previous connection was interrupted'
        ],
        recommendations: [
          'Try connecting again',
          'Clear browser data and reconnect',
          'Update your wallet extension'
        ],
        scenario
      };
      
    case ErrorScenario.CONNECTION_FAILED:
      return {
        title: 'Connection Failed',
        description: 'Unable to establish a connection with your wallet.',
        possibleCauses: [
          'Wallet extension is not responding',
          'Network connectivity issues',
          'Wallet is locked or busy'
        ],
        recommendations: [
          'Check that your wallet is unlocked',
          'Refresh the page and try again',
          'Restart your browser'
        ],
        scenario
      };
      
    case ErrorScenario.INVALID_ADDRESS:
      return {
        title: 'Address Format Issue',
        description: 'There was a problem with the wallet address format.',
        possibleCauses: [
          'Corrupted address data in storage',
          'Incompatible wallet format',
          'Data transmission error'
        ],
        recommendations: [
          'Clear stored data and reconnect',
          'Try using a different wallet',
          'Contact support if issue persists'
        ],
        scenario
      };
      
    case ErrorScenario.STORAGE_CORRUPTION:
      return {
        title: 'Data Storage Issue',
        description: 'Your browser\'s stored wallet data appears to be corrupted.',
        possibleCauses: [
          'Browser storage corruption',
          'Incomplete previous disconnection',
          'Browser extension conflicts'
        ],
        recommendations: [
          'Clear browser data for this site',
          'Disconnect and reconnect wallet',
          'Try using incognito/private mode'
        ],
        scenario
      };
      
    default:
      return {
        title: 'Unexpected Error',
        description: 'An unexpected error occurred with your wallet connection.',
        possibleCauses: [
          'Temporary system issue',
          'Browser compatibility problem',
          'Network connectivity issue'
        ],
        recommendations: [
          'Refresh the page and try again',
          'Try using a different browser',
          'Contact support if problem continues'
        ],
        scenario
      };
  }
};

/**
 * User-friendly error display for production environments
 * Shows clean, non-technical error information with clear recovery options
 */
export const UserErrorDisplay: React.FC<ErrorDisplayProps> = ({
  errorDetails,
  onRetry,
  onReset,
  onCopyDetails
}) => {
  const scenario = categorizeError(errorDetails);
  const userError = getUserFriendlyError(scenario);
  
  const containerStyle: React.CSSProperties = {
    padding: '32px',
    border: '1px solid #ffcdd2',
    borderRadius: '12px',
    backgroundColor: '#fff5f5',
    color: '#d32f2f',
    margin: '20px',
    textAlign: 'left' as const,
    maxWidth: '600px',
    marginLeft: 'auto',
    marginRight: 'auto',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
  };

  const titleStyle: React.CSSProperties = {
    textAlign: 'center' as const,
    marginBottom: '16px',
    fontSize: '24px',
    fontWeight: '600',
    color: '#d32f2f'
  };

  const descriptionStyle: React.CSSProperties = {
    textAlign: 'center' as const,
    marginBottom: '24px',
    fontSize: '16px',
    lineHeight: '1.5',
    color: '#666'
  };

  const sectionStyle: React.CSSProperties = {
    backgroundColor: '#ffffff',
    padding: '20px',
    borderRadius: '8px',
    marginBottom: '16px',
    border: '1px solid #e0e0e0'
  };

  const listStyle: React.CSSProperties = {
    margin: '8px 0 0 0',
    paddingLeft: '20px'
  };

  const listItemStyle: React.CSSProperties = {
    marginBottom: '4px',
    color: '#555'
  };

  return (
    <div style={containerStyle}>
      <h3 style={titleStyle}>{userError.title}</h3>
      <p style={descriptionStyle}>{userError.description}</p>
      
      <div style={sectionStyle}>
        <h4 style={{ margin: '0 0 12px 0', color: '#d32f2f', fontSize: '16px' }}>
          What might have caused this?
        </h4>
        <ul style={listStyle}>
          {userError.possibleCauses.map((cause, index) => (
            <li key={index} style={listItemStyle}>{cause}</li>
          ))}
        </ul>
      </div>

      <div style={sectionStyle}>
        <h4 style={{ margin: '0 0 12px 0', color: '#1976d2', fontSize: '16px' }}>
          What can you do?
        </h4>
        <ul style={listStyle}>
          {userError.recommendations.map((recommendation, index) => (
            <li key={index} style={listItemStyle}>{recommendation}</li>
          ))}
        </ul>
      </div>

      <ErrorRecoveryActions
        onRetry={onRetry}
        onReset={onReset}
        onCopyDetails={onCopyDetails}
        errorDetails={errorDetails}
      />
    </div>
  );
};

export default UserErrorDisplay;