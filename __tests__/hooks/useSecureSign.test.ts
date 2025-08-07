import { renderHook, act } from '@testing-library/react';
import { useSecureSign, MobileSigningError, ConnectionMismatchError, SigningProviderError } from '../../hooks/useSecureSign';
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
    it('throws SigningProviderError when walletProvider is null', async () => {
      mockUseAppKitProvider.mockReturnValue({
        walletProvider: null as any,
      });

      const { result } = renderHook(() => useSecureSign());

      await act(async () => {
        const signResult = await result.current.signMessage('test message');
        expect(signResult.error).toBeInstanceOf(SigningProviderError);
        expect(signResult.error?.message).toBe('Wallet provider not available');
        expect(signResult.signature).toBeNull();
        expect(signResult.userRejected).toBe(false);
      });
    });

    it('throws SigningProviderError when walletProvider is undefined', async () => {
      mockUseAppKitProvider.mockReturnValue({
        walletProvider: undefined as any,
      });

      const { result } = renderHook(() => useSecureSign());

      await act(async () => {
        const signResult = await result.current.signMessage('test message');
        expect(signResult.error).toBeInstanceOf(SigningProviderError);
        expect(signResult.error?.message).toBe('Wallet provider not available');
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
        expect(signResult.error).toBeInstanceOf(MobileSigningError);
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
        expect(signResult.error).toBeInstanceOf(MobileSigningError);
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
        expect(signResult.error).toBeInstanceOf(ConnectionMismatchError);
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
        expect(signResult.error).toBeInstanceOf(MobileSigningError);
        expect(signResult.error?.message).toBe('Wallet connection lost. Please reconnect and try again.');
        expect(signResult.signature).toBeNull();
        expect(signResult.userRejected).toBe(false);
      });
    });
  });

  describe('Hook state management', () => {
    it('manages signing pending state correctly', async () => {
      const testAddress = '0x1234567890123456789012345678901234567890';
      
      mockUseAppKitAccount.mockReturnValue({
        address: testAddress,
        isConnected: true,
        caipAddress: '',
        status: 'connected'
      });

      const mockSigner = {
        getAddress: jest.fn().mockResolvedValue(testAddress),
        signMessage: jest.fn().mockImplementation(() => new Promise(resolve => setTimeout(() => resolve('0xsig'), 100))),
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
        expect(signResult.error).toBeInstanceOf(MobileSigningError);
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
        expect(signResult.error).toBeInstanceOf(ConnectionMismatchError);
        expect(signResult.error?.name).toBe('ConnectionMismatchError');
      });
    });

    it('properly classifies SigningProviderError', async () => {
      mockUseAppKitProvider.mockReturnValue({
        walletProvider: null as any,
      });

      const { result } = renderHook(() => useSecureSign());

      await act(async () => {
        const signResult = await result.current.signMessage('test');
        expect(signResult.error).toBeInstanceOf(SigningProviderError);
        expect(signResult.error?.name).toBe('SigningProviderError');
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
      const mockWalletProvider = { test: 'provider' };
      
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
        signMessage: jest.fn().mockResolvedValue('0xsig'),
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
});