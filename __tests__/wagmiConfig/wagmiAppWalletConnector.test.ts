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
// Mock all viem functions
const mockWalletClient = {
  account: { address: '0x1234567890123456789012345678901234567890' }
};

const mockCreateWalletClient = jest.fn().mockReturnValue(mockWalletClient);
const mockPrivateKeyToAccount = jest.fn().mockReturnValue({ address: '0x1234567890123456789012345678901234567890' });
const mockFallback = jest.fn();
const mockHttp = jest.fn();

jest.mock('viem/accounts', () => ({
  privateKeyToAccount: mockPrivateKeyToAccount
}));

jest.mock('viem', () => ({
  createWalletClient: mockCreateWalletClient,
  fallback: mockFallback,
  http: mockHttp
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
  } as any;

  const mockRequestPasswordModal = jest.fn() as jest.MockedFunction<() => Promise<string>>;
  let connector: any;
  let connectorInstance: any;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Reset all viem mocks
    mockCreateWalletClient.mockReturnValue(mockWalletClient);
    mockPrivateKeyToAccount.mockReturnValue({ address: mockAppWallet.address });
    mockFallback.mockReturnValue(jest.fn());
    mockHttp.mockReturnValue(jest.fn());
    
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
    // Restore original environment
    process.env = originalEnv;
  });

  afterAll(() => {
    // Restore original environment
    process.env = originalEnv;
  });

  describe('Capacitor environment tests', () => {
    beforeEach(() => {
      // Mock Capacitor environment
      (global as any).window = {
        Capacitor: {
          isNativePlatform: jest.fn().mockReturnValue(true)
        }
      };
    });

    afterEach(() => {
      // Clean up global mock
      delete (global as any).window;
    });

    it('throws InvalidPasswordError when address mismatch in Capacitor', async () => {
      const wrongAddress = '0x9999999999999999999999999999999999999999';
      mockDecryptData.mockResolvedValueOnce(wrongAddress);
      
      await expect(connectorInstance.setPassword('validpass123')).rejects.toThrow('Password does not match wallet');
    });
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

    it('throws InvalidPasswordError when password decryption fails (short password case)', async () => {
      // Mock decryptData to fail for short password, simulating real behavior
      mockDecryptData.mockRejectedValueOnce(new Error('Decryption failed'));
      
      await expect(connectorInstance.setPassword('short')).rejects.toThrow('Unexpected error during password validation');
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

    it('accepts any private key format from successful decryption', async () => {
      // The implementation doesn't validate private key format, it trusts decryption result
      mockDecryptData
        .mockResolvedValueOnce(mockAppWallet.address) // Address decryption succeeds
        .mockResolvedValueOnce('invalid_private_key_format'); // Any format is accepted
      mockAreEqualAddresses.mockReturnValue(true);
      
      await expect(connectorInstance.setPassword('validpass123')).resolves.toBeUndefined();
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
      mockRequestPasswordModal.mockResolvedValue(null as any); // Null password from modal
      
      await expect(connectorInstance.connect()).rejects.toThrow('Password is required for wallet connection');
    });

    it('propagates setPassword errors during connect', async () => {
      mockRequestPasswordModal.mockResolvedValue('badpass'); // Bad password that will cause decryption to fail
      mockDecryptData.mockRejectedValueOnce(new Error('Decryption failed'));
      
      await expect(connectorInstance.connect()).rejects.toThrow('Unexpected error during password validation');
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

  describe('connector properties', () => {
    it('has correct icon URL based on wallet address', () => {
      expect(connectorInstance.icon).toBe(`https://robohash.org/${mockAppWallet.address}.png?size=64x64`);
      expect(connectorInstance.iconUrl).toBe(`https://robohash.org/${mockAppWallet.address}.png?size=64x64`);
    });

    it('has correct ID based on wallet address', () => {
      expect(connectorInstance.id).toBe(mockAppWallet.address);
    });

    it('has correct name format', () => {
      const shortAddress = mockAppWallet.address.slice(0, 6) + '...' + mockAppWallet.address.slice(-4);
      expect(connectorInstance.name).toBe(`${mockAppWallet.name} (${shortAddress})`);
    });

    it('has correct type', () => {
      expect(connectorInstance.type).toBe('app-wallet');
    });

    it('does not support simulation', () => {
      expect(connectorInstance.supportsSimulation).toBe(false);
    });

    it('has correct supported connectors', () => {
      expect(connectorInstance.supportedConnectors).toEqual(['app-wallet']);
    });

    it('does not have walletConnectId', () => {
      expect(connectorInstance.walletConnectId).toBeUndefined();
    });
  });

  describe('disconnect', () => {
    it('clears internal state and emits disconnect event', async () => {
      const mockEmitter = {
        emit: jest.fn(),
        on: jest.fn(),
        off: jest.fn()
      };
      const localConnector = connector({ emitter: mockEmitter });
      
      await localConnector.disconnect();
      
      expect(mockEmitter.emit).toHaveBeenCalledWith('disconnect');
    });
  });

  describe('isAuthorized', () => {
    it('returns false when no private key is set', async () => {
      const result = await connectorInstance.isAuthorized();
      expect(result).toBe(false);
    });

    it('returns true after successful password validation', async () => {
      mockDecryptData
        .mockResolvedValueOnce(mockAppWallet.address)
        .mockResolvedValueOnce('valid_private_key');
      mockAreEqualAddresses.mockReturnValue(true);
      
      await connectorInstance.setPassword('validpass123');
      const result = await connectorInstance.isAuthorized();
      expect(result).toBe(true);
    });
  });

  describe('getChainId', () => {
    it('returns default chain ID initially', async () => {
      const chainId = await connectorInstance.getChainId();
      expect(chainId).toBe(mockChains[0].id); // Default to first chain
    });
  });

  describe('getAccounts', () => {
    it('throws error when no decrypted private key available', async () => {
      await expect(connectorInstance.getAccounts()).rejects.toThrow('No decrypted key found. Call connect() first.');
    });

  });

  describe('getProvider and getClient', () => {
    it('throws error when no decrypted private key available', async () => {
      await expect(connectorInstance.getProvider()).rejects.toThrow('No decrypted key found. Call connect() first.');
      await expect(connectorInstance.getClient()).rejects.toThrow('No decrypted key found. Call connect() first.');
    });
  });

  describe('switchChain', () => {
    it('throws error for unsupported chain', async () => {
      const unsupportedChainId = 999;
      await expect(connectorInstance.switchChain({ chainId: unsupportedChainId }))
        .rejects.toThrow(`Chain with id ${unsupportedChainId} not found!`);
    });

  });

  describe('setup', () => {
    it('completes without error', async () => {
      await expect(connectorInstance.setup()).resolves.toBeUndefined();
    });
  });

  describe('event handlers', () => {
    it('has proper event handler methods', () => {
      expect(typeof connectorInstance.onAccountsChanged).toBe('function');
      expect(typeof connectorInstance.onChainChanged).toBe('function');
      expect(typeof connectorInstance.onConnect).toBe('function');
      expect(typeof connectorInstance.onDisconnect).toBe('function');
      expect(typeof connectorInstance.onMessage).toBe('function');
    });

    it('onChainChanged converts hex to numeric chainId', () => {
      const mockEmitter = {
        emit: jest.fn(),
        on: jest.fn(),
        off: jest.fn()
      };
      const localConnector = connector({ emitter: mockEmitter });
      
      localConnector.onChainChanged('0x1'); // Hex for chainId 1
      
      expect(mockEmitter.emit).toHaveBeenCalledWith('change', { chainId: 1 });
    });

    it('onAccountsChanged emits change event with accounts', () => {
      const mockEmitter = {
        emit: jest.fn(),
        on: jest.fn(),
        off: jest.fn()
      };
      const localConnector = connector({ emitter: mockEmitter });
      const accounts = ['0x1234567890123456789012345678901234567890'];
      
      localConnector.onAccountsChanged(accounts);
      
      expect(mockEmitter.emit).toHaveBeenCalledWith('change', { accounts });
    });

    it('onConnect emits connect event', () => {
      const mockEmitter = {
        emit: jest.fn(),
        on: jest.fn(),
        off: jest.fn()
      };
      const localConnector = connector({ emitter: mockEmitter });
      
      localConnector.onConnect({});
      
      expect(mockEmitter.emit).toHaveBeenCalledWith('connect', {
        accounts: [],
        chainId: 1 // Default first chain
      });
    });

    it('onDisconnect emits disconnect event', () => {
      const mockEmitter = {
        emit: jest.fn(),
        on: jest.fn(),
        off: jest.fn()
      };
      const localConnector = connector({ emitter: mockEmitter });
      
      localConnector.onDisconnect(new Error('test'));
      
      expect(mockEmitter.emit).toHaveBeenCalledWith('disconnect');
    });

    it('onMessage emits message event', () => {
      const mockEmitter = {
        emit: jest.fn(),
        on: jest.fn(),
        off: jest.fn()
      };
      const localConnector = connector({ emitter: mockEmitter });
      const message = { type: 'test', data: 'hello' };
      
      localConnector.onMessage(message);
      
      expect(mockEmitter.emit).toHaveBeenCalledWith('message', message);
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