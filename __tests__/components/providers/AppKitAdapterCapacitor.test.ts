import { AppKitAdapterCapacitor } from '../../../components/providers/AppKitAdapterCapacitor';
import { WalletConnectionError, ConnectionStateError } from '../../../src/errors/wallet-connection';
import { AppWallet } from '../../../components/app-wallets/AppWalletsContext';

// Mock dependencies
jest.mock('@reown/appkit-adapter-wagmi');
jest.mock('viem/chains');
jest.mock('@/wagmiConfig/wagmiAppWalletConnector');
jest.mock('wagmi/connectors');
jest.mock('@/constants', () => ({
  CW_PROJECT_ID: 'test-project-id',
  VALIDATED_BASE_ENDPOINT: 'https://test.example.com'
}));

describe('AppKitAdapterCapacitor', () => {
  const mockRequestPassword = jest.fn().mockResolvedValue('test-password');
  const mockAppWallets: AppWallet[] = [
    {
      address: '0x123456789abcdef',
      address_hashed: 'hashed123',
      name: 'Test Wallet 1',
      encrypted_wallet_object: 'encrypted-data-1'
    },
    {
      address: '0x987654321fedcba',
      address_hashed: 'hashed456', 
      name: 'Test Wallet 2',
      encrypted_wallet_object: 'encrypted-data-2'
    }
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Constructor validation', () => {
    it('should throw WalletConnectionError when requestPassword is null', () => {
      expect(() => {
        new AppKitAdapterCapacitor(null as any);
      }).toThrow(new WalletConnectionError('requestPassword function is required but not provided'));
    });

    it('should throw WalletConnectionError when requestPassword is undefined', () => {
      expect(() => {
        new AppKitAdapterCapacitor(undefined as any);
      }).toThrow(new WalletConnectionError('requestPassword function is required but not provided'));
    });

    it('should throw WalletConnectionError when requestPassword is not a function', () => {
      expect(() => {
        new AppKitAdapterCapacitor('not-a-function' as any);
      }).toThrow(new WalletConnectionError('requestPassword must be a function'));
      
      expect(() => {
        new AppKitAdapterCapacitor(123 as any);
      }).toThrow(new WalletConnectionError('requestPassword must be a function'));
      
      expect(() => {
        new AppKitAdapterCapacitor({} as any);
      }).toThrow(new WalletConnectionError('requestPassword must be a function'));
    });

    it('should create instance successfully with valid requestPassword', () => {
      const adapter = new AppKitAdapterCapacitor(mockRequestPassword);
      expect(adapter).toBeInstanceOf(AppKitAdapterCapacitor);
    });
  });

  describe('getConnectionState input validation and error throwing', () => {
    let adapter: AppKitAdapterCapacitor;

    beforeEach(() => {
      adapter = new AppKitAdapterCapacitor(mockRequestPassword);
    });

    it('should throw ConnectionStateError when walletAddress is null', () => {
      expect(() => {
        adapter.getConnectionState(null as any);
      }).toThrow(new ConnectionStateError('Wallet address is required but not provided'));
    });

    it('should throw ConnectionStateError when walletAddress is undefined', () => {
      expect(() => {
        adapter.getConnectionState(undefined as any);
      }).toThrow(new ConnectionStateError('Wallet address is required but not provided'));
    });

    it('should throw ConnectionStateError when walletAddress is not a string', () => {
      expect(() => {
        adapter.getConnectionState(123 as any);
      }).toThrow(new ConnectionStateError('Wallet address must be a string', 123));

      expect(() => {
        adapter.getConnectionState({} as any);
      }).toThrow(new ConnectionStateError('Wallet address must be a string', {}));
    });

    it('should throw ConnectionStateError when walletAddress is empty string', () => {
      expect(() => {
        adapter.getConnectionState('');
      }).toThrow(new ConnectionStateError('Wallet address cannot be empty', ''));
      
      expect(() => {
        adapter.getConnectionState('   ');
      }).toThrow(new ConnectionStateError('Wallet address cannot be empty', '   '));
    });

    it('should throw ConnectionStateError when no connection state found', () => {
      const walletAddress = '0xnonexistent';
      expect(() => {
        adapter.getConnectionState(walletAddress);
      }).toThrow(new ConnectionStateError(`No connection state found for wallet address: ${walletAddress}`, walletAddress));
    });

    it('should return correct connection state when state exists', () => {
      const walletAddress = '0x123456789abcdef';
      adapter.setConnectionState(walletAddress, 'connected');
      
      const state = adapter.getConnectionState(walletAddress);
      expect(state).toBe('connected');
    });
  });

  describe('setConnectionState validation', () => {
    let adapter: AppKitAdapterCapacitor;

    beforeEach(() => {
      adapter = new AppKitAdapterCapacitor(mockRequestPassword);
    });

    it('should throw ConnectionStateError when walletAddress is null or undefined', () => {
      expect(() => {
        adapter.setConnectionState(null as any, 'connected');
      }).toThrow(new ConnectionStateError('Wallet address is required but not provided'));

      expect(() => {
        adapter.setConnectionState(undefined as any, 'connected');
      }).toThrow(new ConnectionStateError('Wallet address is required but not provided'));
    });

    it('should throw ConnectionStateError when walletAddress is not a string', () => {
      expect(() => {
        adapter.setConnectionState(123 as any, 'connected');
      }).toThrow(new ConnectionStateError('Wallet address must be a string', 123));
    });

    it('should throw ConnectionStateError when walletAddress is empty', () => {
      expect(() => {
        adapter.setConnectionState('', 'connected');
      }).toThrow(new ConnectionStateError('Wallet address cannot be empty', ''));
    });

    it('should throw ConnectionStateError when state is null or undefined', () => {
      const walletAddress = '0x123456789abcdef';
      
      expect(() => {
        adapter.setConnectionState(walletAddress, null as any);
      }).toThrow(new ConnectionStateError('Connection state is required but not provided', walletAddress));

      expect(() => {
        adapter.setConnectionState(walletAddress, undefined as any);
      }).toThrow(new ConnectionStateError('Connection state is required but not provided', walletAddress));
    });

    it('should throw ConnectionStateError when state is invalid', () => {
      const walletAddress = '0x123456789abcdef';
      const invalidState = 'invalid-state';
      
      expect(() => {
        adapter.setConnectionState(walletAddress, invalidState as any);
      }).toThrow(new ConnectionStateError(`Invalid connection state: ${invalidState} for wallet ${walletAddress}. Must be 'connecting', 'connected', or 'disconnected'`, walletAddress, invalidState));
    });
  });

  describe('State transition validation', () => {
    let adapter: AppKitAdapterCapacitor;
    const walletAddress = '0x123456789abcdef';

    beforeEach(() => {
      adapter = new AppKitAdapterCapacitor(mockRequestPassword);
    });

    it('should allow initial state setting to any valid state', () => {
      expect(() => {
        adapter.setConnectionState(walletAddress, 'disconnected');
      }).not.toThrow();

      // Reset for next test
      adapter.cleanup();
      adapter = new AppKitAdapterCapacitor(mockRequestPassword);

      expect(() => {
        adapter.setConnectionState(walletAddress, 'connecting');
      }).not.toThrow();

      // Reset for next test  
      adapter.cleanup();
      adapter = new AppKitAdapterCapacitor(mockRequestPassword);

      expect(() => {
        adapter.setConnectionState(walletAddress, 'connected');
      }).not.toThrow();
    });

    it('should throw error when transitioning from connected to connecting', () => {
      adapter.setConnectionState(walletAddress, 'connected');
      
      expect(() => {
        adapter.setConnectionState(walletAddress, 'connecting');
      }).toThrow(new ConnectionStateError(`Invalid state transition from 'connected' to 'connecting' for wallet ${walletAddress}`, walletAddress, 'connecting'));
    });

    it('should throw error when transitioning from disconnected to connected directly', () => {
      adapter.setConnectionState(walletAddress, 'disconnected');
      
      expect(() => {
        adapter.setConnectionState(walletAddress, 'connected');
      }).toThrow(new ConnectionStateError(`Invalid state transition from 'disconnected' to 'connected' for wallet ${walletAddress}. Must go through 'connecting' state first`, walletAddress, 'connected'));
    });

    it('should allow valid state transitions', () => {
      // disconnected -> connecting
      adapter.setConnectionState(walletAddress, 'disconnected');
      expect(() => {
        adapter.setConnectionState(walletAddress, 'connecting');
      }).not.toThrow();

      // connecting -> connected
      expect(() => {
        adapter.setConnectionState(walletAddress, 'connected');
      }).not.toThrow();

      // connected -> disconnected
      expect(() => {
        adapter.setConnectionState(walletAddress, 'disconnected');
      }).not.toThrow();

      // connecting -> disconnected (failure case)
      adapter.setConnectionState(walletAddress, 'connecting');
      expect(() => {
        adapter.setConnectionState(walletAddress, 'disconnected');
      }).not.toThrow();
    });
  });

  describe('Type safety', () => {
    let adapter: AppKitAdapterCapacitor;

    beforeEach(() => {
      adapter = new AppKitAdapterCapacitor(mockRequestPassword);
    });

    it('should ensure getConnectionState returns correct type', () => {
      const walletAddress = '0x123456789abcdef';
      adapter.setConnectionState(walletAddress, 'connected');
      
      const state = adapter.getConnectionState(walletAddress);
      
      // TypeScript compile-time check - this ensures the return type is strictly typed
      const validStates: ('connecting' | 'connected' | 'disconnected')[] = ['connecting', 'connected', 'disconnected'];
      expect(validStates).toContain(state);
    });

    it('should enforce strict typing on setConnectionState', () => {
      const walletAddress = '0x123456789abcdef';
      
      // These should work (compile-time check)
      expect(() => adapter.setConnectionState(walletAddress, 'connecting')).not.toThrow();
      adapter.setConnectionState(walletAddress, 'connected');
      adapter.setConnectionState(walletAddress, 'disconnected');
    });
  });

  describe('createAdapter integration', () => {
    let adapter: AppKitAdapterCapacitor;

    beforeEach(() => {
      adapter = new AppKitAdapterCapacitor(mockRequestPassword);
    });

    it('should throw WalletConnectionError when wallet has no address', () => {
      const invalidWallets = [
        { address_hashed: 'hashed123', name: 'Invalid Wallet' } as any,
        { address: '', address_hashed: 'hashed123', name: 'Empty Address' } as any,
        { address: null, address_hashed: 'hashed123', name: 'Null Address' } as any
      ];

      invalidWallets.forEach((invalidWallet) => {
        expect(() => {
          adapter.createAdapter([invalidWallet]);
        }).toThrow();
      });
    });

    it('should initialize connection states for all valid wallets', () => {
      const wagmiAdapter = adapter.createAdapter(mockAppWallets);
      
      expect(wagmiAdapter).toBeDefined();
      
      // Verify all wallets have initialized connection states
      mockAppWallets.forEach(wallet => {
        const state = adapter.getConnectionState(wallet.address);
        expect(state).toBe('disconnected'); // Initially disconnected
      });
    });

    it('should not reinitialize existing connection states', () => {
      const walletAddress = mockAppWallets[0].address;
      
      // Set initial state
      adapter.setConnectionState(walletAddress, 'connected');
      
      // Create adapter with same wallets
      adapter.createAdapter(mockAppWallets);
      
      // State should remain unchanged
      const state = adapter.getConnectionState(walletAddress);
      expect(state).toBe('connected');
    });

    it('should handle empty wallets array', () => {
      expect(() => {
        adapter.createAdapter([]);
      }).not.toThrow();
    });

    it('should store current wallets for comparison', () => {
      adapter.createAdapter(mockAppWallets);
      
      // This is testing the internal behavior via shouldRecreateAdapter
      expect(adapter.shouldRecreateAdapter(mockAppWallets)).toBe(false);
      expect(adapter.shouldRecreateAdapter([])).toBe(true);
    });
  });

  describe('Cleanup functionality', () => {
    let adapter: AppKitAdapterCapacitor;

    beforeEach(() => {
      adapter = new AppKitAdapterCapacitor(mockRequestPassword);
    });

    it('should clear all connection states on cleanup', () => {
      const walletAddress = '0x123456789abcdef';
      adapter.setConnectionState(walletAddress, 'connected');
      
      // Verify state exists
      expect(adapter.getConnectionState(walletAddress)).toBe('connected');
      
      // Cleanup
      adapter.cleanup();
      
      // State should no longer exist
      expect(() => {
        adapter.getConnectionState(walletAddress);
      }).toThrow();
    });

    it('should reset adapter and wallets on cleanup', () => {
      adapter.createAdapter(mockAppWallets);
      
      expect(adapter.getCurrentAdapter()).toBeDefined();
      expect(adapter.shouldRecreateAdapter(mockAppWallets)).toBe(false);
      
      adapter.cleanup();
      
      expect(adapter.getCurrentAdapter()).toBeNull();
      expect(adapter.shouldRecreateAdapter(mockAppWallets)).toBe(true);
    });
  });

  describe('Error message specificity', () => {
    let adapter: AppKitAdapterCapacitor;

    beforeEach(() => {
      adapter = new AppKitAdapterCapacitor(mockRequestPassword);
    });

    it('should provide specific error messages for debugging', () => {
      const walletAddress = '0xspecificaddress';
      
      try {
        adapter.getConnectionState(walletAddress);
      } catch (error) {
        expect(error.message).toContain(walletAddress);
      }
    });

    it('should include attempted state in error when validation fails', () => {
      const walletAddress = '0x123456789abcdef';
      const invalidState = 'invalid-state';
      
      try {
        adapter.setConnectionState(walletAddress, invalidState as any);
      } catch (error) {
        expect(error.message).toContain(walletAddress);
        expect(error.message).toContain(invalidState);
      }
    });
  });

  describe('Fail-fast behavior verification', () => {
    let adapter: AppKitAdapterCapacitor;

    beforeEach(() => {
      adapter = new AppKitAdapterCapacitor(mockRequestPassword);
    });

    it('should never return fallback values - always throw on invalid input', () => {
      // Test various invalid inputs that should all throw, never return defaults
      const invalidInputs = [
        null,
        undefined,
        '',
        '   ',
        123,
        {},
        []
      ];

      invalidInputs.forEach(input => {
        expect(() => {
          adapter.getConnectionState(input as any);
        }).toThrow();
      });
    });

    it('should never silently fail - all errors must be thrown', () => {
      // Verify that there are no code paths that silently return null or undefined
      const nonExistentAddress = '0xnonexistent';
      
      expect(() => {
        adapter.getConnectionState(nonExistentAddress);
      }).toThrow();
      
      // Even after setting a valid state, invalid inputs should still throw
      adapter.setConnectionState('0xvalid', 'connected');
      
      expect(() => {
        adapter.getConnectionState('');
      }).toThrow();
    });

    it('should halt execution immediately on any validation failure', () => {
      const invalidWallet = { name: 'Invalid' } as any;
      
      expect(() => {
        adapter.createAdapter([invalidWallet]);
      }).toThrow();
      
      // Verify that no partial state was created
      expect(adapter.getCurrentAdapter()).toBeNull();
    });
  });
});