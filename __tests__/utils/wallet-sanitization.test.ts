/**
 * Tests for wallet sanitization utilities
 * These tests ensure fail-fast behavior and prevent sensitive data exposure
 */

import { WalletValidationError } from '../../src/errors/wallet-validation'
import { AppWallet } from '../../components/app-wallets/AppWalletsContext'
import { 
  sanitizeWalletForLogging, 
  validateAppWallet, 
  validateAppWallets 
} from '../../src/utils/wallet-sanitization'

describe('Wallet Sanitization Utilities', () => {
  describe('sanitizeWalletForLogging - Secure Data Redaction', () => {
    it('returns safe object when wallet is null', () => {
      const result = sanitizeWalletForLogging(null)
      expect(result).toEqual({ status: 'null_or_undefined' })
    })

    it('returns safe object when wallet is undefined', () => {
      const result = sanitizeWalletForLogging(undefined)
      expect(result).toEqual({ status: 'null_or_undefined' })
    })

    it('CRITICAL: redacts private_key field', () => {
      const wallet = {
        address: '0x1234567890123456789012345678901234567890',
        name: 'Test Wallet',
        private_key: 'ULTRA_SECRET_PRIVATE_KEY_MUST_NOT_LEAK'
      }
      
      const result = sanitizeWalletForLogging(wallet)
      const resultStr = JSON.stringify(result)
      
      expect(resultStr).not.toContain('ULTRA_SECRET_PRIVATE_KEY_MUST_NOT_LEAK')
      expect(result).toHaveProperty('private_key', '[REDACTED]')
      expect(result).toHaveProperty('__sanitized', true)
      expect(result).toHaveProperty('__sanitizedAt')
    })

    it('CRITICAL: redacts mnemonic field', () => {
      const wallet = {
        address: '0x1234567890123456789012345678901234567890',
        name: 'Test Wallet',
        mnemonic: 'ULTRA_SECRET_MNEMONIC abandon abandon abandon'
      }
      
      const result = sanitizeWalletForLogging(wallet)
      const resultStr = JSON.stringify(result)
      
      expect(resultStr).not.toContain('ULTRA_SECRET_MNEMONIC')
      expect(result).toHaveProperty('mnemonic', '[REDACTED]')
      expect(result).toHaveProperty('__sanitized', true)
    })

    it('preserves safe fields like address and name', () => {
      const wallet = {
        address: '0x1234567890123456789012345678901234567890',
        name: 'My Test Wallet',
        created_at: 1234567890
      }
      
      const result = sanitizeWalletForLogging(wallet)
      
      expect(result).toHaveProperty('address', wallet.address)
      expect(result).toHaveProperty('name', wallet.name)
      expect(result).toHaveProperty('created_at', wallet.created_at)
      expect(result).toHaveProperty('__sanitized', true)
    })

    it('handles nested objects with sensitive data', () => {
      const walletWithNested = {
        address: '0x1234567890123456789012345678901234567890',
        config: {
          private_key: 'SECRET_NESTED_KEY',
          name: 'Safe Config Name'
        }
      }
      
      const result = sanitizeWalletForLogging(walletWithNested)
      const resultStr = JSON.stringify(result)
      
      expect(resultStr).not.toContain('SECRET_NESTED_KEY')
      expect((result as any).config).toHaveProperty('private_key', '[REDACTED]')
      expect((result as any).config).toHaveProperty('name', 'Safe Config Name')
    })

    it('prevents infinite recursion with max depth limit', () => {
      const circular: any = { address: '0x123' }
      circular.self = circular
      
      const result = sanitizeWalletForLogging(circular)
      expect(result).toHaveProperty('__sanitized', true)
      // Should not throw or hang due to circular reference
    })
  })

  describe('validateAppWallet - FAIL FAST Validation', () => {
    it('throws WalletValidationError when wallet is null', () => {
      expect(() => validateAppWallet(null as any)).toThrow(WalletValidationError)
      expect(() => validateAppWallet(null as any)).toThrow('Wallet is null or undefined during validation')
    })

    it('throws WalletValidationError when wallet is undefined', () => {
      expect(() => validateAppWallet(undefined as any)).toThrow(WalletValidationError)
      expect(() => validateAppWallet(undefined as any)).toThrow('Wallet is null or undefined during validation')
    })

    it('throws WalletValidationError when address is missing', () => {
      const wallet = {} as AppWallet
      expect(() => validateAppWallet(wallet)).toThrow(WalletValidationError)
      expect(() => validateAppWallet(wallet)).toThrow('Wallet missing required \'address\' field during validation')
    })

    it('throws WalletValidationError when address is not a string', () => {
      const wallet = { address: 123 } as any
      expect(() => validateAppWallet(wallet)).toThrow(WalletValidationError)
      expect(() => validateAppWallet(wallet)).toThrow('Wallet address must be a string during validation')
    })

    it('throws WalletValidationError for empty address string', () => {
      const wallet = { address: '' } as any
      expect(() => validateAppWallet(wallet)).toThrow(WalletValidationError)
      expect(() => validateAppWallet(wallet)).toThrow('Wallet missing required \'address\' field during validation')
    })

    it('throws WalletValidationError for whitespace-only address', () => {
      const wallet = { address: '   ' } as any
      expect(() => validateAppWallet(wallet)).toThrow(WalletValidationError)
      expect(() => validateAppWallet(wallet)).toThrow('Wallet address cannot be empty during validation')
    })

    it('throws WalletValidationError for invalid Ethereum address format', () => {
      const invalidAddresses = [
        '0x123', // too short
        '0x12345678901234567890123456789012345678901', // too long
        '1234567890123456789012345678901234567890', // missing 0x prefix
        '0xGGGG567890123456789012345678901234567890', // invalid hex characters
        '0x123456789012345678901234567890123456789G', // invalid hex at end
      ]

      for (const address of invalidAddresses) {
        const wallet = { address } as AppWallet
        expect(() => validateAppWallet(wallet)).toThrow(WalletValidationError)
        expect(() => validateAppWallet(wallet)).toThrow('Invalid Ethereum address format during validation')
      }
    })

    it('accepts valid Ethereum addresses', () => {
      const validAddresses = [
        '0x1234567890123456789012345678901234567890',
        '0xabcdefABCDEF1234567890123456789012345678',
        '0x0000000000000000000000000000000000000000',
        '0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF'
      ]

      for (const address of validAddresses) {
        const wallet = { address } as AppWallet
        expect(() => validateAppWallet(wallet)).not.toThrow()
      }
    })

    it('includes context in error messages', () => {
      expect(() => validateAppWallet(null as any, 'during adapter creation')).toThrow(
        'Wallet is null or undefined during during adapter creation'
      )
    })

    it('validates address_hashed when provided', () => {
      const wallet = {
        address: '0x1234567890123456789012345678901234567890',
        address_hashed: 123
      } as any
      
      expect(() => validateAppWallet(wallet)).toThrow(WalletValidationError)
      expect(() => validateAppWallet(wallet)).toThrow('Wallet address_hashed must be a string when provided')
    })

    it('throws for empty address_hashed when provided', () => {
      const wallet = {
        address: '0x1234567890123456789012345678901234567890',
        address_hashed: '   '
      } as any
      
      expect(() => validateAppWallet(wallet)).toThrow(WalletValidationError)
      expect(() => validateAppWallet(wallet)).toThrow('Wallet address_hashed cannot be empty when provided')
    })

    it('accepts valid address_hashed when provided', () => {
      const wallet = {
        address: '0x1234567890123456789012345678901234567890',
        address_hashed: 'valid_hash_string'
      } as any
      
      expect(() => validateAppWallet(wallet)).not.toThrow()
    })
  })

  describe('validateAppWallets - Array Validation', () => {
    const validWallet: AppWallet = {
      address: '0x1234567890123456789012345678901234567890',
      name: 'Test Wallet',
      created_at: 1234567890,
      address_hashed: 'hash123',
      mnemonic: 'test mnemonic',
      private_key: 'test_key',
      imported: false
    }

    it('throws WalletValidationError when wallets is not an array', () => {
      expect(() => validateAppWallets('not an array' as any)).toThrow(WalletValidationError)
      expect(() => validateAppWallets('not an array' as any)).toThrow('Expected array of wallets during validation')
    })

    it('throws WalletValidationError when array is empty', () => {
      expect(() => validateAppWallets([])).toThrow(WalletValidationError)
      expect(() => validateAppWallets([])).toThrow('No wallets provided during validation')
    })

    it('validates each wallet in the array', () => {
      const invalidWallet = { address: 'invalid' } as AppWallet
      const wallets = [validWallet, invalidWallet]
      
      expect(() => validateAppWallets(wallets)).toThrow(WalletValidationError)
      expect(() => validateAppWallets(wallets)).toThrow('Invalid Ethereum address format during validation at index 1')
    })

    it('detects duplicate addresses', () => {
      const wallet2 = { ...validWallet }
      const wallets = [validWallet, wallet2]
      
      expect(() => validateAppWallets(wallets)).toThrow(WalletValidationError)
      expect(() => validateAppWallets(wallets)).toThrow('Duplicate wallet address found during validation at index 1')
    })

    it('passes validation with array of unique valid wallets', () => {
      const wallet2: AppWallet = {
        ...validWallet,
        address: '0x9876543210987654321098765432109876543210'
      }
      const wallets = [validWallet, wallet2]
      
      expect(() => validateAppWallets(wallets)).not.toThrow()
    })

    it('includes context in error messages', () => {
      expect(() => validateAppWallets([], 'during bulk import')).toThrow(
        'No wallets provided during during bulk import'
      )
    })

    it('handles errors gracefully during individual wallet validation', () => {
      const invalidWallet = {
        address: null // This will cause validation to fail with missing address error
      } as any
      
      expect(() => validateAppWallets([invalidWallet])).toThrow(WalletValidationError)
      expect(() => validateAppWallets([invalidWallet])).toThrow('Wallet missing required \'address\' field during validation at index 0')
    })
  })

  describe('Integration Tests - Security Focused', () => {
    it('sanitizeWalletForLogging never exposes data that validateAppWallet handles', () => {
      const walletWithSensitiveData = {
        address: '0x1234567890123456789012345678901234567890',
        name: 'Test Wallet',
        private_key: 'CRITICAL_SECRET_KEY_MUST_NOT_LEAK',
        mnemonic: 'CRITICAL_SECRET_PHRASE abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon',
        keystore: 'ENCRYPTED_KEYSTORE_DATA',
        password: 'USER_PASSWORD'
      }
      
      const sanitized = sanitizeWalletForLogging(walletWithSensitiveData)
      const sanitizedStr = JSON.stringify(sanitized)
      
      // Verify no sensitive data leaks
      expect(sanitizedStr).not.toContain('CRITICAL_SECRET_KEY_MUST_NOT_LEAK')
      expect(sanitizedStr).not.toContain('CRITICAL_SECRET_PHRASE')
      expect(sanitizedStr).not.toContain('ENCRYPTED_KEYSTORE_DATA')
      expect(sanitizedStr).not.toContain('USER_PASSWORD')
      
      // But safe data should be preserved
      expect(sanitized).toHaveProperty('address', walletWithSensitiveData.address)
      expect(sanitized).toHaveProperty('name', walletWithSensitiveData.name)
      expect(sanitized).toHaveProperty('__sanitized', true)
    })

    it('validateAppWallet works with minimal valid wallet structure', () => {
      const minimalWallet: AppWallet = {
        address: '0x1234567890123456789012345678901234567890',
        name: 'Minimal',
        created_at: 123,
        address_hashed: 'hash',
        mnemonic: 'mnemonic',
        private_key: 'key',
        imported: false
      }
      
      expect(() => validateAppWallet(minimalWallet)).not.toThrow()
      
      // And it can be safely logged
      const sanitized = sanitizeWalletForLogging(minimalWallet)
      expect(sanitized).toHaveProperty('address', minimalWallet.address)
      expect(sanitized).toHaveProperty('mnemonic', '[REDACTED]')
      expect(sanitized).toHaveProperty('private_key', '[REDACTED]')
    })

    it('error messages never expose wallet contents when validation fails', () => {
      const walletWithSecrets = {
        address: 'invalid_format',
        name: 'Test',
        private_key: 'SECRET_THAT_SHOULD_NOT_APPEAR_IN_ERROR'
      } as any
      
      try {
        validateAppWallet(walletWithSecrets)
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error)
        expect(errorMessage).not.toContain('SECRET_THAT_SHOULD_NOT_APPEAR_IN_ERROR')
        expect(errorMessage).toContain('Invalid Ethereum address format')
      }
    })
  })
})