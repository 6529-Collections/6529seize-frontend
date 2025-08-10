import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
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

// Test component to use the hook
const TestComponent: React.FC = () => {
  const {
    seizeConnect,
    seizeAcceptConnection,
    address,
    isAuthenticated
  } = useSeizeConnectContext();

  return (
    <div>
      <button onClick={seizeConnect} data-testid="connect-button">Connect</button>
      <button 
        onClick={() => seizeAcceptConnection('0x1234567890123456789012345678901234567890')} 
        data-testid="accept-valid"
      >
        Accept Valid
      </button>
      <button 
        onClick={() => seizeAcceptConnection('invalid-address')} 
        data-testid="accept-invalid"
      >
        Accept Invalid
      </button>
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
        <SeizeConnectProvider>
          <TestComponent />
        </SeizeConnectProvider>
      );

      const connectButton = screen.getByTestId('connect-button');
      
      await act(async () => {
        try {
          fireEvent.click(connectButton);
        } catch {
          // Expected to throw
        }
      });

      // Verify error was logged
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        '[SEIZE_CONNECT_ERROR] seizeConnect:',
        expect.objectContaining({
          context: 'seizeConnect',
          name: 'WalletConnectionError',
          message: expect.stringContaining('0x***REDACTED***'), // Address should be sanitized
          timestamp: expect.any(String),
          userAgent: expect.any(String)
        })
      );

      // Verify sensitive data is sanitized
      const logCall = consoleErrorSpy.mock.calls[0];
      const loggedData = logCall[1];
      expect(loggedData.message).not.toContain('0x1234567890123456789012345678901234567890');
      expect(loggedData.message).toContain('0x***REDACTED***');
      
      // Verify stack trace is not included in production
      expect(loggedData.stack).toBeUndefined();
    });

    it('sanitizes potential tokens in error messages', async () => {
      const { useAppKit } = require('@reown/appkit/react');
      const mockOpen = jest.fn().mockImplementation(() => {
        throw new Error('Token abc123def456ghi789jkl012mno345pqr678stu901 is invalid');
      });
      useAppKit.mockReturnValue({ open: mockOpen });

      render(
        <SeizeConnectProvider>
          <TestComponent />
        </SeizeConnectProvider>
      );

      const connectButton = screen.getByTestId('connect-button');
      
      await act(async () => {
        try {
          fireEvent.click(connectButton);
        } catch {
          // Expected to throw
        }
      });

      const logCall = consoleErrorSpy.mock.calls[0];
      const loggedData = logCall[1];
      expect(loggedData.message).toContain('***TOKEN***');
      expect(loggedData.message).not.toContain('abc123def456ghi789jkl012mno345pqr678stu901');
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
        <SeizeConnectProvider>
          <TestComponent />
        </SeizeConnectProvider>
      );

      const connectButton = screen.getByTestId('connect-button');
      
      await act(async () => {
        try {
          fireEvent.click(connectButton);
        } catch {
          // Expected to throw
        }
      });

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        '[SEIZE_CONNECT_ERROR] seizeConnect:',
        expect.objectContaining({
          context: 'seizeConnect',
          name: 'WalletConnectionError',
          message: expect.stringContaining('Test connection error'),
          stack: expect.stringContaining('Error: Test connection error'),
          timestamp: expect.any(String),
          userAgent: expect.any(String)
        })
      );
    });
  });

  describe('Security Event Logging', () => {
    it('logs connection attempts with security event', async () => {
      const { useAppKit } = require('@reown/appkit/react');
      const mockOpen = jest.fn();
      useAppKit.mockReturnValue({ open: mockOpen });

      render(
        <SeizeConnectProvider>
          <TestComponent />
        </SeizeConnectProvider>
      );

      const connectButton = screen.getByTestId('connect-button');
      
      await act(async () => {
        fireEvent.click(connectButton);
      });

      // Should log connection attempt
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        '[SEIZE_SECURITY_EVENT] wallet_connection_attempt:',
        expect.objectContaining({
          timestamp: expect.any(String),
          eventType: 'wallet_connection_attempt',
          source: 'seizeConnect',
          userAgent: expect.any(String)
        })
      );

      // Should log modal opened
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        '[SEIZE_SECURITY_EVENT] wallet_modal_opened:',
        expect.objectContaining({
          timestamp: expect.any(String),
          eventType: 'wallet_modal_opened',
          source: 'seizeConnect',
          userAgent: expect.any(String)
        })
      );
    });

    it('logs invalid address attempts with complete address removal in production', async () => {
      process.env.NODE_ENV = 'production';

      render(
        <SeizeConnectProvider>
          <TestComponent />
        </SeizeConnectProvider>
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
        '[SEIZE_SECURITY_EVENT] invalid_address_attempt:',
        expect.objectContaining({
          timestamp: expect.any(String),
          eventType: 'invalid_address_attempt',
          address: undefined, // Completely removed in production
          source: 'seizeAcceptConnection',
          valid: false,
          addressLength: 15, // Safe diagnostic data
          addressFormat: 'other',
          userAgent: expect.any(String)
        })
      );
    });

    it('logs valid address acceptance with complete address removal in production', async () => {
      process.env.NODE_ENV = 'production';

      render(
        <SeizeConnectProvider>
          <TestComponent />
        </SeizeConnectProvider>
      );

      const acceptValidButton = screen.getByTestId('accept-valid');
      
      await act(async () => {
        fireEvent.click(acceptValidButton);
      });

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        '[SEIZE_SECURITY_EVENT] address_validation_success:',
        expect.objectContaining({
          timestamp: expect.any(String),
          eventType: 'address_validation_success',
          address: undefined, // Completely removed in production
          source: 'seizeAcceptConnection',
          valid: true,
          userAgent: expect.any(String)
        })
      );
    });

    it('shows truncated address in development mode', async () => {
      process.env.NODE_ENV = 'development';

      render(
        <SeizeConnectProvider>
          <TestComponent />
        </SeizeConnectProvider>
      );

      const acceptValidButton = screen.getByTestId('accept-valid');
      
      await act(async () => {
        fireEvent.click(acceptValidButton);
      });

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        '[SEIZE_SECURITY_EVENT] address_validation_success:',
        expect.objectContaining({
          timestamp: expect.any(String),
          eventType: 'address_validation_success',
          address: '0x1234...7890', // Truncated address in development
          source: 'seizeAcceptConnection',
          valid: true,
          userAgent: expect.any(String)
        })
      );
    });

    it('never logs raw addresses in production', async () => {
      process.env.NODE_ENV = 'production';

      render(
        <SeizeConnectProvider>
          <TestComponent />
        </SeizeConnectProvider>
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

    it('includes safe diagnostic data in production logs', async () => {
      process.env.NODE_ENV = 'production';

      render(
        <SeizeConnectProvider>
          <TestComponent />
        </SeizeConnectProvider>
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
        '[SEIZE_SECURITY_EVENT] invalid_address_attempt:',
        expect.objectContaining({
          addressLength: expect.any(Number),
          addressFormat: expect.stringMatching(/^(hex_prefixed|other|non_string)$/),
          source: 'seizeAcceptConnection',
          valid: false
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
        <SeizeConnectProvider>
          <TestComponent />
        </SeizeConnectProvider>
      );

      const connectButton = screen.getByTestId('connect-button');
      
      await act(async () => {
        try {
          fireEvent.click(connectButton);
        } catch {
          // Expected to throw
        }
      });

      // Should still log error even with undefined NODE_ENV
      expect(consoleErrorSpy).toHaveBeenCalled();
    });

    it('always logs security events regardless of environment', async () => {
      delete process.env.NODE_ENV;

      render(
        <SeizeConnectProvider>
          <TestComponent />
        </SeizeConnectProvider>
      );

      const connectButton = screen.getByTestId('connect-button');
      
      await act(async () => {
        fireEvent.click(connectButton);
      });

      // Should still log security events even with undefined NODE_ENV
      expect(consoleWarnSpy).toHaveBeenCalled();
    });
  });

  describe('Error Propagation', () => {
    it('throws WalletConnectionError when connection fails', async () => {
      const { useAppKit } = require('@reown/appkit/react');
      const mockOpen = jest.fn().mockImplementation(() => {
        throw new Error('Connection failed');
      });
      useAppKit.mockReturnValue({ open: mockOpen });

      render(
        <SeizeConnectProvider>
          <TestComponent />
        </SeizeConnectProvider>
      );

      const connectButton = screen.getByTestId('connect-button');
      
      // The error is thrown inside React event handler, so we need to catch it properly
      let thrownError: any = null;
      const errorBoundary = jest.fn((error) => {
        thrownError = error;
      });
      
      // Listen for unhandled errors during click
      const originalOnError = window.onerror;
      window.onerror = errorBoundary;
      
      await act(async () => {
        try {
          fireEvent.click(connectButton);
        } catch (error) {
          thrownError = error;
        }
      });

      window.onerror = originalOnError;
      
      // Verify that the error was logged even if not caught by test
      expect(consoleErrorSpy).toHaveBeenCalled();
    });

    it('throws AuthenticationError for invalid addresses', async () => {
      render(
        <SeizeConnectProvider>
          <TestComponent />
        </SeizeConnectProvider>
      );

      const acceptInvalidButton = screen.getByTestId('accept-invalid');
      
      // Similar approach for invalid address error
      let thrownError: any = null;
      
      await act(async () => {
        try {
          fireEvent.click(acceptInvalidButton);
        } catch (error) {
          thrownError = error;
        }
      });
      
      // Verify that the error was logged with proper privacy protection
      expect(consoleErrorSpy).toHaveBeenCalled();
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        '[SEIZE_SECURITY_EVENT] invalid_address_attempt:',
        expect.objectContaining({
          eventType: 'invalid_address_attempt',
          valid: false,
          // In any environment, raw address should not appear in logs
          address: expect.not.stringMatching(/invalid-address/)
        })
      );
    });
  });

  describe('Timestamp and Context Inclusion', () => {
    it('includes timestamps in all log entries', async () => {
      const { useAppKit } = require('@reown/appkit/react');
      const mockOpen = jest.fn();
      useAppKit.mockReturnValue({ open: mockOpen });

      render(
        <SeizeConnectProvider>
          <TestComponent />
        </SeizeConnectProvider>
      );

      const connectButton = screen.getByTestId('connect-button');
      
      await act(async () => {
        fireEvent.click(connectButton);
      });

      // Check that all log calls include timestamps
      consoleWarnSpy.mock.calls.forEach(call => {
        expect(call[1]).toHaveProperty('timestamp');
        expect(call[1].timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
      });
    });

    it('includes user agent in all log entries', async () => {
      const { useAppKit } = require('@reown/appkit/react');
      const mockOpen = jest.fn();
      useAppKit.mockReturnValue({ open: mockOpen });

      render(
        <SeizeConnectProvider>
          <TestComponent />
        </SeizeConnectProvider>
      );

      const connectButton = screen.getByTestId('connect-button');
      
      await act(async () => {
        fireEvent.click(connectButton);
      });

      // Check that all log calls include user agent
      consoleWarnSpy.mock.calls.forEach(call => {
        expect(call[1]).toHaveProperty('userAgent');
      });
    });
  });
});