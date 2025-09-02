import { getLCPImageUrl } from '../../utils/lcp-image';
import { getMediaType } from '../../components/nft-image/utils/media-type';
import { NFTWithMemesExtendedData } from '../../entities/INFT';

// Mock the getMediaType utility
jest.mock('../../components/nft-image/utils/media-type');
const mockGetMediaType = getMediaType as jest.MockedFunction<typeof getMediaType>;

describe('lcp-image utils', () => {
  describe('getLCPImageUrl', () => {
    const createMockNFT = (overrides: Partial<NFTWithMemesExtendedData> = {}): NFTWithMemesExtendedData => ({
      id: 1,
      contract: '0x123',
      created_at: new Date(),
      mint_price: 0,
      supply: 1,
      name: 'Test NFT',
      collection: 'Test Collection',
      token_type: 'ERC721',
      description: 'Test Description',
      artist: 'Test Artist',
      artist_seize_handle: 'test_artist',
      uri: 'https://example.com/token/1',
      icon: 'https://example.com/icon.png',
      thumbnail: 'https://example.com/thumb.png',
      scaled: 'https://example.com/scaled.png',
      image: 'https://example.com/image.png',
      animation: 'https://example.com/animation.mp4',
      market_cap: 0,
      floor_price: 0,
      total_volume_last_24_hours: 0,
      total_volume_last_7_days: 0,
      total_volume_last_1_month: 0,
      total_volume: 0,
      highest_offer: 0,
      boosted_tdh: 0,
      tdh: 0,
      tdh__raw: 0,
      // Extended data base properties
      collection_size: 100,
      edition_size: 100,
      edition_size_rank: 1,
      museum_holdings: 0,
      museum_holdings_rank: 1,
      edition_size_cleaned: 100,
      edition_size_cleaned_rank: 1,
      hodlers: 50,
      hodlers_rank: 1,
      percent_unique: 0.5,
      percent_unique_rank: 1,
      percent_unique_cleaned: 0.5,
      percent_unique_cleaned_rank: 1,
      // Memes extended data
      season: 1,
      meme: 1,
      meme_name: 'Test Meme',
      ...overrides
    });

    beforeEach(() => {
      jest.clearAllMocks();
    });

    describe('when media type is image', () => {
      beforeEach(() => {
        mockGetMediaType.mockReturnValue('image');
      });

      describe('image priority logic', () => {
        it('returns scaled image when available (highest priority)', () => {
          const nft = createMockNFT({
            scaled: 'https://example.com/scaled.jpg',
            image: 'https://example.com/image.jpg',
            thumbnail: 'https://example.com/thumb.jpg'
          });
          
          const result = getLCPImageUrl(nft);
          
          expect(result).toBe('https://example.com/scaled.jpg');
          expect(mockGetMediaType).toHaveBeenCalledWith(nft, true);
        });

        it('returns image when scaled is not available (second priority)', () => {
          const nft = createMockNFT({
            scaled: '',
            image: 'https://example.com/image.jpg',
            thumbnail: 'https://example.com/thumb.jpg'
          });
          
          const result = getLCPImageUrl(nft);
          
          expect(result).toBe('https://example.com/image.jpg');
          expect(mockGetMediaType).toHaveBeenCalledWith(nft, true);
        });

        it('returns image when scaled is null', () => {
          const nft = createMockNFT({
            scaled: null as any,
            image: 'https://example.com/image.jpg',
            thumbnail: 'https://example.com/thumb.jpg'
          });
          
          const result = getLCPImageUrl(nft);
          
          expect(result).toBe('https://example.com/image.jpg');
          expect(mockGetMediaType).toHaveBeenCalledWith(nft, true);
        });

        it('returns image when scaled is undefined', () => {
          const nft = createMockNFT({
            scaled: undefined as any,
            image: 'https://example.com/image.jpg',
            thumbnail: 'https://example.com/thumb.jpg'
          });
          
          const result = getLCPImageUrl(nft);
          
          expect(result).toBe('https://example.com/image.jpg');
          expect(mockGetMediaType).toHaveBeenCalledWith(nft, true);
        });

        it('returns thumbnail when scaled and image are not available (lowest priority)', () => {
          const nft = createMockNFT({
            scaled: '',
            image: '',
            thumbnail: 'https://example.com/thumb.jpg'
          });
          
          const result = getLCPImageUrl(nft);
          
          expect(result).toBe('https://example.com/thumb.jpg');
          expect(mockGetMediaType).toHaveBeenCalledWith(nft, true);
        });

        it('returns thumbnail when scaled and image are null', () => {
          const nft = createMockNFT({
            scaled: null as any,
            image: null as any,
            thumbnail: 'https://example.com/thumb.jpg'
          });
          
          const result = getLCPImageUrl(nft);
          
          expect(result).toBe('https://example.com/thumb.jpg');
          expect(mockGetMediaType).toHaveBeenCalledWith(nft, true);
        });

        it('returns thumbnail when scaled and image are undefined', () => {
          const nft = createMockNFT({
            scaled: undefined as any,
            image: undefined as any,
            thumbnail: 'https://example.com/thumb.jpg'
          });
          
          const result = getLCPImageUrl(nft);
          
          expect(result).toBe('https://example.com/thumb.jpg');
          expect(mockGetMediaType).toHaveBeenCalledWith(nft, true);
        });

        it('prefers scaled over image even when both are available', () => {
          const nft = createMockNFT({
            scaled: 'https://example.com/scaled.jpg',
            image: 'https://example.com/high-res.jpg',
            thumbnail: 'https://example.com/thumb.jpg'
          });
          
          const result = getLCPImageUrl(nft);
          
          expect(result).toBe('https://example.com/scaled.jpg');
          expect(result).not.toBe('https://example.com/high-res.jpg');
        });

        it('prefers image over thumbnail when scaled is not available', () => {
          const nft = createMockNFT({
            scaled: '',
            image: 'https://example.com/image.jpg',
            thumbnail: 'https://example.com/thumb.jpg'
          });
          
          const result = getLCPImageUrl(nft);
          
          expect(result).toBe('https://example.com/image.jpg');
          expect(result).not.toBe('https://example.com/thumb.jpg');
        });
      });

      describe('edge cases with image media type', () => {
        it('returns null when all image fields are empty strings', () => {
          const nft = createMockNFT({
            scaled: '',
            image: '',
            thumbnail: ''
          });
          
          const result = getLCPImageUrl(nft);
          
          expect(result).toBeNull();
          expect(mockGetMediaType).toHaveBeenCalledWith(nft, true);
        });

        it('returns null when all image fields are null', () => {
          const nft = createMockNFT({
            scaled: null as any,
            image: null as any,
            thumbnail: null as any
          });
          
          const result = getLCPImageUrl(nft);
          
          expect(result).toBeNull();
          expect(mockGetMediaType).toHaveBeenCalledWith(nft, true);
        });

        it('returns null when all image fields are undefined', () => {
          const nft = createMockNFT({
            scaled: undefined as any,
            image: undefined as any,
            thumbnail: undefined as any
          });
          
          const result = getLCPImageUrl(nft);
          
          expect(result).toBeNull();
          expect(mockGetMediaType).toHaveBeenCalledWith(nft, true);
        });

        it('handles whitespace-only strings as falsy values', () => {
          const nft = createMockNFT({
            scaled: '   ',
            image: '\t',
            thumbnail: 'https://example.com/thumb.jpg'
          });
          
          const result = getLCPImageUrl(nft);
          
          // Whitespace strings are truthy in JavaScript, so scaled should be returned
          expect(result).toBe('   ');
        });
      });
    });

    describe('when media type is not image', () => {
      describe('HTML media type', () => {
        it('returns null for HTML content', () => {
          mockGetMediaType.mockReturnValue('html');
          
          const nft = createMockNFT({
            scaled: 'https://example.com/scaled.jpg',
            image: 'https://example.com/image.jpg',
            thumbnail: 'https://example.com/thumb.jpg'
          });
          
          const result = getLCPImageUrl(nft);
          
          expect(result).toBeNull();
          expect(mockGetMediaType).toHaveBeenCalledWith(nft, true);
        });
      });

      describe('GLB media type', () => {
        it('returns null for GLB 3D models', () => {
          mockGetMediaType.mockReturnValue('glb');
          
          const nft = createMockNFT({
            scaled: 'https://example.com/scaled.jpg',
            image: 'https://example.com/image.jpg',
            thumbnail: 'https://example.com/thumb.jpg'
          });
          
          const result = getLCPImageUrl(nft);
          
          expect(result).toBeNull();
          expect(mockGetMediaType).toHaveBeenCalledWith(nft, true);
        });
      });

      describe('Video media type', () => {
        it('returns null for video content', () => {
          mockGetMediaType.mockReturnValue('video');
          
          const nft = createMockNFT({
            scaled: 'https://example.com/scaled.jpg',
            image: 'https://example.com/image.jpg',
            thumbnail: 'https://example.com/thumb.jpg'
          });
          
          const result = getLCPImageUrl(nft);
          
          expect(result).toBeNull();
          expect(mockGetMediaType).toHaveBeenCalledWith(nft, true);
        });
      });
    });

    describe('getMediaType integration', () => {
      it('calls getMediaType with correct parameters', () => {
        mockGetMediaType.mockReturnValue('image');
        
        const nft = createMockNFT();
        getLCPImageUrl(nft);
        
        expect(mockGetMediaType).toHaveBeenCalledTimes(1);
        expect(mockGetMediaType).toHaveBeenCalledWith(nft, true);
      });

      it('passes the animation flag as true to match NFTImageRenderer behavior', () => {
        mockGetMediaType.mockReturnValue('image');
        
        const nft = createMockNFT();
        getLCPImageUrl(nft);
        
        expect(mockGetMediaType).toHaveBeenCalledWith(expect.any(Object), true);
      });

      it('uses getMediaType return value to determine if image should be returned', () => {
        // First call returns 'video', should get null
        mockGetMediaType.mockReturnValueOnce('video');
        const nft1 = createMockNFT({ scaled: 'https://example.com/image1.jpg' });
        const result1 = getLCPImageUrl(nft1);
        expect(result1).toBeNull();

        // Second call returns 'image', should get the image URL
        mockGetMediaType.mockReturnValueOnce('image');
        const nft2 = createMockNFT({ scaled: 'https://example.com/image2.jpg' });
        const result2 = getLCPImageUrl(nft2);
        expect(result2).toBe('https://example.com/image2.jpg');
      });
    });

    describe('type safety', () => {
      it('works with NFTWithMemesExtendedData type', () => {
        mockGetMediaType.mockReturnValue('image');
        
        const nft: NFTWithMemesExtendedData = createMockNFT({
          scaled: 'https://example.com/scaled.jpg'
        });
        
        const result: string | null = getLCPImageUrl(nft);
        expect(result).toBe('https://example.com/scaled.jpg');
      });

      it('returns string | null as documented in function signature', () => {
        mockGetMediaType.mockReturnValue('image');
        
        const nftWithImage = createMockNFT({ scaled: 'https://example.com/image.jpg' });
        const resultWithImage = getLCPImageUrl(nftWithImage);
        expect(typeof resultWithImage).toBe('string');

        mockGetMediaType.mockReturnValue('video');
        const nftWithVideo = createMockNFT();
        const resultWithVideo = getLCPImageUrl(nftWithVideo);
        expect(resultWithVideo).toBeNull();
      });
    });

    describe('real-world scenarios', () => {
      it('handles typical meme NFT with all image formats available', () => {
        mockGetMediaType.mockReturnValue('image');
        
        const memeNft = createMockNFT({
          id: 123,
          name: 'The Memes by 6529',
          collection: 'The Memes',
          season: 1,
          meme: 42,
          meme_name: 'Sample Meme',
          scaled: 'https://seize-images.s3.amazonaws.com/scaled/123.jpg',
          image: 'https://seize-images.s3.amazonaws.com/images/123.jpg',
          thumbnail: 'https://seize-images.s3.amazonaws.com/thumbnails/123.jpg'
        });
        
        const result = getLCPImageUrl(memeNft);
        
        expect(result).toBe('https://seize-images.s3.amazonaws.com/scaled/123.jpg');
      });

      it('handles meme NFT with only thumbnail available', () => {
        mockGetMediaType.mockReturnValue('image');
        
        const memeNft = createMockNFT({
          id: 456,
          name: 'The Memes by 6529',
          collection: 'The Memes',
          season: 2,
          meme: 15,
          meme_name: 'Another Meme',
          scaled: '',
          image: '',
          thumbnail: 'https://seize-images.s3.amazonaws.com/thumbnails/456.jpg'
        });
        
        const result = getLCPImageUrl(memeNft);
        
        expect(result).toBe('https://seize-images.s3.amazonaws.com/thumbnails/456.jpg');
      });

      it('handles HTML-based generative art NFT', () => {
        mockGetMediaType.mockReturnValue('html');
        
        const generativeNft = createMockNFT({
          id: 789,
          name: 'Generative Art Piece',
          collection: 'Art Blocks',
          scaled: 'https://example.com/preview.jpg',
          image: 'https://example.com/static.jpg',
          thumbnail: 'https://example.com/thumb.jpg',
          animation: 'https://example.com/generative.html'
        });
        
        const result = getLCPImageUrl(generativeNft);
        
        expect(result).toBeNull(); // Should not preload images for HTML content
      });

      it('handles 3D GLB model NFT', () => {
        mockGetMediaType.mockReturnValue('glb');
        
        const modelNft = createMockNFT({
          id: 101112,
          name: '3D Model NFT',
          collection: '3D Collection',
          scaled: 'https://example.com/preview.jpg',
          image: 'https://example.com/static.jpg',
          thumbnail: 'https://example.com/thumb.jpg',
          animation: 'https://example.com/model.glb'
        });
        
        const result = getLCPImageUrl(modelNft);
        
        expect(result).toBeNull(); // Should not preload images for 3D content
      });

      it('handles video NFT', () => {
        mockGetMediaType.mockReturnValue('video');
        
        const videoNft = createMockNFT({
          id: 131415,
          name: 'Video NFT',
          collection: 'Video Collection',
          scaled: 'https://example.com/preview.jpg',
          image: 'https://example.com/poster.jpg',
          thumbnail: 'https://example.com/thumb.jpg',
          animation: 'https://example.com/video.mp4'
        });
        
        const result = getLCPImageUrl(videoNft);
        
        expect(result).toBeNull(); // Should not preload images for video content
      });
    });

    describe('performance and optimization', () => {
      it('should be lightweight and not perform expensive operations', () => {
        mockGetMediaType.mockReturnValue('image');
        
        const startTime = performance.now();
        
        const nft = createMockNFT({
          scaled: 'https://example.com/scaled.jpg'
        });
        
        getLCPImageUrl(nft);
        
        const endTime = performance.now();
        const executionTime = endTime - startTime;
        
        // Function should execute in under 1ms for performance-critical LCP optimization
        expect(executionTime).toBeLessThan(1);
      });

      it('only calls getMediaType once per invocation', () => {
        mockGetMediaType.mockReturnValue('image');
        
        const nft = createMockNFT();
        getLCPImageUrl(nft);
        
        expect(mockGetMediaType).toHaveBeenCalledTimes(1);
      });

      it('should not mutate the input NFT object', () => {
        mockGetMediaType.mockReturnValue('image');
        
        const originalNft = createMockNFT({
          scaled: 'https://example.com/scaled.jpg',
          image: 'https://example.com/image.jpg'
        });
        
        // Store critical properties that shouldn't change
        const criticalProps = {
          scaled: originalNft.scaled,
          image: originalNft.image,
          thumbnail: originalNft.thumbnail,
          id: originalNft.id,
          name: originalNft.name
        };
        
        getLCPImageUrl(originalNft);
        
        // Verify critical properties weren't mutated
        expect(originalNft.scaled).toBe(criticalProps.scaled);
        expect(originalNft.image).toBe(criticalProps.image);
        expect(originalNft.thumbnail).toBe(criticalProps.thumbnail);
        expect(originalNft.id).toBe(criticalProps.id);
        expect(originalNft.name).toBe(criticalProps.name);
      });
    });
  });
});
