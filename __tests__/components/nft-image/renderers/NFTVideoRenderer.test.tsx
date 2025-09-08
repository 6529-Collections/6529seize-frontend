import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import NFTVideoRenderer from '../../../../components/nft-image/renderers/NFTVideoRenderer';
import { BaseRendererProps } from '../../../../components/nft-image/types/renderer-props';
import { BaseNFT } from '../../../../entities/INFT';

// Mock NFTImageBalance to match the new implementation
jest.mock('../../../../components/nft-image/NFTImageBalance', () => {
  return function MockNFTImageBalance({ contract, tokenId, showOwnedIfLoggedIn, showUnseizedIfLoggedIn, height }: any) {
    // Mock the balance state - in real component this comes from useNftBalance hook
    // For tests, we'll derive the balance from the contract/tokenId to make tests predictable
    const mockBalance = tokenId === 1 ? 1 : tokenId === 0 ? 0 : -1;
    
    return (
      <div data-testid="nft-image-balance" data-height={height}>
        {mockBalance > 0 && (
          <span data-testid="seized-text">
            SEIZED{!showOwnedIfLoggedIn ? ` x${mockBalance}` : ""}
          </span>
        )}
        {showUnseizedIfLoggedIn && mockBalance === 0 && (
          <span data-testid="unseized-text">UNSEIZED</span>
        )}
        {showUnseizedIfLoggedIn && mockBalance === -1 && (
          <span data-testid="loading-text">...</span>
        )}
      </div>
    );
  };
});

// Mock the hooks that NFTImageBalance depends on
jest.mock('../../../../components/auth/Auth', () => ({
  useAuth: () => ({
    connectedProfile: { consolidation_key: 'test-key' },
  }),
}));

jest.mock('../../../../hooks/useNftBalance', () => ({
  useNftBalance: ({ tokenId }: any) => ({
    balance: tokenId === 1 ? 1 : tokenId === 0 ? 0 : -1,
    error: null,
  }),
}));

const createMockNFT = (overrides: Partial<BaseNFT> = {}): BaseNFT => ({
  id: 1,
  contract: '0x123',
  token_id: '1',
  name: 'Test Video NFT',
  image: 'https://example.com/image.png',
  thumbnail: 'https://example.com/thumb.png',
  scaled: 'https://example.com/scaled.png',
  animation: 'https://example.com/video.mp4',
  compressed_animation: 'https://example.com/compressed-video.mp4',
  metadata: {
    image: 'https://example.com/metadata-image.png',
    name: 'Test Video NFT',
    description: 'Test description',
    attributes: [],
    animation: 'https://example.com/metadata-video.mp4',
  },
  ...overrides,
});


const createDefaultProps = (overrides: Partial<BaseRendererProps> = {}): BaseRendererProps => ({
  nft: createMockNFT(),
  height: 300,
  showOwnedIfLoggedIn: false,
  showUnseizedIfLoggedIn: false,
  heightStyle: 'height-300',
  imageStyle: 'image-style',
  bgStyle: 'bg-style',
  ...overrides,
});

describe('NFTVideoRenderer', () => {
  describe('Basic Rendering', () => {
    it('renders video element with correct structure', () => {
      const props = createDefaultProps();
      const { container } = render(<NFTVideoRenderer {...props} />);
      
      const video = container.querySelector('video');
      expect(video).toBeInTheDocument();
      expect(video).toHaveAttribute('src');
    });

    it('applies correct CSS classes from props', () => {
      const props = createDefaultProps({
        heightStyle: 'custom-height',
        bgStyle: 'custom-bg',
        imageStyle: 'custom-image',
      });
      const { container } = render(<NFTVideoRenderer {...props} />);
      
      const video = container.querySelector('video');
      const wrapper = video?.parentElement;
      expect(wrapper).toHaveClass('custom-height');
      expect(wrapper).toHaveClass('custom-bg');
      expect(wrapper).toHaveClass('nftAnimation');
      expect(wrapper).toHaveClass('d-flex');
      expect(wrapper).toHaveClass('justify-content-center');
      expect(wrapper).toHaveClass('align-items-center');
      
      expect(video).toHaveClass('custom-image');
    });

    it('renders NFTImageBalance component', () => {
      const props = createDefaultProps();
      render(<NFTVideoRenderer {...props} />);
      
      const balance = screen.getByTestId('nft-image-balance');
      expect(balance).toBeInTheDocument();
    });

    it('uses Bootstrap Col component as container', () => {
      const props = createDefaultProps();
      const { container } = render(<NFTVideoRenderer {...props} />);
      
      const colElement = container.querySelector('.d-flex.justify-content-center.align-items-center');
      expect(colElement).toBeInTheDocument();
    });
  });

  describe('Video Source Selection', () => {
    it('uses compressed_animation by default when available', () => {
      const props = createDefaultProps();
      const { container } = render(<NFTVideoRenderer {...props} />);
      
      const video = container.querySelector('video');
      expect(video).toHaveAttribute('src', 'https://example.com/compressed-video.mp4');
    });

    it('uses original animation when showOriginal is true', () => {
      const props = createDefaultProps({ showOriginal: true });
      const { container } = render(<NFTVideoRenderer {...props} />);
      
      const video = container.querySelector('video');
      expect(video).toHaveAttribute('src', 'https://example.com/video.mp4');
    });

    it('falls back to original animation when compressed_animation is not available', () => {
      const nft = createMockNFT({ compressed_animation: undefined });
      const props = createDefaultProps({ nft });
      const { container } = render(<NFTVideoRenderer {...props} />);
      
      const video = container.querySelector('video');
      expect(video).toHaveAttribute('src', 'https://example.com/video.mp4');
    });

    it('uses original animation when compressed_animation is null', () => {
      const nft = createMockNFT({ compressed_animation: null });
      const props = createDefaultProps({ nft });
      const { container } = render(<NFTVideoRenderer {...props} />);
      
      const video = container.querySelector('video');
      expect(video).toHaveAttribute('src', 'https://example.com/video.mp4');
    });

    it('uses original animation when compressed_animation is empty string', () => {
      const nft = createMockNFT({ compressed_animation: '' });
      const props = createDefaultProps({ nft });
      const { container } = render(<NFTVideoRenderer {...props} />);
      
      const video = container.querySelector('video');
      expect(video).toHaveAttribute('src', 'https://example.com/video.mp4');
    });
  });

  describe('Video Attributes', () => {
    it('sets correct video attributes', () => {
      const props = createDefaultProps();
      const { container } = render(<NFTVideoRenderer {...props} />);
      
      const video = container.querySelector('video');
      expect(video).toHaveAttribute('autoplay');
      expect(video).toHaveProperty('muted', true);
      expect(video).toHaveAttribute('controls');
      expect(video).toHaveAttribute('loop');
      expect(video).toHaveAttribute('playsinline');
    });

    it('uses custom id when provided', () => {
      const props = createDefaultProps({ id: 'custom-video-id' });
      const { container } = render(<NFTVideoRenderer {...props} />);
      
      const video = container.querySelector('video');
      expect(video).toHaveAttribute('id', 'custom-video-id');
    });

    it('generates default id when not provided', () => {
      const props = createDefaultProps();
      const { container } = render(<NFTVideoRenderer {...props} />);
      
      const video = container.querySelector('video');
      expect(video).toHaveAttribute('id', 'video-1');
    });

    it('applies imageStyle class to video element', () => {
      const props = createDefaultProps({ imageStyle: 'custom-video-style' });
      const { container } = render(<NFTVideoRenderer {...props} />);
      
      const video = container.querySelector('video');
      expect(video).toHaveClass('custom-video-style');
    });
  });



  describe('NFTImageBalance Integration', () => {
    it('passes correct props to NFTImageBalance', () => {
      const nft = createMockNFT({ id: 1 }); // id: 1 will result in balance: 1 in our mock
      const props = createDefaultProps({
        nft,
        showOwnedIfLoggedIn: true,
        showUnseizedIfLoggedIn: true,
        height: 650,
      });
      render(<NFTVideoRenderer {...props} />);
      
      const balance = screen.getByTestId('nft-image-balance');
      expect(balance).toBeInTheDocument();
      expect(balance).toHaveAttribute('data-height', '650');
      expect(screen.getByTestId('seized-text')).toHaveTextContent('SEIZED');
    });

    it('shows balance with quantity when showOwnedIfLoggedIn is false', () => {
      const nft = createMockNFT({ id: 1 }); // id: 1 will result in balance: 1 in our mock
      const props = createDefaultProps({
        nft,
        showOwnedIfLoggedIn: false,
      });
      render(<NFTVideoRenderer {...props} />);
      
      expect(screen.getByTestId('seized-text')).toHaveTextContent('SEIZED x1');
    });

    it('shows unseized state correctly', () => {
      const nft = createMockNFT({ id: 0 }); // id: 0 will result in balance: 0 in our mock
      const props = createDefaultProps({
        nft,
        showUnseizedIfLoggedIn: true,
      });
      render(<NFTVideoRenderer {...props} />);
      
      expect(screen.getByTestId('unseized-text')).toHaveTextContent('UNSEIZED');
    });

    it('shows loading state for negative balance', () => {
      const nft = createMockNFT({ id: -1 }); // id: -1 will result in balance: -1 in our mock
      const props = createDefaultProps({
        nft,
        showUnseizedIfLoggedIn: true,
      });
      render(<NFTVideoRenderer {...props} />);
      
      expect(screen.getByTestId('loading-text')).toHaveTextContent('...');
    });

    it('passes height prop to NFTImageBalance', () => {
      const props = createDefaultProps({ height: 300 });
      render(<NFTVideoRenderer {...props} />);
      
      const balance = screen.getByTestId('nft-image-balance');
      expect(balance).toHaveAttribute('data-height', '300');
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('handles missing animation properties gracefully', () => {
      const nft = createMockNFT({ 
        animation: undefined,
        compressed_animation: undefined,
      });
      const props = createDefaultProps({ nft });
      
      expect(() => {
        render(<NFTVideoRenderer {...props} />);
      }).not.toThrow();
      
      const { container } = render(<NFTVideoRenderer {...props} />);
      const video = container.querySelector('video');
      expect(video).toBeInTheDocument();
    });

    it('handles null animation properties gracefully', () => {
      const nft = createMockNFT({ 
        animation: null,
        compressed_animation: null,
      });
      const props = createDefaultProps({ nft });
      
      expect(() => {
        render(<NFTVideoRenderer {...props} />);
      }).not.toThrow();
      
      const { container } = render(<NFTVideoRenderer {...props} />);
      const video = container.querySelector('video');
      expect(video).toBeInTheDocument();
    });

    it('handles missing metadata gracefully', () => {
      const nft = createMockNFT({ metadata: undefined });
      const props = createDefaultProps({ nft });
      
      expect(() => {
        render(<NFTVideoRenderer {...props} />);
      }).not.toThrow();
      
      const { container } = render(<NFTVideoRenderer {...props} />);
      const video = container.querySelector('video');
      expect(video).toBeInTheDocument();
    });

    it('handles empty metadata object gracefully', () => {
      const nft = createMockNFT({ metadata: {} });
      const props = createDefaultProps({ nft });
      
      expect(() => {
        render(<NFTVideoRenderer {...props} />);
      }).not.toThrow();
      
      const { container } = render(<NFTVideoRenderer {...props} />);
      const video = container.querySelector('video');
      expect(video).toBeInTheDocument();
    });

    it('handles minimal NFT properties', () => {
      const minimalNFT = {
        id: 1,
        name: 'Minimal Video NFT',
        animation: 'https://example.com/minimal.mp4',
      } as BaseNFT;
      
      const props = createDefaultProps({ nft: minimalNFT });
      
      expect(() => {
        render(<NFTVideoRenderer {...props} />);
      }).not.toThrow();
      
      const { container } = render(<NFTVideoRenderer {...props} />);
      const video = container.querySelector('video');
      expect(video).toBeInTheDocument();
      expect(video).toHaveAttribute('src', 'https://example.com/minimal.mp4');
    });

    it('handles different height configurations', () => {
      const heights = [300, 650, 'full'] as const;
      
      heights.forEach(height => {
        const props = createDefaultProps({ height });
        const { container, unmount } = render(<NFTVideoRenderer {...props} />);
        
        const video = container.querySelector('video');
        expect(video).toBeInTheDocument();
        unmount();
      });
    });

    it('handles zero balance correctly', () => {
      const nft = createMockNFT({ id: 0 }); // id: 0 will result in balance: 0 in our mock
      const props = createDefaultProps({ nft });
      render(<NFTVideoRenderer {...props} />);
      
      const balance = screen.getByTestId('nft-image-balance');
      expect(balance).toBeInTheDocument();
      // Should not show seized text for zero balance
      expect(screen.queryByTestId('seized-text')).not.toBeInTheDocument();
    });

    it('handles negative balance correctly', () => {
      const nft = createMockNFT({ id: -1 }); // id: -1 will result in balance: -1 in our mock
      const props = createDefaultProps({ 
        nft,
        showUnseizedIfLoggedIn: true,
      });
      render(<NFTVideoRenderer {...props} />);
      
      const balance = screen.getByTestId('nft-image-balance');
      expect(balance).toBeInTheDocument();
      expect(screen.getByTestId('loading-text')).toHaveTextContent('...');
    });
  });

  describe('Props Propagation', () => {
    it('propagates all styling props correctly', () => {
      const props = createDefaultProps({
        heightStyle: 'test-height',
        imageStyle: 'test-image',
        bgStyle: 'test-bg',
      });
      const { container } = render(<NFTVideoRenderer {...props} />);
      
      const video = container.querySelector('video');
      const wrapper = video?.parentElement;
      expect(wrapper).toHaveClass('test-height');
      expect(wrapper).toHaveClass('test-bg');
      expect(video).toHaveClass('test-image');
    });

    it('propagates balance-related props to NFTImageBalance', () => {
      const nft = createMockNFT({ id: 1 }); // id: 1 will result in balance: 1 in our mock
      const props = createDefaultProps({
        nft,
        showOwnedIfLoggedIn: true,
        showUnseizedIfLoggedIn: false,
        height: 650,
      });
      render(<NFTVideoRenderer {...props} />);
      
      const balance = screen.getByTestId('nft-image-balance');
      expect(balance).toBeInTheDocument();
      expect(balance).toHaveAttribute('data-height', '650');
      
      // Verify the mocked balance shows correct text
      const seizedText = screen.getByTestId('seized-text');
      expect(seizedText).toHaveTextContent('SEIZED'); // showOwnedIfLoggedIn=true, so no quantity
    });

    it('handles optional props correctly', () => {
      const propsWithoutOptionals: BaseRendererProps = {
        nft: createMockNFT(),
        height: 300,
        showOwnedIfLoggedIn: false,
        showUnseizedIfLoggedIn: false,
        heightStyle: 'height-300',
        imageStyle: 'image-style',
        bgStyle: 'bg-style',
        // id, showOriginal are optional and not provided
      };
      
      expect(() => {
        render(<NFTVideoRenderer {...propsWithoutOptionals} />);
      }).not.toThrow();
      
      const { container } = render(<NFTVideoRenderer {...propsWithoutOptionals} />);
      const video = container.querySelector('video');
      expect(video).toBeInTheDocument();
      expect(video).toHaveAttribute('id', 'video-1'); // Default id
    });
  });

  describe('Video Source Priority Logic', () => {
    it('prioritizes compressed_animation over animation when showOriginal is false', () => {
      const nft = createMockNFT({
        compressed_animation: 'https://priority.com/compressed.mp4',
        animation: 'https://fallback.com/original.mp4',
      });
      const props = createDefaultProps({ nft, showOriginal: false });
      const { container } = render(<NFTVideoRenderer {...props} />);
      
      const video = container.querySelector('video');
      expect(video).toHaveAttribute('src', 'https://priority.com/compressed.mp4');
    });

    it('uses animation when showOriginal is true regardless of compressed_animation', () => {
      const nft = createMockNFT({
        compressed_animation: 'https://compressed.com/video.mp4',
        animation: 'https://original.com/video.mp4',
      });
      const props = createDefaultProps({ nft, showOriginal: true });
      const { container } = render(<NFTVideoRenderer {...props} />);
      
      const video = container.querySelector('video');
      expect(video).toHaveAttribute('src', 'https://original.com/video.mp4');
    });

    it('uses animation when compressed_animation is falsy', () => {
      const falsyValues = [null, undefined, '', false, 0];
      
      falsyValues.forEach(falsyValue => {
        const nft = createMockNFT({
          compressed_animation: falsyValue,
          animation: 'https://fallback.com/video.mp4',
        } as any);
        const props = createDefaultProps({ nft });
        const { container, unmount } = render(<NFTVideoRenderer {...props} />);
        
        const video = container.querySelector('video');
        expect(video).toHaveAttribute('src', 'https://fallback.com/video.mp4');
        unmount();
      });
    });

    it('handles NFTLite type correctly', () => {
      // Create a simplified NFT-like object that would represent NFTLite with metadata property
      const nftLite = {
        id: 1,
        name: 'Test NFT Lite',
        contract: '0x123',
        token_id: '1',
        compressed_animation: 'https://nftlite.com/compressed.mp4',
        animation: 'https://nftlite.com/original.mp4',
        metadata: {}, // NFTLite can have metadata property
      };
      const props = createDefaultProps({ nft: nftLite as any });
      const { container } = render(<NFTVideoRenderer {...props} />);
      
      const video = container.querySelector('video');
      expect(video).toHaveAttribute('src', 'https://nftlite.com/compressed.mp4');
    });
  });

  describe('Accessibility and Standards Compliance', () => {
    it('provides proper video element structure', () => {
      const props = createDefaultProps();
      const { container } = render(<NFTVideoRenderer {...props} />);
      
      const video = container.querySelector('video');
      expect(video).toBeInTheDocument();
      expect(video).toHaveProperty('muted', true); // Important for autoplay
      expect(video).toHaveAttribute('controls'); // Accessibility
      expect(video).toHaveAttribute('playsinline'); // Mobile compatibility
    });

    it('handles missing NFT name gracefully in video context', () => {
      const nft = createMockNFT({ name: undefined as any });
      const props = createDefaultProps({ nft });
      const { container } = render(<NFTVideoRenderer {...props} />);
      
      const video = container.querySelector('video');
      expect(video).toBeInTheDocument();
    });

    it('provides proper video attributes for accessibility', () => {
      const props = createDefaultProps();
      const { container } = render(<NFTVideoRenderer {...props} />);
      
      const video = container.querySelector('video');
      expect(video).toHaveAttribute('preload', 'auto');
      expect(video).toHaveAttribute('loop');
      expect(video).toHaveAttribute('autoplay');
    });
  });

  describe('Video Loading and Performance', () => {
    it('sets video to autoplay and loop for optimal user experience', () => {
      const props = createDefaultProps();
      const { container } = render(<NFTVideoRenderer {...props} />);
      
      const video = container.querySelector('video');
      expect(video).toHaveAttribute('autoplay');
      expect(video).toHaveAttribute('loop');
      expect(video).toHaveProperty('muted', true); // Required for autoplay in most browsers
    });

    it('sets preload to auto for better performance', () => {
      const props = createDefaultProps();
      const { container } = render(<NFTVideoRenderer {...props} />);
      
      const video = container.querySelector('video');
      expect(video).toHaveAttribute('preload', 'auto');
    });
  });

  describe('Video Source Logic Edge Cases', () => {
    it('handles metadata check correctly for BaseNFT vs NFTLite', () => {
      // Test BaseNFT with metadata property
      const nftWithMetadata = createMockNFT({
        compressed_animation: 'https://example.com/compressed.mp4',
        metadata: { animation: 'https://example.com/metadata.mp4' },
      });
      const propsWithMetadata = createDefaultProps({ nft: nftWithMetadata, showOriginal: false });
      const { container: container1 } = render(<NFTVideoRenderer {...propsWithMetadata} />);
      const video1 = container1.querySelector('video');
      expect(video1).toHaveAttribute('src', 'https://example.com/compressed.mp4');
      
      // Test NFT without metadata property
      const nftWithoutMetadata = {
        id: 2,
        name: 'Test',
        contract: '0x123',
        token_id: '2',
        animation: 'https://example.com/original.mp4',
        compressed_animation: 'https://example.com/compressed.mp4',
      };
      const propsWithoutMetadata = createDefaultProps({ nft: nftWithoutMetadata as any, showOriginal: false });
      const { container: container2 } = render(<NFTVideoRenderer {...propsWithoutMetadata} />);
      const video2 = container2.querySelector('video');
      // Should use animation when no metadata property exists
      expect(video2).toHaveAttribute('src', 'https://example.com/original.mp4');
    });

    it('prioritizes showOriginal flag over compressed_animation', () => {
      const nft = createMockNFT({
        compressed_animation: 'https://example.com/compressed.mp4',
        animation: 'https://example.com/original.mp4',
      });
      
      // Test showOriginal: true
      const propsOriginal = createDefaultProps({ nft, showOriginal: true });
      const { container: container1 } = render(<NFTVideoRenderer {...propsOriginal} />);
      const video1 = container1.querySelector('video');
      expect(video1).toHaveAttribute('src', 'https://example.com/original.mp4');
      
      // Test showOriginal: false (or undefined)
      const propsCompressed = createDefaultProps({ nft, showOriginal: false });
      const { container: container2 } = render(<NFTVideoRenderer {...propsCompressed} />);
      const video2 = container2.querySelector('video');
      expect(video2).toHaveAttribute('src', 'https://example.com/compressed.mp4');
    });
  });

  describe('Error Resistance and Edge Cases', () => {
    it('handles completely empty NFT animation properties gracefully', () => {
      const nft = createMockNFT({
        animation: undefined,
        compressed_animation: undefined,
        metadata: undefined,
      });
      const props = createDefaultProps({ nft });
      
      expect(() => {
        render(<NFTVideoRenderer {...props} />);
      }).not.toThrow();
      
      const { container } = render(<NFTVideoRenderer {...props} />);
      const video = container.querySelector('video');
      expect(video).toBeInTheDocument();
      // When all animation sources are undefined, src will be undefined but element still renders
      const srcAttribute = video?.getAttribute('src');
      expect(srcAttribute === null || srcAttribute === 'undefined').toBe(true);
    });

    it('renders without breaking when required NFT fields are minimal', () => {
      const minimalNFT = {
        id: 999,
        contract: '0xabc',
        token_id: '999',
        name: 'Minimal NFT',
        animation: 'https://example.com/minimal.mp4',
      } as any;
      
      const props = createDefaultProps({ nft: minimalNFT });
      
      expect(() => {
        render(<NFTVideoRenderer {...props} />);
      }).not.toThrow();
      
      const { container } = render(<NFTVideoRenderer {...props} />);
      const video = container.querySelector('video');
      expect(video).toBeInTheDocument();
      expect(video).toHaveAttribute('src', 'https://example.com/minimal.mp4');
    });
  });
});
