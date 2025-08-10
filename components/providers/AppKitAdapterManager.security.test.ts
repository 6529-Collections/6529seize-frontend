/**
 * Security-focused tests for AppKitAdapterManager
 * Tests fail-fast behavior and validates that security violations are caught immediately
 */

import { AppKitAdapterManager } from './AppKitAdapterManager';
import { WalletValidationError, WalletSecurityError } from '@/src/errors/wallet-validation';
import { AdapterError } from '@/src/errors/adapter';
import { AppWallet } from '../app-wallets/AppWalletsContext';

// Mock the CW_PROJECT_ID constant
jest.mock('@/constants', () => ({
  CW_PROJECT_ID: 'test-project-id'
}));

// Mock the wagmi config creator
jest.mock('@/wagmiConfig/wagmiAppWalletConnector', () => ({
  createAppWalletConnector: jest.fn(() => ({}))
}));

describe('AppKitAdapterManager Security Tests', () => {
  let adapterManager: AppKitAdapterManager;
  const mockRequestPassword = jest.fn();

  beforeEach(() => {
    mockRequestPassword.mockClear();
    adapterManager = new AppKitAdapterManager(mockRequestPassword);
  });

  describe('Constructor Security', () => {
    it('throws immediately when requestPassword is null', () => {
      expect(() => new AppKitAdapterManager(null as any)).toThrow(AdapterError);
    });

    it('throws immediately when requestPassword is undefined', () => {
      expect(() => new AppKitAdapterManager(undefined as any)).toThrow(AdapterError);
    });

    it('throws immediately when requestPassword is not a function', () => {
      expect(() => new AppKitAdapterManager('not-a-function' as any)).toThrow(AdapterError);
    });
  });

  describe('Wallet Validation Security', () => {
    it('throws WalletValidationError when wallet is null', () => {
      expect(() => adapterManager.createAdapter([null as any])).toThrow(WalletValidationError);
      expect(() => adapterManager.createAdapter([null as any])).toThrow('Wallet object is null or undefined');
    });

    it('throws WalletValidationError when wallet is undefined', () => {
      expect(() => adapterManager.createAdapter([undefined as any])).toThrow(WalletValidationError);
    });

    it('throws WalletValidationError when wallet address is missing', () => {
      const invalidWallet = {
        address_hashed: 'hash123456789012345678901234567890123456789012345678901234567890',
        name: 'Test Wallet'
      } as AppWallet;

      expect(() => adapterManager.createAdapter([invalidWallet])).toThrow(WalletValidationError);
      expect(() => adapterManager.createAdapter([invalidWallet])).toThrow('missing required address field');
    });

    it('throws WalletValidationError when wallet address is not a string', () => {
      const invalidWallet = {
        address: 123,
        address_hashed: 'hash123456789012345678901234567890123456789012345678901234567890',
        name: 'Test Wallet'
      } as any;

      expect(() => adapterManager.createAdapter([invalidWallet])).toThrow(WalletValidationError);
      expect(() => adapterManager.createAdapter([invalidWallet])).toThrow('address must be a string');
    });

    it('throws WalletValidationError when wallet address format is invalid', () => {
      const invalidWallet = {
        address: 'invalid-address',
        address_hashed: 'hash123456789012345678901234567890123456789012345678901234567890',
        name: 'Test Wallet'
      } as AppWallet;

      expect(() => adapterManager.createAdapter([invalidWallet])).toThrow(WalletValidationError);
      expect(() => adapterManager.createAdapter([invalidWallet])).toThrow('invalid Ethereum format');
    });

    it('throws WalletValidationError when address_hashed is missing', () => {
      const invalidWallet = {
        address: '0x742D35A1CbF05C7A56C1Bf2dF5e8Dd6cf0DA8c4c',
        name: 'Test Wallet'
      } as AppWallet;

      expect(() => adapterManager.createAdapter([invalidWallet])).toThrow(WalletValidationError);
      expect(() => adapterManager.createAdapter([invalidWallet])).toThrow('missing required address_hashed field');
    });

    it('throws WalletValidationError when address_hashed is too short', () => {
      const invalidWallet = {
        address: '0x742D35A1CbF05C7A56C1Bf2dF5e8Dd6cf0DA8c4c',
        address_hashed: 'short',
        name: 'Test Wallet'
      } as AppWallet;

      expect(() => adapterManager.createAdapter([invalidWallet])).toThrow(WalletValidationError);
      expect(() => adapterManager.createAdapter([invalidWallet])).toThrow('too short - potential security issue');
    });

    it('throws WalletValidationError when wallet name is missing', () => {
      const invalidWallet = {
        address: '0x742D35A1CbF05C7A56C1Bf2dF5e8Dd6cf0DA8c4c',
        address_hashed: 'hash123456789012345678901234567890123456789012345678901234567890'
      } as AppWallet;

      expect(() => adapterManager.createAdapter([invalidWallet])).toThrow(WalletValidationError);
      expect(() => adapterManager.createAdapter([invalidWallet])).toThrow('missing required name field');
    });

    it('throws WalletValidationError when wallet name is empty', () => {
      const invalidWallet = {
        address: '0x742D35A1CbF05C7A56C1Bf2dF5e8Dd6cf0DA8c4c',
        address_hashed: 'hash123456789012345678901234567890123456789012345678901234567890',
        name: ''
      } as AppWallet;

      expect(() => adapterManager.createAdapter([invalidWallet])).toThrow(WalletValidationError);
      expect(() => adapterManager.createAdapter([invalidWallet])).toThrow('length must be between 1 and 100');
    });

    it('throws WalletValidationError when wallet name is too long', () => {
      const invalidWallet = {
        address: '0x742D35A1CbF05C7A56C1Bf2dF5e8Dd6cf0DA8c4c',
        address_hashed: 'hash123456789012345678901234567890123456789012345678901234567890',
        name: 'a'.repeat(101)
      } as AppWallet;

      expect(() => adapterManager.createAdapter([invalidWallet])).toThrow(WalletValidationError);
      expect(() => adapterManager.createAdapter([invalidWallet])).toThrow('length must be between 1 and 100');
    });
  });

  describe('Private Key Security', () => {
    it('throws WalletSecurityError when private key is not a string', () => {
      const invalidWallet = {
        address: '0x742D35A1CbF05C7A56C1Bf2dF5e8Dd6cf0DA8c4c',
        address_hashed: 'hash123456789012345678901234567890123456789012345678901234567890',
        name: 'Test Wallet',
        private_key: 123
      } as any;

      expect(() => adapterManager.createAdapter([invalidWallet])).toThrow(WalletSecurityError);
      expect(() => adapterManager.createAdapter([invalidWallet])).toThrow('Private key must be a string');
    });

    it('throws WalletSecurityError when private key is too short', () => {
      const invalidWallet = {
        address: '0x742D35A1CbF05C7A56C1Bf2dF5e8Dd6cf0DA8c4c',
        address_hashed: 'hash123456789012345678901234567890123456789012345678901234567890',
        name: 'Test Wallet',
        private_key: 'short'
      } as AppWallet;

      expect(() => adapterManager.createAdapter([invalidWallet])).toThrow(WalletSecurityError);
      expect(() => adapterManager.createAdapter([invalidWallet])).toThrow('too short - security violation detected');
    });
  });

  describe('Mnemonic Security', () => {
    it('throws WalletSecurityError when mnemonic is not a string', () => {
      const invalidWallet = {
        address: '0x742D35A1CbF05C7A56C1Bf2dF5e8Dd6cf0DA8c4c',
        address_hashed: 'hash123456789012345678901234567890123456789012345678901234567890',
        name: 'Test Wallet',
        mnemonic: 123
      } as any;

      expect(() => adapterManager.createAdapter([invalidWallet])).toThrow(WalletSecurityError);
      expect(() => adapterManager.createAdapter([invalidWallet])).toThrow('Mnemonic must be a string');
    });

    it('throws WalletSecurityError when mnemonic has too few words', () => {
      const invalidWallet = {
        address: '0x742D35A1CbF05C7A56C1Bf2dF5e8Dd6cf0DA8c4c',
        address_hashed: 'hash123456789012345678901234567890123456789012345678901234567890',
        name: 'Test Wallet',
        mnemonic: 'word1 word2 word3'
      } as AppWallet;

      expect(() => adapterManager.createAdapter([invalidWallet])).toThrow(WalletSecurityError);
      expect(() => adapterManager.createAdapter([invalidWallet])).toThrow('word count invalid - security violation detected');
    });

    it('throws WalletSecurityError when mnemonic has too many words', () => {
      const invalidWallet = {
        address: '0x742D35A1CbF05C7A56C1Bf2dF5e8Dd6cf0DA8c4c',
        address_hashed: 'hash123456789012345678901234567890123456789012345678901234567890',
        name: 'Test Wallet',
        mnemonic: Array(25).fill('word').join(' ')
      } as AppWallet;

      expect(() => adapterManager.createAdapter([invalidWallet])).toThrow(WalletSecurityError);
      expect(() => adapterManager.createAdapter([invalidWallet])).toThrow('word count invalid - security violation detected');
    });

    it('throws WalletSecurityError when mnemonic contains empty words', () => {
      const invalidWallet = {
        address: '0x742D35A1CbF05C7A56C1Bf2dF5e8Dd6cf0DA8c4c',
        address_hashed: 'hash123456789012345678901234567890123456789012345678901234567890',
        name: 'Test Wallet',
        mnemonic: 'word1 word2  word4 word5 word6 word7 word8 word9 word10 word11 word12'
      } as AppWallet;

      expect(() => adapterManager.createAdapter([invalidWallet])).toThrow(WalletSecurityError);
      expect(() => adapterManager.createAdapter([invalidWallet])).toThrow('empty words - security violation detected');
    });
  });

  describe('Array Validation Security', () => {
    it('throws AdapterError when appWallets is not an array', () => {
      expect(() => adapterManager.createAdapter('not-array' as any)).toThrow(AdapterError);
      expect(() => adapterManager.createAdapter('not-array' as any)).toThrow('appWallets must be an array');
    });

    it('throws AdapterError when appWallets contains null elements', () => {
      const wallets = [null as any];
      expect(() => adapterManager.createAdapter(wallets)).toThrow('null or undefined');
    });
  });

  describe('Valid Wallet Success Cases', () => {
    it('successfully creates adapter with valid wallet', () => {
      const validWallet = {
        address: '0x742D35A1CbF05C7A56C1Bf2dF5e8Dd6cf0DA8c4c',
        address_hashed: 'hash123456789012345678901234567890123456789012345678901234567890',
        name: 'Test Wallet'
      } as AppWallet;

      expect(() => adapterManager.createAdapter([validWallet])).not.toThrow();
    });

    it('successfully creates adapter with valid wallet with secure private key', () => {
      const validWallet = {
        address: '0x742D35A1CbF05C7A56C1Bf2dF5e8Dd6cf0DA8c4c',
        address_hashed: 'hash123456789012345678901234567890123456789012345678901234567890',
        name: 'Test Wallet',
        private_key: '0123456789012345678901234567890123456789012345678901234567890123'
      } as AppWallet;

      expect(() => adapterManager.createAdapter([validWallet])).not.toThrow();
    });

    it('successfully creates adapter with valid wallet with secure mnemonic', () => {
      const validWallet = {
        address: '0x742D35A1CbF05C7A56C1Bf2dF5e8Dd6cf0DA8c4c',
        address_hashed: 'hash123456789012345678901234567890123456789012345678901234567890',
        name: 'Test Wallet',
        mnemonic: 'word1 word2 word3 word4 word5 word6 word7 word8 word9 word10 word11 word12'
      } as AppWallet;

      expect(() => adapterManager.createAdapter([validWallet])).not.toThrow();
    });
  });
});