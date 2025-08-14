import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';

// Set up environment variable before imports
const originalEnv = process.env;
process.env.BASE_ENDPOINT = 'https://6529.io';
import { createAppWalletConnector } from '../../wagmiConfig/wagmiAppWalletConnector';
import { InvalidPasswordError, PrivateKeyDecryptionError, WalletAuthenticationError } from '../../src/errors/wallet-auth';
import { decryptData } from '../../components/app-wallets/app-wallet-helpers';
import { areEqualAddresses } from '../../helpers/Helpers';

// Mock dependencies
jest.mock('../../components/app-wallets/app-wallet-helpers');
jest.mock('../../helpers/Helpers');
jest.mock('viem/accounts', () => ({
  privateKeyToAccount: jest.fn().mockReturnValue({ address: '0x1234567890123456789012345678901234567890' })
}));
// Mock createWalletClient to return a proper wallet client
const mockWalletClient = {
  account: { address: '0x1234567890123456789012345678901234567890' }
};

jest.mock('viem', () => ({
  createWalletClient: jest.fn().mockReturnValue(mockWalletClient),
  fallback: jest.fn(),
  http: jest.fn()
}));

const mockDecryptData = decryptData as jest.MockedFunction<typeof decryptData>;
const mockAreEqualAddresses = areEqualAddresses as jest.MockedFunction<typeof areEqualAddresses>;

describe('wagmiAppWalletConnector', () => {
  const mockChains = [
    { id: 1, name: 'Ethereum' },
    { id: 137, name: 'Polygon' }
  ] as any[];

  const mockAppWallet = {
    address: '0x1234567890123456789012345678901234567890',
    address_hashed: 'hashed_address_data',
    private_key: 'encrypted_private_key_data',
    name: 'Test Wallet'
  };

  const mockRequestPasswordModal = jest.fn();
  let connector: any;
  let connectorInstance: any;

  beforeEach(() => {
    jest.clearAllMocks();
    connector = createAppWalletConnector(
      mockChains,
      { appWallet: mockAppWallet },
      mockRequestPasswordModal
    );
    // Create connector instance with mock emitter
    const mockEmitter = {
      emit: jest.fn(),
      on: jest.fn(),
      off: jest.fn()
    };
    connectorInstance = connector({ emitter: mockEmitter });
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  afterAll(() => {
    // Restore original environment
    process.env = originalEnv;
  });

  describe('setPassword', () => {
    it('throws InvalidPasswordError when password is empty', async () => {
      await expect(connectorInstance.setPassword('')).rejects.toThrow('Password is required and must be a string');
    });

    it('throws InvalidPasswordError when password is null', async () => {
      await expect(connectorInstance.setPassword(null as any)).rejects.toThrow('Password is required and must be a string');
    });

    it('throws InvalidPasswordError when password is not a string', async () => {
      await expect(connectorInstance.setPassword(123 as any)).rejects.toThrow('Password is required and must be a string');
    });

    it('throws InvalidPasswordError when password is too short', async () => {
      await expect(connectorInstance.setPassword('short')).rejects.toThrow('Password must be at least 8 characters long');
    });

    it('throws InvalidPasswordError when address decryption returns empty data', async () => {
      mockDecryptData.mockResolvedValueOnce(''); // Empty decrypted address
      
      await expect(connectorInstance.setPassword('validpass123')).rejects.toThrow('Password decryption resulted in empty data');
    });

    it('throws InvalidPasswordError when decrypted address does not match', async () => {
      mockDecryptData.mockResolvedValueOnce('0xdifferentaddress123456789012345678901234567890'); // Wrong address
      mockAreEqualAddresses.mockReturnValue(false);
      
      await expect(connectorInstance.setPassword('validpass123')).rejects.toThrow('Password does not match wallet - address verification failed');
    });

    it('throws PrivateKeyDecryptionError when private key decryption returns empty result', async () => {
      mockDecryptData
        .mockResolvedValueOnce(mockAppWallet.address) // Address decryption succeeds
        .mockResolvedValueOnce(''); // Private key decryption returns empty
      mockAreEqualAddresses.mockReturnValue(true);
      
      await expect(connectorInstance.setPassword('validpass123')).rejects.toThrow('Private key decryption returned empty result');
    });

    it('throws PrivateKeyDecryptionError when private key has invalid format', async () => {
      mockDecryptData
        .mockResolvedValueOnce(mockAppWallet.address) // Address decryption succeeds
        .mockResolvedValueOnce('invalid_private_key_format'); // Invalid private key format
      mockAreEqualAddresses.mockReturnValue(true);
      
      await expect(connectorInstance.setPassword('validpass123')).rejects.toThrow('Decrypted private key has invalid format');
    });

    it('wraps unexpected errors in PrivateKeyDecryptionError', async () => {
      const unexpectedError = new Error('Network timeout');
      mockDecryptData.mockRejectedValueOnce(unexpectedError);
      
      await expect(connectorInstance.setPassword('validpass123')).rejects.toThrow('Unexpected error during password validation');
    });

    it('re-throws custom wallet authentication errors unchanged', async () => {
      const customError = new InvalidPasswordError('Custom error message');
      mockDecryptData.mockRejectedValueOnce(customError);
      
      await expect(connectorInstance.setPassword('validpass123')).rejects.toThrow('Custom error message');
    });

    it('succeeds with valid password and private key', async () => {
      const validPrivateKey = 'abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890';
      mockDecryptData
        .mockResolvedValueOnce(mockAppWallet.address) // Address decryption succeeds
        .mockResolvedValueOnce(validPrivateKey); // Valid private key
      mockAreEqualAddresses.mockReturnValue(true);
      
      await expect(connectorInstance.setPassword('validpass123')).resolves.toBeUndefined();
    });

    it('returns Promise<void>, not Promise<boolean>', () => {
      // This test ensures the method signature is correct
      mockDecryptData
        .mockResolvedValueOnce(mockAppWallet.address)
        .mockResolvedValueOnce('abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890');
      mockAreEqualAddresses.mockReturnValue(true);
      
      const result = connectorInstance.setPassword('validpass123');
      expect(result).toBeInstanceOf(Promise);
      // The result should be a Promise<void>, which resolves to undefined
      return expect(result).resolves.toBeUndefined();
    });
  });

  describe('connect', () => {
    it('throws error for unsupported chainId', async () => {
      const unsupportedChainId = 999;
      
      await expect(connectorInstance.connect({ chainId: unsupportedChainId }))
        .rejects.toThrow(`Chain ID ${unsupportedChainId} is not supported. Supported chains: 1, 137`);
    });

    it('throws InvalidPasswordError when password modal returns empty password', async () => {
      mockRequestPasswordModal.mockResolvedValue(''); // Empty password from modal
      
      await expect(connectorInstance.connect()).rejects.toThrow('Password is required for wallet connection');
    });

    it('throws InvalidPasswordError when password modal returns null', async () => {
      mockRequestPasswordModal.mockResolvedValue(null); // Null password from modal
      
      await expect(connectorInstance.connect()).rejects.toThrow('Password is required for wallet connection');
    });

    it('propagates setPassword errors during connect', async () => {
      mockRequestPasswordModal.mockResolvedValue('short'); // Too short password
      
      await expect(connectorInstance.connect()).rejects.toThrow('Password must be at least 8 characters long');
    });

    it('throws PrivateKeyDecryptionError when private key is not available after password validation', async () => {
      // Mock scenario where setPassword doesn't throw but somehow private key is still null
      mockRequestPasswordModal.mockResolvedValue('validpass123');
      mockDecryptData
        .mockResolvedValueOnce(mockAppWallet.address)
        .mockResolvedValueOnce(null as any); // This should trigger the private key validation error first
      mockAreEqualAddresses.mockReturnValue(true);
      
      await expect(connectorInstance.connect()).rejects.toThrow('Private key decryption returned empty result');
    });
  });

  describe('error inheritance', () => {
    it('InvalidPasswordError is instance of WalletAuthenticationError', () => {
      const error = new InvalidPasswordError('test message');
      expect(error).toBeInstanceOf(WalletAuthenticationError);
      expect(error).toBeInstanceOf(Error);
      expect(error.name).toBe('InvalidPasswordError');
    });

    it('PrivateKeyDecryptionError is instance of WalletAuthenticationError', () => {
      const error = new PrivateKeyDecryptionError('test message');
      expect(error).toBeInstanceOf(WalletAuthenticationError);
      expect(error).toBeInstanceOf(Error);
      expect(error.name).toBe('PrivateKeyDecryptionError');
    });

    it('WalletAuthenticationError has correct prototype chain', () => {
      const error = new WalletAuthenticationError('test message');
      expect(error).toBeInstanceOf(Error);
      expect(error.name).toBe('WalletAuthenticationError');
    });
  });
});