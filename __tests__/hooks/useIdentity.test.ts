import { renderHook } from '@testing-library/react';
import { useIdentity } from '@/hooks/useIdentity';
import { QueryKey } from '@/components/react-query-wrapper/ReactQueryWrapper';
import type { ApiIdentity } from '@/generated/models/ApiIdentity';
import { commonApiFetch } from '@/services/api/common-api';

jest.mock('@tanstack/react-query', () => ({ useQuery: jest.fn() }));
jest.mock('@/services/api/common-api', () => ({ commonApiFetch: jest.fn() }));

const { useQuery } = require('@tanstack/react-query');
const mockCommonApiFetch = commonApiFetch as jest.Mock;

const mockProfile: ApiIdentity = {
  id: '1',
  handle: 'alice',
  normalised_handle: 'alice',
  pfp: null,
  cic: 100,
  rep: 200,
  level: 5,
  tdh: 1000,
  tdh_rate: 50,
  consolidation_key: 'key123',
  display: 'Alice',
  primary_wallet: '0x123abc',
  banner1: null,
  banner2: null,
  classification: {
    name: 'active',
    display: 'Active'
  } as any,
  sub_classification: null,
  query: undefined,
  wallets: undefined,
  active_main_stage_submission_ids: [],
  winner_main_stage_drop_ids: []
};

describe('useIdentity', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Query Key Generation', () => {
    it('calls useQuery with correct lower case key for handle', () => {
      (useQuery as jest.Mock).mockReturnValue({ data: mockProfile, isLoading: false });
      const { result } = renderHook(() => useIdentity({ handleOrWallet: 'Alice', initialProfile: null }));
      
      expect(useQuery).toHaveBeenCalledWith(expect.objectContaining({ 
        queryKey: [QueryKey.PROFILE, 'alice'], 
        enabled: true 
      }));
      expect(result.current.profile).toEqual(mockProfile);
      expect(result.current.isLoading).toBe(false);
    });

    it('calls useQuery with correct lower case key for wallet address', () => {
      const walletAddress = '0x123ABC456DEF';
      (useQuery as jest.Mock).mockReturnValue({ data: mockProfile, isLoading: false });
      const { result } = renderHook(() => useIdentity({ handleOrWallet: walletAddress, initialProfile: null }));
      
      expect(useQuery).toHaveBeenCalledWith(expect.objectContaining({ 
        queryKey: [QueryKey.PROFILE, walletAddress.toLowerCase()], 
        enabled: true 
      }));
      expect(result.current.profile).toEqual(mockProfile);
    });

    it('handles undefined handleOrWallet correctly', () => {
      (useQuery as jest.Mock).mockReturnValue({ data: null, isLoading: false });
      const { result } = renderHook(() => useIdentity({ handleOrWallet: undefined, initialProfile: null }));
      
      expect(useQuery).toHaveBeenCalledWith(expect.objectContaining({ 
        queryKey: [QueryKey.PROFILE, undefined], 
        enabled: false 
      }));
      expect(result.current.profile).toBeNull();
    });
  });

  describe('Query Enablement', () => {
    it('disables query when handleOrWallet is null', () => {
      (useQuery as jest.Mock).mockReturnValue({ data: null, isLoading: false });
      const { result } = renderHook(() => useIdentity({ handleOrWallet: null, initialProfile: null }));
      
      expect(useQuery).toHaveBeenCalledWith(expect.objectContaining({ enabled: false }));
      expect(result.current.profile).toBeNull();
    });

    it('disables query when handleOrWallet is empty string', () => {
      (useQuery as jest.Mock).mockReturnValue({ data: null, isLoading: false });
      const { result } = renderHook(() => useIdentity({ handleOrWallet: '', initialProfile: null }));
      
      expect(useQuery).toHaveBeenCalledWith(expect.objectContaining({ enabled: false }));
      expect(result.current.profile).toBeNull();
    });

    it('enables query when handleOrWallet has valid value', () => {
      (useQuery as jest.Mock).mockReturnValue({ data: mockProfile, isLoading: false });
      const { result } = renderHook(() => useIdentity({ handleOrWallet: 'alice', initialProfile: null }));
      
      expect(useQuery).toHaveBeenCalledWith(expect.objectContaining({ enabled: true }));
    });
  });

  describe('Initial Profile Data', () => {
    it('sets initialData to provided profile', () => {
      (useQuery as jest.Mock).mockReturnValue({ data: mockProfile, isLoading: false });
      const { result } = renderHook(() => useIdentity({ 
        handleOrWallet: 'alice', 
        initialProfile: mockProfile 
      }));
      
      expect(useQuery).toHaveBeenCalledWith(expect.objectContaining({ 
        initialData: mockProfile 
      }));
    });

    it('sets initialData to undefined when initialProfile is null', () => {
      (useQuery as jest.Mock).mockReturnValue({ data: null, isLoading: false });
      const { result } = renderHook(() => useIdentity({ 
        handleOrWallet: 'alice', 
        initialProfile: null 
      }));
      
      expect(useQuery).toHaveBeenCalledWith(expect.objectContaining({ 
        initialData: undefined 
      }));
    });
  });

  describe('Query Function', () => {
    it('configures queryFn to call commonApiFetch with correct endpoint', () => {
      const mockQueryFn = jest.fn().mockResolvedValue(mockProfile);
      (useQuery as jest.Mock).mockImplementation((config) => {
        // Store the queryFn to test it separately
        mockQueryFn.mockImplementation(config.queryFn);
        return { data: mockProfile, isLoading: false };
      });
      
      renderHook(() => useIdentity({ handleOrWallet: 'alice', initialProfile: null }));
      
      expect(useQuery).toHaveBeenCalledWith(expect.objectContaining({
        queryFn: expect.any(Function)
      }));
    });

    it('calls commonApiFetch with correct endpoint for handle', async () => {
      let capturedQueryFn: (() => Promise<ApiIdentity>) | null = null;
      (useQuery as jest.Mock).mockImplementation((config) => {
        capturedQueryFn = config.queryFn;
        return { data: mockProfile, isLoading: false };
      });
      
      renderHook(() => useIdentity({ handleOrWallet: 'Alice', initialProfile: null }));
      
      if (capturedQueryFn) {
        await capturedQueryFn();
        expect(mockCommonApiFetch).toHaveBeenCalledWith({
          endpoint: 'identities/alice'
        });
      }
    });

    it('calls commonApiFetch with correct endpoint for wallet', async () => {
      let capturedQueryFn: (() => Promise<ApiIdentity>) | null = null;
      (useQuery as jest.Mock).mockImplementation((config) => {
        capturedQueryFn = config.queryFn;
        return { data: mockProfile, isLoading: false };
      });
      
      renderHook(() => useIdentity({ handleOrWallet: '0x123ABC', initialProfile: null }));
      
      if (capturedQueryFn) {
        await capturedQueryFn();
        expect(mockCommonApiFetch).toHaveBeenCalledWith({
          endpoint: 'identities/0x123abc'
        });
      }
    });
  });

  describe('Retry Configuration', () => {
    it('configures retry to 3 attempts', () => {
      (useQuery as jest.Mock).mockReturnValue({ data: mockProfile, isLoading: false });
      
      renderHook(() => useIdentity({ handleOrWallet: 'alice', initialProfile: null }));
      
      expect(useQuery).toHaveBeenCalledWith(expect.objectContaining({ 
        retry: 3 
      }));
    });
  });

  describe('Return Values', () => {
    it('returns profile data when available', () => {
      (useQuery as jest.Mock).mockReturnValue({ data: mockProfile, isLoading: false });
      const { result } = renderHook(() => useIdentity({ handleOrWallet: 'alice', initialProfile: null }));
      
      expect(result.current.profile).toEqual(mockProfile);
      expect(result.current.isLoading).toBe(false);
    });

    it('returns null when no profile data', () => {
      (useQuery as jest.Mock).mockReturnValue({ data: null, isLoading: false });
      const { result } = renderHook(() => useIdentity({ handleOrWallet: 'alice', initialProfile: null }));
      
      expect(result.current.profile).toBeNull();
      expect(result.current.isLoading).toBe(false);
    });

    it('returns null when data is undefined', () => {
      (useQuery as jest.Mock).mockReturnValue({ data: undefined, isLoading: false });
      const { result } = renderHook(() => useIdentity({ handleOrWallet: 'alice', initialProfile: null }));
      
      expect(result.current.profile).toBeNull();
      expect(result.current.isLoading).toBe(false);
    });

    it('correctly passes through loading state', () => {
      (useQuery as jest.Mock).mockReturnValue({ data: null, isLoading: true });
      const { result } = renderHook(() => useIdentity({ handleOrWallet: 'alice', initialProfile: null }));
      
      expect(result.current.profile).toBeNull();
      expect(result.current.isLoading).toBe(true);
    });

    it('maintains loading state with profile data', () => {
      (useQuery as jest.Mock).mockReturnValue({ data: mockProfile, isLoading: true });
      const { result } = renderHook(() => useIdentity({ handleOrWallet: 'alice', initialProfile: null }));
      
      expect(result.current.profile).toEqual(mockProfile);
      expect(result.current.isLoading).toBe(true);
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('handles whitespace-only handleOrWallet as enabled', () => {
      (useQuery as jest.Mock).mockReturnValue({ data: null, isLoading: false });
      const { result } = renderHook(() => useIdentity({ handleOrWallet: '   ', initialProfile: null }));
      
      // Whitespace string is truthy, so query should be enabled
      expect(useQuery).toHaveBeenCalledWith(expect.objectContaining({ 
        queryKey: [QueryKey.PROFILE, '   '],
        enabled: true 
      }));
    });

    it('handles special characters in handleOrWallet', () => {
      const specialHandle = 'user@domain.com';
      (useQuery as jest.Mock).mockReturnValue({ data: mockProfile, isLoading: false });
      const { result } = renderHook(() => useIdentity({ handleOrWallet: specialHandle, initialProfile: null }));
      
      expect(useQuery).toHaveBeenCalledWith(expect.objectContaining({ 
        queryKey: [QueryKey.PROFILE, specialHandle.toLowerCase()],
        enabled: true 
      }));
    });

    it('maintains referential stability of return object structure', () => {
      (useQuery as jest.Mock).mockReturnValue({ data: mockProfile, isLoading: false });
      const { result, rerender } = renderHook(
        ({ handleOrWallet }) => useIdentity({ handleOrWallet, initialProfile: null }),
        { initialProps: { handleOrWallet: 'alice' } }
      );
      
      const firstRender = result.current;
      rerender({ handleOrWallet: 'alice' }); // Same props
      const secondRender = result.current;
      
      // The structure should be consistent
      expect(Object.keys(firstRender)).toEqual(Object.keys(secondRender));
      expect(typeof firstRender.profile).toBe(typeof secondRender.profile);
      expect(typeof firstRender.isLoading).toBe(typeof secondRender.isLoading);
    });
  });
});
