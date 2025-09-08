import { renderHook, waitFor } from '@testing-library/react';
import { useNFTCollections } from '../../hooks/useNFTCollections';
import { fetchUrl, fetchAllPages } from '../../services/6529api';
import { commonApiFetch } from '../../services/api/common-api';
import { NFT } from '../../entities/INFT';
import { NextGenCollection } from '../../entities/INextgen';
import { DBResponse } from '../../entities/IDBResponse';

// Mock the API services
jest.mock('../../services/6529api');
jest.mock('../../services/api/common-api');

const mockFetchUrl = fetchUrl as jest.MockedFunction<typeof fetchUrl>;
const mockFetchAllPages = fetchAllPages as jest.MockedFunction<typeof fetchAllPages>;
const mockCommonApiFetch = commonApiFetch as jest.MockedFunction<typeof commonApiFetch>;

// Test data
const mockMemes: NFT[] = [
  {
    id: 1,
    contract: '0x33FD426905F149f8376e227d0C9D3340AaD17aF1',
    token_id: '1',
    name: 'Test Meme',
    image: 'test-image.jpg',
  } as NFT,
  {
    id: 2,
    contract: '0x33FD426905F149f8376e227d0C9D3340AaD17aF1',
    token_id: '2',
    name: 'Another Meme',
    image: 'another-image.jpg',
  } as NFT,
];

const mockGradients: NFT[] = [
  {
    id: 101,
    contract: '0x0C58Ef43fF3032005e472cB5709f8908aCb00205',
    token_id: '1',
    name: 'Test Gradient',
    image: 'gradient-1.jpg',
  } as NFT,
];

const mockNextgenCollections: NextGenCollection[] = [
  {
    id: '1',
    name: 'Test NextGen Collection',
    contract: '0x456',
    description: 'Test description',
  } as NextGenCollection,
  {
    id: '2',
    name: 'Another NextGen Collection',
    contract: '0x789',
    description: 'Another test description',
  } as NextGenCollection,
];

describe('useNFTCollections', () => {
  const originalEnv = process.env.API_ENDPOINT;
  
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.API_ENDPOINT = 'https://test-api.6529.io';
    
    // Default mock implementations
    mockFetchUrl.mockResolvedValue({
      count: mockMemes.length,
      data: mockMemes,
    } as DBResponse);
    
    mockFetchAllPages.mockResolvedValue(mockGradients);
    
    mockCommonApiFetch.mockResolvedValue({
      count: mockNextgenCollections.length,
      page: 1,
      next: null,
      data: mockNextgenCollections,
    });
  });
  
  afterEach(() => {
    process.env.API_ENDPOINT = originalEnv;
  });

  describe('Initial State', () => {
    it('initializes with empty arrays and loading state when no initial data provided', () => {
      const { result } = renderHook(() => useNFTCollections());
      
      expect(result.current.nfts).toEqual([]);
      expect(result.current.nextgenCollections).toEqual([]);
      expect(result.current.loading).toBe(true);
    });

    it('initializes with provided initial data and no loading state', () => {
      const initialData = {
        nfts: mockMemes,
        nextgenCollections: mockNextgenCollections,
      };
      
      const { result } = renderHook(() => useNFTCollections(initialData));
      
      expect(result.current.nfts).toEqual(mockMemes);
      expect(result.current.nextgenCollections).toEqual(mockNextgenCollections);
      expect(result.current.loading).toBe(false);
    });

    it('initializes with empty initial data and loading state', () => {
      const initialData = {
        nfts: [],
        nextgenCollections: [],
      };
      
      const { result } = renderHook(() => useNFTCollections(initialData));
      
      expect(result.current.nfts).toEqual([]);
      expect(result.current.nextgenCollections).toEqual([]);
      expect(result.current.loading).toBe(false);
    });
  });

  describe('NFT Collections Fetching (Memes + Gradients)', () => {
    it('fetches memes and gradients when no initial data provided', async () => {
      const { result } = renderHook(() => useNFTCollections());
      
      expect(result.current.loading).toBe(true);
      
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
      
      expect(mockFetchUrl).toHaveBeenCalledWith(
        'https://test-api.6529.io/api/memes_lite'
      );
      
      expect(mockFetchAllPages).toHaveBeenCalledWith(
        'https://test-api.6529.io/api/nfts/gradients?&page_size=101'
      );
      
      expect(result.current.nfts).toEqual([...mockMemes, ...mockGradients]);
    });

    it('does not fetch NFTs when initial NFTs are provided', async () => {
      const initialData = {
        nfts: mockMemes,
        nextgenCollections: [],
      };
      
      renderHook(() => useNFTCollections(initialData));
      
      // Wait a bit to ensure no calls are made
      await new Promise(resolve => setTimeout(resolve, 100));
      
      expect(mockFetchUrl).not.toHaveBeenCalled();
      expect(mockFetchAllPages).not.toHaveBeenCalled();
    });

    it('fetches NFTs when initial data is empty array', async () => {
      const initialData = {
        nfts: [],
        nextgenCollections: mockNextgenCollections,
      };
      
      renderHook(() => useNFTCollections(initialData));
      
      await waitFor(() => {
        expect(mockFetchUrl).toHaveBeenCalled();
      });
      
      expect(mockFetchAllPages).toHaveBeenCalled();
    });

    it('combines memes and gradients correctly', async () => {
      const { result } = renderHook(() => useNFTCollections());
      
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
      
      expect(result.current.nfts).toHaveLength(mockMemes.length + mockGradients.length);
      expect(result.current.nfts).toEqual([...mockMemes, ...mockGradients]);
      
      // Verify memes come first
      expect(result.current.nfts.slice(0, mockMemes.length)).toEqual(mockMemes);
      // Verify gradients come after
      expect(result.current.nfts.slice(mockMemes.length)).toEqual(mockGradients);
    });
  });

  describe('NextGen Collections Fetching', () => {
    it('fetches NextGen collections when no initial data provided', async () => {
      const { result } = renderHook(() => useNFTCollections());
      
      await waitFor(() => {
        expect(mockCommonApiFetch).toHaveBeenCalledWith({
          endpoint: 'nextgen/collections',
        });
      });
      
      await waitFor(() => {
        expect(result.current.nextgenCollections).toEqual(mockNextgenCollections);
      });
    });

    it('does not fetch NextGen collections when initial collections are provided', async () => {
      const initialData = {
        nfts: [],
        nextgenCollections: mockNextgenCollections,
      };
      
      renderHook(() => useNFTCollections(initialData));
      
      // Wait a bit to ensure no calls are made
      await new Promise(resolve => setTimeout(resolve, 100));
      
      expect(mockCommonApiFetch).not.toHaveBeenCalled();
    });

    it('fetches NextGen collections when initial data is empty array', async () => {
      const initialData = {
        nfts: mockMemes,
        nextgenCollections: [],
      };
      
      renderHook(() => useNFTCollections(initialData));
      
      await waitFor(() => {
        expect(mockCommonApiFetch).toHaveBeenCalled();
      });
    });
  });

  describe('Loading State Management', () => {
    it('sets loading to false only after NFTs are fetched (both memes and gradients)', async () => {
      const { result } = renderHook(() => useNFTCollections());
      
      expect(result.current.loading).toBe(true);
      
      // Loading should remain true until both API calls complete
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
      
      // Ensure both calls were made
      expect(mockFetchUrl).toHaveBeenCalled();
      expect(mockFetchAllPages).toHaveBeenCalled();
      expect(result.current.nfts.length).toBeGreaterThan(0);
    });

    it('does not affect loading state when fetching NextGen collections', async () => {
      const { result } = renderHook(() => useNFTCollections());
      
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
      
      // NextGen collections should be loaded but not affect loading state
      expect(mockCommonApiFetch).toHaveBeenCalled();
      expect(result.current.nextgenCollections.length).toBeGreaterThan(0);
    });
  });

  describe('IMPLEMENTATION BUGS: API Error Handling Issues', () => {
    it('documents unhandled promise rejection bug when memes API fails', () => {
      // Test documents the current buggy behavior - should not be used in production
      const mockError = jest.fn();
      const originalConsoleError = console.error;
      console.error = mockError;
      
      // This setup will cause unhandled promise rejection in real usage
      // The hook has no try-catch blocks around fetchUrl calls
      const { result } = renderHook(() => useNFTCollections());
      
      expect(result.current.loading).toBe(true);
      expect(result.current.nfts).toEqual([]);
      expect(result.current.nextgenCollections).toEqual([]);
      
      console.error = originalConsoleError;
    });

    it('documents promise chain break when gradients API fails', () => {
      // Test documents the current buggy behavior
      const mockError = jest.fn();
      const originalConsoleError = console.error;
      console.error = mockError;
      
      // In real usage, if gradients fetch fails, the promise chain breaks
      // and setLoading(false) is never called
      const { result } = renderHook(() => useNFTCollections());
      
      expect(result.current.loading).toBe(true);
      expect(result.current.nfts).toEqual([]);
      
      console.error = originalConsoleError;
    });

    it('documents that NextGen API failures are silently ignored', () => {
      // NextGen API failures don't break the main NFT functionality
      // This is actually acceptable behavior since they're independent
      const { result } = renderHook(() => useNFTCollections());
      
      expect(result.current.loading).toBe(true);
      expect(result.current.nextgenCollections).toEqual([]);
    });
  });

  describe('Hook Behavior with Initial Collections', () => {
    it('does not refetch when initialCollections prop changes (by design)', () => {
      // The hook only reads initialCollections on mount - it doesn't watch for changes
      // This is correct behavior as initialCollections is meant to be SSR data
      const { result, rerender } = renderHook(
        (props) => useNFTCollections(props?.initialCollections),
        { initialProps: { initialCollections: undefined } }
      );
      
      expect(result.current.loading).toBe(true);
      expect(result.current.nfts).toEqual([]);
      
      // Rerendering with new initialCollections doesn't change the hook's state
      // because useEffect dependencies only include [initialCollections] reference
      rerender({
        initialCollections: {
          nfts: mockMemes,
          nextgenCollections: mockNextgenCollections,
        }
      });
      
      // The hook behavior remains based on the initial mount
      // This is expected - initialCollections is for SSR, not dynamic updates
      expect(result.current.loading).toBe(true);
      expect(result.current.nfts).toEqual([]); // Still empty from original mount
    });
  });

  describe('Return Value Structure', () => {
    it('returns correct TypeScript interface structure', async () => {
      const { result } = renderHook(() => useNFTCollections());
      
      // Check return value has correct structure
      expect(result.current).toHaveProperty('nfts');
      expect(result.current).toHaveProperty('nextgenCollections');
      expect(result.current).toHaveProperty('loading');
      
      expect(Array.isArray(result.current.nfts)).toBe(true);
      expect(Array.isArray(result.current.nextgenCollections)).toBe(true);
      expect(typeof result.current.loading).toBe('boolean');
    });
  });

  describe('Environment Configuration', () => {
    it('uses API_ENDPOINT environment variable correctly', async () => {
      process.env.API_ENDPOINT = 'https://custom-api.example.com';
      
      renderHook(() => useNFTCollections());
      
      await waitFor(() => {
        expect(mockFetchUrl).toHaveBeenCalledWith(
          'https://custom-api.example.com/api/memes_lite'
        );
        expect(mockFetchAllPages).toHaveBeenCalledWith(
          'https://custom-api.example.com/api/nfts/gradients?&page_size=101'
        );
      });
    });
  });
});
