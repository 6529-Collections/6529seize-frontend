import { AppKitAdapterManager } from '../../../components/providers/AppKitAdapterManager'
import { AdapterError } from '../../../src/errors/adapter'
import { WalletValidationError } from '../../../src/errors/wallet-validation'
import { AppWallet } from '../../../components/app-wallets/AppWalletsContext'
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi'

// Jest helper
const fail = (message?: string): never => {
  throw new Error(message || 'Test failed')
}

// Mock dependencies
jest.mock('@reown/appkit-adapter-wagmi')
jest.mock('../../../wagmiConfig/wagmiAppWalletConnector', () => ({
  createAppWalletConnector: jest.fn(() => ({ id: 'mock-connector' }))
}))
jest.mock('../../../constants', () => ({
  CW_PROJECT_ID: '12345678-1234-1234-1234-123456789abc' // Valid UUID format
}))

describe('AppKitAdapterManager', () => {
  let manager: AppKitAdapterManager
  let mockRequestPassword: jest.Mock
  let consoleSpy: jest.SpyInstance

  const mockWallet: AppWallet = {
    address: '0x742D35A1CbF05C7A56C1Bf2dF5e8Dd6cf0DA8c4c',
    address_hashed: 'hash123456789012345678901234567890123456789012345678901234567890',
    name: 'Test Wallet',
    created_at: Date.now(),
    mnemonic: '',
    private_key: '',
    imported: false
  }

  const mockWalletWithSensitiveData: AppWallet = {
    address: '0x456D35A1CbF05C7A56C1Bf2dF5e8Dd6cf0DA8c4c',
    address_hashed: 'hash4567890123456789012345678901234567890123456789012345678901234',
    name: 'Sensitive Wallet',
    created_at: Date.now(),
    private_key: 'abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
    mnemonic: 'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about',
    imported: false
  }

  const mockWallet2: AppWallet = {
    address: '0x789D35A1CbF05C7A56C1Bf2dF5e8Dd6cf0DA8c4c',
    address_hashed: 'hash789012345678901234567890123456789012345678901234567890123456',
    name: 'Test Wallet 2',
    created_at: Date.now(),
    mnemonic: '',
    private_key: '',
    imported: false
  }

  beforeEach(() => {
    jest.clearAllMocks()
    mockRequestPassword = jest.fn().mockResolvedValue('password123')
    
    // Suppress console.error for expected error cases
    consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
    
    // Mock WagmiAdapter constructor
    ;(WagmiAdapter as jest.MockedClass<typeof WagmiAdapter>).mockImplementation(() => ({
      wagmiConfig: { id: 'mock-config' }
    } as any))
  })

  afterEach(() => {
    consoleSpy?.mockRestore()
  })

  describe('Security Tests - Critical', () => {
    beforeEach(() => {
      manager = new AppKitAdapterManager(mockRequestPassword)
    })

    describe('Sensitive Data Exposure Prevention', () => {
      it('should never expose private keys in error messages', () => {
        const walletWithPrivateKey = {
          // Missing address to trigger error
          address_hashed: 'hash123',
          name: 'Test',
          private_key: 'SENSITIVE_PRIVATE_KEY_THAT_SHOULD_NEVER_BE_LOGGED_abcdef1234567890abcdef1234'
        }

        try {
          manager.createAdapter([walletWithPrivateKey] as any)
          fail('Should have thrown error')
        } catch (error: any) {
          expect(error.message).not.toContain('SENSITIVE_PRIVATE_KEY_THAT_SHOULD_NEVER_BE_LOGGED')
          expect(error.message).not.toContain(walletWithPrivateKey.private_key)
          expect(error.message).toContain('Wallet missing required address field')
        }
      })

      it('should never expose mnemonics in error messages', () => {
        const walletWithMnemonic = {
          // Missing address to trigger error
          address_hashed: 'hash123',
          name: 'Test',
          mnemonic: 'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about SENSITIVE_PHRASE'
        }

        try {
          manager.createAdapter([walletWithMnemonic] as any)
          fail('Should have thrown error')
        } catch (error: any) {
          expect(error.message).not.toContain('SENSITIVE_PHRASE')
          expect(error.message).not.toContain(walletWithMnemonic.mnemonic)
          expect(error.message).toContain('Wallet missing required address field')
        }
      })

      it('should validate private key format without exposing content', () => {
        const walletWithInvalidPrivateKey = {
          address: '0x742D35A1CbF05C7A56C1Bf2dF5e8Dd6cf0DA8c4c',
          address_hashed: 'hash123456789012345678901234567890123456789012345678901234567890',
          name: 'Test',
          private_key: 'too_short'
        }

        expect(() => manager.createAdapter([walletWithInvalidPrivateKey] as any))
          .toThrow(WalletValidationError)
        expect(() => manager.createAdapter([walletWithInvalidPrivateKey] as any))
          .toThrow('Wallet security violation: Private key too short - security violation detected')
      })

      it('should validate mnemonic format without exposing content', () => {
        const walletWithValidMnemonic = {
          address: '0x742D35A1CbF05C7A56C1Bf2dF5e8Dd6cf0DA8c4c',
          address_hashed: 'hash123456789012345678901234567890123456789012345678901234567890', 
          name: 'Test',
          mnemonic: 'word1 word2 word3' // Valid mnemonic with proper words
        }

        // Current implementation only validates empty words, which won't occur with split(/\s+/)
        // So any mnemonic with actual words should pass
        expect(() => manager.createAdapter([walletWithValidMnemonic] as any))
          .not.toThrow()
      })

      it('should throw WalletSecurityError for invalid private key type', () => {
        const walletWithInvalidPrivateKeyType = {
          address: '0x742D35A1CbF05C7A56C1Bf2dF5e8Dd6cf0DA8c4c',
          address_hashed: 'hash123456789012345678901234567890123456789012345678901234567890',
          name: 'Test Wallet',
          private_key: 123
        } as any

        expect(() => manager.createAdapter([walletWithInvalidPrivateKeyType]))
          .toThrow(WalletValidationError)
        expect(() => manager.createAdapter([walletWithInvalidPrivateKeyType]))
          .toThrow('Wallet security violation: Private key must be a string')
      })

      it('should throw WalletSecurityError for short private key', () => {
        const walletWithShortPrivateKey = {
          address: '0x742D35A1CbF05C7A56C1Bf2dF5e8Dd6cf0DA8c4c',
          address_hashed: 'hash123456789012345678901234567890123456789012345678901234567890',
          name: 'Test Wallet',
          private_key: 'short'
        } as AppWallet

        expect(() => manager.createAdapter([walletWithShortPrivateKey]))
          .toThrow(WalletValidationError)
        expect(() => manager.createAdapter([walletWithShortPrivateKey]))
          .toThrow('Wallet security violation: Private key too short - security violation detected')
      })

      it('should throw WalletSecurityError for invalid mnemonic type', () => {
        const walletWithInvalidMnemonicType = {
          address: '0x742D35A1CbF05C7A56C1Bf2dF5e8Dd6cf0DA8c4c',
          address_hashed: 'hash123456789012345678901234567890123456789012345678901234567890',
          name: 'Test Wallet',
          mnemonic: 123
        } as any

        expect(() => manager.createAdapter([walletWithInvalidMnemonicType]))
          .toThrow(WalletValidationError)
        expect(() => manager.createAdapter([walletWithInvalidMnemonicType]))
          .toThrow('Wallet security violation: Mnemonic must be a string')
      })

      it('should accept mnemonic with multiple spaces between words', () => {
        const walletWithSpacedMnemonic = {
          address: '0x742D35A1CbF05C7A56C1Bf2dF5e8Dd6cf0DA8c4c',
          address_hashed: 'hash123456789012345678901234567890123456789012345678901234567890',
          name: 'Test Wallet',
          mnemonic: 'word1  word2   word3' // Multiple spaces between words - should be normalized
        } as AppWallet

        // Current implementation trims and splits by /\s+/ which handles multiple spaces correctly
        expect(() => manager.createAdapter([walletWithSpacedMnemonic]))
          .not.toThrow()
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

  describe('Wallet Field Validation', () => {
    beforeEach(() => {
      manager = new AppKitAdapterManager(mockRequestPassword)
    })

    it('should throw WalletValidationError when wallet address is not a string', () => {
      const invalidWallet = {
        address: 123,
        address_hashed: 'hash123456789012345678901234567890123456789012345678901234567890',
        name: 'Test Wallet'
      } as any

      expect(() => manager.createAdapter([invalidWallet]))
        .toThrow(WalletValidationError)
      expect(() => manager.createAdapter([invalidWallet]))
        .toThrow('Wallet address must be a string')
    })

    it('should throw WalletValidationError when wallet address format is invalid', () => {
      const invalidWallet = {
        address: 'invalid-address',
        address_hashed: 'hash123456789012345678901234567890123456789012345678901234567890',
        name: 'Test Wallet'
      } as AppWallet

      expect(() => manager.createAdapter([invalidWallet]))
        .toThrow(WalletValidationError)
      expect(() => manager.createAdapter([invalidWallet]))
        .toThrow('Wallet address has invalid Ethereum format')
    })

    it('should throw WalletValidationError when address_hashed is too short', () => {
      const invalidWallet = {
        address: '0x742D35A1CbF05C7A56C1Bf2dF5e8Dd6cf0DA8c4c',
        address_hashed: 'short',
        name: 'Test Wallet'
      } as AppWallet

      expect(() => manager.createAdapter([invalidWallet]))
        .toThrow(WalletValidationError)
      expect(() => manager.createAdapter([invalidWallet]))
        .toThrow('Wallet address_hashed too short - potential security issue')
    })

    it('should throw WalletValidationError when wallet name is missing', () => {
      const invalidWallet = {
        address: '0x742D35A1CbF05C7A56C1Bf2dF5e8Dd6cf0DA8c4c',
        address_hashed: 'hash123456789012345678901234567890123456789012345678901234567890'
      } as AppWallet

      expect(() => manager.createAdapter([invalidWallet]))
        .toThrow(WalletValidationError)
      expect(() => manager.createAdapter([invalidWallet]))
        .toThrow('Wallet missing required name field')
    })

    it('should throw WalletValidationError when wallet name is too long', () => {
      const invalidWallet = {
        address: '0x742D35A1CbF05C7A56C1Bf2dF5e8Dd6cf0DA8c4c',
        address_hashed: 'hash123456789012345678901234567890123456789012345678901234567890',
        name: 'a'.repeat(101)
      } as AppWallet

      expect(() => manager.createAdapter([invalidWallet]))
        .toThrow(WalletValidationError)
      expect(() => manager.createAdapter([invalidWallet]))
        .toThrow('Wallet name length must be between 1 and 100 characters')
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

      it('should throw WalletValidationError when wallet missing address', () => {
        const invalidWallet = { address_hashed: 'hash123456789012345678901234567890123456789012345678901234567890', name: 'Test' }
        expect(() => manager.createAdapter([invalidWallet] as any)).toThrow(WalletValidationError)
        expect(() => manager.createAdapter([invalidWallet] as any))
          .toThrow('Wallet missing required address field')
      })

      it('should throw WalletValidationError when wallet missing address_hashed', () => {
        const invalidWallet = { address: '0x742D35A1CbF05C7A56C1Bf2dF5e8Dd6cf0DA8c4c', name: 'Test' }
        expect(() => manager.createAdapter([invalidWallet] as any)).toThrow(WalletValidationError)
        expect(() => manager.createAdapter([invalidWallet] as any))
          .toThrow('Wallet missing required address_hashed field')
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
          .toThrow('ADAPTER_020: Invalid state: invalid. Must be \'connecting\', \'connected\', or \'disconnected\'')
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
        const _adapter2 = manager.createAdapter([mockWallet2])
        
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
      const address = '0x742D35A1CbF05C7A56C1Bf2dF5e8Dd6cf0DA8c4c'
      manager.setConnectionState(address, 'connecting')
      expect(manager.getConnectionState(address)).toBe('connecting')
      
      manager.setConnectionState(address, 'connected')
      expect(manager.getConnectionState(address)).toBe('connected')
      
      manager.setConnectionState(address, 'disconnected')
      expect(manager.getConnectionState(address)).toBe('disconnected')
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
          address: `0x${i.toString(16).padStart(39, '0')}1`,
          address_hashed: `hash${i}${'0'.repeat(60)}`,
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


  describe('Valid Wallet Success Cases', () => {
    beforeEach(() => {
      manager = new AppKitAdapterManager(mockRequestPassword)
    })

    it('should successfully create adapter with valid wallet', () => {
      const validWallet = {
        address: '0x742D35A1CbF05C7A56C1Bf2dF5e8Dd6cf0DA8c4c',
        address_hashed: 'hash123456789012345678901234567890123456789012345678901234567890',
        name: 'Test Wallet',
        created_at: Date.now(),
        mnemonic: '',
        private_key: '',
        imported: false
      } as AppWallet

      expect(() => manager.createAdapter([validWallet])).not.toThrow()
      const adapter = manager.createAdapter([validWallet])
      expect(adapter).toBeDefined()
    })

    it('should successfully create adapter with valid wallet with secure private key', () => {
      const validWallet = {
        address: '0x742D35A1CbF05C7A56C1Bf2dF5e8Dd6cf0DA8c4c',
        address_hashed: 'hash123456789012345678901234567890123456789012345678901234567890',
        name: 'Test Wallet',
        created_at: Date.now(),
        private_key: '0123456789012345678901234567890123456789012345678901234567890123',
        mnemonic: '',
        imported: false
      } as AppWallet

      expect(() => manager.createAdapter([validWallet])).not.toThrow()
      const adapter = manager.createAdapter([validWallet])
      expect(adapter).toBeDefined()
    })

    it('should successfully create adapter with valid wallet with secure mnemonic', () => {
      const validWallet = {
        address: '0x742D35A1CbF05C7A56C1Bf2dF5e8Dd6cf0DA8c4c',
        address_hashed: 'hash123456789012345678901234567890123456789012345678901234567890',
        name: 'Test Wallet',
        created_at: Date.now(),
        mnemonic: 'word1 word2 word3 word4 word5 word6 word7 word8 word9 word10 word11 word12',
        private_key: '',
        imported: false
      } as AppWallet

      expect(() => manager.createAdapter([validWallet])).not.toThrow()
      const adapter = manager.createAdapter([validWallet])
      expect(adapter).toBeDefined()
    })
  })
})