import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
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
  useAppKit: () => ({
    open: jest.fn(),
  }),
  useAppKitAccount: () => ({
    address: undefined,
    isConnected: false,
    status: 'disconnected',
  }),
  useAppKitState: () => ({
    open: false,
  }),
  useDisconnect: () => ({
    disconnect: jest.fn(),
  }),
  useWalletInfo: () => ({
    walletInfo: null,
  }),
}));

// Mock viem
jest.mock('viem', () => ({
  isAddress: jest.fn(),
  getAddress: jest.fn(),
}));

// Mock auth utils
jest.mock('../../../services/auth/auth.utils', () => ({
  migrateCookiesToLocalStorage: jest.fn(),
  getWalletAddress: jest.fn(),
  removeAuthJwt: jest.fn(),
}));

// Test component that uses the context
const TestComponent: React.FC = () => {
  const context = useSeizeConnectContext();
  return (
    <div data-testid="test-component">
      <div data-testid="address">{context.address || 'undefined'}</div>
      <div data-testid="is-authenticated">{context.isAuthenticated.toString()}</div>
      <div data-testid="has-error">{context.hasInitializationError.toString()}</div>
      <div data-testid="error-message">{context.initializationError?.message || 'no error'}</div>
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

      // Component should render with loading state
      expect(screen.getByText('Initializing wallet connection...')).toBeInTheDocument();
    });

    it('should handle initialization errors gracefully in useEffect', async () => {
      // Setup invalid stored address
      mockGetWalletAddress.mockReturnValue('invalid-address-format');
      mockIsAddress.mockReturnValue(false);

      renderWithProvider();

      // Wait for initialization to complete
      await waitFor(() => {
        expect(screen.getByTestId('test-component')).toBeInTheDocument();
      });

      // Should show error state without crashing
      expect(screen.getByTestId('has-error')).toHaveTextContent('true');
      expect(screen.getByTestId('error-message')).toContainText('Invalid wallet address found in storage');
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

      await waitFor(() => {
        expect(screen.getByTestId('test-component')).toBeInTheDocument();
      });

      expect(screen.getByTestId('has-error')).toHaveTextContent('true');
      expect(screen.getByTestId('error-message')).toContainText('Unexpected error during wallet initialization');
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
        expect(screen.getByText('Wallet Initialization Error')).toBeInTheDocument();
        expect(screen.getByText('Test initialization error')).toBeInTheDocument();
        expect(screen.getByText('Clear Storage and Reload')).toBeInTheDocument();
      });
    });

    it('should provide recovery option in error boundary', async () => {
      const ThrowingComponent: React.FC = () => {
        throw new Error('Generic error');
      };

      // Mock window.location.reload
      const mockReload = jest.fn();
      Object.defineProperty(window, 'location', {
        value: { reload: mockReload },
        writable: true,
      });

      render(
        <SeizeConnectProvider>
          <ThrowingComponent />
        </SeizeConnectProvider>
      );

      await waitFor(() => {
        expect(screen.getByText('Clear Storage and Reload')).toBeInTheDocument();
      });

      const clearButton = screen.getByText('Clear Storage and Reload');
      await userEvent.click(clearButton);

      expect(mockReload).toHaveBeenCalled();
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

  describe('Security Event Logging', () => {
    let consoleWarnSpy: jest.SpyInstance;

    beforeEach(() => {
      consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    });

    afterEach(() => {
      consoleWarnSpy.mockRestore();
    });

    it('should log security events for invalid stored addresses', async () => {
      mockGetWalletAddress.mockReturnValue('0xinvalid');
      mockIsAddress.mockReturnValue(false);

      renderWithProvider();

      await waitFor(() => {
        expect(screen.getByTestId('test-component')).toBeInTheDocument();
      });

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('[SEIZE_SECURITY_EVENT] invalid_stored_address_detected:'),
        expect.objectContaining({
          eventType: 'invalid_stored_address_detected',
          source: 'wallet_initialization',
          valid: false
        })
      );
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
    jest.useFakeTimers();
    
    const validAddress = '0x1234567890abcdef1234567890abcdef12345678';
    mockGetWalletAddress.mockReturnValue(validAddress);
    mockIsAddress.mockReturnValue(true);
    mockGetAddress.mockReturnValue(validAddress);

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

    await waitFor(() => {
      expect(screen.getByTestId('logout-btn')).toBeInTheDocument();
    });

    await userEvent.click(screen.getByTestId('logout-btn'));
    
    expect(mockDisconnect).toHaveBeenCalled();
    expect(authUtils.removeAuthJwt).toHaveBeenCalled();

    // Fast-forward timers to trigger delayed reconnection
    act(() => {
      jest.advanceTimersByTime(100);
    });

    expect(mockOpen).toHaveBeenCalledWith({ view: 'Connect' });
    
    jest.useRealTimers();
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

    await waitFor(() => {
      expect(screen.getByTestId('logout-btn')).toBeInTheDocument();
    });

    await userEvent.click(screen.getByTestId('logout-btn'));

    await waitFor(() => {
      expect(screen.getByTestId('error')).toHaveTextContent('AuthenticationError');
    });

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

    await waitFor(() => {
      expect(screen.getByTestId('logout-btn')).toBeInTheDocument();
    });

    await userEvent.click(screen.getByTestId('logout-btn'));

    await waitFor(() => {
      expect(screen.getByTestId('error')).toHaveTextContent('AuthenticationError');
    });

    // Verify disconnect was successful before auth cleanup failure
    expect(mockDisconnect).toHaveBeenCalled();
  });
});