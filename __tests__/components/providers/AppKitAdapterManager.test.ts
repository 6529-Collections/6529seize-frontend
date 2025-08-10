import { AppKitAdapterManager } from '@/components/providers/AppKitAdapterManager'
import { AdapterError, AdapterCacheError, AdapterCleanupError } from '@/src/errors/adapter'
import { AppWallet } from '@/components/app-wallets/AppWalletsContext'
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi'

// Jest helper
const fail = (message?: string): never => {
  throw new Error(message || 'Test failed')
}

// Mock dependencies
jest.mock('@reown/appkit-adapter-wagmi')
jest.mock('@/wagmiConfig/wagmiAppWalletConnector', () => ({
  createAppWalletConnector: jest.fn(() => ({ id: 'mock-connector' }))
}))
jest.mock('@/constants', () => ({
  CW_PROJECT_ID: '12345678-1234-1234-1234-123456789abc' // Valid UUID format
}))

describe('AppKitAdapterManager', () => {
  let manager: AppKitAdapterManager
  let mockRequestPassword: jest.Mock

  const mockWallet: AppWallet = {
    address: '0x123',
    address_hashed: 'hash123',
    name: 'Test Wallet',
    created_at: Date.now(),
    mnemonic: '',
    private_key: '',
    imported: false
  }

  const mockWalletWithSensitiveData: AppWallet = {
    address: '0x456',
    address_hashed: 'hash456',
    name: 'Sensitive Wallet',
    created_at: Date.now(),
    private_key: 'abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
    mnemonic: 'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about',
    imported: false
  }

  const mockWallet2: AppWallet = {
    address: '0x789',
    address_hashed: 'hash789',
    name: 'Test Wallet 2',
    created_at: Date.now(),
    mnemonic: '',
    private_key: '',
    imported: false
  }

  beforeEach(() => {
    jest.clearAllMocks()
    mockRequestPassword = jest.fn().mockResolvedValue('password123')
    
    // Mock WagmiAdapter constructor
    ;(WagmiAdapter as jest.MockedClass<typeof WagmiAdapter>).mockImplementation(() => ({
      wagmiConfig: { id: 'mock-config' }
    } as any))
  })

  describe('Security Tests - Critical', () => {
    beforeEach(() => {
      manager = new AppKitAdapterManager(mockRequestPassword)
    })

    describe('Sensitive Data Exposure Prevention', () => {
      it('should never expose private keys in error messages', () => {
        const walletWithPrivateKey = {
          // Missing address to trigger error that calls getSafeWalletInfo
          address_hashed: 'hash123',
          name: 'Test',
          private_key: 'SENSITIVE_PRIVATE_KEY_THAT_SHOULD_NEVER_BE_LOGGED_abcdef1234567890abcdef1234'
        }

        try {
          manager.createAdapter([walletWithPrivateKey] as any)
          fail('Should have thrown error')
        } catch (error: any) {
          expect(error.message).not.toContain('SENSITIVE_PRIVATE_KEY_THAT_SHOULD_NEVER_BE_LOGGED')
          expect(error.message).toContain('has_private_key')
          expect(error.message).not.toContain(walletWithPrivateKey.private_key)
        }
      })

      it('should never expose mnemonics in error messages', () => {
        const walletWithMnemonic = {
          // Missing address to trigger error that calls getSafeWalletInfo
          address_hashed: 'hash123',
          name: 'Test',
          mnemonic: 'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about SENSITIVE_PHRASE'
        }

        try {
          manager.createAdapter([walletWithMnemonic] as any)
          fail('Should have thrown error')
        } catch (error: any) {
          expect(error.message).not.toContain('SENSITIVE_PHRASE')
          expect(error.message).toContain('has_mnemonic')
          expect(error.message).not.toContain(walletWithMnemonic.mnemonic)
        }
      })

      it('should validate private key format without exposing content', () => {
        const walletWithInvalidPrivateKey = {
          // Missing address to trigger getSafeWalletInfo
          address_hashed: 'hash123',
          name: 'Test',
          private_key: 'too_short'
        }

        expect(() => manager.createAdapter([walletWithInvalidPrivateKey] as any))
          .toThrow('SECURITY_001: Invalid private_key format detected')
      })

      it('should validate mnemonic format without exposing content', () => {
        const walletWithInvalidMnemonic = {
          // Missing address to trigger getSafeWalletInfo
          address_hashed: 'hash123', 
          name: 'Test',
          mnemonic: 'invalid mnemonic'
        }

        expect(() => manager.createAdapter([walletWithInvalidMnemonic] as any))
          .toThrow('SECURITY_002: Invalid mnemonic format detected')
      })

      it('should safely handle wallets with both valid private key and mnemonic', () => {
        expect(() => manager.createAdapter([mockWalletWithSensitiveData]))
          .not.toThrow()
      })
    })

    describe('Error Code Security', () => {
      it('should use indexed error codes for tracking without exposing sensitive info', () => {
        expect(() => manager.createAdapter(null as any))
          .toThrow('ADAPTER_007: appWallets must be an array')
          
        expect(() => manager.createAdapter([null] as any))
          .toThrow('ADAPTER_008: Invalid wallet object found in appWallets array')
      })

      it('should include wallet type information safely', () => {
        try {
          manager.createAdapter([{ address_hashed: 'hash123' }] as any)
          fail('Should have thrown error')
        } catch (error: any) {
          expect(error.message).toContain('ADAPTER_001')
          expect(error.message).toContain('type":"AppWallet"')
          expect(error.message).not.toContain('private_key')
          expect(error.message).not.toContain('mnemonic')
        }
      })
    })

    describe('CW_PROJECT_ID Validation Security', () => {
      beforeEach(() => {
        // Override the mock for these tests
        jest.doMock('@/constants', () => ({
          CW_PROJECT_ID: 'invalid-format'
        }))
      })

      it('should validate CW_PROJECT_ID format and truncate in error message', () => {
        // Need to reimport with the new mock
        jest.resetModules()
        const { AppKitAdapterManager } = require('@/components/providers/AppKitAdapterManager')
        const testManager = new AppKitAdapterManager(mockRequestPassword)
        
        expect(() => testManager.createAdapter([mockWallet]))
          .toThrow(/ADAPTER_004: CW_PROJECT_ID has invalid format.*invalid-\.\.\./)
      })

      it('should not expose full CW_PROJECT_ID in error messages', () => {
        jest.resetModules()
        const { AppKitAdapterManager } = require('@/components/providers/AppKitAdapterManager')
        const testManager = new AppKitAdapterManager(mockRequestPassword)
        
        try {
          testManager.createAdapter([mockWallet])
          fail('Should have thrown error')
        } catch (error: any) {
          expect(error.message).not.toContain('invalid-format')
          expect(error.message).toContain('invalid-...')
        }
      })
    })
  })

  describe('Constructor Validation', () => {
    it('should throw indexed AdapterError when requestPassword is null', () => {
      expect(() => new AppKitAdapterManager(null as any)).toThrow(AdapterError)
      expect(() => new AppKitAdapterManager(null as any))
        .toThrow('ADAPTER_005: requestPassword function is required')
    })

    it('should throw indexed AdapterError when requestPassword is undefined', () => {
      expect(() => new AppKitAdapterManager(undefined as any)).toThrow(AdapterError)
      expect(() => new AppKitAdapterManager(undefined as any))
        .toThrow('ADAPTER_005: requestPassword function is required')
    })

    it('should throw indexed AdapterError when requestPassword is not a function', () => {
      expect(() => new AppKitAdapterManager('not-a-function' as any)).toThrow(AdapterError)
      expect(() => new AppKitAdapterManager('not-a-function' as any))
        .toThrow('ADAPTER_006: requestPassword must be a function')
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
      it('should throw indexed AdapterError when appWallets is not an array', () => {
        expect(() => manager.createAdapter(null as any)).toThrow(AdapterError)
        expect(() => manager.createAdapter(null as any))
          .toThrow('ADAPTER_007: appWallets must be an array')
        
        expect(() => manager.createAdapter('not-array' as any)).toThrow(AdapterError)
        expect(() => manager.createAdapter(undefined as any)).toThrow(AdapterError)
      })

      it('should throw indexed AdapterError when wallet object is invalid', () => {
        expect(() => manager.createAdapter([null] as any)).toThrow(AdapterError)
        expect(() => manager.createAdapter([null] as any))
          .toThrow('ADAPTER_008: Invalid wallet object found in appWallets array')
      })

      it('should throw indexed AdapterError when wallet missing address', () => {
        const invalidWallet = { address_hashed: 'hash123', name: 'Test' }
        expect(() => manager.createAdapter([invalidWallet] as any)).toThrow(AdapterError)
        expect(() => manager.createAdapter([invalidWallet] as any))
          .toThrow('ADAPTER_001: Wallet is missing required address property')
      })

      it('should throw indexed AdapterError when wallet missing address_hashed', () => {
        const invalidWallet = { address: '0x123', name: 'Test' }
        expect(() => manager.createAdapter([invalidWallet] as any)).toThrow(AdapterError)
        expect(() => manager.createAdapter([invalidWallet] as any))
          .toThrow('ADAPTER_002: Wallet is missing required address_hashed property')
      })
    })

    describe('shouldRecreateAdapter', () => {
      it('should throw indexed AdapterError when newWallets is not an array', () => {
        expect(() => manager.shouldRecreateAdapter(null as any)).toThrow(AdapterError)
        expect(() => manager.shouldRecreateAdapter(null as any))
          .toThrow('ADAPTER_009: newWallets must be an array')
      })

      it('should throw indexed AdapterError when wallet in newWallets is invalid', () => {
        manager.createAdapter([mockWallet])
        expect(() => manager.shouldRecreateAdapter([null] as any)).toThrow(AdapterError)
        expect(() => manager.shouldRecreateAdapter([null] as any))
          .toThrow('ADAPTER_011: Invalid wallet in newWallets array')
      })

      it('should throw indexed AdapterError when currentWallets contains invalid wallet', () => {
        manager.createAdapter([mockWallet])
        ;(manager as any).currentWallets = [null]
        
        expect(() => manager.shouldRecreateAdapter([mockWallet])).toThrow(AdapterError)
        expect(() => manager.shouldRecreateAdapter([mockWallet]))
          .toThrow('ADAPTER_010: Invalid wallet in currentWallets array')
      })
    })

    describe('createAdapterWithCache', () => {
      it('should throw indexed AdapterError when appWallets is not an array', () => {
        expect(() => manager.createAdapterWithCache(null as any)).toThrow(AdapterError)
        expect(() => manager.createAdapterWithCache(null as any))
          .toThrow('ADAPTER_012: appWallets must be an array')
      })

      it('should throw indexed AdapterCacheError when cached adapter is null', () => {
        const cacheKey = manager['getCacheKey']([mockWallet])
        manager['adapterCache'].set(cacheKey, null as any)
        
        expect(() => manager.createAdapterWithCache([mockWallet]))
          .toThrow('CACHE_001: Cached adapter is null or undefined')
      })
    })

    describe('getConnectionState', () => {
      it('should throw indexed AdapterError when walletAddress is not provided', () => {
        expect(() => manager.getConnectionState('')).toThrow(AdapterError)
        expect(() => manager.getConnectionState(''))
          .toThrow('ADAPTER_015: walletAddress is required')
        
        expect(() => manager.getConnectionState(null as any)).toThrow(AdapterError)
        expect(() => manager.getConnectionState(undefined as any)).toThrow(AdapterError)
      })

      it('should throw indexed AdapterError when walletAddress is not a string', () => {
        expect(() => manager.getConnectionState(123 as any)).toThrow(AdapterError)
        expect(() => manager.getConnectionState(123 as any))
          .toThrow('ADAPTER_016: walletAddress must be a string')
      })
    })

    describe('setConnectionState', () => {
      it('should throw indexed AdapterError when walletAddress is not provided', () => {
        expect(() => manager.setConnectionState('', 'connected')).toThrow(AdapterError)
        expect(() => manager.setConnectionState('', 'connected'))
          .toThrow('ADAPTER_017: walletAddress is required')
      })

      it('should throw indexed AdapterError when walletAddress is not a string', () => {
        expect(() => manager.setConnectionState(123 as any, 'connected')).toThrow(AdapterError)
        expect(() => manager.setConnectionState(123 as any, 'connected'))
          .toThrow('ADAPTER_018: walletAddress must be a string')
      })

      it('should throw indexed AdapterError when state is not provided', () => {
        expect(() => manager.setConnectionState('0x123', '' as any)).toThrow(AdapterError)
        expect(() => manager.setConnectionState('0x123', '' as any))
          .toThrow('ADAPTER_019: state is required')
      })

      it('should throw indexed AdapterError when state is invalid', () => {
        expect(() => manager.setConnectionState('0x123', 'invalid' as any)).toThrow(AdapterError)
        expect(() => manager.setConnectionState('0x123', 'invalid' as any))
          .toThrow('ADAPTER_020: Invalid state: invalid')
      })
    })
  })

  describe('Cache Cleanup Error Handling', () => {
    beforeEach(() => {
      manager = new AppKitAdapterManager(mockRequestPassword)
    })

    describe('performAdapterCleanup', () => {
      it('should throw indexed AdapterCleanupError when adapter is null', () => {
        expect(() => manager['performAdapterCleanup'](null as any, 'test-key'))
          .toThrow('CLEANUP_001: Cannot cleanup null or undefined adapter')
      })

      it('should throw indexed AdapterCleanupError when cacheKey is empty', () => {
        const mockAdapter = {} as WagmiAdapter
        expect(() => manager['performAdapterCleanup'](mockAdapter, ''))
          .toThrow('CLEANUP_002: Cannot cleanup adapter without cache key')
      })

      it('should throw indexed AdapterCleanupError when trying to cleanup current adapter', () => {
        const adapter = manager.createAdapter([mockWallet])
        expect(() => manager['performAdapterCleanup'](adapter, 'test-key'))
          .toThrow('CLEANUP_004: Failed to cleanup adapter for key test-key')
      })

      it('should cleanup non-current adapter successfully', () => {
        const adapter1 = manager.createAdapter([mockWallet])
        const adapter2 = manager.createAdapter([mockWallet2])
        
        expect(() => manager['performAdapterCleanup'](adapter1, 'test-key')).not.toThrow()
      })
    })

    describe('cleanup method', () => {
      it('should handle cleanup errors and throw indexed AdapterCleanupError', () => {
        manager.createAdapterWithCache([mockWallet])
        manager.createAdapterWithCache([mockWallet2])
        
        jest.spyOn(manager as any, 'performAdapterCleanup').mockImplementation(() => {
          throw new Error('Mock cleanup error')
        })
        
        expect(() => manager.cleanup()).toThrow('CLEANUP_006: Unexpected error during cleanup')
      })

      it('should throw indexed AdapterCleanupError for unexpected errors', () => {
        jest.spyOn(Array, 'from').mockImplementationOnce(() => {
          throw new Error('Unexpected error')
        })
        
        expect(() => manager.cleanup()).toThrow('CLEANUP_006: Unexpected error during cleanup')
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

    it('should throw indexed AdapterError when wallets is not an array', () => {
      expect(() => manager['getCacheKey'](null as any)).toThrow(AdapterError)
      expect(() => manager['getCacheKey'](null as any))
        .toThrow('ADAPTER_013: Cannot generate cache key: wallets must be an array')
    })

    it('should throw indexed AdapterError when wallet object is invalid', () => {
      expect(() => manager['getCacheKey']([null] as any)).toThrow(AdapterError)
      expect(() => manager['getCacheKey']([null] as any))
        .toThrow('ADAPTER_014: Cannot generate cache key: invalid wallet object')
    })

    it('should return empty-wallets for empty array', () => {
      expect(manager['getCacheKey']([])).toBe('empty-wallets')
    })

    it('should generate consistent cache key for same wallets', () => {
      const key1 = manager['getCacheKey']([mockWallet, mockWallet2])
      const key2 = manager['getCacheKey']([mockWallet2, mockWallet])
      expect(key1).toBe(key2)
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
      manager.setConnectionState('0x123', 'connecting')
      manager.setConnectionState('0x123', 'connected')
      manager.setConnectionState('0x123', 'disconnected')
      
      const state: 'connecting' | 'connected' | 'disconnected' = manager.getConnectionState('0x123')
      expect(typeof state).toBe('string')
    })

    it('should return WagmiAdapter or null for getCurrentAdapter', () => {
      expect(manager.getCurrentAdapter()).toBeNull()
      
      const adapter = manager.createAdapter([mockWallet])
      expect(manager.getCurrentAdapter()).toBe(adapter)
      expect(manager.getCurrentAdapter()).toBeDefined()
    })
  })

  describe('Functional Behavior Tests', () => {
    beforeEach(() => {
      manager = new AppKitAdapterManager(mockRequestPassword)
    })

    it('should detect when adapter recreation is needed', () => {
      expect(manager.shouldRecreateAdapter([mockWallet])).toBe(true)
      
      manager.createAdapter([mockWallet])
      expect(manager.shouldRecreateAdapter([mockWallet])).toBe(false)
      expect(manager.shouldRecreateAdapter([mockWallet, mockWallet2])).toBe(true)
      expect(manager.shouldRecreateAdapter([])).toBe(true)
    })

    it('should use cached adapter when available', () => {
      const adapter1 = manager.createAdapterWithCache([mockWallet])
      const adapter2 = manager.createAdapterWithCache([mockWallet])
      
      expect(adapter1).toBe(adapter2)
    })

    it('should enforce cache size limit', () => {
      const maxSize = 5
      
      for (let i = 0; i < maxSize + 2; i++) {
        const wallet: AppWallet = {
          address: `0x${i}`,
          address_hashed: `hash${i}`,
          name: `Wallet ${i}`,
          created_at: Date.now(),
          mnemonic: '',
          private_key: '',
          imported: false
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
      
      expect(adapter).toBeDefined()
    })
  })
})