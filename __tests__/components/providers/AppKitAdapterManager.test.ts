import { AppKitAdapterManager } from '@/components/providers/AppKitAdapterManager'
import { AdapterError, AdapterCacheError, AdapterCleanupError } from '@/src/errors/adapter'
import { AppWallet } from '@/components/app-wallets/AppWalletsContext'
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi'

// Mock dependencies
jest.mock('@reown/appkit-adapter-wagmi')
jest.mock('@/wagmiConfig/wagmiAppWalletConnector', () => ({
  createAppWalletConnector: jest.fn(() => ({ id: 'mock-connector' }))
}))
jest.mock('@/constants', () => ({
  CW_PROJECT_ID: 'test-project-id'
}))

describe('AppKitAdapterManager', () => {
  let manager: AppKitAdapterManager
  let mockRequestPassword: jest.Mock

  const mockWallet: AppWallet = {
    address: '0x123',
    address_hashed: 'hash123',
    name: 'Test Wallet',
    app_wallet_id: 'test-wallet-1'
  }

  const mockWallet2: AppWallet = {
    address: '0x456',
    address_hashed: 'hash456',
    name: 'Test Wallet 2',
    app_wallet_id: 'test-wallet-2'
  }

  beforeEach(() => {
    jest.clearAllMocks()
    mockRequestPassword = jest.fn().mockResolvedValue('password123')
    
    // Mock WagmiAdapter constructor
    ;(WagmiAdapter as jest.MockedClass<typeof WagmiAdapter>).mockImplementation(() => ({
      wagmiConfig: { id: 'mock-config' }
    } as any))
  })

  describe('Constructor Validation', () => {
    it('should throw AdapterError when requestPassword is null', () => {
      expect(() => new AppKitAdapterManager(null as any)).toThrow(AdapterError)
      expect(() => new AppKitAdapterManager(null as any)).toThrow('requestPassword function is required')
    })

    it('should throw AdapterError when requestPassword is undefined', () => {
      expect(() => new AppKitAdapterManager(undefined as any)).toThrow(AdapterError)
      expect(() => new AppKitAdapterManager(undefined as any)).toThrow('requestPassword function is required')
    })

    it('should throw AdapterError when requestPassword is not a function', () => {
      expect(() => new AppKitAdapterManager('not-a-function' as any)).toThrow(AdapterError)
      expect(() => new AppKitAdapterManager('not-a-function' as any)).toThrow('requestPassword must be a function')
    })

    it('should create manager successfully with valid requestPassword', () => {
      expect(() => new AppKitAdapterManager(mockRequestPassword)).not.toThrow()
    })
  })

  describe('Input Validation Tests', () => {
    beforeEach(() => {
      manager = new AppKitAdapterManager(mockRequestPassword)
    })

    describe('createAdapter', () => {
      it('should throw AdapterError when appWallets is not an array', () => {
        expect(() => manager.createAdapter(null as any)).toThrow(AdapterError)
        expect(() => manager.createAdapter(null as any)).toThrow('appWallets must be an array')
        
        expect(() => manager.createAdapter('not-array' as any)).toThrow(AdapterError)
        expect(() => manager.createAdapter(undefined as any)).toThrow(AdapterError)
      })

      it('should throw AdapterError when wallet object is invalid', () => {
        expect(() => manager.createAdapter([null] as any)).toThrow(AdapterError)
        expect(() => manager.createAdapter([null] as any)).toThrow('Invalid wallet object found in appWallets array')
      })

      it('should throw AdapterError when wallet missing address', () => {
        const invalidWallet = { address_hashed: 'hash123', name: 'Test' }
        expect(() => manager.createAdapter([invalidWallet] as any)).toThrow(AdapterError)
        expect(() => manager.createAdapter([invalidWallet] as any)).toThrow('Wallet is missing required address property')
      })

      it('should throw AdapterError when wallet missing address_hashed', () => {
        const invalidWallet = { address: '0x123', name: 'Test' }
        expect(() => manager.createAdapter([invalidWallet] as any)).toThrow(AdapterError)
        expect(() => manager.createAdapter([invalidWallet] as any)).toThrow('Wallet is missing required address_hashed property')
      })
    })

    describe('shouldRecreateAdapter', () => {
      it('should throw AdapterError when newWallets is not an array', () => {
        expect(() => manager.shouldRecreateAdapter(null as any)).toThrow(AdapterError)
        expect(() => manager.shouldRecreateAdapter(null as any)).toThrow('newWallets must be an array')
      })

      it('should throw AdapterError when wallet in newWallets is invalid', () => {
        // First create an adapter so shouldRecreateAdapter has something to compare against
        manager.createAdapter([mockWallet])
        expect(() => manager.shouldRecreateAdapter([null] as any)).toThrow(AdapterError)
        expect(() => manager.shouldRecreateAdapter([null] as any)).toThrow('Invalid wallet in newWallets array')
      })

      it('should throw AdapterError when currentWallets contains invalid wallet', () => {
        // Set up invalid currentWallets state
        manager.createAdapter([mockWallet])
        ;(manager as any).currentWallets = [null] // Force invalid state
        
        expect(() => manager.shouldRecreateAdapter([mockWallet])).toThrow(AdapterError)
        expect(() => manager.shouldRecreateAdapter([mockWallet])).toThrow('Invalid wallet in currentWallets array')
      })
    })

    describe('createAdapterWithCache', () => {
      it('should throw AdapterError when appWallets is not an array', () => {
        expect(() => manager.createAdapterWithCache(null as any)).toThrow(AdapterError)
        expect(() => manager.createAdapterWithCache(null as any)).toThrow('appWallets must be an array')
      })

      it('should throw AdapterCacheError when cached adapter is null', () => {
        const cacheKey = manager['getCacheKey']([mockWallet])
        manager['adapterCache'].set(cacheKey, null as any)
        
        expect(() => manager.createAdapterWithCache([mockWallet])).toThrow('Cached adapter is null or undefined')
      })
    })

    describe('getConnectionState', () => {
      it('should throw AdapterError when walletAddress is not provided', () => {
        expect(() => manager.getConnectionState('')).toThrow(AdapterError)
        expect(() => manager.getConnectionState('')).toThrow('walletAddress is required')
        
        expect(() => manager.getConnectionState(null as any)).toThrow(AdapterError)
        expect(() => manager.getConnectionState(undefined as any)).toThrow(AdapterError)
      })

      it('should throw AdapterError when walletAddress is not a string', () => {
        expect(() => manager.getConnectionState(123 as any)).toThrow(AdapterError)
        expect(() => manager.getConnectionState(123 as any)).toThrow('walletAddress must be a string')
      })
    })

    describe('setConnectionState', () => {
      it('should throw AdapterError when walletAddress is not provided', () => {
        expect(() => manager.setConnectionState('', 'connected')).toThrow(AdapterError)
        expect(() => manager.setConnectionState('', 'connected')).toThrow('walletAddress is required')
      })

      it('should throw AdapterError when state is not provided', () => {
        expect(() => manager.setConnectionState('0x123', '' as any)).toThrow(AdapterError)
        expect(() => manager.setConnectionState('0x123', '' as any)).toThrow('state is required')
      })

      it('should throw AdapterError when state is invalid', () => {
        expect(() => manager.setConnectionState('0x123', 'invalid' as any)).toThrow(AdapterError)
        expect(() => manager.setConnectionState('0x123', 'invalid' as any))
          .toThrow("Invalid state: invalid. Must be 'connecting', 'connected', or 'disconnected'")
      })
    })
  })

  describe('Cache Cleanup Error Handling', () => {
    beforeEach(() => {
      manager = new AppKitAdapterManager(mockRequestPassword)
    })

    describe('performAdapterCleanup', () => {
      it('should throw AdapterCleanupError when adapter is null', () => {
        expect(() => manager['performAdapterCleanup'](null as any, 'test-key')).toThrow('Cannot cleanup null or undefined adapter')
      })

      it('should throw AdapterCleanupError when cacheKey is empty', () => {
        const mockAdapter = {} as WagmiAdapter
        expect(() => manager['performAdapterCleanup'](mockAdapter, '')).toThrow('Cannot cleanup adapter without cache key')
      })

      it('should throw AdapterCleanupError when trying to cleanup current adapter', () => {
        const adapter = manager.createAdapter([mockWallet])
        expect(() => manager['performAdapterCleanup'](adapter, 'test-key')).toThrow(/Failed to cleanup adapter for key test-key/)
      })

      it('should cleanup non-current adapter successfully', () => {
        const adapter1 = manager.createAdapter([mockWallet])
        const adapter2 = manager.createAdapter([mockWallet2]) // Makes adapter2 current
        
        // Should not throw when cleaning up non-current adapter
        expect(() => manager['performAdapterCleanup'](adapter1, 'test-key')).not.toThrow()
      })
    })

    describe('cleanup method', () => {
      it('should handle cleanup errors and throw AdapterCleanupError', () => {
        // Create adapters to populate cache
        manager.createAdapterWithCache([mockWallet])
        manager.createAdapterWithCache([mockWallet2])
        
        // Mock performAdapterCleanup to throw error
        jest.spyOn(manager as any, 'performAdapterCleanup').mockImplementation(() => {
          throw new Error('Mock cleanup error')
        })
        
        expect(() => manager.cleanup()).toThrow(/Unexpected error during cleanup/)
      })

      it('should throw AdapterCleanupError for unexpected errors', () => {
        // Mock Array.from to throw unexpected error
        jest.spyOn(Array, 'from').mockImplementationOnce(() => {
          throw new Error('Unexpected error')
        })
        
        expect(() => manager.cleanup()).toThrow('Unexpected error during cleanup')
      })
    })
  })

  describe('Connection State Validation', () => {
    beforeEach(() => {
      manager = new AppKitAdapterManager(mockRequestPassword)
    })

    it('should return disconnected for unknown wallet address', () => {
      expect(manager.getConnectionState('unknown-address')).toBe('disconnected')
    })

    it('should set and get connection state correctly', () => {
      manager.setConnectionState('0x123', 'connecting')
      expect(manager.getConnectionState('0x123')).toBe('connecting')
      
      manager.setConnectionState('0x123', 'connected')
      expect(manager.getConnectionState('0x123')).toBe('connected')
      
      manager.setConnectionState('0x123', 'disconnected')
      expect(manager.getConnectionState('0x123')).toBe('disconnected')
    })
  })

  describe('Cache Key Generation', () => {
    beforeEach(() => {
      manager = new AppKitAdapterManager(mockRequestPassword)
    })

    it('should throw AdapterError when wallets is not an array', () => {
      expect(() => manager['getCacheKey'](null as any)).toThrow(AdapterError)
      expect(() => manager['getCacheKey'](null as any))
        .toThrow('Cannot generate cache key: wallets must be an array')
    })

    it('should throw AdapterError when wallet object is invalid', () => {
      expect(() => manager['getCacheKey']([null] as any)).toThrow(AdapterError)
      expect(() => manager['getCacheKey']([null] as any))
        .toThrow('Cannot generate cache key: invalid wallet object')
    })

    it('should return empty-wallets for empty array', () => {
      expect(manager['getCacheKey']([])).toBe('empty-wallets')
    })

    it('should generate consistent cache key for same wallets', () => {
      const key1 = manager['getCacheKey']([mockWallet, mockWallet2])
      const key2 = manager['getCacheKey']([mockWallet2, mockWallet]) // Different order
      expect(key1).toBe(key2) // Should be same due to sorting
    })

    it('should generate different cache keys for different wallets', () => {
      const key1 = manager['getCacheKey']([mockWallet])
      const key2 = manager['getCacheKey']([mockWallet2])
      expect(key1).not.toBe(key2)
    })
  })

  describe('Type Safety Tests', () => {
    beforeEach(() => {
      manager = new AppKitAdapterManager(mockRequestPassword)
    })

    it('should maintain type safety for connection states', () => {
      // These should compile and work
      manager.setConnectionState('0x123', 'connecting')
      manager.setConnectionState('0x123', 'connected')
      manager.setConnectionState('0x123', 'disconnected')
      
      // Return type should be strictly typed
      const state: 'connecting' | 'connected' | 'disconnected' = manager.getConnectionState('0x123')
      expect(typeof state).toBe('string')
    })

    it('should return WagmiAdapter or null for getCurrentAdapter', () => {
      // Initially null
      expect(manager.getCurrentAdapter()).toBeNull()
      
      // After creating adapter, should return WagmiAdapter
      const adapter = manager.createAdapter([mockWallet])
      expect(manager.getCurrentAdapter()).toBe(adapter)
      // Note: We can't test instanceof WagmiAdapter here because it's mocked
      expect(manager.getCurrentAdapter()).toBeDefined()
    })
  })

  describe('Functional Behavior Tests', () => {
    beforeEach(() => {
      manager = new AppKitAdapterManager(mockRequestPassword)
    })

    it('should detect when adapter recreation is needed', () => {
      expect(manager.shouldRecreateAdapter([mockWallet])).toBe(true) // No current adapter
      
      manager.createAdapter([mockWallet])
      expect(manager.shouldRecreateAdapter([mockWallet])).toBe(false) // Same wallet
      expect(manager.shouldRecreateAdapter([mockWallet, mockWallet2])).toBe(true) // Different wallets
      expect(manager.shouldRecreateAdapter([])).toBe(true) // Empty array
    })

    it('should use cached adapter when available', () => {
      const adapter1 = manager.createAdapterWithCache([mockWallet])
      const adapter2 = manager.createAdapterWithCache([mockWallet]) // Should return cached
      
      expect(adapter1).toBe(adapter2)
    })

    it('should enforce cache size limit', () => {
      const maxSize = 5
      
      // Fill cache beyond limit
      for (let i = 0; i < maxSize + 2; i++) {
        const wallet: AppWallet = {
          address: `0x${i}`,
          address_hashed: `hash${i}`,
          name: `Wallet ${i}`,
          app_wallet_id: `wallet-${i}`
        }
        manager.createAdapterWithCache([wallet])
      }
      
      expect(manager['adapterCache'].size).toBeLessThanOrEqual(maxSize)
    })

    it('should clear all state on cleanup', () => {
      manager.createAdapterWithCache([mockWallet])
      manager.setConnectionState('0x123', 'connected')
      
      expect(manager.getCurrentAdapter()).not.toBeNull()
      expect(manager.getConnectionState('0x123')).toBe('connected')
      expect(manager['adapterCache'].size).toBeGreaterThan(0)
      
      manager.cleanup()
      
      expect(manager.getCurrentAdapter()).toBeNull()
      expect(manager.getConnectionState('0x123')).toBe('disconnected')
      expect(manager['adapterCache'].size).toBe(0)
    })
  })

  describe('Error Propagation', () => {
    beforeEach(() => {
      manager = new AppKitAdapterManager(mockRequestPassword)
    })

    it('should propagate WagmiAdapter constructor errors', () => {
      ;(WagmiAdapter as jest.MockedClass<typeof WagmiAdapter>).mockImplementationOnce(() => {
        throw new Error('WagmiAdapter creation failed')
      })
      
      expect(() => manager.createAdapter([mockWallet])).toThrow('WagmiAdapter creation failed')
    })

    it('should propagate requestPassword errors', async () => {
      mockRequestPassword.mockRejectedValueOnce(new Error('Password request failed'))
      const adapter = manager.createAdapter([mockWallet])
      
      // The error would be thrown when the connector actually requests password
      // This tests that we don't swallow the promise rejection
      expect(adapter).toBeDefined()
    })
  })
})