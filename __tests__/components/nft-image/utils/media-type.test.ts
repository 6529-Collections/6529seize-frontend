import { getMediaType, MediaType } from '@/components/nft-image/utils/media-type';
import { BaseNFT, NFTLite } from '@/entities/INFT';

describe('media-type utils', () => {
  describe('getMediaType', () => {
    const createMockNFT = (overrides: Partial<BaseNFT> = {}): BaseNFT => ({
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
      ...overrides
    });

    const createMockNFTLite = (overrides: Partial<NFTLite> = {}): NFTLite => ({
      id: 1,
      contract: '0x123',
      name: 'Test NFT',
      icon: 'https://example.com/icon.png',
      thumbnail: 'https://example.com/thumb.png',
      scaled: 'https://example.com/scaled.png',
      image: 'https://example.com/image.png',
      animation: 'https://example.com/animation.mp4',
      ...overrides
    });

    describe('when animation is false', () => {
      it('returns image type regardless of NFT metadata', () => {
        const nft = createMockNFT({
          metadata: {
            animation_details: { format: 'HTML' }
          }
        });
        
        const result = getMediaType(nft, false);
        expect(result).toBe('image');
      });

      it('returns image type for NFTLite with animation', () => {
        const nft = createMockNFTLite();
        
        const result = getMediaType(nft, false);
        expect(result).toBe('image');
      });
    });

    describe('when animation is true but no animation property', () => {
      it('returns image type when animation property is missing', () => {
        const nft = createMockNFT({ animation: '' });
        
        const result = getMediaType(nft, true);
        expect(result).toBe('image');
      });

      it('returns image type when animation property is undefined', () => {
        const nft = createMockNFT({ animation: undefined as any });
        
        const result = getMediaType(nft, true);
        expect(result).toBe('image');
      });

      it('returns image type when animation property is null', () => {
        const nft = createMockNFT({ animation: null as any });
        
        const result = getMediaType(nft, true);
        expect(result).toBe('image');
      });
    });

    describe('when animation is true but NFT has no metadata', () => {
      it('returns image type for BaseNFT without metadata', () => {
        const nft = createMockNFT({ metadata: undefined });
        
        const result = getMediaType(nft, true);
        expect(result).toBe('image');
      });

      it('returns image type for BaseNFT with null metadata', () => {
        const nft = createMockNFT({ metadata: null });
        
        const result = getMediaType(nft, true);
        expect(result).toBe('image');
      });

      it('returns image type for NFTLite (no metadata property)', () => {
        const nft = createMockNFTLite();
        
        const result = getMediaType(nft, true);
        expect(result).toBe('image');
      });
    });

    describe('when animation is true but no animation_details', () => {
      it('returns image type when animation_details is missing', () => {
        const nft = createMockNFT({
          metadata: {}
        });
        
        const result = getMediaType(nft, true);
        expect(result).toBe('image');
      });

      it('returns image type when animation_details is null', () => {
        const nft = createMockNFT({
          metadata: { animation_details: null }
        });
        
        const result = getMediaType(nft, true);
        expect(result).toBe('image');
      });

      it('returns image type when animation_details format is missing', () => {
        const nft = createMockNFT({
          metadata: { animation_details: {} }
        });
        
        const result = getMediaType(nft, true);
        expect(result).toBe('image');
      });

      it('returns image type when animation_details format is null', () => {
        const nft = createMockNFT({
          metadata: { animation_details: { format: null } }
        });
        
        const result = getMediaType(nft, true);
        expect(result).toBe('image');
      });
    });

    describe('when animation is true and format is available', () => {
      describe('HTML format', () => {
        it('returns html for uppercase HTML', () => {
          const nft = createMockNFT({
            metadata: {
              animation_details: { format: 'HTML' }
            }
          });
          
          const result = getMediaType(nft, true);
          expect(result).toBe('html');
        });

        it('returns html for lowercase html', () => {
          const nft = createMockNFT({
            metadata: {
              animation_details: { format: 'html' }
            }
          });
          
          const result = getMediaType(nft, true);
          expect(result).toBe('html');
        });

        it('returns html for mixed case Html', () => {
          const nft = createMockNFT({
            metadata: {
              animation_details: { format: 'Html' }
            }
          });
          
          const result = getMediaType(nft, true);
          expect(result).toBe('html');
        });
      });

      describe('GLB format', () => {
        it('returns glb for uppercase GLB', () => {
          const nft = createMockNFT({
            metadata: {
              animation_details: { format: 'GLB' }
            }
          });
          
          const result = getMediaType(nft, true);
          expect(result).toBe('glb');
        });

        it('returns glb for lowercase glb', () => {
          const nft = createMockNFT({
            metadata: {
              animation_details: { format: 'glb' }
            }
          });
          
          const result = getMediaType(nft, true);
          expect(result).toBe('glb');
        });

        it('returns glb for mixed case Glb', () => {
          const nft = createMockNFT({
            metadata: {
              animation_details: { format: 'Glb' }
            }
          });
          
          const result = getMediaType(nft, true);
          expect(result).toBe('glb');
        });
      });

      describe('Video formats', () => {
        it('returns video for uppercase MP4', () => {
          const nft = createMockNFT({
            metadata: {
              animation_details: { format: 'MP4' }
            }
          });
          
          const result = getMediaType(nft, true);
          expect(result).toBe('video');
        });

        it('returns video for lowercase mp4', () => {
          const nft = createMockNFT({
            metadata: {
              animation_details: { format: 'mp4' }
            }
          });
          
          const result = getMediaType(nft, true);
          expect(result).toBe('video');
        });

        it('returns video for mixed case Mp4', () => {
          const nft = createMockNFT({
            metadata: {
              animation_details: { format: 'Mp4' }
            }
          });
          
          const result = getMediaType(nft, true);
          expect(result).toBe('video');
        });

        it('returns video for uppercase MOV', () => {
          const nft = createMockNFT({
            metadata: {
              animation_details: { format: 'MOV' }
            }
          });
          
          const result = getMediaType(nft, true);
          expect(result).toBe('video');
        });

        it('returns video for lowercase mov', () => {
          const nft = createMockNFT({
            metadata: {
              animation_details: { format: 'mov' }
            }
          });
          
          const result = getMediaType(nft, true);
          expect(result).toBe('video');
        });

        it('returns video for mixed case Mov', () => {
          const nft = createMockNFT({
            metadata: {
              animation_details: { format: 'Mov' }
            }
          });
          
          const result = getMediaType(nft, true);
          expect(result).toBe('video');
        });
      });

      describe('Unknown formats', () => {
        it('returns image for unknown format', () => {
          const nft = createMockNFT({
            metadata: {
              animation_details: { format: 'unknown' }
            }
          });
          
          const result = getMediaType(nft, true);
          expect(result).toBe('image');
        });

        it('returns image for gif format', () => {
          const nft = createMockNFT({
            metadata: {
              animation_details: { format: 'gif' }
            }
          });
          
          const result = getMediaType(nft, true);
          expect(result).toBe('image');
        });

        it('returns image for png format', () => {
          const nft = createMockNFT({
            metadata: {
              animation_details: { format: 'png' }
            }
          });
          
          const result = getMediaType(nft, true);
          expect(result).toBe('image');
        });

        it('returns image for jpg format', () => {
          const nft = createMockNFT({
            metadata: {
              animation_details: { format: 'jpg' }
            }
          });
          
          const result = getMediaType(nft, true);
          expect(result).toBe('image');
        });

        it('returns image for empty string format', () => {
          const nft = createMockNFT({
            metadata: {
              animation_details: { format: '' }
            }
          });
          
          const result = getMediaType(nft, true);
          expect(result).toBe('image');
        });

        it('returns image for whitespace format', () => {
          const nft = createMockNFT({
            metadata: {
              animation_details: { format: '  ' }
            }
          });
          
          const result = getMediaType(nft, true);
          expect(result).toBe('image');
        });
      });
    });

    describe('edge cases', () => {
      it('handles deeply nested metadata structure correctly', () => {
        const nft = createMockNFT({
          metadata: {
            other_property: 'value',
            animation_details: {
              format: 'html',
              other_detail: 'value'
            },
            more_data: 'value'
          }
        });
        
        const result = getMediaType(nft, true);
        expect(result).toBe('html');
      });

      it('handles format with extra whitespace', () => {
        const nft = createMockNFT({
          metadata: {
            animation_details: { format: '  mp4  ' }
          }
        });
        
        const result = getMediaType(nft, true);
        expect(result).toBe('image'); // Should not match due to whitespace
      });

      it('throws error for non-string format types (current implementation limitation)', () => {
        const nft = createMockNFT({
          metadata: {
            animation_details: { format: 123 as any }
          }
        });
        
        expect(() => getMediaType(nft, true)).toThrow('format.toLowerCase is not a function');
      });

      it('throws error for boolean format types (current implementation limitation)', () => {
        const nft = createMockNFT({
          metadata: {
            animation_details: { format: true as any }
          }
        });
        
        expect(() => getMediaType(nft, true)).toThrow('format.toLowerCase is not a function');
      });

      it('throws error for array format types (current implementation limitation)', () => {
        const nft = createMockNFT({
          metadata: {
            animation_details: { format: ['html'] as any }
          }
        });
        
        expect(() => getMediaType(nft, true)).toThrow('format.toLowerCase is not a function');
      });

      it('throws error for object format types (current implementation limitation)', () => {
        const nft = createMockNFT({
          metadata: {
            animation_details: { format: { type: 'html' } as any }
          }
        });
        
        expect(() => getMediaType(nft, true)).toThrow('format.toLowerCase is not a function');
      });
    });

    describe('type safety', () => {
      it('works with BaseNFT type', () => {
        const nft: BaseNFT = createMockNFT({
          metadata: { animation_details: { format: 'html' } }
        });
        
        const result: MediaType = getMediaType(nft, true);
        expect(result).toBe('html');
      });

      it('works with NFTLite type', () => {
        const nft: NFTLite = createMockNFTLite();
        
        const result: MediaType = getMediaType(nft, false);
        expect(result).toBe('image');
      });
    });
  });
});
