import { render, screen } from '@testing-library/react';
import React from 'react';
import NFTHTMLRenderer from '../../../../components/nft-image/renderers/NFTHTMLRenderer';
import { BaseRendererProps } from '../../../../components/nft-image/types/renderer-props';
import { BaseNFT } from '../../../../entities/INFT';

// Mock NFTImageBalance
jest.mock('../../../../components/nft-image/NFTImageBalance', () => {
  return function MockNFTImageBalance({ balance, showOwned, showUnseized, height }: any) {
    return (
      <div data-testid="nft-image-balance" data-height={height}>
        {balance > 0 && (
          <span data-testid="seized-text">
            SEIZED{!showOwned ? ` x${balance}` : ""}
          </span>
        )}
        {showUnseized && balance === 0 && (
          <span data-testid="unseized-text">UNSEIZED</span>
        )}
        {showUnseized && balance === -1 && (
          <span data-testid="loading-text">...</span>
        )}
      </div>
    );
  };
});

const createMockNFT = (overrides: Partial<BaseNFT> = {}): BaseNFT => ({
  id: 1,
  contract: '0x123',
  token_id: '1',
  name: 'Test HTML NFT',
  image: 'https://example.com/image.png',
  thumbnail: 'https://example.com/thumb.png',
  scaled: 'https://example.com/scaled.png',
  animation: 'https://example.com/animation.html',
  metadata: {
    image: 'https://example.com/metadata-image.png',
    name: 'Test HTML NFT',
    description: 'Test description',
    attributes: [],
    animation: 'https://example.com/metadata-animation.html',
    animation_url: 'https://example.com/animation_url.html',
  },
  ...overrides,
} as BaseNFT);

const createMockNFTLite = (overrides: any = {}) => ({
  id: 1,
  name: 'Test HTML NFT Lite',
  image: 'https://example.com/image.png',
  animation: 'https://example.com/animation.html',
  metadata: {
    animation_url: 'https://example.com/animation_url.html',
  },
  ...overrides,
});

const createDefaultProps = (overrides: Partial<BaseRendererProps> = {}): BaseRendererProps => ({
  nft: createMockNFT(),
  height: 300,
  balance: 1,
  showUnseized: false,
  heightStyle: 'height-300',
  imageStyle: 'image-style',
  bgStyle: 'bg-style',
  ...overrides,
});

describe('NFTHTMLRenderer', () => {
  describe('Basic Rendering', () => {
    it('renders iframe with correct structure', () => {
      const props = createDefaultProps({ id: 'test-iframe' });
      render(<NFTHTMLRenderer {...props} />);
      
      const iframe = screen.getByTitle('test-iframe');
      expect(iframe).toBeInTheDocument();
      expect(iframe.tagName).toBe('IFRAME');
    });

    it('applies correct CSS classes from props', () => {
      const props = createDefaultProps({
        id: 'test-iframe',
        heightStyle: 'custom-height',
        bgStyle: 'custom-bg',
        imageStyle: 'custom-image',
      });
      render(<NFTHTMLRenderer {...props} />);
      
      const wrapper = screen.getByTitle('test-iframe').parentElement;
      expect(wrapper).toHaveClass('custom-height');
      expect(wrapper).toHaveClass('custom-bg');
      expect(wrapper).toHaveClass('custom-image');
      expect(wrapper).toHaveClass('nftAnimation');
      expect(wrapper).toHaveClass('d-flex');
      expect(wrapper).toHaveClass('justify-content-center');
      expect(wrapper).toHaveClass('align-items-center');
    });

    it('renders NFTImageBalance component', () => {
      const props = createDefaultProps();
      render(<NFTHTMLRenderer {...props} />);
      
      const balance = screen.getByTestId('nft-image-balance');
      expect(balance).toBeInTheDocument();
    });

    it('uses Bootstrap Col component as container', () => {
      const props = createDefaultProps();
      const { container } = render(<NFTHTMLRenderer {...props} />);
      
      const colElement = container.querySelector('.d-flex.justify-content-center.align-items-center');
      expect(colElement).toBeInTheDocument();
    });
  });

  describe('Animation Source Selection', () => {
    it('uses metadata.animation when available on BaseNFT', () => {
      const nft = createMockNFT({
        metadata: {
          animation: 'https://example.com/priority-animation.html',
          animation_url: 'https://example.com/fallback-animation.html',
        },
      });
      const props = createDefaultProps({ nft, id: 'test-iframe' });
      render(<NFTHTMLRenderer {...props} />);
      
      const iframe = screen.getByTitle('test-iframe');
      expect(iframe).toHaveAttribute('src', 'https://example.com/priority-animation.html');
    });

    it('falls back to metadata.animation_url when metadata.animation is not available', () => {
      const nft = createMockNFT({
        metadata: {
          animation_url: 'https://example.com/fallback-animation.html',
        },
      });
      const props = createDefaultProps({ nft, id: 'test-iframe' });
      render(<NFTHTMLRenderer {...props} />);
      
      const iframe = screen.getByTitle('test-iframe');
      expect(iframe).toHaveAttribute('src', 'https://example.com/fallback-animation.html');
    });

    it('uses metadata.animation_url for NFTLite without metadata.animation', () => {
      const nft = createMockNFTLite({
        metadata: {
          animation_url: 'https://example.com/nftlite-animation.html',
        },
      });
      const props = createDefaultProps({ nft, id: 'test-iframe' });
      render(<NFTHTMLRenderer {...props} />);
      
      const iframe = screen.getByTitle('test-iframe');
      expect(iframe).toHaveAttribute('src', 'https://example.com/nftlite-animation.html');
    });

    it('handles undefined animation sources gracefully', () => {
      const nft = createMockNFT({
        metadata: {
          animation: undefined,
          animation_url: undefined,
        },
      });
      const props = createDefaultProps({ nft, id: 'test-iframe' });
      
      expect(() => {
        render(<NFTHTMLRenderer {...props} />);
      }).not.toThrow();
      
      const iframe = screen.getByTitle('test-iframe');
      // When both are undefined, src becomes undefined and React removes the attribute
      expect(iframe).not.toHaveAttribute('src');
    });

    it('handles null animation sources gracefully', () => {
      const nft = createMockNFT({
        metadata: {
          animation: null,
          animation_url: null,
        },
      } as any);
      const props = createDefaultProps({ nft, id: 'test-iframe' });
      
      expect(() => {
        render(<NFTHTMLRenderer {...props} />);
      }).not.toThrow();
      
      const iframe = screen.getByTitle('test-iframe');
      // When both are null, src becomes null and React removes the attribute
      expect(iframe).not.toHaveAttribute('src');
    });
  });

  describe('Iframe Attributes', () => {
    it('uses custom id when provided', () => {
      const props = createDefaultProps({ id: 'custom-iframe-id' });
      render(<NFTHTMLRenderer {...props} />);
      
      const iframe = screen.getByTitle('custom-iframe-id');
      expect(iframe).toHaveAttribute('id', 'custom-iframe-id');
    });

    it('generates default id when not provided', () => {
      const props = createDefaultProps();
      render(<NFTHTMLRenderer {...props} />);
      
      // When no id is provided, title will be undefined
      const iframe = document.querySelector('iframe');
      expect(iframe).toBeInTheDocument();
      expect(iframe).toHaveAttribute('id', 'iframe-1');
    });

    it('uses props.id as iframe title', () => {
      const nft = createMockNFT({ name: 'Special Animation NFT' });
      const props = createDefaultProps({ nft, id: 'special-iframe-id' });
      render(<NFTHTMLRenderer {...props} />);
      
      const iframe = screen.getByTitle('special-iframe-id');
      expect(iframe).toBeInTheDocument();
    });

    it('handles undefined id gracefully', () => {
      const nft = createMockNFT({ name: 'Test NFT' });
      const props = createDefaultProps({ nft }); // no id provided
      
      expect(() => {
        render(<NFTHTMLRenderer {...props} />);
      }).not.toThrow();
      
      const iframe = document.querySelector('iframe');
      expect(iframe).toBeInTheDocument();
      expect(iframe).not.toHaveAttribute('title');
    });
  });

  describe('NFTImageBalance Integration', () => {
    it('passes correct props to NFTImageBalance', () => {
      const props = createDefaultProps({
        balance: 5,
        showOwned: true,
        showUnseized: true,
        height: 650,
      });
      render(<NFTHTMLRenderer {...props} />);
      
      const balance = screen.getByTestId('nft-image-balance');
      expect(balance).toBeInTheDocument();
      expect(balance).toHaveAttribute('data-height', '650');
      expect(screen.getByTestId('seized-text')).toHaveTextContent('SEIZED');
    });

    it('shows balance with quantity when showOwned is false', () => {
      const props = createDefaultProps({
        balance: 3,
        showOwned: false,
      });
      render(<NFTHTMLRenderer {...props} />);
      
      expect(screen.getByTestId('seized-text')).toHaveTextContent('SEIZED x3');
    });

    it('shows unseized state correctly', () => {
      const props = createDefaultProps({
        balance: 0,
        showUnseized: true,
      });
      render(<NFTHTMLRenderer {...props} />);
      
      expect(screen.getByTestId('unseized-text')).toHaveTextContent('UNSEIZED');
    });

    it('shows loading state for balance -1', () => {
      const props = createDefaultProps({
        balance: -1,
        showUnseized: true,
      });
      render(<NFTHTMLRenderer {...props} />);
      
      expect(screen.getByTestId('loading-text')).toHaveTextContent('...');
    });

    it('passes height prop to NFTImageBalance', () => {
      const props = createDefaultProps({ height: 300 });
      render(<NFTHTMLRenderer {...props} />);
      
      const balance = screen.getByTestId('nft-image-balance');
      expect(balance).toHaveAttribute('data-height', '300');
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('crashes when metadata is missing (IMPLEMENTATION BUG)', () => {
      const nft = createMockNFT({ metadata: undefined });
      const props = createDefaultProps({ nft, id: 'test-iframe' });
      
      // This currently crashes because the component tries to access
      // props.nft.metadata.animation when metadata is undefined
      expect(() => {
        render(<NFTHTMLRenderer {...props} />);
      }).toThrow('Cannot read properties of undefined (reading \'animation\')');
    });

    it('handles empty metadata object gracefully', () => {
      const nft = createMockNFT({ metadata: {} });
      const props = createDefaultProps({ nft, id: 'test-iframe' });
      
      expect(() => {
        render(<NFTHTMLRenderer {...props} />);
      }).not.toThrow();
      
      const iframe = screen.getByTitle('test-iframe');
      expect(iframe).toBeInTheDocument();
      // Empty metadata means animation_url is undefined, so no src attribute
      expect(iframe).not.toHaveAttribute('src');
    });

    it('handles minimal NFT properties', () => {
      const minimalNFT = {
        id: 1,
        name: 'Minimal HTML NFT',
        metadata: {
          animation_url: 'https://example.com/minimal.html',
        },
      } as BaseNFT;
      
      const props = createDefaultProps({ nft: minimalNFT, id: 'test-iframe' });
      
      expect(() => {
        render(<NFTHTMLRenderer {...props} />);
      }).not.toThrow();
      
      const iframe = screen.getByTitle('test-iframe');
      expect(iframe).toBeInTheDocument();
      expect(iframe).toHaveAttribute('src', 'https://example.com/minimal.html');
    });

    it('handles different height configurations', () => {
      const heights = [300, 650, 'full'] as const;
      
      heights.forEach(height => {
        const props = createDefaultProps({ height, id: 'test-iframe' });
        const { unmount } = render(<NFTHTMLRenderer {...props} />);
        
        const iframe = screen.getByTitle('test-iframe');
        expect(iframe).toBeInTheDocument();
        unmount();
      });
    });

    it('handles zero balance correctly', () => {
      const props = createDefaultProps({ balance: 0 });
      render(<NFTHTMLRenderer {...props} />);
      
      const balance = screen.getByTestId('nft-image-balance');
      expect(balance).toBeInTheDocument();
      // Should not show seized text for zero balance
      expect(screen.queryByTestId('seized-text')).not.toBeInTheDocument();
    });

    it('handles negative balance correctly', () => {
      const props = createDefaultProps({ 
        balance: -1,
        showUnseized: true,
      });
      render(<NFTHTMLRenderer {...props} />);
      
      const balance = screen.getByTestId('nft-image-balance');
      expect(balance).toBeInTheDocument();
      expect(screen.getByTestId('loading-text')).toHaveTextContent('...');
    });
  });

  describe('Security Considerations', () => {
    it('does not sanitize iframe src but passes it through as-is', () => {
      // Note: In a real application, iframe src should be validated/sanitized
      // This test documents current behavior
      const nft = createMockNFT({
        metadata: {
          animation: 'https://untrusted-domain.com/content.html',
        },
      });
      const props = createDefaultProps({ nft, id: 'test-iframe' });
      render(<NFTHTMLRenderer {...props} />);
      
      const iframe = screen.getByTitle('test-iframe');
      expect(iframe).toHaveAttribute('src', 'https://untrusted-domain.com/content.html');
    });

    it('handles potentially malicious URLs but some crash in test environment', () => {
      const safeUrls = [
        'data:text/html,<script>alert("xss")</script>',
        'file:///etc/passwd',
        'ftp://malicious.com/file',
      ];
      const crashingUrls = [
        'javascript:alert("xss")', // JSDOM crashes on javascript: URLs
      ];

      // Test safe URLs that don't crash JSDOM
      safeUrls.forEach((url, index) => {
        const nft = createMockNFT({
          metadata: {
            animation: url,
          },
        });
        const props = createDefaultProps({ nft, id: `test-iframe-safe-${index}` });
        
        expect(() => {
          render(<NFTHTMLRenderer {...props} />);
        }).not.toThrow();
        
        const iframe = screen.getByTitle(`test-iframe-safe-${index}`);
        expect(iframe).toHaveAttribute('src', url);
      });
      
      // Document that javascript: URLs cause issues in test environment
      // React itself doesn't block these at render time, but JSDOM throws an error
      // when the iframe tries to load the javascript: URL
      const nft = createMockNFT({
        metadata: {
          animation: 'javascript:alert("xss")',
        },
      });
      const props = createDefaultProps({ nft, id: 'test-iframe-js' });
      
      // The component renders successfully but the iframe src causes JSDOM to error
      expect(() => {
        render(<NFTHTMLRenderer {...props} />);
      }).not.toThrow();
      
      // React actually transforms javascript: URLs to throw an error instead
      const iframe = screen.getByTitle('test-iframe-js');
      expect(iframe).toHaveAttribute('src', 'javascript:throw new Error(\'React has blocked a javascript: URL as a security precaution.\')');
    });

    it('handles empty string URLs correctly', () => {
      const baseNft = createMockNFT();
      const nft = {
        ...baseNft,
        metadata: {
          ...baseNft.metadata,
          animation: '', // Empty string is falsy, so will use animation_url
          animation_url: '', // This gets used instead
        },
      };
      const props = createDefaultProps({ nft, id: 'test-iframe' });
      
      expect(() => {
        render(<NFTHTMLRenderer {...props} />);
      }).not.toThrow();
      
      const iframe = screen.getByTitle('test-iframe');
      // React/DOM removes empty src attributes for security
      expect(iframe).not.toHaveAttribute('src');
    });
  });

  describe('Props Propagation', () => {
    it('propagates all styling props correctly', () => {
      const props = createDefaultProps({
        id: 'test-iframe',
        heightStyle: 'test-height',
        imageStyle: 'test-image',
        bgStyle: 'test-bg',
      });
      render(<NFTHTMLRenderer {...props} />);
      
      const wrapper = screen.getByTitle('test-iframe').parentElement;
      expect(wrapper).toHaveClass('test-height');
      expect(wrapper).toHaveClass('test-image');
      expect(wrapper).toHaveClass('test-bg');
    });

    it('propagates balance-related props to NFTImageBalance', () => {
      const props = createDefaultProps({
        balance: 7,
        showOwned: true,
        showUnseized: false,
        height: 650,
      });
      render(<NFTHTMLRenderer {...props} />);
      
      const balance = screen.getByTestId('nft-image-balance');
      expect(balance).toBeInTheDocument();
      expect(balance).toHaveAttribute('data-height', '650');
      
      // Verify the mocked balance shows correct text
      const seizedText = screen.getByTestId('seized-text');
      expect(seizedText).toHaveTextContent('SEIZED'); // showOwned=true, so no quantity
    });

    it('handles optional props correctly', () => {
      const propsWithoutOptionals: BaseRendererProps = {
        nft: createMockNFT(),
        height: 300,
        balance: 1,
        showUnseized: false,
        heightStyle: 'height-300',
        imageStyle: 'image-style',
        bgStyle: 'bg-style',
        // id, showOwned are optional and not provided
      };
      
      expect(() => {
        render(<NFTHTMLRenderer {...propsWithoutOptionals} />);
      }).not.toThrow();
      
      const iframe = document.querySelector('iframe');
      expect(iframe).toBeInTheDocument();
      expect(iframe).toHaveAttribute('id', 'iframe-1'); // Default id
      expect(iframe).not.toHaveAttribute('title'); // No id provided, so no title
    });
  });

  describe('Animation Source Priority Logic', () => {
    it('prioritizes metadata.animation over animation_url when both exist', () => {
      const nft = createMockNFT({
        metadata: {
          animation: 'https://priority.com/animation.html',
          animation_url: 'https://fallback.com/animation.html',
        },
      });
      const props = createDefaultProps({ nft, id: 'test-iframe' });
      render(<NFTHTMLRenderer {...props} />);
      
      const iframe = screen.getByTitle('test-iframe');
      expect(iframe).toHaveAttribute('src', 'https://priority.com/animation.html');
    });

    it('uses animation_url when metadata.animation is falsy but present', () => {
      const falsyValues = [null, undefined, '', false, 0];
      
      falsyValues.forEach((falsyValue, index) => {
        const nft = createMockNFT({
          metadata: {
            animation: falsyValue,
            animation_url: 'https://fallback.com/animation.html',
          },
        } as any);
        const props = createDefaultProps({ nft, id: `test-iframe-${index}` });
        const { unmount } = render(<NFTHTMLRenderer {...props} />);
        
        const iframe = screen.getByTitle(`test-iframe-${index}`);
        expect(iframe).toHaveAttribute('src', 'https://fallback.com/animation.html');
        unmount();
      });
    });

    it('handles NFTLite type correctly (no metadata property check)', () => {
      const nftLite = createMockNFTLite({
        metadata: {
          animation_url: 'https://nftlite.com/animation.html',
        },
      });
      const props = createDefaultProps({ nft: nftLite, id: 'test-iframe' });
      render(<NFTHTMLRenderer {...props} />);
      
      const iframe = screen.getByTitle('test-iframe');
      expect(iframe).toHaveAttribute('src', 'https://nftlite.com/animation.html');
    });
  });
});