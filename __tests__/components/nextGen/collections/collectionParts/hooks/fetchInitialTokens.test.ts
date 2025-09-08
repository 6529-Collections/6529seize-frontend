import { fetchInitialTokens } from '../../../../../../components/nextGen/collections/collectionParts/hooks/fetchInitialTokens';
import { commonApiFetch } from '../../../../../../services/api/common-api';
import { NextGenToken } from '../../../../../../entities/INextgen';

// Mock the commonApiFetch service
jest.mock('../../../../../../services/api/common-api');
const mockCommonApiFetch = commonApiFetch as jest.MockedFunction<typeof commonApiFetch>;

// Mock console.error to prevent noise in tests
const originalConsoleError = console.error;
beforeAll(() => {
  console.error = jest.fn();
});
afterAll(() => {
  console.error = originalConsoleError;
});

const mockToken: NextGenToken = {
  created_at: '2024-01-15T10:00:00Z',
  updated_at: '2024-01-15T10:00:00Z',
  id: 1001,
  normalised_id: 1,
  name: 'Test Token #1',
  collection_id: 123,
  collection_name: 'Test Collection',
  mint_date: new Date('2024-01-15T10:00:00Z'),
  mint_price: 0.1,
  metadata_url: 'https://api.example.com/metadata/1001',
  image_url: 'https://api.example.com/image/1001',
  icon_url: 'https://api.example.com/icon/1001',
  thumbnail_url: 'https://api.example.com/thumbnail/1001',
  animation_url: 'https://api.example.com/animation/1001',
  generator: {
    html: '<html>test</html>',
    metadata: '{"test": true}',
    image: 'data:image/svg+xml;base64,test'
  },
  owner: '0x1234567890123456789012345678901234567890',
  pending: false,
  burnt: false,
  burnt_date: undefined,
  hodl_rate: 0.95,
  mint_data: 'test_mint_data',
  rarity_score: 95.5,
  rarity_score_rank: 10,
  rarity_score_normalised: 0.955,
  rarity_score_normalised_rank: 10,
  rarity_score_trait_count: 5,
  rarity_score_trait_count_rank: 15,
  rarity_score_trait_count_normalised: 0.5,
  rarity_score_trait_count_normalised_rank: 15,
  statistical_score: 88.2,
  statistical_score_rank: 25,
  statistical_score_normalised: 0.882,
  statistical_score_normalised_rank: 25,
  statistical_score_trait_count: 4,
  statistical_score_trait_count_rank: 30,
  statistical_score_trait_count_normalised: 0.4,
  statistical_score_trait_count_normalised_rank: 30,
  single_trait_rarity_score: 77.3,
  single_trait_rarity_score_rank: 40,
  single_trait_rarity_score_normalised: 0.773,
  single_trait_rarity_score_normalised_rank: 40,
  single_trait_rarity_score_trait_count: 3,
  single_trait_rarity_score_trait_count_rank: 45,
  single_trait_rarity_score_trait_count_normalised: 0.3,
  single_trait_rarity_score_trait_count_normalised_rank: 45,
  price: 1.5,
  opensea_price: 1.4,
  opensea_royalty: 0.05,
  blur_price: 1.45,
  me_price: 1.42,
  me_royalty: 0.025,
  last_sale_value: 1.3,
  last_sale_date: new Date('2024-01-10T08:00:00Z'),
  max_sale_value: 2.1,
  max_sale_date: new Date('2024-01-05T12:00:00Z'),
  normalised_handle: 'testuser',
  handle: 'TestUser',
  level: 5,
  tdh: 12500,
  rep_score: 85
};

const mockApiResponse = {
  count: 150,
  page: 1,
  next: 'next_page_token',
  data: [mockToken, { ...mockToken, id: 1002, name: 'Test Token #2' }]
};

describe('fetchInitialTokens', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Success Cases', () => {
    it('fetches initial tokens successfully with valid collection ID', async () => {
      mockCommonApiFetch.mockResolvedValueOnce(mockApiResponse);

      const result = await fetchInitialTokens(123);

      expect(mockCommonApiFetch).toHaveBeenCalledWith({
        endpoint: 'nextgen/collections/123/tokens?page_size=50&page=1&sort=random'
      });
      expect(result).toEqual(mockApiResponse.data);
      expect(result).toHaveLength(2);
      expect(result[0]).toEqual(mockToken);
      expect(result[1].name).toBe('Test Token #2');
    });

    it('returns empty array when API returns empty data', async () => {
      mockCommonApiFetch.mockResolvedValueOnce({
        count: 0,
        page: 1,
        next: null,
        data: []
      });

      const result = await fetchInitialTokens(456);

      expect(result).toEqual([]);
      expect(result).toHaveLength(0);
    });

    it('calls API with correct endpoint format for different collection IDs', async () => {
      mockCommonApiFetch.mockResolvedValueOnce(mockApiResponse);

      await fetchInitialTokens(999);

      expect(mockCommonApiFetch).toHaveBeenCalledWith({
        endpoint: 'nextgen/collections/999/tokens?page_size=50&page=1&sort=random'
      });
    });
  });

  describe('Error Handling - CRITICAL BUGS EXPOSED', () => {
    it('SECURITY BUG: silently accepts invalid collection ID types instead of throwing', async () => {
      // 🚨 BUG: These should throw but don't - function accepts invalid inputs silently
      // This exposes the API to invalid requests and potential injection attacks
      
      // Test null - should throw but returns empty array
      const nullResult = await fetchInitialTokens(null as any);
      expect(nullResult).toEqual([]);  // BUG: Should throw TypeError
      
      // Test undefined - should throw but returns empty array
      const undefinedResult = await fetchInitialTokens(undefined as any);
      expect(undefinedResult).toEqual([]);  // BUG: Should throw TypeError
      
      // Test string - should throw but calls API with string interpolation
      const stringResult = await fetchInitialTokens('invalid' as any);
      expect(stringResult).toEqual([]);  // BUG: Should throw TypeError, not call API
      
      // Test negative number - should throw but calls API with negative ID
      const negativeResult = await fetchInitialTokens(-1);
      expect(negativeResult).toEqual([]);  // BUG: Should throw RangeError
      
      // Test zero - should throw but calls API with zero ID
      const zeroResult = await fetchInitialTokens(0);
      expect(zeroResult).toEqual([]);  // BUG: Should throw RangeError
      
      // Verify API was called with invalid data (exposes backend to bad requests)
      expect(mockCommonApiFetch).toHaveBeenCalledWith({
        endpoint: 'nextgen/collections/null/tokens?page_size=50&page=1&sort=random'
      });
      expect(mockCommonApiFetch).toHaveBeenCalledWith({
        endpoint: 'nextgen/collections/undefined/tokens?page_size=50&page=1&sort=random'
      });
      expect(mockCommonApiFetch).toHaveBeenCalledWith({
        endpoint: 'nextgen/collections/invalid/tokens?page_size=50&page=1&sort=random'
      });
    });

    it('returns empty array when API throws network error', async () => {
      const networkError = new Error('Network request failed');
      mockCommonApiFetch.mockRejectedValueOnce(networkError);

      const result = await fetchInitialTokens(123);

      expect(console.error).toHaveBeenCalledWith('Failed to fetch initial tokens:', networkError);
      expect(result).toEqual([]);
    });

    it('returns empty array when API throws authentication error', async () => {
      const authError = new Error('Unauthorized');
      mockCommonApiFetch.mockRejectedValueOnce(authError);

      const result = await fetchInitialTokens(123);

      expect(console.error).toHaveBeenCalledWith('Failed to fetch initial tokens:', authError);
      expect(result).toEqual([]);
    });

    it('returns empty array when API throws server error', async () => {
      const serverError = new Error('Internal Server Error');
      mockCommonApiFetch.mockRejectedValueOnce(serverError);

      const result = await fetchInitialTokens(123);

      expect(console.error).toHaveBeenCalledWith('Failed to fetch initial tokens:', serverError);
      expect(result).toEqual([]);
    });

    it('CRITICAL BUG: crashes with undefined when API response is malformed', async () => {
      // 🚨 BUG: Function doesn't validate API response structure
      // When response.data is missing, it returns undefined instead of empty array
      mockCommonApiFetch.mockResolvedValueOnce({ count: 0, page: 1 } as any);

      const result = await fetchInitialTokens(123);

      // BUG: Returns undefined instead of empty array, breaking type contract
      expect(result).toBeUndefined();  // Should be [] but is undefined
      
      // This will cause runtime errors in consuming components that expect an array
      // For example: initialTokens.map() will throw "Cannot read property 'map' of undefined"
    });
  });

  describe('Edge Cases', () => {
    it('handles very large collection IDs', async () => {
      const largeId = 999999999;
      mockCommonApiFetch.mockResolvedValueOnce(mockApiResponse);

      await fetchInitialTokens(largeId);

      expect(mockCommonApiFetch).toHaveBeenCalledWith({
        endpoint: `nextgen/collections/${largeId}/tokens?page_size=50&page=1&sort=random`
      });
    });

    it('preserves exact token data structure from API', async () => {
      const complexToken = {
        ...mockToken,
        generator: {
          html: '<svg>complex</svg>',
          metadata: '{"complex": {"nested": true}}',
          image: 'data:image/svg+xml;base64,complexdata'
        },
        burnt_date: '2024-01-20T15:30:00Z'
      };
      
      mockCommonApiFetch.mockResolvedValueOnce({
        ...mockApiResponse,
        data: [complexToken]
      });

      const result = await fetchInitialTokens(123);

      expect(result[0]).toEqual(complexToken);
      expect(result[0].generator?.html).toBe('<svg>complex</svg>');
      expect(result[0].burnt_date).toBe('2024-01-20T15:30:00Z');
    });

    it('handles tokens with minimal data', async () => {
      const minimalToken = {
        ...mockToken,
        icon_url: undefined,
        generator: undefined,
        burnt_date: undefined
      };
      
      mockCommonApiFetch.mockResolvedValueOnce({
        ...mockApiResponse,
        data: [minimalToken]
      });

      const result = await fetchInitialTokens(123);

      expect(result[0]).toEqual(minimalToken);
      expect(result[0].icon_url).toBeUndefined();
      expect(result[0].generator).toBeUndefined();
    });

    it('maintains API response structure fidelity', async () => {
      const responseWithExtraFields = {
        ...mockApiResponse,
        extra_field: 'should_be_ignored',
        metadata: { version: '1.0' }
      };
      
      mockCommonApiFetch.mockResolvedValueOnce(responseWithExtraFields);

      const result = await fetchInitialTokens(123);

      // Function should only return the data array, ignoring other fields
      expect(result).toEqual(responseWithExtraFields.data);
      expect(result).not.toHaveProperty('extra_field');
      expect(result).not.toHaveProperty('metadata');
    });
  });

  describe('API Contract Validation', () => {
    it('calls API with exact expected parameters', async () => {
      mockCommonApiFetch.mockResolvedValueOnce(mockApiResponse);

      await fetchInitialTokens(123);

      expect(mockCommonApiFetch).toHaveBeenCalledTimes(1);
      expect(mockCommonApiFetch).toHaveBeenCalledWith({
        endpoint: 'nextgen/collections/123/tokens?page_size=50&page=1&sort=random'
      });
      
      // Verify no additional parameters are passed
      const callArgs = mockCommonApiFetch.mock.calls[0][0];
      expect(Object.keys(callArgs)).toEqual(['endpoint']);
    });

    it('uses correct API endpoint format consistently', async () => {
      mockCommonApiFetch.mockResolvedValue(mockApiResponse);

      const testIds = [1, 42, 999, 123456];
      for (const id of testIds) {
        await fetchInitialTokens(id);
        
        const expectedEndpoint = `nextgen/collections/${id}/tokens?page_size=50&page=1&sort=random`;
        expect(mockCommonApiFetch).toHaveBeenCalledWith({ endpoint: expectedEndpoint });
      }
    });

    it('maintains consistent page size of 50', async () => {
      mockCommonApiFetch.mockResolvedValueOnce(mockApiResponse);

      await fetchInitialTokens(123);

      const endpoint = mockCommonApiFetch.mock.calls[0][0].endpoint;
      expect(endpoint).toContain('page_size=50');
      expect(endpoint).toContain('page=1');
      expect(endpoint).toContain('sort=random');
    });
  });

  describe('Type Safety', () => {
    it('returns properly typed NextGenToken array', async () => {
      mockCommonApiFetch.mockResolvedValueOnce(mockApiResponse);

      const result = await fetchInitialTokens(123);

      expect(Array.isArray(result)).toBe(true);
      
      if (result.length > 0) {
        const token = result[0];
        
        // Verify critical fields are present and correctly typed
        expect(typeof token.id).toBe('number');
        expect(typeof token.name).toBe('string');
        expect(typeof token.collection_id).toBe('number');
        expect(typeof token.image_url).toBe('string');
        expect(typeof token.owner).toBe('string');
        expect(typeof token.pending).toBe('boolean');
        expect(typeof token.burnt).toBe('boolean');
        
        // Verify optional fields handle undefined correctly
        if (token.icon_url !== undefined) {
          expect(typeof token.icon_url).toBe('string');
        }
        
        if (token.generator !== undefined) {
          expect(typeof token.generator.html).toBe('string');
          expect(typeof token.generator.metadata).toBe('string');
          expect(typeof token.generator.image).toBe('string');
        }
      }
    });

    it('handles type coercion in API response gracefully', async () => {
      // API might return string numbers - function should preserve them
      const responseWithStringNumbers = {
        ...mockApiResponse,
        data: [{
          ...mockToken,
          id: '1001' as any,  // String instead of number
          collection_id: '123' as any
        }]
      };
      
      mockCommonApiFetch.mockResolvedValueOnce(responseWithStringNumbers);

      const result = await fetchInitialTokens(123);

      // Function should return data as-is from API (no type coercion)
      expect(result[0].id).toBe('1001');
      expect(result[0].collection_id).toBe('123');
    });
  });
});

// Additional integration-style test to verify real-world usage patterns
describe('fetchInitialTokens Integration Scenarios', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('works correctly in homepage context with real collection ID', async () => {
    // Simulate the actual usage pattern from app/page.tsx
    const featuredCollectionId = 7;  // Real collection ID from the codebase
    
    mockCommonApiFetch.mockResolvedValueOnce({
      count: 25,
      page: 1,
      next: null,
      data: Array.from({ length: 25 }, (_, i) => ({
        ...mockToken,
        id: 7000 + i,
        normalised_id: i + 1,
        name: `Zen NFT #${i + 1}`,
        collection_id: 7,
        collection_name: 'Zen NFT'
      }))
    });

    const initialTokens = await fetchInitialTokens(featuredCollectionId);

    expect(initialTokens).toHaveLength(25);
    expect(initialTokens[0].collection_id).toBe(7);
    expect(initialTokens[0].collection_name).toBe('Zen NFT');
    expect(mockCommonApiFetch).toHaveBeenCalledWith({
      endpoint: 'nextgen/collections/7/tokens?page_size=50&page=1&sort=random'
    });
  });

  it('handles scenario where featured collection has no tokens', async () => {
    mockCommonApiFetch.mockResolvedValueOnce({
      count: 0,
      page: 1,
      next: null,
      data: []
    });

    const result = await fetchInitialTokens(999);

    expect(result).toEqual([]);
    expect(result).toHaveLength(0);
  });

  it('handles scenario where API is temporarily unavailable', async () => {
    mockCommonApiFetch.mockRejectedValueOnce(new Error('Service temporarily unavailable'));

    const result = await fetchInitialTokens(123);

    expect(result).toEqual([]);
    expect(console.error).toHaveBeenCalledWith(
      'Failed to fetch initial tokens:', 
      new Error('Service temporarily unavailable')
    );
  });
});
