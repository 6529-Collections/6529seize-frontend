import { renderHook, act } from '@testing-library/react';
import { useSecureSign } from '@/hooks/useSecureSign';
import { useAppKitAccount } from '@reown/appkit/react';
import { useSignMessage } from 'wagmi';
import { UserRejectedRequestError } from 'viem';

// Mock the hooks
jest.mock('@reown/appkit/react', () => ({
  useAppKitAccount: jest.fn(),
}));

jest.mock('wagmi', () => ({
  useSignMessage: jest.fn(),
}));

const mockUseAppKitAccount = useAppKitAccount as jest.MockedFunction<typeof useAppKitAccount>;
const mockUseSignMessage = useSignMessage as jest.MockedFunction<typeof useSignMessage>;

describe('useSecureSign with Wagmi', () => {
  const validAddress = '0x1234567890123456789012345678901234567890';
  const validSignature = '0x1234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890';

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup default successful mocks
    mockUseAppKitAccount.mockReturnValue({
      address: validAddress,
      isConnected: true,
      caipAddress: '',
      status: 'connected'
    });
    
    mockUseSignMessage.mockReturnValue({
      signMessage: jest.fn(),
      signMessageAsync: jest.fn().mockResolvedValue(validSignature),
      data: undefined,
      error: null,
      isError: false,
      isIdle: true,
      isPending: false,
      isSuccess: false,
      reset: jest.fn(),
      status: 'idle',
      variables: undefined,
    } as any);
  });

  describe('Successful signing with Wagmi', () => {
    it('successfully signs message using Wagmi signMessageAsync', async () => {
      const mockSignMessageAsync = jest.fn().mockResolvedValue(validSignature);
      mockUseSignMessage.mockReturnValue({
        signMessageAsync: mockSignMessageAsync,
      } as any);

      const { result } = renderHook(() => useSecureSign());

      await act(async () => {
        const signResult = await result.current.signMessage('test message');
        expect(signResult.signature).toBe(validSignature);
        expect(signResult.userRejected).toBe(false);
        expect(signResult.error).toBeUndefined();
      });

      expect(mockSignMessageAsync).toHaveBeenCalledWith({ message: 'test message' });
    });

    it('handles user rejection correctly', async () => {
      const mockSignMessageAsync = jest.fn().mockRejectedValue(new UserRejectedRequestError(new Error()));
      mockUseSignMessage.mockReturnValue({
        signMessageAsync: mockSignMessageAsync,
      } as any);

      const { result } = renderHook(() => useSecureSign());

      await act(async () => {
        const signResult = await result.current.signMessage('test message');
        expect(signResult.signature).toBeNull();
        expect(signResult.userRejected).toBe(true);
        expect(signResult.error).toBeUndefined();
      });
    });
  });

  describe('Connection validation', () => {
    it('fails when wallet not connected', async () => {
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

    it('fails when address is missing', async () => {
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
  });

  describe('Input validation', () => {
    it('validates empty message', async () => {
      const { result } = renderHook(() => useSecureSign());

      await act(async () => {
        const signResult = await result.current.signMessage('');
        expect(signResult.error?.name).toBe('ProviderValidationError');
        expect(signResult.error?.message).toBe('Message cannot be empty');
        expect(signResult.signature).toBeNull();
        expect(signResult.userRejected).toBe(false);
      });
    });

    it('validates message length', async () => {
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

    it('validates signature format', async () => {
      const mockSignMessageAsync = jest.fn().mockResolvedValue('invalid-signature');
      mockUseSignMessage.mockReturnValue({
        signMessageAsync: mockSignMessageAsync,
      } as any);

      const { result } = renderHook(() => useSecureSign());

      await act(async () => {
        const signResult = await result.current.signMessage('test message');
        expect(signResult.error?.name).toBe('ProviderValidationError');
        expect(signResult.error?.message).toBe('Invalid signature format');
        expect(signResult.signature).toBeNull();
        expect(signResult.userRejected).toBe(false);
      });
    });
  });

  describe('Error handling', () => {
    it('handles generic Wagmi errors', async () => {
      const mockSignMessageAsync = jest.fn().mockRejectedValue(new Error('Wagmi signing failed'));
      mockUseSignMessage.mockReturnValue({
        signMessageAsync: mockSignMessageAsync,
      } as any);

      const { result } = renderHook(() => useSecureSign());

      await act(async () => {
        const signResult = await result.current.signMessage('test message');
        expect(signResult.error?.name).toBe('MobileSigningError');
        expect(signResult.signature).toBeNull();
        expect(signResult.userRejected).toBe(false);
      });
    });

    it('manages signing pending state correctly', async () => {
      const mockSignMessageAsync = jest.fn().mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve(validSignature), 50))
      );
      mockUseSignMessage.mockReturnValue({
        signMessageAsync: mockSignMessageAsync,
      } as any);

      const { result } = renderHook(() => useSecureSign());

      expect(result.current.isSigningPending).toBe(false);

      await act(async () => {
        const signResult = await result.current.signMessage('test message');
        expect(signResult.signature).toBe(validSignature);
      });

      expect(result.current.isSigningPending).toBe(false);
    });
  });
});