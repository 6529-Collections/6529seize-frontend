import React, { useState } from 'react';
import { ErrorDisplayProps } from './types';
import { UserErrorDisplay } from './UserErrorDisplay';

/**
 * Developer-focused error panel with detailed debugging information
 * Only shown in development environment with sanitized data
 */
export const DeveloperErrorPanel: React.FC<ErrorDisplayProps> = (props) => {
  const [showDebugDetails, setShowDebugDetails] = useState(false);
  const { errorDetails } = props;
  
  const debugContainerStyle: React.CSSProperties = {
    backgroundColor: '#f8f9fa',
    border: '2px solid #e9ecef',
    borderRadius: '8px',
    margin: '20px',
    overflow: 'hidden'
  };

  const debugHeaderStyle: React.CSSProperties = {
    backgroundColor: '#343a40',
    color: '#fff',
    padding: '12px 16px',
    margin: 0,
    fontSize: '14px',
    fontWeight: '600',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    cursor: 'pointer',
    userSelect: 'none' as const
  };

  const toggleButtonStyle: React.CSSProperties = {
    background: 'none',
    border: '1px solid #6c757d',
    color: '#fff',
    padding: '4px 8px',
    borderRadius: '4px',
    fontSize: '12px',
    cursor: 'pointer'
  };

  const debugSectionStyle: React.CSSProperties = {
    backgroundColor: '#ffffff',
    padding: '16px',
    marginBottom: '12px',
    borderRadius: '6px',
    border: '1px solid #dee2e6'
  };

  const codeBlockStyle: React.CSSProperties = {
    backgroundColor: '#f8f9fa',
    padding: '12px',
    borderRadius: '4px',
    fontFamily: 'Monaco, Menlo, "Ubuntu Mono", monospace',
    fontSize: '12px',
    border: '1px solid #e9ecef',
    whiteSpace: 'pre-wrap' as const,
    wordBreak: 'break-word' as const,
    maxHeight: '200px',
    overflow: 'auto',
    color: '#495057'
  };

  const sectionTitleStyle: React.CSSProperties = {
    margin: '0 0 8px 0',
    fontSize: '14px',
    fontWeight: '600',
    color: '#495057'
  };

  return (
    <div>
      {/* Show user-friendly display first */}
      <UserErrorDisplay {...props} />
      
      {/* Development debug panel */}
      <div style={debugContainerStyle}>
        <div 
          style={debugHeaderStyle}
          onClick={() => setShowDebugDetails(!showDebugDetails)}
        >
          <span>🔧 Developer Debug Information</span>
          <button style={toggleButtonStyle}>
            {showDebugDetails ? 'Hide Details' : 'Show Details'}
          </button>
        </div>
        
        {showDebugDetails && (
          <div style={{ padding: '16px' }}>
            {/* Error Summary */}
            <div style={debugSectionStyle}>
              <h4 style={sectionTitleStyle}>Error Summary</h4>
              <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: '8px', fontSize: '13px' }}>
                <strong>Type:</strong>
                <span>{errorDetails.name}</span>
                
                <strong>Timestamp:</strong>
                <span>{errorDetails.timestamp}</span>
                
                <strong>Minified:</strong>
                <span>{errorDetails.isMinified ? 'Yes' : 'No'}</span>
              </div>
            </div>

            {/* Error Message */}
            <div style={debugSectionStyle}>
              <h4 style={sectionTitleStyle}>Sanitized Message</h4>
              <div style={codeBlockStyle}>
                {errorDetails.message}
              </div>
            </div>

            {/* Stack Trace */}
            {errorDetails.stack && (
              <div style={debugSectionStyle}>
                <h4 style={sectionTitleStyle}>Sanitized Stack Trace</h4>
                <div style={codeBlockStyle}>
                  {errorDetails.stack}
                </div>
              </div>
            )}

            {/* Component Stack */}
            {errorDetails.componentStack && (
              <div style={debugSectionStyle}>
                <h4 style={sectionTitleStyle}>Component Stack</h4>
                <div style={codeBlockStyle}>
                  {errorDetails.componentStack}
                </div>
              </div>
            )}

            {/* Error String Representation */}
            <div style={debugSectionStyle}>
              <h4 style={sectionTitleStyle}>Error toString()</h4>
              <div style={codeBlockStyle}>
                {errorDetails.toString}
              </div>
            </div>

            {/* Debug Tips */}
            <div style={{
              ...debugSectionStyle,
              backgroundColor: '#e3f2fd',
              border: '1px solid #bbdefb'
            }}>
              <h4 style={{ ...sectionTitleStyle, color: '#1976d2' }}>🔍 Debug Tips</h4>
              <ul style={{ margin: '0', paddingLeft: '20px', fontSize: '13px', color: '#424242' }}>
                <li>All sensitive data (addresses, tokens) has been sanitized</li>
                <li>Check browser console for additional error context</li>
                <li>Component stack shows React component hierarchy when error occurred</li>
                <li>Use "Copy Error Details" to get sanitized error info for reporting</li>
                <li>This debug panel only appears in development mode</li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DeveloperErrorPanel;