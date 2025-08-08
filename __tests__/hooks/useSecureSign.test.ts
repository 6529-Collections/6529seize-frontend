import { renderHook, act } from '@testing-library/react';
import { useSecureSign, MobileSigningError, ConnectionMismatchError, SigningProviderError, ProviderValidationError } from '../../hooks/useSecureSign';
import { useAppKitAccount, useAppKitProvider } from '@reown/appkit/react';
import { BrowserProvider } from 'ethers';

// Mock the AppKit hooks
jest.mock('@reown/appkit/react', () => ({
  useAppKitAccount: jest.fn(),
  useAppKitProvider: jest.fn(),
}));

// Mock ethers
jest.mock('ethers', () => ({
  BrowserProvider: jest.fn(),
}));

const mockUseAppKitAccount = useAppKitAccount as jest.MockedFunction<typeof useAppKitAccount>;
const mockUseAppKitProvider = useAppKitProvider as jest.MockedFunction<typeof useAppKitProvider>;
const MockBrowserProvider = BrowserProvider as jest.MockedClass<typeof BrowserProvider>;

describe('useSecureSign', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup default mocks
    mockUseAppKitAccount.mockReturnValue({
      address: '0x1234567890123456789012345678901234567890',
      isConnected: true,
      caipAddress: '',
      status: 'connected'
    });
    
    mockUseAppKitProvider.mockReturnValue({
      walletProvider: {} as any,
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Fail-fast behavior', () => {
    it('throws ProviderValidationError when walletProvider is null', async () => {
      mockUseAppKitProvider.mockReturnValue({
        walletProvider: null as any,
      });

      const { result } = renderHook(() => useSecureSign());

      await act(async () => {
        const signResult = await result.current.signMessage('test message');
        expect(signResult.error?.name).toBe('ProviderValidationError');
        expect(signResult.error?.message).toBe('Invalid provider: does not implement EIP-1193 interface');
        expect(signResult.signature).toBeNull();
        expect(signResult.userRejected).toBe(false);
      });
    });

    it('throws ProviderValidationError when walletProvider is undefined', async () => {
      mockUseAppKitProvider.mockReturnValue({
        walletProvider: undefined as any,
      });

      const { result } = renderHook(() => useSecureSign());

      await act(async () => {
        const signResult = await result.current.signMessage('test message');
        expect(signResult.error?.name).toBe('ProviderValidationError');
        expect(signResult.error?.message).toBe('Invalid provider: does not implement EIP-1193 interface');
        expect(signResult.signature).toBeNull();
        expect(signResult.userRejected).toBe(false);
      });
    });

    it('throws MobileSigningError when not connected', async () => {
      mockUseAppKitAccount.mockReturnValue({
        address: undefined,
        isConnected: false,
        caipAddress: '',
        status: 'disconnected'
      });

      const { result } = renderHook(() => useSecureSign());

      await act(async () => {
        const signResult = await result.current.signMessage('test message');
        expect(signResult.error?.name).toBe('MobileSigningError');
        expect(signResult.error?.message).toBe('Wallet not connected. Please connect your wallet and try again.');
        expect(signResult.signature).toBeNull();
        expect(signResult.userRejected).toBe(false);
      });
    });

    it('throws MobileSigningError when address is missing', async () => {
      mockUseAppKitAccount.mockReturnValue({
        address: undefined,
        isConnected: true,
        caipAddress: '',
        status: 'connected'
      });

      const { result } = renderHook(() => useSecureSign());

      await act(async () => {
        const signResult = await result.current.signMessage('test message');
        expect(signResult.error?.name).toBe('MobileSigningError');
        expect(signResult.error?.message).toBe('No wallet address detected. Please reconnect your wallet.');
        expect(signResult.signature).toBeNull();
        expect(signResult.userRejected).toBe(false);
      });
    });

    it('throws ConnectionMismatchError when signer address does not match connected address', async () => {
      const connectedAddress = '0x1234567890123456789012345678901234567890';
      const signerAddress = '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd';
      
      mockUseAppKitAccount.mockReturnValue({
        address: connectedAddress,
        isConnected: true,
        caipAddress: '',
        status: 'connected'
      });

      mockUseAppKitProvider.mockReturnValue({
        walletProvider: { request: jest.fn(), isMetaMask: true } as any,
      });

      const mockSigner = {
        getAddress: jest.fn().mockResolvedValue(signerAddress),
        signMessage: jest.fn(),
      };
      
      const mockProvider = {
        getSigner: jest.fn().mockResolvedValue(mockSigner),
      };
      
      MockBrowserProvider.mockImplementation(() => mockProvider as any);

      const { result } = renderHook(() => useSecureSign());

      await act(async () => {
        const signResult = await result.current.signMessage('test message');
        expect(signResult.error?.name).toBe('ConnectionMismatchError');
        expect(signResult.error?.message).toBe(`Address mismatch: expected ${connectedAddress}, got ${signerAddress}`);
        expect(signResult.signature).toBeNull();
        expect(signResult.userRejected).toBe(false);
      });
    });
  });

  describe('Successful signing', () => {
    it('successfully signs message when all validations pass', async () => {
      const testAddress = '0x1234567890123456789012345678901234567890';
      const testMessage = 'test message';
      const testSignature = '0xsignature123';
      
      mockUseAppKitAccount.mockReturnValue({
        address: testAddress,
        isConnected: true,
        caipAddress: '',
        status: 'connected'
      });

      const mockSigner = {
        getAddress: jest.fn().mockResolvedValue(testAddress),
        signMessage: jest.fn().mockResolvedValue(testSignature),
      };
      
      const mockProvider = {
        getSigner: jest.fn().mockResolvedValue(mockSigner),
      };
      
      MockBrowserProvider.mockImplementation(() => mockProvider as any);

      const { result } = renderHook(() => useSecureSign());

      await act(async () => {
        const signResult = await result.current.signMessage(testMessage);
        expect(signResult.signature).toBe(testSignature);
        expect(signResult.userRejected).toBe(false);
        expect(signResult.error).toBeUndefined();
      });

      expect(mockSigner.signMessage).toHaveBeenCalledWith(testMessage);
      expect(mockSigner.getAddress).toHaveBeenCalled();
    });

    it('successfully signs with case-insensitive address matching', async () => {
      const testAddress = '0x1234567890123456789012345678901234567890';
      const signerAddress = '0X1234567890123456789012345678901234567890'; // Different case
      const testMessage = 'test message';
      const testSignature = '0xsignature123';
      
      mockUseAppKitAccount.mockReturnValue({
        address: testAddress,
        isConnected: true,
        caipAddress: '',
        status: 'connected'
      });

      const mockSigner = {
        getAddress: jest.fn().mockResolvedValue(signerAddress),
        signMessage: jest.fn().mockResolvedValue(testSignature),
      };
      
      const mockProvider = {
        getSigner: jest.fn().mockResolvedValue(mockSigner),
      };
      
      MockBrowserProvider.mockImplementation(() => mockProvider as any);

      const { result } = renderHook(() => useSecureSign());

      await act(async () => {
        const signResult = await result.current.signMessage(testMessage);
        expect(signResult.signature).toBe(testSignature);
        expect(signResult.userRejected).toBe(false);
        expect(signResult.error).toBeUndefined();
      });
    });
  });

  describe('User rejection handling', () => {
    it('handles user rejection correctly', async () => {
      const testAddress = '0x1234567890123456789012345678901234567890';
      
      mockUseAppKitAccount.mockReturnValue({
        address: testAddress,
        isConnected: true,
        caipAddress: '',
        status: 'connected'
      });

      mockUseAppKitProvider.mockReturnValue({
        walletProvider: { request: jest.fn(), isMetaMask: true } as any,
      });

      const mockSigner = {
        getAddress: jest.fn().mockResolvedValue(testAddress),
        signMessage: jest.fn().mockRejectedValue({ code: 4001, message: 'User rejected' }),
      };
      
      const mockProvider = {
        getSigner: jest.fn().mockResolvedValue(mockSigner),
      };
      
      MockBrowserProvider.mockImplementation(() => mockProvider as any);

      const { result } = renderHook(() => useSecureSign());

      await act(async () => {
        const signResult = await result.current.signMessage('test message');
        expect(signResult.signature).toBeNull();
        expect(signResult.userRejected).toBe(true);
        expect(signResult.error).toBeUndefined();
      });
    });
  });

  describe('Provider validation', () => {
    it('validates ethereum provider when available', async () => {
      const testAddress = '0x1234567890123456789012345678901234567890';
      
      // Mock window.ethereum
      const mockEthereum = {
        request: jest.fn().mockResolvedValue([testAddress]),
      };
      
      Object.defineProperty(window, 'ethereum', {
        value: mockEthereum,
        writable: true,
      });
      
      mockUseAppKitAccount.mockReturnValue({
        address: testAddress,
        isConnected: true,
        caipAddress: '',
        status: 'connected'
      });

      const mockSigner = {
        getAddress: jest.fn().mockResolvedValue(testAddress),
        signMessage: jest.fn().mockResolvedValue('0xsignature'),
      };
      
      const mockProvider = {
        getSigner: jest.fn().mockResolvedValue(mockSigner),
      };
      
      MockBrowserProvider.mockImplementation(() => mockProvider as any);

      const { result } = renderHook(() => useSecureSign());

      await act(async () => {
        await result.current.signMessage('test message');
      });

      expect(mockEthereum.request).toHaveBeenCalledWith({
        method: 'eth_accounts'
      });
    });

    it('handles connection lost error during provider validation', async () => {
      const testAddress = '0x1234567890123456789012345678901234567890';
      
      // Mock window.ethereum returning empty accounts
      const mockEthereum = {
        request: jest.fn().mockResolvedValue([]),
      };
      
      Object.defineProperty(window, 'ethereum', {
        value: mockEthereum,
        writable: true,
      });
      
      mockUseAppKitAccount.mockReturnValue({
        address: testAddress,
        isConnected: true,
        caipAddress: '',
        status: 'connected'
      });

      const { result } = renderHook(() => useSecureSign());

      await act(async () => {
        const signResult = await result.current.signMessage('test message');
        expect(signResult.error?.name).toBe('MobileSigningError');
        expect(signResult.error?.message).toBe('Wallet connection lost. Please reconnect and try again.');
        expect(signResult.signature).toBeNull();
        expect(signResult.userRejected).toBe(false);
      });
    });
  });

  describe('Hook state management', () => {
    it('manages signing pending state correctly', async () => {
      const testAddress = '0x1234567890123456789012345678901234567890';
      const validSignature = '0x1234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890';
      
      mockUseAppKitAccount.mockReturnValue({
        address: testAddress,
        isConnected: true,
        caipAddress: '',
        status: 'connected'
      });

      mockUseAppKitProvider.mockReturnValue({
        walletProvider: { request: jest.fn(), isMetaMask: true } as any,
      });

      const mockSigner = {
        getAddress: jest.fn().mockResolvedValue(testAddress),
        signMessage: jest.fn().mockImplementation(() => new Promise(resolve => setTimeout(() => resolve(validSignature), 100))),
      };
      
      const mockProvider = {
        getSigner: jest.fn().mockResolvedValue(mockSigner),
      };
      
      MockBrowserProvider.mockImplementation(() => mockProvider as any);

      const { result } = renderHook(() => useSecureSign());

      expect(result.current.isSigningPending).toBe(false);

      let signPromise: Promise<any>;
      await act(async () => {
        signPromise = result.current.signMessage('test message');
        // Check that it becomes pending immediately
        expect(result.current.isSigningPending).toBe(true);
      });

      // Wait for completion
      await act(async () => {
        await signPromise;
        expect(result.current.isSigningPending).toBe(false);
      });
    });

    it('resets signing state when reset is called', async () => {
      const { result } = renderHook(() => useSecureSign());

      await act(async () => {
        result.current.reset();
        expect(result.current.isSigningPending).toBe(false);
      });
    });
  });

  describe('Error classification', () => {
    it('properly classifies MobileSigningError', async () => {
      mockUseAppKitAccount.mockReturnValue({
        address: undefined,
        isConnected: false,
        caipAddress: '',
        status: 'disconnected'
      });

      const { result } = renderHook(() => useSecureSign());

      await act(async () => {
        const signResult = await result.current.signMessage('test');
        expect(signResult.error?.name).toBe('MobileSigningError');
        expect(signResult.error?.name).toBe('MobileSigningError');
      });
    });

    it('properly classifies ConnectionMismatchError', async () => {
      const connectedAddress = '0x1234567890123456789012345678901234567890';
      const signerAddress = '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd';
      
      mockUseAppKitAccount.mockReturnValue({
        address: connectedAddress,
        isConnected: true,
        caipAddress: '',
        status: 'connected'
      });

      const mockSigner = {
        getAddress: jest.fn().mockResolvedValue(signerAddress),
        signMessage: jest.fn(),
      };
      
      const mockProvider = {
        getSigner: jest.fn().mockResolvedValue(mockSigner),
      };
      
      MockBrowserProvider.mockImplementation(() => mockProvider as any);

      const { result } = renderHook(() => useSecureSign());

      await act(async () => {
        const signResult = await result.current.signMessage('test');
        expect(signResult.error?.name).toBe('ConnectionMismatchError');
        expect(signResult.error?.name).toBe('ConnectionMismatchError');
      });
    });

    it('properly classifies ProviderValidationError', async () => {
      mockUseAppKitProvider.mockReturnValue({
        walletProvider: null as any,
      });

      const { result } = renderHook(() => useSecureSign());

      await act(async () => {
        const signResult = await result.current.signMessage('test');
        expect(signResult.error?.name).toBe('ProviderValidationError');
        expect(signResult.error?.name).toBe('ProviderValidationError');
      });
    });
  });

  describe('Integration with AppKit', () => {
    it('correctly uses AppKit hooks', () => {
      renderHook(() => useSecureSign());

      expect(mockUseAppKitAccount).toHaveBeenCalled();
      expect(mockUseAppKitProvider).toHaveBeenCalledWith('eip155');
    });

    it('creates BrowserProvider with walletProvider', async () => {
      const testAddress = '0x1234567890123456789012345678901234567890';
      const mockWalletProvider = { 
        request: jest.fn(),
        isMetaMask: true
      };
      
      mockUseAppKitAccount.mockReturnValue({
        address: testAddress,
        isConnected: true,
        caipAddress: '',
        status: 'connected'
      });
      
      mockUseAppKitProvider.mockReturnValue({
        walletProvider: mockWalletProvider as any,
      });

      const mockSigner = {
        getAddress: jest.fn().mockResolvedValue(testAddress),
        signMessage: jest.fn().mockResolvedValue('0x1234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890'),
      };
      
      const mockProvider = {
        getSigner: jest.fn().mockResolvedValue(mockSigner),
      };
      
      MockBrowserProvider.mockImplementation(() => mockProvider as any);

      const { result } = renderHook(() => useSecureSign());

      await act(async () => {
        await result.current.signMessage('test');
      });

      expect(MockBrowserProvider).toHaveBeenCalledWith(mockWalletProvider);
    });
  });

  describe('Security Tests - Input Validation', () => {
    beforeEach(() => {
      mockUseAppKitAccount.mockReturnValue({
        address: '0x1234567890123456789012345678901234567890',
        isConnected: true,
        caipAddress: '',
        status: 'connected'
      });
      
      mockUseAppKitProvider.mockReturnValue({
        walletProvider: { request: jest.fn(), isMetaMask: true } as any,
      });
    });

    it('throws ProviderValidationError for non-string message', async () => {
      const { result } = renderHook(() => useSecureSign());

      await act(async () => {
        const signResult = await result.current.signMessage(123 as any);
        expect(signResult.error?.name).toBe('ProviderValidationError');
        expect(signResult.error?.message).toBe('Message must be a string');
        expect(signResult.signature).toBeNull();
        expect(signResult.userRejected).toBe(false);
      });
    });

    it('throws ProviderValidationError for empty message', async () => {
      const { result } = renderHook(() => useSecureSign());

      await act(async () => {
        const signResult = await result.current.signMessage('');
        expect(signResult.error?.name).toBe('ProviderValidationError');
        expect(signResult.error?.message).toBe('Message cannot be empty');
        expect(signResult.signature).toBeNull();
        expect(signResult.userRejected).toBe(false);
      });
    });

    it('throws ProviderValidationError for message too long', async () => {
      const { result } = renderHook(() => useSecureSign());
      const longMessage = 'a'.repeat(10001);

      await act(async () => {
        const signResult = await result.current.signMessage(longMessage);
        expect(signResult.error?.name).toBe('ProviderValidationError');
        expect(signResult.error?.message).toBe('Message too long (max 10000 characters)');
        expect(signResult.signature).toBeNull();
        expect(signResult.userRejected).toBe(false);
      });
    });

    it('throws ProviderValidationError for message with script injection', async () => {
      const { result } = renderHook(() => useSecureSign());

      await act(async () => {
        const signResult = await result.current.signMessage('<script>alert("xss")</script>');
        expect(signResult.error?.name).toBe('ProviderValidationError');
        expect(signResult.error?.message).toBe('Message contains suspicious content');
        expect(signResult.signature).toBeNull();
        expect(signResult.userRejected).toBe(false);
      });
    });

    it('throws ProviderValidationError for message with javascript injection', async () => {
      const { result } = renderHook(() => useSecureSign());

      await act(async () => {
        const signResult = await result.current.signMessage('javascript:alert("xss")');
        expect(signResult.error?.name).toBe('ProviderValidationError');
        expect(signResult.error?.message).toBe('Message contains suspicious content');
        expect(signResult.signature).toBeNull();
        expect(signResult.userRejected).toBe(false);
      });
    });

    it('throws ProviderValidationError for invalid connected address', async () => {
      mockUseAppKitAccount.mockReturnValue({
        address: 'invalid-address',
        isConnected: true,
        caipAddress: '',
        status: 'connected'
      });

      const { result } = renderHook(() => useSecureSign());

      await act(async () => {
        const signResult = await result.current.signMessage('test message');
        expect(signResult.error?.name).toBe('ProviderValidationError');
        expect(signResult.error?.message).toBe('Invalid Ethereum address format');
        expect(signResult.signature).toBeNull();
        expect(signResult.userRejected).toBe(false);
      });
    });
  });

  describe('Security Tests - Provider Validation', () => {
    beforeEach(() => {
      mockUseAppKitAccount.mockReturnValue({
        address: '0x1234567890123456789012345678901234567890',
        isConnected: true,
        caipAddress: '',
        status: 'connected'
      });
    });

    it('throws ProviderValidationError for invalid provider without request method', async () => {
      mockUseAppKitProvider.mockReturnValue({
        walletProvider: { notAProvider: true } as any,
      });

      const { result } = renderHook(() => useSecureSign());

      await act(async () => {
        const signResult = await result.current.signMessage('test message');
        expect(signResult.error?.name).toBe('ProviderValidationError');
        expect(signResult.error?.message).toBe('Invalid provider: does not implement EIP-1193 interface');
        expect(signResult.signature).toBeNull();
        expect(signResult.userRejected).toBe(false);
      });
    });

    it('throws ProviderValidationError for provider without wallet features', async () => {
      mockUseAppKitProvider.mockReturnValue({
        walletProvider: { request: jest.fn() } as any,
      });

      const { result } = renderHook(() => useSecureSign());

      await act(async () => {
        const signResult = await result.current.signMessage('test message');
        expect(signResult.error?.name).toBe('ProviderValidationError');
        expect(signResult.error?.message).toBe('Provider does not appear to be a legitimate wallet provider');
        expect(signResult.signature).toBeNull();
        expect(signResult.userRejected).toBe(false);
      });
    });

    it('handles window.ethereum provider validation correctly', async () => {
      const testAddress = '0x1234567890123456789012345678901234567890';
      
      // Mock legitimate wallet provider
      mockUseAppKitProvider.mockReturnValue({
        walletProvider: { request: jest.fn(), isMetaMask: true } as any,
      });

      // Mock window.ethereum with valid provider
      const mockEthereum = {
        request: jest.fn().mockResolvedValue([testAddress]),
        isMetaMask: true,
      };
      
      Object.defineProperty(window, 'ethereum', {
        value: mockEthereum,
        writable: true,
      });
      
      const mockSigner = {
        getAddress: jest.fn().mockResolvedValue(testAddress),
        signMessage: jest.fn().mockResolvedValue('0x1234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890'),
      };
      
      const mockProvider = {
        getSigner: jest.fn().mockResolvedValue(mockSigner),
      };
      
      MockBrowserProvider.mockImplementation(() => mockProvider as any);

      const { result } = renderHook(() => useSecureSign());

      await act(async () => {
        const signResult = await result.current.signMessage('test message');
        expect(signResult.signature).toBeTruthy();
        expect(signResult.userRejected).toBe(false);
        expect(signResult.error).toBeUndefined();
      });

      expect(mockEthereum.request).toHaveBeenCalledWith({
        method: 'eth_accounts'
      });
    });

    it('throws ProviderValidationError for invalid accounts response from window.ethereum', async () => {
      const testAddress = '0x1234567890123456789012345678901234567890';
      
      mockUseAppKitProvider.mockReturnValue({
        walletProvider: { request: jest.fn(), isMetaMask: true } as any,
      });

      // Mock window.ethereum returning invalid response
      const mockEthereum = {
        request: jest.fn().mockResolvedValue('not-an-array'),
        isMetaMask: true,
      };
      
      Object.defineProperty(window, 'ethereum', {
        value: mockEthereum,
        writable: true,
      });

      const { result } = renderHook(() => useSecureSign());

      await act(async () => {
        const signResult = await result.current.signMessage('test message');
        expect(signResult.error?.name).toBe('ProviderValidationError');
        expect(signResult.error?.message).toBe('Invalid accounts response format');
        expect(signResult.signature).toBeNull();
        expect(signResult.userRejected).toBe(false);
      });
    });

    it('throws ProviderValidationError for invalid address type in accounts', async () => {
      const testAddress = '0x1234567890123456789012345678901234567890';
      
      mockUseAppKitProvider.mockReturnValue({
        walletProvider: { request: jest.fn(), isMetaMask: true } as any,
      });

      // Mock window.ethereum returning invalid address type
      const mockEthereum = {
        request: jest.fn().mockResolvedValue([123]), // number instead of string
        isMetaMask: true,
      };
      
      Object.defineProperty(window, 'ethereum', {
        value: mockEthereum,
        writable: true,
      });

      const { result } = renderHook(() => useSecureSign());

      await act(async () => {
        const signResult = await result.current.signMessage('test message');
        expect(signResult.error?.name).toBe('ProviderValidationError');
        expect(signResult.error?.message).toBe('Provider returned invalid address type');
        expect(signResult.signature).toBeNull();
        expect(signResult.userRejected).toBe(false);
      });
    });
  });

  describe('Security Tests - Signature Validation', () => {
    it('throws ProviderValidationError for invalid signature format', async () => {
      const testAddress = '0x1234567890123456789012345678901234567890';
      
      mockUseAppKitAccount.mockReturnValue({
        address: testAddress,
        isConnected: true,
        caipAddress: '',
        status: 'connected'
      });
      
      mockUseAppKitProvider.mockReturnValue({
        walletProvider: { request: jest.fn(), isMetaMask: true } as any,
      });

      const mockSigner = {
        getAddress: jest.fn().mockResolvedValue(testAddress),
        signMessage: jest.fn().mockResolvedValue('invalid-signature'),
      };
      
      const mockProvider = {
        getSigner: jest.fn().mockResolvedValue(mockSigner),
      };
      
      MockBrowserProvider.mockImplementation(() => mockProvider as any);

      const { result } = renderHook(() => useSecureSign());

      await act(async () => {
        const signResult = await result.current.signMessage('test message');
        expect(signResult.error?.name).toBe('ProviderValidationError');
        expect(signResult.error?.message).toBe('Invalid signature format');
        expect(signResult.signature).toBeNull();
        expect(signResult.userRejected).toBe(false);
      });
    });

    it('accepts valid signature format', async () => {
      const testAddress = '0x1234567890123456789012345678901234567890';
      const validSignature = '0x1234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890';
      
      mockUseAppKitAccount.mockReturnValue({
        address: testAddress,
        isConnected: true,
        caipAddress: '',
        status: 'connected'
      });
      
      mockUseAppKitProvider.mockReturnValue({
        walletProvider: { request: jest.fn(), isMetaMask: true } as any,
      });

      const mockSigner = {
        getAddress: jest.fn().mockResolvedValue(testAddress),
        signMessage: jest.fn().mockResolvedValue(validSignature),
      };
      
      const mockProvider = {
        getSigner: jest.fn().mockResolvedValue(mockSigner),
      };
      
      MockBrowserProvider.mockImplementation(() => mockProvider as any);

      const { result } = renderHook(() => useSecureSign());

      await act(async () => {
        const signResult = await result.current.signMessage('test message');
        expect(signResult.signature).toBe(validSignature);
        expect(signResult.userRejected).toBe(false);
        expect(signResult.error).toBeUndefined();
      });
    });
  });

  describe('Security Tests - Error Handling', () => {
    it('properly classifies ProviderValidationError', async () => {
      mockUseAppKitAccount.mockReturnValue({
        address: '0x1234567890123456789012345678901234567890',
        isConnected: true,
        caipAddress: '',
        status: 'connected'
      });
      
      mockUseAppKitProvider.mockReturnValue({
        walletProvider: null as any,
      });

      const { result } = renderHook(() => useSecureSign());

      await act(async () => {
        const signResult = await result.current.signMessage('');
        expect(signResult.error?.name).toBe('ProviderValidationError');
        expect(signResult.error?.name).toBe('ProviderValidationError');
      });
    });

    it('handles unknown error types safely', async () => {
      const testAddress = '0x1234567890123456789012345678901234567890';
      
      mockUseAppKitAccount.mockReturnValue({
        address: testAddress,
        isConnected: true,
        caipAddress: '',
        status: 'connected'
      });
      
      mockUseAppKitProvider.mockReturnValue({
        walletProvider: { request: jest.fn(), isMetaMask: true } as any,
      });

      const mockSigner = {
        getAddress: jest.fn().mockResolvedValue(testAddress),
        signMessage: jest.fn().mockRejectedValue('string error'),
      };
      
      const mockProvider = {
        getSigner: jest.fn().mockResolvedValue(mockSigner),
      };
      
      MockBrowserProvider.mockImplementation(() => mockProvider as any);

      const { result } = renderHook(() => useSecureSign());

      await act(async () => {
        const signResult = await result.current.signMessage('test message');
        expect(signResult.error?.name).toBe('MobileSigningError');
        expect(signResult.signature).toBeNull();
        expect(signResult.userRejected).toBe(false);
      });
    });

    it('handles errors with numeric codes safely', async () => {
      const testAddress = '0x1234567890123456789012345678901234567890';
      
      mockUseAppKitAccount.mockReturnValue({
        address: testAddress,
        isConnected: true,
        caipAddress: '',
        status: 'connected'
      });
      
      mockUseAppKitProvider.mockReturnValue({
        walletProvider: { request: jest.fn(), isMetaMask: true } as any,
      });

      const mockSigner = {
        getAddress: jest.fn().mockResolvedValue(testAddress),
        signMessage: jest.fn().mockRejectedValue({ code: 1234, message: 'Custom error' }),
      };
      
      const mockProvider = {
        getSigner: jest.fn().mockResolvedValue(mockSigner),
      };
      
      MockBrowserProvider.mockImplementation(() => mockProvider as any);

      const { result } = renderHook(() => useSecureSign());

      await act(async () => {
        const signResult = await result.current.signMessage('test message');
        expect(signResult.error?.name).toBe('MobileSigningError');
        expect(signResult.signature).toBeNull();
        expect(signResult.userRejected).toBe(false);
      });
    });
  });
});