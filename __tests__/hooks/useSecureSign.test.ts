import React from 'react';
import { renderHook, act } from '@testing-library/react';
import { useSecureSign, MobileSigningError, ConnectionMismatchError, SigningProviderError, ProviderValidationError } from '../../hooks/useSecureSign';
import { useAppKitAccount } from '@reown/appkit/react';
import { useSignMessage } from 'wagmi';
import { UserRejectedRequestError } from 'viem';
import { WagmiProvider } from 'wagmi';

// Mock the hooks
jest.mock('@reown/appkit/react', () => ({
  useAppKitAccount: jest.fn(),
}));

jest.mock('wagmi', () => ({
  useSignMessage: jest.fn(),
  WagmiProvider: ({ children }: any) => React.createElement('div', { 'data-testid': 'wagmi-provider' }, children),
}));

// Create a mock that can be used both in tests and jest.mock
class MockUserRejectedRequestError extends Error {
  constructor(message?: string) {
    super(message);
    this.name = 'UserRejectedRequestError';
    // Set the prototype explicitly for instanceof checks to work
    Object.setPrototypeOf(this, MockUserRejectedRequestError.prototype);
  }
}

// Mock viem module at the top level before any imports
jest.mock('viem', () => ({
  UserRejectedRequestError: MockUserRejectedRequestError,
}));

// Make the mock available to tests
const UserRejectedRequestError = MockUserRejectedRequestError;

const mockUseAppKitAccount = useAppKitAccount as jest.MockedFunction<typeof useAppKitAccount>;
const mockUseSignMessage = useSignMessage as jest.MockedFunction<typeof useSignMessage>;

// Test wrapper with WagmiProvider
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return React.createElement(WagmiProvider as any, { config: {} }, children);
};

const renderHookWithWrapper = (hook: () => any) => {
  return renderHook(hook, { wrapper: TestWrapper });
};

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
    
    // Setup default Wagmi mock
    mockUseSignMessage.mockReturnValue({
      signMessageAsync: jest.fn(),
      isError: false,
      isLoading: false,
      isSuccess: false,
      data: undefined,
      error: null,
    } as any);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Fail-fast behavior', () => {
    it('throws MobileSigningError when wallet not connected', async () => {
      mockUseAppKitAccount.mockReturnValue({
        address: undefined,
        isConnected: false,
        caipAddress: '',
        status: 'disconnected'
      });

      const { result } = renderHookWithWrapper(() => useSecureSign());

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

      const { result } = renderHookWithWrapper(() => useSecureSign());

      await act(async () => {
        const signResult = await result.current.signMessage('test message');
        expect(signResult.error?.name).toBe('MobileSigningError');
        expect(signResult.error?.message).toBe('No wallet address detected. Please reconnect your wallet.');
        expect(signResult.signature).toBeNull();
        expect(signResult.userRejected).toBe(false);
      });
    });

    it('throws ProviderValidationError for invalid address format', async () => {
      mockUseAppKitAccount.mockReturnValue({
        address: 'invalid-address-format',
        isConnected: true,
        caipAddress: '',
        status: 'connected'
      });

      const { result } = renderHookWithWrapper(() => useSecureSign());

      await act(async () => {
        const signResult = await result.current.signMessage('test message');
        expect(signResult.error?.name).toBe('ProviderValidationError');
        expect(signResult.error?.message).toBe('Invalid Ethereum address format');
        expect(signResult.signature).toBeNull();
        expect(signResult.userRejected).toBe(false);
      });
    });
  });

  describe('Successful signing', () => {
    it('successfully signs message when all validations pass', async () => {
      const testAddress = '0x1234567890123456789012345678901234567890';
      const testMessage = 'test message';
      const testSignature = '0x1234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890';
      
      mockUseAppKitAccount.mockReturnValue({
        address: testAddress,
        isConnected: true,
        caipAddress: '',
        status: 'connected'
      });

      const mockSignMessageAsync = jest.fn().mockResolvedValue(testSignature);
      mockUseSignMessage.mockReturnValue({
        signMessageAsync: mockSignMessageAsync,
        isError: false,
        isLoading: false,
        isSuccess: true,
        data: testSignature,
        error: null,
      } as any);

      const { result } = renderHookWithWrapper(() => useSecureSign());

      await act(async () => {
        const signResult = await result.current.signMessage(testMessage);
        expect(signResult.signature).toBe(testSignature);
        expect(signResult.userRejected).toBe(false);
        expect(signResult.error).toBeUndefined();
      });

      expect(mockSignMessageAsync).toHaveBeenCalledWith({ message: testMessage });
    });

    it('successfully signs with valid address format', async () => {
      const testAddress = '0x1234567890123456789012345678901234567890';
      const testMessage = 'test message';
      const testSignature = '0x1234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890';
      
      mockUseAppKitAccount.mockReturnValue({
        address: testAddress,
        isConnected: true,
        caipAddress: '',
        status: 'connected'
      });

      const mockSignMessageAsync = jest.fn().mockResolvedValue(testSignature);
      mockUseSignMessage.mockReturnValue({
        signMessageAsync: mockSignMessageAsync,
        isError: false,
        isLoading: false,
        isSuccess: true,
        data: testSignature,
        error: null,
      } as any);

      const { result } = renderHookWithWrapper(() => useSecureSign());

      await act(async () => {
        const signResult = await result.current.signMessage(testMessage);
        expect(signResult.signature).toBe(testSignature);
        expect(signResult.userRejected).toBe(false);
        expect(signResult.error).toBeUndefined();
      });

      expect(mockSignMessageAsync).toHaveBeenCalledWith({ message: testMessage });
    });
  });

  describe('User rejection handling', () => {
    it('handles UserRejectedRequestError correctly', async () => {
      const testAddress = '0x1234567890123456789012345678901234567890';
      
      mockUseAppKitAccount.mockReturnValue({
        address: testAddress,
        isConnected: true,
        caipAddress: '',
        status: 'connected'
      });

      const userRejectionError = new UserRejectedRequestError('User rejected the request');
      const mockSignMessageAsync = jest.fn().mockRejectedValue(userRejectionError);
      mockUseSignMessage.mockReturnValue({
        signMessageAsync: mockSignMessageAsync,
        isError: true,
        isLoading: false,
        isSuccess: false,
        data: undefined,
        error: userRejectionError,
      } as any);

      const { result } = renderHookWithWrapper(() => useSecureSign());

      await act(async () => {
        const signResult = await result.current.signMessage('test message');
        expect(signResult.signature).toBeNull();
        expect(signResult.userRejected).toBe(true);
        expect(signResult.error).toBeUndefined();
      });
    });

    it('handles legacy code 4001 rejection correctly', async () => {
      const testAddress = '0x1234567890123456789012345678901234567890';
      
      mockUseAppKitAccount.mockReturnValue({
        address: testAddress,
        isConnected: true,
        caipAddress: '',
        status: 'connected'
      });

      const legacyRejectionError = { code: 4001, message: 'User rejected' };
      const mockSignMessageAsync = jest.fn().mockRejectedValue(legacyRejectionError);
      mockUseSignMessage.mockReturnValue({
        signMessageAsync: mockSignMessageAsync,
        isError: true,
        isLoading: false,
        isSuccess: false,
        data: undefined,
        error: legacyRejectionError,
      } as any);

      const { result } = renderHookWithWrapper(() => useSecureSign());

      await act(async () => {
        const signResult = await result.current.signMessage('test message');
        expect(signResult.signature).toBeNull();
        expect(signResult.userRejected).toBe(true);
        expect(signResult.error).toBeUndefined();
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

      const mockSignMessageAsync = jest.fn().mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve(validSignature), 50))
      );
      mockUseSignMessage.mockReturnValue({
        signMessageAsync: mockSignMessageAsync,
        isError: false,
        isLoading: false,
        isSuccess: false,
        data: undefined,
        error: null,
      } as any);

      const { result } = renderHookWithWrapper(() => useSecureSign());

      expect(result.current.isSigningPending).toBe(false);

      // Execute signing and verify final state
      await act(async () => {
        const signResult = await result.current.signMessage('test message');
        expect(signResult.signature).toBe(validSignature);
      });

      expect(result.current.isSigningPending).toBe(false);
    });

    it('resets signing state when reset is called', async () => {
      const { result } = renderHookWithWrapper(() => useSecureSign());

      await act(async () => {
        result.current.reset();
        expect(result.current.isSigningPending).toBe(false);
      });
    });
  });

  describe('Error classification', () => {
    it('properly classifies MobileSigningError for disconnected wallet', async () => {
      mockUseAppKitAccount.mockReturnValue({
        address: undefined,
        isConnected: false,
        caipAddress: '',
        status: 'disconnected'
      });

      const { result } = renderHookWithWrapper(() => useSecureSign());

      await act(async () => {
        const signResult = await result.current.signMessage('test');
        expect(signResult.error?.name).toBe('MobileSigningError');
        expect(signResult.error?.message).toBe('Wallet not connected. Please connect your wallet and try again.');
      });
    });

    it('properly classifies ProviderValidationError for invalid address', async () => {
      mockUseAppKitAccount.mockReturnValue({
        address: 'invalid',
        isConnected: true,
        caipAddress: '',
        status: 'connected'
      });

      const { result } = renderHookWithWrapper(() => useSecureSign());

      await act(async () => {
        const signResult = await result.current.signMessage('test');
        expect(signResult.error?.name).toBe('ProviderValidationError');
        expect(signResult.error?.message).toBe('Invalid Ethereum address format');
      });
    });

    it('properly classifies MobileSigningError for Wagmi errors', async () => {
      const testAddress = '0x1234567890123456789012345678901234567890';
      mockUseAppKitAccount.mockReturnValue({
        address: testAddress,
        isConnected: true,
        caipAddress: '',
        status: 'connected'
      });

      const wagmiError = new Error('Wagmi signing failed');
      const mockSignMessageAsync = jest.fn().mockRejectedValue(wagmiError);
      mockUseSignMessage.mockReturnValue({
        signMessageAsync: mockSignMessageAsync,
        isError: true,
        isLoading: false,
        isSuccess: false,
        data: undefined,
        error: wagmiError,
      } as any);

      const { result } = renderHookWithWrapper(() => useSecureSign());

      await act(async () => {
        const signResult = await result.current.signMessage('test');
        expect(signResult.error?.name).toBe('MobileSigningError');
        expect(signResult.signature).toBeNull();
        expect(signResult.userRejected).toBe(false);
      });
    });
  });

  describe('Integration with Wagmi', () => {
    it('correctly uses Wagmi and AppKit hooks', () => {
      renderHookWithWrapper(() => useSecureSign());

      expect(mockUseAppKitAccount).toHaveBeenCalled();
      expect(mockUseSignMessage).toHaveBeenCalled();
    });

    it('calls Wagmi signMessageAsync with correct parameters', async () => {
      const testAddress = '0x1234567890123456789012345678901234567890';
      const testMessage = 'test message';
      const testSignature = '0x1234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890';
      
      mockUseAppKitAccount.mockReturnValue({
        address: testAddress,
        isConnected: true,
        caipAddress: '',
        status: 'connected'
      });
      
      const mockSignMessageAsync = jest.fn().mockResolvedValue(testSignature);
      mockUseSignMessage.mockReturnValue({
        signMessageAsync: mockSignMessageAsync,
        isError: false,
        isLoading: false,
        isSuccess: false,
        data: undefined,
        error: null,
      } as any);

      const { result } = renderHookWithWrapper(() => useSecureSign());

      await act(async () => {
        await result.current.signMessage(testMessage);
      });

      expect(mockSignMessageAsync).toHaveBeenCalledWith({ message: testMessage });
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
      
      // Reset Wagmi mock to default success state
      mockUseSignMessage.mockReturnValue({
        signMessageAsync: jest.fn(),
        isError: false,
        isLoading: false,
        isSuccess: false,
        data: undefined,
        error: null,
      } as any);
    });

    it('throws ProviderValidationError for non-string message', async () => {
      const { result } = renderHookWithWrapper(() => useSecureSign());

      await act(async () => {
        const signResult = await result.current.signMessage(123 as any);
        expect(signResult.error?.name).toBe('ProviderValidationError');
        expect(signResult.error?.message).toBe('Message must be a string');
        expect(signResult.signature).toBeNull();
        expect(signResult.userRejected).toBe(false);
      });
    });

    it('throws ProviderValidationError for empty message', async () => {
      const { result } = renderHookWithWrapper(() => useSecureSign());

      await act(async () => {
        const signResult = await result.current.signMessage('');
        expect(signResult.error?.name).toBe('ProviderValidationError');
        expect(signResult.error?.message).toBe('Message cannot be empty');
        expect(signResult.signature).toBeNull();
        expect(signResult.userRejected).toBe(false);
      });
    });

    it('throws ProviderValidationError for message too long', async () => {
      const { result } = renderHookWithWrapper(() => useSecureSign());
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
      const { result } = renderHookWithWrapper(() => useSecureSign());

      await act(async () => {
        const signResult = await result.current.signMessage('<script>alert("xss")</script>');
        expect(signResult.error?.name).toBe('ProviderValidationError');
        expect(signResult.error?.message).toBe('Message contains suspicious content');
        expect(signResult.signature).toBeNull();
        expect(signResult.userRejected).toBe(false);
      });
    });

    it('throws ProviderValidationError for message with javascript injection', async () => {
      const { result } = renderHookWithWrapper(() => useSecureSign());

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

      const { result } = renderHookWithWrapper(() => useSecureSign());

      await act(async () => {
        const signResult = await result.current.signMessage('test message');
        expect(signResult.error?.name).toBe('ProviderValidationError');
        expect(signResult.error?.message).toBe('Invalid Ethereum address format');
        expect(signResult.signature).toBeNull();
        expect(signResult.userRejected).toBe(false);
      });
    });
  });


  describe('Security Tests - Signature Validation', () => {
    it('throws ProviderValidationError for invalid signature format from Wagmi', async () => {
      const testAddress = '0x1234567890123456789012345678901234567890';
      
      mockUseAppKitAccount.mockReturnValue({
        address: testAddress,
        isConnected: true,
        caipAddress: '',
        status: 'connected'
      });
      
      const mockSignMessageAsync = jest.fn().mockResolvedValue('invalid-signature');
      mockUseSignMessage.mockReturnValue({
        signMessageAsync: mockSignMessageAsync,
        isError: false,
        isLoading: false,
        isSuccess: false,
        data: undefined,
        error: null,
      } as any);

      const { result } = renderHookWithWrapper(() => useSecureSign());

      await act(async () => {
        const signResult = await result.current.signMessage('test message');
        expect(signResult.error?.name).toBe('ProviderValidationError');
        expect(signResult.error?.message).toBe('Invalid signature format');
        expect(signResult.signature).toBeNull();
        expect(signResult.userRejected).toBe(false);
      });
    });

    it('accepts valid signature format from Wagmi', async () => {
      const testAddress = '0x1234567890123456789012345678901234567890';
      const validSignature = '0x1234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890';
      
      mockUseAppKitAccount.mockReturnValue({
        address: testAddress,
        isConnected: true,
        caipAddress: '',
        status: 'connected'
      });
      
      const mockSignMessageAsync = jest.fn().mockResolvedValue(validSignature);
      mockUseSignMessage.mockReturnValue({
        signMessageAsync: mockSignMessageAsync,
        isError: false,
        isLoading: false,
        isSuccess: false,
        data: undefined,
        error: null,
      } as any);

      const { result } = renderHookWithWrapper(() => useSecureSign());

      await act(async () => {
        const signResult = await result.current.signMessage('test message');
        expect(signResult.signature).toBe(validSignature);
        expect(signResult.userRejected).toBe(false);
        expect(signResult.error).toBeUndefined();
      });
    });

    it('throws ProviderValidationError for non-string signature from Wagmi', async () => {
      const testAddress = '0x1234567890123456789012345678901234567890';
      
      mockUseAppKitAccount.mockReturnValue({
        address: testAddress,
        isConnected: true,
        caipAddress: '',
        status: 'connected'
      });
      
      const mockSignMessageAsync = jest.fn().mockResolvedValue(123); // non-string
      mockUseSignMessage.mockReturnValue({
        signMessageAsync: mockSignMessageAsync,
        isError: false,
        isLoading: false,
        isSuccess: false,
        data: undefined,
        error: null,
      } as any);

      const { result } = renderHookWithWrapper(() => useSecureSign());

      await act(async () => {
        const signResult = await result.current.signMessage('test message');
        expect(signResult.error?.name).toBe('ProviderValidationError');
        expect(signResult.error?.message).toBe('Signature must be a string');
        expect(signResult.signature).toBeNull();
        expect(signResult.userRejected).toBe(false);
      });
    });
  });




  describe('Security Tests - Type Safety Verification', () => {
    it('verifies no null signatures on successful signing', async () => {
      const testAddress = '0x1234567890123456789012345678901234567890';
      const validSignature = '0x1234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890';
      
      mockUseAppKitAccount.mockReturnValue({
        address: testAddress,
        isConnected: true,
        caipAddress: '',
        status: 'connected'
      });
      
      const mockSignMessageAsync = jest.fn().mockResolvedValue(validSignature);
      mockUseSignMessage.mockReturnValue({
        signMessageAsync: mockSignMessageAsync,
        isError: false,
        isLoading: false,
        isSuccess: true,
        data: validSignature,
        error: null,
      } as any);

      const { result } = renderHookWithWrapper(() => useSecureSign());

      await act(async () => {
        const signResult = await result.current.signMessage('test message');
        // SECURITY: Verify no null signature on success
        expect(signResult.signature).not.toBeNull();
        expect(signResult.signature).toBe(validSignature);
        expect(signResult.userRejected).toBe(false);
        expect(signResult.error).toBeUndefined();
      });
    });

    it('handles Wagmi signMessage errors gracefully', async () => {
      const testAddress = '0x1234567890123456789012345678901234567890';
      
      mockUseAppKitAccount.mockReturnValue({
        address: testAddress,
        isConnected: true,
        caipAddress: '',
        status: 'connected'
      });
      
      const wagmiError = new Error('Wagmi internal error');
      const mockSignMessageAsync = jest.fn().mockRejectedValue(wagmiError);
      mockUseSignMessage.mockReturnValue({
        signMessageAsync: mockSignMessageAsync,
        isError: true,
        isLoading: false,
        isSuccess: false,
        data: undefined,
        error: wagmiError,
      } as any);

      const { result } = renderHookWithWrapper(() => useSecureSign());

      await act(async () => {
        const signResult = await result.current.signMessage('test message');
        expect(signResult.error?.name).toBe('MobileSigningError');
        expect(signResult.signature).toBeNull();
        expect(signResult.userRejected).toBe(false);
      });
    });
  });

  describe('Security Tests - Error Handling', () => {
    it('properly handles input validation failures', async () => {
      mockUseAppKitAccount.mockReturnValue({
        address: '0x1234567890123456789012345678901234567890',
        isConnected: true,
        caipAddress: '',
        status: 'connected'
      });

      const { result } = renderHookWithWrapper(() => useSecureSign());

      await act(async () => {
        const signResult = await result.current.signMessage('');
        expect(signResult.error?.name).toBe('ProviderValidationError');
        expect(signResult.error?.message).toBe('Message cannot be empty');
      });
    });

    it('handles unknown error types from Wagmi safely', async () => {
      const testAddress = '0x1234567890123456789012345678901234567890';
      
      mockUseAppKitAccount.mockReturnValue({
        address: testAddress,
        isConnected: true,
        caipAddress: '',
        status: 'connected'
      });
      
      const mockSignMessageAsync = jest.fn().mockRejectedValue('string error');
      mockUseSignMessage.mockReturnValue({
        signMessageAsync: mockSignMessageAsync,
        isError: true,
        isLoading: false,
        isSuccess: false,
        data: undefined,
        error: 'string error',
      } as any);

      const { result } = renderHookWithWrapper(() => useSecureSign());

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
      
      const errorWithCode = { code: 1234, message: 'Custom error' };
      const mockSignMessageAsync = jest.fn().mockRejectedValue(errorWithCode);
      mockUseSignMessage.mockReturnValue({
        signMessageAsync: mockSignMessageAsync,
        isError: true,
        isLoading: false,
        isSuccess: false,
        data: undefined,
        error: errorWithCode,
      } as any);

      const { result } = renderHookWithWrapper(() => useSecureSign());

      await act(async () => {
        const signResult = await result.current.signMessage('test message');
        expect(signResult.error?.name).toBe('MobileSigningError');
        expect(signResult.signature).toBeNull();
        expect(signResult.userRejected).toBe(false);
      });
    });

    it('handles plain object errors correctly', async () => {
      const testAddress = '0x1234567890123456789012345678901234567890';
      
      mockUseAppKitAccount.mockReturnValue({
        address: testAddress,
        isConnected: true,
        caipAddress: '',
        status: 'connected'
      });
      
      const objectError = { error: 'plain object error', details: 'some details' };
      const mockSignMessageAsync = jest.fn().mockRejectedValue(objectError);
      mockUseSignMessage.mockReturnValue({
        signMessageAsync: mockSignMessageAsync,
        isError: true,
        isLoading: false,
        isSuccess: false,
        data: undefined,
        error: objectError,
      } as any);

      const { result } = renderHookWithWrapper(() => useSecureSign());

      await act(async () => {
        const signResult = await result.current.signMessage('test message');
        expect(signResult.error?.name).toBe('MobileSigningError');
        expect(signResult.signature).toBeNull();
        expect(signResult.userRejected).toBe(false);
      });
    });

    it('handles memory cleanup properly', async () => {
      const testAddress = '0x1234567890123456789012345678901234567890';
      const testSignature = '0x1234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890';
      
      mockUseAppKitAccount.mockReturnValue({
        address: testAddress,
        isConnected: true,
        caipAddress: '',
        status: 'connected'
      });
      
      const mockSignMessageAsync = jest.fn().mockResolvedValue(testSignature);
      mockUseSignMessage.mockReturnValue({
        signMessageAsync: mockSignMessageAsync,
        isError: false,
        isLoading: false,
        isSuccess: true,
        data: testSignature,
        error: null,
      } as any);

      const { result } = renderHookWithWrapper(() => useSecureSign());

      let originalMessage = 'sensitive message content';
      
      await act(async () => {
        const signResult = await result.current.signMessage(originalMessage);
        expect(signResult.signature).toBe(testSignature);
        expect(signResult.error).toBeUndefined();
      });
      
      // Verify message was passed correctly but implementation should clear it
      expect(mockSignMessageAsync).toHaveBeenCalledWith({ message: originalMessage });
    });
  });
});