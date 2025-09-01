import React from 'react';
import { render, screen, fireEvent, waitFor, renderHook } from '@testing-library/react';
import { act } from 'react-dom/test-utils';
import userEvent from '@testing-library/user-event';
import {
  SeizeConnectProvider,
  useSeizeConnectContext,
  WalletConnectionError,
  WalletDisconnectionError,
  AuthenticationError,
} from '../../../components/auth/SeizeConnectContext';
import * as authUtils from '../../../services/auth/auth.utils';
import { WalletInitializationError } from '../../../src/errors/wallet';

// Mock the Reown AppKit hooks
jest.mock('@reown/appkit/react', () => ({
  useAppKit: jest.fn(() => ({
    open: jest.fn()
  })),
  useAppKitAccount: jest.fn(() => ({
    address: undefined,
    isConnected: false,
    status: 'disconnected'
  })),
  useAppKitState: jest.fn(() => ({
    open: false
  })),
  useDisconnect: jest.fn(() => ({
    disconnect: jest.fn()
  })),
  useWalletInfo: jest.fn(() => ({
    walletInfo: null
  }))
}));

// Mock viem
jest.mock('viem', () => ({
  isAddress: jest.fn((address: string) => /^0x[a-fA-F0-9]{40}$/.test(address)),
  getAddress: jest.fn((address: string) => address.toLowerCase()),
}));

// Mock auth utils
jest.mock('../../../services/auth/auth.utils', () => ({
  migrateCookiesToLocalStorage: jest.fn(),
  getWalletAddress: jest.fn(() => null),
  removeAuthJwt: jest.fn(),
}));

// Don't mock security logger - we want to test actual logging behavior

// Error boundary for testing
class TestErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(_error: Error, _errorInfo: React.ErrorInfo) {
    // Suppress error logging in tests
  }

  render() {
    if (this.state.hasError) {
      return <div data-testid="error-boundary">Error caught: {this.state.error?.message}</div>;
    }
    return this.props.children;
  }
}

// Test component to use the hook
const TestComponent: React.FC = () => {
  const {
    seizeConnect,
    seizeAcceptConnection,
    address,
    isAuthenticated,
    hasInitializationError,
    initializationError
  } = useSeizeConnectContext();

  const handleConnect = () => {
    try {
      seizeConnect();
    } catch {
      // Errors are logged by the component
    }
  };

  const handleAcceptValid = () => {
    try {
      seizeAcceptConnection('0x1234567890123456789012345678901234567890');
    } catch {
      // Errors are logged by the component
    }
  };

  const handleAcceptInvalid = () => {
    try {
      seizeAcceptConnection('invalid-address');
    } catch {
      // Errors are logged by the component
    }
  };

  return (
    <div data-testid="test-component">
      <button onClick={handleConnect} data-testid="connect-button">Connect</button>
      <button onClick={handleAcceptValid} data-testid="accept-valid">Accept Valid</button>
      <button onClick={handleAcceptInvalid} data-testid="accept-invalid">Accept Invalid</button>
      <div data-testid="address">{address || 'undefined'}</div>
      <div data-testid="is-authenticated">{isAuthenticated.toString()}</div>
      <div data-testid="has-error">{hasInitializationError.toString()}</div>
      <div data-testid="error-message">{initializationError?.message || 'no error'}</div>
    </div>
  );
};

// Helper to render the component with provider
const renderWithProvider = (children: React.ReactNode = <TestComponent />) => {
  return render(
    <SeizeConnectProvider>
      {children}
    </SeizeConnectProvider>
  );
};

describe('SeizeConnectContext Security Logging', () => {
  let consoleErrorSpy: jest.SpyInstance;
  let consoleWarnSpy: jest.SpyInstance;
  let originalNodeEnv: string | undefined;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Spy on console methods
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    
    // Store original NODE_ENV
    originalNodeEnv = process.env.NODE_ENV;
  });

  afterEach(() => {
    // Restore console methods
    consoleErrorSpy.mockRestore();
    consoleWarnSpy.mockRestore();
    
    // Restore NODE_ENV
    if (originalNodeEnv !== undefined) {
      process.env.NODE_ENV = originalNodeEnv;
    } else {
      delete process.env.NODE_ENV;
    }
  });

  describe('Error Logging in Production', () => {
    beforeEach(() => {
      process.env.NODE_ENV = 'production';
    });

    it('logs errors in production mode with sanitization', async () => {
      const { useAppKit } = require('@reown/appkit/react');
      const mockOpen = jest.fn().mockImplementation(() => {
        throw new Error('Connection failed with wallet 0x1234567890123456789012345678901234567890');
      });
      useAppKit.mockReturnValue({ open: mockOpen });

      render(
        <TestErrorBoundary>
          <SeizeConnectProvider>
            <TestComponent />
          </SeizeConnectProvider>
        </TestErrorBoundary>
      );

      const connectButton = screen.getByTestId('connect-button');
      
      await act(async () => {
        fireEvent.click(connectButton);
        // Allow error to propagate through React
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      // Verify error was logged (logError always works in production)
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        '[SEIZE_CONNECT_ERROR]',
        expect.objectContaining({
          context: 'seizeConnect',
          name: 'WalletConnectionError',
          message: expect.stringContaining('Failed to open wallet connection modal'),
          timestamp: expect.any(String),
          userAgent: expect.any(String)
        })
      );

      // Find the correct log call (skip the deprecation warning)
      const logCall = consoleErrorSpy.mock.calls.find(call => 
        call[0] === '[SEIZE_CONNECT_ERROR]'
      );
      expect(logCall).toBeDefined();
      const loggedData = logCall[1];
      
      // CRITICAL SECURITY: In production, cause and stack trace are NEVER logged
      // This prevents any potential sensitive data leakage
      expect(loggedData.cause).toBeUndefined();
      expect(loggedData.stack).toBeUndefined();
      
      // Only basic error info is logged in production
      expect(loggedData.message).toBe('Failed to open wallet connection modal');
      expect(loggedData.name).toBe('WalletConnectionError');
      expect(loggedData.context).toBe('seizeConnect');
    });

    it('sanitizes potential tokens in error messages', async () => {
      const { useAppKit } = require('@reown/appkit/react');
      const mockOpen = jest.fn().mockImplementation(() => {
        throw new Error('Token abcdef1234567890abcdef1234567890abcdef12 is invalid');
      });
      useAppKit.mockReturnValue({ open: mockOpen });

      render(
        <TestErrorBoundary>
          <SeizeConnectProvider>
            <TestComponent />
          </SeizeConnectProvider>
        </TestErrorBoundary>
      );

      const connectButton = screen.getByTestId('connect-button');
      
      await act(async () => {
        fireEvent.click(connectButton);
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      const logCall = consoleErrorSpy.mock.calls.find(call => 
        call[0] === '[SEIZE_CONNECT_ERROR]'
      );
      expect(logCall).toBeDefined();
      const loggedData = logCall[1];
      
      // CRITICAL SECURITY: In production, no cause or sensitive data is logged
      expect(loggedData.cause).toBeUndefined();
      expect(loggedData.stack).toBeUndefined();
      
      // Only the safe wrapper message is logged
      expect(loggedData.message).toBe('Failed to open wallet connection modal');
      
      // Verify no sensitive data appears anywhere in the logged object
      const loggedString = JSON.stringify(loggedData);
      expect(loggedString).not.toContain('abcdef1234567890abcdef1234567890abcdef12');
    });
  });

  describe('Error Logging in Development', () => {
    beforeEach(() => {
      process.env.NODE_ENV = 'development';
    });

    it('includes full error details including stack trace in development', async () => {
      const { useAppKit } = require('@reown/appkit/react');
      const testError = new Error('Test connection error');
      testError.stack = 'Error: Test connection error\n    at TestComponent';
      
      const mockOpen = jest.fn().mockImplementation(() => {
        throw testError;
      });
      useAppKit.mockReturnValue({ open: mockOpen });

      render(
        <TestErrorBoundary>
          <SeizeConnectProvider>
            <TestComponent />
          </SeizeConnectProvider>
        </TestErrorBoundary>
      );

      const connectButton = screen.getByTestId('connect-button');
      
      await act(async () => {
        fireEvent.click(connectButton);
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      const logCall = consoleErrorSpy.mock.calls.find(call => 
        call[0] === '[SEIZE_CONNECT_ERROR]'
      );
      expect(logCall).toBeDefined();
      const loggedData = logCall[1];
      
      // Verify development logging includes stack trace and cause
      expect(loggedData).toEqual(expect.objectContaining({
        context: 'seizeConnect',
        name: 'WalletConnectionError',
        message: expect.stringContaining('Failed to open wallet connection modal'),
        stack: expect.stringContaining('WalletConnectionError: Failed to open wallet connection modal'),
        cause: expect.stringContaining('Test connection error'),
        timestamp: expect.any(String),
        userAgent: expect.any(String)
      }));
    });

    it('sanitizes sensitive data in development mode cause field', async () => {
      const { useAppKit } = require('@reown/appkit/react');
      const mockOpen = jest.fn().mockImplementation(() => {
        throw new Error('Connection failed with wallet 0x1234567890123456789012345678901234567890 and token abcdef1234567890abcdef1234567890abcdef12');
      });
      useAppKit.mockReturnValue({ open: mockOpen });

      render(
        <TestErrorBoundary>
          <SeizeConnectProvider>
            <TestComponent />
          </SeizeConnectProvider>
        </TestErrorBoundary>
      );

      const connectButton = screen.getByTestId('connect-button');
      
      await act(async () => {
        fireEvent.click(connectButton);
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      const logCall = consoleErrorSpy.mock.calls.find(call => 
        call[0] === '[SEIZE_CONNECT_ERROR]'
      );
      expect(logCall).toBeDefined();
      const loggedData = logCall[1];
      
      // In development, cause should be included but sanitized
      expect(loggedData.cause).toBeDefined();
      expect(loggedData.cause).toContain('0x***REDACTED***');
      expect(loggedData.cause).toContain('***TOKEN***');
      expect(loggedData.cause).not.toContain('0x1234567890123456789012345678901234567890');
      expect(loggedData.cause).not.toContain('abcdef1234567890abcdef1234567890abcdef12');
    });
  });

  describe('Security Event Logging', () => {
    it('logs connection attempts with security event when enabled', async () => {
      // Enable security logging for this test
      process.env.ENABLE_SECURITY_LOGGING = 'true';
      process.env.NODE_ENV = 'development';
      
      const { useAppKit } = require('@reown/appkit/react');
      const mockOpen = jest.fn();
      useAppKit.mockReturnValue({ open: mockOpen });

      render(
        <TestErrorBoundary>
          <SeizeConnectProvider>
            <TestComponent />
          </SeizeConnectProvider>
        </TestErrorBoundary>
      );

      const connectButton = screen.getByTestId('connect-button');
      
      await act(async () => {
        fireEvent.click(connectButton);
      });

      // Should log connection attempt
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        '[SEIZE_SECURITY_EVENT]',
        expect.objectContaining({
          timestamp: expect.any(String),
          eventType: 'wallet_connection_attempt',
          source: 'seizeConnect',
          userAgent: expect.any(String)
        })
      );

      // Should log modal opened
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        '[SEIZE_SECURITY_EVENT]',
        expect.objectContaining({
          timestamp: expect.any(String),
          eventType: 'wallet_modal_opened',
          source: 'seizeConnect',
          userAgent: expect.any(String)
        })
      );
      
      // Clean up
      delete process.env.ENABLE_SECURITY_LOGGING;
    });

    it('NEVER logs security events in production (security events disabled)', async () => {
      process.env.NODE_ENV = 'production';

      render(
        <TestErrorBoundary>
          <SeizeConnectProvider>
            <TestComponent />
          </SeizeConnectProvider>
        </TestErrorBoundary>
      );

      const acceptInvalidButton = screen.getByTestId('accept-invalid');
      
      await act(async () => {
        try {
          fireEvent.click(acceptInvalidButton);
        } catch {
          // Expected to throw
        }
      });

      // CRITICAL: Security events should NOT be logged in production for privacy
      expect(consoleWarnSpy).not.toHaveBeenCalledWith(
        '[SEIZE_SECURITY_EVENT]',
        expect.anything()
      );
      
      // But errors should still be logged with sanitization
      expect(consoleErrorSpy).toHaveBeenCalled();
    });

    it('logs valid address acceptance in development with truncated address', async () => {
      process.env.NODE_ENV = 'development';
      process.env.ENABLE_SECURITY_LOGGING = 'true';

      render(
        <TestErrorBoundary>
          <SeizeConnectProvider>
            <TestComponent />
          </SeizeConnectProvider>
        </TestErrorBoundary>
      );

      const acceptValidButton = screen.getByTestId('accept-valid');
      
      await act(async () => {
        fireEvent.click(acceptValidButton);
      });

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        '[SEIZE_SECURITY_EVENT]',
        expect.objectContaining({
          timestamp: expect.any(String),
          eventType: 'address_validation_success',
          source: 'seizeAcceptConnection',
          valid: true,
          userAgent: expect.any(String)
        })
      );
      
      delete process.env.ENABLE_SECURITY_LOGGING;
    });

    it('logs security events in development when explicitly enabled', async () => {
      process.env.NODE_ENV = 'development';
      process.env.ENABLE_SECURITY_LOGGING = 'true';

      render(
        <TestErrorBoundary>
          <SeizeConnectProvider>
            <TestComponent />
          </SeizeConnectProvider>
        </TestErrorBoundary>
      );

      const acceptInvalidButton = screen.getByTestId('accept-invalid');
      
      await act(async () => {
        try {
          fireEvent.click(acceptInvalidButton);
        } catch {
          // Expected to throw
        }
      });

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        '[SEIZE_SECURITY_EVENT]',
        expect.objectContaining({
          timestamp: expect.any(String),
          eventType: 'invalid_address_detected',
          source: 'seizeAcceptConnection',
          valid: false,
          addressLength: 15,
          addressFormat: 'other',
          userAgent: expect.any(String)
        })
      );
      
      delete process.env.ENABLE_SECURITY_LOGGING;
    });

    it('never logs raw addresses in production', async () => {
      process.env.NODE_ENV = 'production';

      render(
        <TestErrorBoundary>
          <SeizeConnectProvider>
            <TestComponent />
          </SeizeConnectProvider>
        </TestErrorBoundary>
      );

      const acceptValidButton = screen.getByTestId('accept-valid');
      
      await act(async () => {
        fireEvent.click(acceptValidButton);
      });

      // Check that no console call contains raw addresses
      const allCalls = [...consoleWarnSpy.mock.calls, ...consoleErrorSpy.mock.calls];
      const callsAsString = JSON.stringify(allCalls);
      
      expect(callsAsString).not.toContain('0x1234567890123456789012345678901234567890');
      expect(callsAsString).not.toContain('invalid-address');
    });

    it('production mode disables security event logging entirely', async () => {
      process.env.NODE_ENV = 'production';

      render(
        <TestErrorBoundary>
          <SeizeConnectProvider>
            <TestComponent />
          </SeizeConnectProvider>
        </TestErrorBoundary>
      );

      const acceptInvalidButton = screen.getByTestId('accept-invalid');
      
      await act(async () => {
        try {
          fireEvent.click(acceptInvalidButton);
        } catch {
          // Expected to throw
        }
      });

      // SECURITY: No security events should be logged in production
      expect(consoleWarnSpy).not.toHaveBeenCalledWith(
        '[SEIZE_SECURITY_EVENT]',
        expect.anything()
      );
      
      // But diagnostic information is logged via error logging
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        '[SEIZE_CONNECT_ERROR]',
        expect.objectContaining({
          context: 'seizeAcceptConnection',
          name: 'AuthenticationError'
        })
      );
    });
  });

  describe('Logging Never Disabled', () => {
    it('always logs errors regardless of environment', async () => {
      // Test with undefined NODE_ENV
      delete process.env.NODE_ENV;

      const { useAppKit } = require('@reown/appkit/react');
      const mockOpen = jest.fn().mockImplementation(() => {
        throw new Error('Connection failed');
      });
      useAppKit.mockReturnValue({ open: mockOpen });

      render(
        <TestErrorBoundary>
          <SeizeConnectProvider>
            <TestComponent />
          </SeizeConnectProvider>
        </TestErrorBoundary>
      );

      const connectButton = screen.getByTestId('connect-button');
      
      await act(async () => {
        fireEvent.click(connectButton);
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      // Should still log error even with undefined NODE_ENV
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        '[SEIZE_CONNECT_ERROR]',
        expect.objectContaining({
          context: 'seizeConnect',
          name: 'WalletConnectionError'
        })
      );
    });

    it('security events require explicit enablement even with undefined NODE_ENV', async () => {
      delete process.env.NODE_ENV;
      delete process.env.ENABLE_SECURITY_LOGGING;

      render(
        <TestErrorBoundary>
          <SeizeConnectProvider>
            <TestComponent />
          </SeizeConnectProvider>
        </TestErrorBoundary>
      );

      const connectButton = screen.getByTestId('connect-button');
      
      await act(async () => {
        fireEvent.click(connectButton);
      });

      // Should NOT log security events without explicit enablement
      expect(consoleWarnSpy).not.toHaveBeenCalledWith(
        '[SEIZE_SECURITY_EVENT]',
        expect.anything()
      );
    });
  });

  describe('Error Propagation', () => {
    it('logs WalletConnectionError when connection fails and throws', async () => {
      const { useAppKit } = require('@reown/appkit/react');
      const mockOpen = jest.fn().mockImplementation(() => {
        throw new Error('Connection failed');
      });
      useAppKit.mockReturnValue({ open: mockOpen });

      render(
        <TestErrorBoundary>
          <SeizeConnectProvider>
            <TestComponent />
          </SeizeConnectProvider>
        </TestErrorBoundary>
      );

      const connectButton = screen.getByTestId('connect-button');
      
      // Error is caught and logged by the component, then re-thrown
      await act(async () => {
        fireEvent.click(connectButton);
        await new Promise(resolve => setTimeout(resolve, 0));
      });
      
      // Verify that the error was logged with proper context
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        '[SEIZE_CONNECT_ERROR]',
        expect.objectContaining({
          context: 'seizeConnect',
          name: 'WalletConnectionError',
          message: expect.stringContaining('Failed to open wallet connection modal'),
          timestamp: expect.any(String)
        })
      );
    });

    it('logs AuthenticationError for invalid addresses and throws', async () => {
      render(
        <TestErrorBoundary>
          <SeizeConnectProvider>
            <TestComponent />
          </SeizeConnectProvider>
        </TestErrorBoundary>
      );

      const acceptInvalidButton = screen.getByTestId('accept-invalid');
      
      await act(async () => {
        fireEvent.click(acceptInvalidButton);
        await new Promise(resolve => setTimeout(resolve, 0));
      });
      
      // Verify that the error was logged with proper context
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        '[SEIZE_CONNECT_ERROR]',
        expect.objectContaining({
          context: 'seizeAcceptConnection',
          name: 'AuthenticationError',
          message: expect.stringContaining('Invalid Ethereum address format'),
          timestamp: expect.any(String)
        })
      );
      
      // In test environment (not production), security events are not logged by default
      // unless ENABLE_SECURITY_LOGGING=true
      expect(consoleWarnSpy).not.toHaveBeenCalledWith(
        '[SEIZE_SECURITY_EVENT]',
        expect.anything()
      );
    });
  });

  describe('Timestamp and Context Inclusion', () => {
    it('includes timestamps in all log entries when security logging enabled', async () => {
      process.env.NODE_ENV = 'development';
      process.env.ENABLE_SECURITY_LOGGING = 'true';
      
      const { useAppKit } = require('@reown/appkit/react');
      const mockOpen = jest.fn();
      useAppKit.mockReturnValue({ open: mockOpen });

      render(
        <TestErrorBoundary>
          <SeizeConnectProvider>
            <TestComponent />
          </SeizeConnectProvider>
        </TestErrorBoundary>
      );

      const connectButton = screen.getByTestId('connect-button');
      
      await act(async () => {
        fireEvent.click(connectButton);
      });

      // Check that all security log calls include timestamps
      consoleWarnSpy.mock.calls
        .filter(call => call[0] === '[SEIZE_SECURITY_EVENT]')
        .forEach(call => {
          expect(call[1]).toHaveProperty('timestamp');
          expect(call[1].timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
        });
        
      delete process.env.ENABLE_SECURITY_LOGGING;
    });

    it('includes user agent in all log entries when logging enabled', async () => {
      process.env.NODE_ENV = 'development';
      process.env.ENABLE_SECURITY_LOGGING = 'true';
      
      const { useAppKit } = require('@reown/appkit/react');
      const mockOpen = jest.fn();
      useAppKit.mockReturnValue({ open: mockOpen });

      render(
        <TestErrorBoundary>
          <SeizeConnectProvider>
            <TestComponent />
          </SeizeConnectProvider>
        </TestErrorBoundary>
      );

      const connectButton = screen.getByTestId('connect-button');
      
      await act(async () => {
        fireEvent.click(connectButton);
      });

      // Check that all security log calls include user agent
      consoleWarnSpy.mock.calls
        .filter(call => call[0] === '[SEIZE_SECURITY_EVENT]')
        .forEach(call => {
          expect(call[1]).toHaveProperty('userAgent');
        });
        
      delete process.env.ENABLE_SECURITY_LOGGING;
    });
  });

  describe('Critical Security Patterns', () => {
    it('fails fast on invalid addresses without fallback', async () => {
      render(
        <TestErrorBoundary>
          <SeizeConnectProvider>
            <TestComponent />
          </SeizeConnectProvider>
        </TestErrorBoundary>
      );

      const acceptInvalidButton = screen.getByTestId('accept-invalid');
      
      await act(async () => {
        fireEvent.click(acceptInvalidButton);
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      // Should log the error and NOT set any address
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        '[SEIZE_CONNECT_ERROR]',
        expect.objectContaining({
          context: 'seizeAcceptConnection',
          name: 'AuthenticationError',
          message: expect.stringContaining('Invalid Ethereum address format')
        })
      );

      // Address should remain undefined - no fallback behavior
      const addressElement = screen.getByTestId('address');
      expect(addressElement.textContent).toBe('undefined');
    });

    it('correctly handles valid address with checksumming', async () => {
      render(
        <TestErrorBoundary>
          <SeizeConnectProvider>
            <TestComponent />
          </SeizeConnectProvider>
        </TestErrorBoundary>
      );

      const acceptValidButton = screen.getByTestId('accept-valid');
      
      await act(async () => {
        fireEvent.click(acceptValidButton);
      });

      // Address should be set (checksummed by getAddress)
      const addressElement = screen.getByTestId('address');
      expect(addressElement.textContent).toBe('0x1234567890123456789012345678901234567890');

      // Should be authenticated
      const authenticatedElement = screen.getByTestId('is-authenticated');
      expect(authenticatedElement.textContent).toBe('true');
    });

    it('initialization with invalid stored address clears auth state', async () => {
      // Mock getWalletAddress to return invalid address
      const { getWalletAddress } = require('../../../services/auth/auth.utils');
      getWalletAddress.mockReturnValue('invalid-stored-address');

      render(
        <TestErrorBoundary>
          <SeizeConnectProvider>
            <TestComponent />
          </SeizeConnectProvider>
        </TestErrorBoundary>
      );

      await waitFor(() => {
        expect(screen.getByTestId('test-component')).toBeInTheDocument();
      });

      // Should remain unauthenticated
      const authenticatedElement = screen.getByTestId('is-authenticated');
      expect(authenticatedElement.textContent).toBe('false');

      // Address should be undefined
      const addressElement = screen.getByTestId('address');
      expect(addressElement.textContent).toBe('undefined');

      // Should have logged the initialization error
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        '[SEIZE_CONNECT_ERROR]',
        expect.objectContaining({
          context: 'wallet_initialization',
          name: 'WalletInitializationError'
        })
      );
    });

    it('prevents authentication bypass through null/undefined values', async () => {
      render(
        <TestErrorBoundary>
          <SeizeConnectProvider>
            <TestComponent />
          </SeizeConnectProvider>
        </TestErrorBoundary>
      );

      const { result } = renderHook(() => useSeizeConnectContext(), {
        wrapper: ({ children }) => (
          <TestErrorBoundary>
            <SeizeConnectProvider>{children}</SeizeConnectProvider>
          </TestErrorBoundary>
        ),
      });

      // Test various invalid values that should all fail
      const invalidValues = [null, undefined, '', ' ', '0x', '0x123'];
      
      for (const invalidValue of invalidValues) {
        expect(() => {
          result.current.seizeAcceptConnection(invalidValue as any);
        }).toThrow();
      }

      // Should remain unauthenticated after all attempts
      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.address).toBeUndefined();
    });

    it('throws and logs on network errors without silent failures', async () => {
      const { useAppKit } = require('@reown/appkit/react');
      const mockOpen = jest.fn().mockImplementation(() => {
        throw new Error('Network connection failed');
      });
      useAppKit.mockReturnValue({ open: mockOpen });

      render(
        <TestErrorBoundary>
          <SeizeConnectProvider>
            <TestComponent />
          </SeizeConnectProvider>
        </TestErrorBoundary>
      );

      const connectButton = screen.getByTestId('connect-button');
      
      await act(async () => {
        fireEvent.click(connectButton);
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      // Should log the error - no silent failures
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        '[SEIZE_CONNECT_ERROR]',
        expect.objectContaining({
          context: 'seizeConnect',
          name: 'WalletConnectionError',
          message: expect.stringContaining('Failed to open wallet connection modal')
        })
      );

      // Connection state should remain disconnected on failure
      const { result } = renderHook(() => useSeizeConnectContext(), {
        wrapper: ({ children }) => (
          <TestErrorBoundary>
            <SeizeConnectProvider>{children}</SeizeConnectProvider>
          </TestErrorBoundary>
        ),
      });

      expect(result.current.connectionState).toBe('error');
      expect(result.current.isAuthenticated).toBe(false);
    });
  });
});

describe('SeizeConnectContext Security Vulnerability Fix', () => {
  let mockGetWalletAddress: jest.MockedFunction<typeof authUtils.getWalletAddress>;
  let mockRemoveAuthJwt: jest.MockedFunction<typeof authUtils.removeAuthJwt>;
  let mockIsAddress: jest.MockedFunction<any>;
  let mockGetAddress: jest.MockedFunction<any>;
  let consoleSpy: jest.SpyInstance;

  beforeEach(() => {
    mockGetWalletAddress = authUtils.getWalletAddress as jest.MockedFunction<typeof authUtils.getWalletAddress>;
    mockRemoveAuthJwt = authUtils.removeAuthJwt as jest.MockedFunction<typeof authUtils.removeAuthJwt>;
    mockIsAddress = require('viem').isAddress as jest.MockedFunction<any>;
    mockGetAddress = require('viem').getAddress as jest.MockedFunction<any>;
    
    // Mock console methods to avoid noise in tests
    consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    
    // Reset all mocks
    jest.clearAllMocks();
  });

  afterEach(() => {
    consoleSpy.mockRestore();
    jest.restoreAllMocks();
  });

  describe('Critical Security Fix: useState Initialization', () => {
    it('should NOT throw during initial render with invalid stored address', async () => {
      // Setup invalid stored address
      mockGetWalletAddress.mockReturnValue('invalid-address');
      mockIsAddress.mockReturnValue(false);

      // This should NOT throw and crash the app
      expect(() => {
        renderWithProvider();
      }).not.toThrow();

      // Component might start with loading state, but initialization is very fast
      // The main test is that it doesn't crash - either state is acceptable
      try {
        expect(screen.getByText('Initializing wallet connection...')).toBeInTheDocument();
      } catch {
        // If initialization finished quickly, check for the error state
        expect(screen.getByTestId('test-component')).toBeInTheDocument();
        expect(screen.getByTestId('has-error')).toHaveTextContent('true');
      }
    });

    it('should handle initialization errors gracefully in useEffect', async () => {
      // Setup invalid stored address
      mockGetWalletAddress.mockReturnValue('invalid-address-format');
      mockIsAddress.mockReturnValue(false);

      renderWithProvider();

      // Wait for initialization to complete
      await waitFor(() => {
        expect(screen.getByTestId('test-component')).toBeInTheDocument();
      }, { timeout: 5000 });

      // Should show error state without crashing
      expect(screen.getByTestId('has-error')).toHaveTextContent('true');
      expect(screen.getByTestId('error-message')).toHaveTextContent('Invalid wallet address found in storage during initialization. This indicates potential data corruption or security breach.');
      expect(screen.getByTestId('address')).toHaveTextContent('undefined');
      expect(screen.getByTestId('is-authenticated')).toHaveTextContent('false');
    });

    it('should clear invalid auth state during initialization', async () => {
      mockGetWalletAddress.mockReturnValue('0xinvalid');
      mockIsAddress.mockReturnValue(false);

      renderWithProvider();

      await waitFor(() => {
        expect(screen.getByTestId('test-component')).toBeInTheDocument();
      });

      // Should have called removeAuthJwt to clear invalid state
      expect(mockRemoveAuthJwt).toHaveBeenCalled();
    });

    it('should handle valid stored address correctly', async () => {
      const validAddress = '0x1234567890abcdef1234567890abcdef12345678';
      const checksummedAddress = '0x1234567890AbcdEF1234567890AbcDEF12345678';
      
      mockGetWalletAddress.mockReturnValue(validAddress);
      mockIsAddress.mockReturnValue(true);
      mockGetAddress.mockReturnValue(checksummedAddress);

      renderWithProvider();

      await waitFor(() => {
        expect(screen.getByTestId('test-component')).toBeInTheDocument();
      });

      expect(screen.getByTestId('has-error')).toHaveTextContent('false');
      expect(screen.getByTestId('address')).toHaveTextContent(checksummedAddress);
      expect(screen.getByTestId('is-authenticated')).toHaveTextContent('true');
    });

    it('should handle no stored address scenario', async () => {
      mockGetWalletAddress.mockReturnValue(null);

      renderWithProvider();

      await waitFor(() => {
        expect(screen.getByTestId('test-component')).toBeInTheDocument();
      });

      expect(screen.getByTestId('has-error')).toHaveTextContent('false');
      expect(screen.getByTestId('address')).toHaveTextContent('undefined');
      expect(screen.getByTestId('is-authenticated')).toHaveTextContent('false');
    });

    it('should handle auth cleanup failures during initialization', async () => {
      mockGetWalletAddress.mockReturnValue('invalid');
      mockIsAddress.mockReturnValue(false);
      mockRemoveAuthJwt.mockImplementation(() => {
        throw new Error('Cleanup failed');
      });

      renderWithProvider();

      await waitFor(() => {
        expect(screen.getByTestId('test-component')).toBeInTheDocument();
      });

      // Should still handle the error gracefully
      expect(screen.getByTestId('has-error')).toHaveTextContent('true');
      expect(mockRemoveAuthJwt).toHaveBeenCalled();
    });

    it('should handle unexpected initialization errors', async () => {
      mockGetWalletAddress.mockImplementation(() => {
        throw new Error('Unexpected storage error');
      });

      renderWithProvider();

      // Wait for initialization to complete
      await waitFor(() => {
        expect(screen.getByTestId('test-component')).toBeInTheDocument();
      }, { timeout: 5000 });

      expect(screen.getByTestId('has-error')).toHaveTextContent('true');
      expect(screen.getByTestId('error-message')).toHaveTextContent('Unexpected error during wallet initialization');
      
      // Clean up the mock to prevent interference with other tests
      mockGetWalletAddress.mockImplementation(() => null);
    });
  });

  describe('Error Boundary Functionality', () => {
    it('should catch and display wallet initialization errors', async () => {
      // Create a component that throws during render
      const ThrowingComponent: React.FC = () => {
        throw new WalletInitializationError('Test initialization error');
      };

      render(
        <SeizeConnectProvider>
          <ThrowingComponent />
        </SeizeConnectProvider>
      );

      await waitFor(() => {
        expect(screen.getByText('Connection Problem')).toBeInTheDocument();
        expect(screen.getByText(/Something went wrong with your wallet connection/)).toBeInTheDocument();
        expect(screen.getByText('Clear Storage & Reload')).toBeInTheDocument();
      });
    });

    it('should provide recovery option in error boundary', async () => {
      const ThrowingComponent: React.FC = () => {
        throw new Error('Generic error');
      };

      render(
        <SeizeConnectProvider>
          <ThrowingComponent />
        </SeizeConnectProvider>
      );

      await waitFor(() => {
        expect(screen.getByText('Clear Storage & Reload')).toBeInTheDocument();
      });

      // The main test is that the error boundary shows correctly
      // and provides a recovery option - clicking it would reload in real use
      expect(screen.getByText('Connection Problem')).toBeInTheDocument();
      expect(screen.getByText(/Something went wrong with your wallet connection/)).toBeInTheDocument();
      expect(screen.getByText('Try Again')).toBeInTheDocument();
    });
  });

  describe('Context Interface Extensions', () => {
    it('should expose initialization error state in context', async () => {
      mockGetWalletAddress.mockReturnValue('invalid');
      mockIsAddress.mockReturnValue(false);

      renderWithProvider();

      await waitFor(() => {
        expect(screen.getByTestId('test-component')).toBeInTheDocument();
      });

      expect(screen.getByTestId('has-error')).toHaveTextContent('true');
      expect(screen.getByTestId('error-message')).not.toHaveTextContent('no error');
    });

    it('should expose no error state when initialization succeeds', async () => {
      mockGetWalletAddress.mockReturnValue(null); // No stored address

      renderWithProvider();

      await waitFor(() => {
        expect(screen.getByTestId('test-component')).toBeInTheDocument();
      });

      expect(screen.getByTestId('has-error')).toHaveTextContent('false');
      expect(screen.getByTestId('error-message')).toHaveTextContent('no error');
    });
  });

  describe('Security Event Logging - Initialization', () => {
    let consoleWarnSpy: jest.SpyInstance;

    beforeEach(() => {
      consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    });

    afterEach(() => {
      consoleWarnSpy.mockRestore();
    });

    it('should log security events for invalid stored addresses', async () => {
      // Enable security logging for this test
      process.env.NODE_ENV = 'development';
      process.env.ENABLE_SECURITY_LOGGING = 'true';
      
      mockGetWalletAddress.mockReturnValue('0xinvalid');
      mockIsAddress.mockReturnValue(false);

      renderWithProvider();

      await waitFor(() => {
        expect(screen.getByTestId('test-component')).toBeInTheDocument();
      }, { timeout: 5000 });

      // Wait for security logging to be called
      await waitFor(() => {
        expect(consoleWarnSpy).toHaveBeenCalledWith(
          '[SEIZE_SECURITY_EVENT]',
          expect.objectContaining({
            eventType: 'invalid_address_detected',
            source: 'wallet_initialization',
            valid: false,
            addressLength: 9,
            addressFormat: 'hex_prefixed',
            timestamp: expect.any(String),
            userAgent: expect.any(String)
          })
        );
      }, { timeout: 5000 });
      
      // Clean up
      delete process.env.ENABLE_SECURITY_LOGGING;
    });
  });

  describe('Error Classes', () => {
    it('should create WalletConnectionError with proper structure', () => {
      const error = new WalletConnectionError('Test message', new Error('cause'), 'TEST_CODE');
      
      expect(error.name).toBe('WalletConnectionError');
      expect(error.message).toBe('Test message');
      expect(error.cause).toBeInstanceOf(Error);
      expect(error.code).toBe('TEST_CODE');
    });

    it('should create WalletDisconnectionError with proper structure', () => {
      const error = new WalletDisconnectionError('Test message', new Error('cause'), 'TEST_CODE');
      
      expect(error.name).toBe('WalletDisconnectionError');
      expect(error.message).toBe('Test message');
      expect(error.cause).toBeInstanceOf(Error);
      expect(error.code).toBe('TEST_CODE');
    });

    it('should create AuthenticationError with proper structure', () => {
      const error = new AuthenticationError('Test message', new Error('cause'));
      
      expect(error.name).toBe('AuthenticationError');
      expect(error.message).toBe('Test message');
      expect(error.cause).toBeInstanceOf(Error);
    });
  });
});

describe('Regression Tests: Original Functionality with Secure Implementation', () => {
  let mockGetWalletAddress: jest.MockedFunction<typeof authUtils.getWalletAddress>;
  let mockIsAddress: jest.MockedFunction<any>;
  let mockGetAddress: jest.MockedFunction<any>;
  let mockDisconnect: jest.MockedFunction<any>;
  let mockOpen: jest.MockedFunction<any>;

  beforeEach(() => {
    mockGetWalletAddress = authUtils.getWalletAddress as jest.MockedFunction<typeof authUtils.getWalletAddress>;
    mockIsAddress = require('viem').isAddress as jest.MockedFunction<any>;
    mockGetAddress = require('viem').getAddress as jest.MockedFunction<any>;
    
    const { useAppKit, useDisconnect } = require('@reown/appkit/react');
    mockDisconnect = jest.fn().mockResolvedValue(undefined);
    mockOpen = jest.fn();
    
    (useDisconnect as jest.Mock).mockReturnValue({ disconnect: mockDisconnect });
    (useAppKit as jest.Mock).mockReturnValue({ open: mockOpen });
    
    // Mock console methods
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should maintain all original context values', async () => {
    const validAddress = '0x1234567890abcdef1234567890abcdef12345678';
    const checksummedAddress = '0x1234567890AbcdEF1234567890AbcDEF12345678';
    
    mockGetWalletAddress.mockReturnValue(validAddress);
    mockIsAddress.mockReturnValue(true);
    mockGetAddress.mockReturnValue(checksummedAddress);

    renderWithProvider();

    await waitFor(() => {
      expect(screen.getByTestId('test-component')).toBeInTheDocument();
    });

    // Verify all expected context values are present
    expect(screen.getByTestId('address')).toBeInTheDocument();
    expect(screen.getByTestId('is-authenticated')).toBeInTheDocument();
    expect(screen.getByTestId('has-error')).toBeInTheDocument();
    expect(screen.getByTestId('error-message')).toBeInTheDocument();
  });

  it('should throw error when used outside provider', () => {
    // Mock console.error to avoid noise
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    
    expect(() => {
      render(<TestComponent />);
    }).toThrow('useSeizeConnectContext must be used within a SeizeConnectProvider');
    
    consoleSpy.mockRestore();
  });

  it('should provide working connect functionality', async () => {
    mockGetWalletAddress.mockReturnValue(null);

    const ConnectTestComponent: React.FC = () => {
      const { seizeConnect } = useSeizeConnectContext();
      return (
        <button onClick={seizeConnect} data-testid="connect-btn">
          Connect
        </button>
      );
    };

    render(
      <SeizeConnectProvider>
        <ConnectTestComponent />
      </SeizeConnectProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('connect-btn')).toBeInTheDocument();
    });

    await userEvent.click(screen.getByTestId('connect-btn'));
    expect(mockOpen).toHaveBeenCalledWith({ view: 'Connect' });
  });

  it('should provide working disconnect functionality', async () => {
    const validAddress = '0x1234567890abcdef1234567890abcdef12345678';
    mockGetWalletAddress.mockReturnValue(validAddress);
    mockIsAddress.mockReturnValue(true);
    mockGetAddress.mockReturnValue(validAddress);

    const DisconnectTestComponent: React.FC = () => {
      const { seizeDisconnect } = useSeizeConnectContext();
      return (
        <button onClick={() => seizeDisconnect()} data-testid="disconnect-btn">
          Disconnect
        </button>
      );
    };

    render(
      <SeizeConnectProvider>
        <DisconnectTestComponent />
      </SeizeConnectProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('disconnect-btn')).toBeInTheDocument();
    });

    await userEvent.click(screen.getByTestId('disconnect-btn'));
    expect(mockDisconnect).toHaveBeenCalled();
  });

  it('should handle disconnect and logout with reconnect', async () => {
    const validAddress = '0x1234567890abcdef1234567890abcdef12345678';
    mockGetWalletAddress.mockReturnValue(validAddress);
    mockIsAddress.mockReturnValue(true);
    mockGetAddress.mockReturnValue(validAddress);
    
    // Ensure removeAuthJwt doesn't throw for this test
    (authUtils.removeAuthJwt as jest.MockedFunction<typeof authUtils.removeAuthJwt>).mockImplementation(() => {});

    const LogoutTestComponent: React.FC = () => {
      const { seizeDisconnectAndLogout } = useSeizeConnectContext();
      return (
        <button 
          onClick={() => seizeDisconnectAndLogout(true)} 
          data-testid="logout-btn"
        >
          Logout
        </button>
      );
    };

    render(
      <SeizeConnectProvider>
        <LogoutTestComponent />
      </SeizeConnectProvider>
    );

    // Wait for component to be ready
    await waitFor(() => {
      expect(screen.getByTestId('logout-btn')).toBeInTheDocument();
    }, { timeout: 5000 });

    await act(async () => {
      fireEvent.click(screen.getByTestId('logout-btn'));
      // Wait for the disconnect and logout operations to complete
      await new Promise(resolve => setTimeout(resolve, 150));
    });
    
    expect(mockDisconnect).toHaveBeenCalled();
    expect(authUtils.removeAuthJwt).toHaveBeenCalled();
    expect(mockOpen).toHaveBeenCalledWith({ view: 'Connect' });
  });
});

describe('Fail-Fast Security Tests', () => {
  let mockGetWalletAddress: jest.MockedFunction<typeof authUtils.getWalletAddress>;
  let mockRemoveAuthJwt: jest.MockedFunction<typeof authUtils.removeAuthJwt>;
  let mockDisconnect: jest.MockedFunction<any>;

  beforeEach(() => {
    mockGetWalletAddress = authUtils.getWalletAddress as jest.MockedFunction<typeof authUtils.getWalletAddress>;
    mockRemoveAuthJwt = authUtils.removeAuthJwt as jest.MockedFunction<typeof authUtils.removeAuthJwt>;
    
    const { useDisconnect } = require('@reown/appkit/react');
    mockDisconnect = jest.fn().mockResolvedValue(undefined);
    (useDisconnect as jest.Mock).mockReturnValue({ disconnect: mockDisconnect });
    
    // Mock console methods
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should throw AuthenticationError when wallet disconnect fails during logout', async () => {
    const validAddress = '0x1234567890abcdef1234567890abcdef12345678';
    mockGetWalletAddress.mockReturnValue(validAddress);
    require('viem').isAddress.mockReturnValue(true);
    require('viem').getAddress.mockReturnValue(validAddress);
    
    const disconnectError = new Error('Wallet disconnect failed');
    mockDisconnect.mockRejectedValueOnce(disconnectError);

    const LogoutTestComponent: React.FC = () => {
      const { seizeDisconnectAndLogout } = useSeizeConnectContext();
      const [error, setError] = React.useState<string>('');
      
      const handleLogout = async () => {
        try {
          await seizeDisconnectAndLogout();
        } catch (err) {
          setError((err as Error).name);
        }
      };

      return (
        <div>
          <button onClick={handleLogout} data-testid="logout-btn">
            Logout
          </button>
          <div data-testid="error">{error}</div>
        </div>
      );
    };

    render(
      <SeizeConnectProvider>
        <LogoutTestComponent />
      </SeizeConnectProvider>
    );

    // Wait for component to be ready
    await waitFor(() => {
      expect(screen.getByTestId('logout-btn')).toBeInTheDocument();
    }, { timeout: 5000 });

    await act(async () => {
      fireEvent.click(screen.getByTestId('logout-btn'));
    });

    await waitFor(() => {
      expect(screen.getByTestId('error')).toHaveTextContent('AuthenticationError');
    }, { timeout: 5000 });

    // Verify auth cleanup was NOT called after disconnect failure
    expect(mockRemoveAuthJwt).not.toHaveBeenCalled();
  });

  it('should throw AuthenticationError when auth cleanup fails after successful disconnect', async () => {
    const validAddress = '0x1234567890abcdef1234567890abcdef12345678';
    mockGetWalletAddress.mockReturnValue(validAddress);
    require('viem').isAddress.mockReturnValue(true);
    require('viem').getAddress.mockReturnValue(validAddress);
    
    const authError = new Error('Auth cleanup failed');
    mockRemoveAuthJwt.mockImplementationOnce(() => {
      throw authError;
    });

    const LogoutTestComponent: React.FC = () => {
      const { seizeDisconnectAndLogout } = useSeizeConnectContext();
      const [error, setError] = React.useState<string>('');
      
      const handleLogout = async () => {
        try {
          await seizeDisconnectAndLogout();
        } catch (err) {
          setError((err as Error).name);
        }
      };

      return (
        <div>
          <button onClick={handleLogout} data-testid="logout-btn">
            Logout
          </button>
          <div data-testid="error">{error}</div>
        </div>
      );
    };

    render(
      <SeizeConnectProvider>
        <LogoutTestComponent />
      </SeizeConnectProvider>
    );

    // Wait for component to be ready
    await waitFor(() => {
      expect(screen.getByTestId('logout-btn')).toBeInTheDocument();
    }, { timeout: 5000 });

    await act(async () => {
      fireEvent.click(screen.getByTestId('logout-btn'));
    });

    await waitFor(() => {
      expect(screen.getByTestId('error')).toHaveTextContent('AuthenticationError');
    }, { timeout: 5000 });

    // Verify disconnect was successful before auth cleanup failure
    expect(mockDisconnect).toHaveBeenCalled();
  });
});