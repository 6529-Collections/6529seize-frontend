import React from 'react';
import { render, screen, fireEvent, waitFor, renderHook } from '@testing-library/react';
import { act } from 'react-dom/test-utils';
import {
  SeizeConnectProvider,
  useSeizeConnectContext,
  WalletConnectionError,
  WalletDisconnectionError,
  AuthenticationError
} from '../../components/auth/SeizeConnectContext';

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

// Mock auth utils
jest.mock('../../services/auth/auth.utils', () => ({
  migrateCookiesToLocalStorage: jest.fn(),
  getWalletAddress: jest.fn(() => null),
  removeAuthJwt: jest.fn()
}));

// Mock viem
jest.mock('viem', () => ({
  isAddress: jest.fn((address: string) => /^0x[a-fA-F0-9]{40}$/.test(address)),
  getAddress: jest.fn((address: string) => address.toLowerCase())
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

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
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
    isAuthenticated
  } = useSeizeConnectContext();

  const handleConnect = () => {
    try {
      seizeConnect();
    } catch (error) {
      // Errors are logged by the component
    }
  };

  const handleAcceptValid = () => {
    try {
      seizeAcceptConnection('0x1234567890123456789012345678901234567890');
    } catch (error) {
      // Errors are logged by the component
    }
  };

  const handleAcceptInvalid = () => {
    try {
      seizeAcceptConnection('invalid-address');
    } catch (error) {
      // Errors are logged by the component
    }
  };

  return (
    <div>
      <button onClick={handleConnect} data-testid="connect-button">Connect</button>
      <button onClick={handleAcceptValid} data-testid="accept-valid">Accept Valid</button>
      <button onClick={handleAcceptInvalid} data-testid="accept-invalid">Accept Invalid</button>
      <div data-testid="address">{address || 'No address'}</div>
      <div data-testid="authenticated">{isAuthenticated ? 'Authenticated' : 'Not authenticated'}</div>
    </div>
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
      expect(addressElement.textContent).toBe('No address');
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
      const authenticatedElement = screen.getByTestId('authenticated');
      expect(authenticatedElement.textContent).toBe('Authenticated');
    });

    it('initialization with invalid stored address clears auth state', async () => {
      // Mock getWalletAddress to return invalid address
      const { getWalletAddress } = require('../../services/auth/auth.utils');
      getWalletAddress.mockReturnValue('invalid-stored-address');

      render(
        <TestErrorBoundary>
          <SeizeConnectProvider>
            <TestComponent />
          </SeizeConnectProvider>
        </TestErrorBoundary>
      );

      // Should remain unauthenticated
      const authenticatedElement = screen.getByTestId('authenticated');
      expect(authenticatedElement.textContent).toBe('Not authenticated');

      // Address should be undefined
      const addressElement = screen.getByTestId('address');
      expect(addressElement.textContent).toBe('No address');

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

      expect(result.current.connectionState).toBe('disconnected');
      expect(result.current.isAuthenticated).toBe(false);
    });
  });
});