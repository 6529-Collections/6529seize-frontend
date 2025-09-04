import { render, screen } from '@testing-library/react';
import React from 'react';
import NFTModelRenderer from '../../../../components/nft-image/renderers/NFTModelRenderer';
import { BaseRendererProps } from '../../../../components/nft-image/types/renderer-props';
import { BaseNFT } from '../../../../entities/INFT';

// Mock @google/model-viewer
jest.mock('@google/model-viewer', () => {});

// Mock useAuth hook
jest.mock('../../../../components/auth/Auth', () => ({
  useAuth: jest.fn(() => ({
    connectedProfile: {
      consolidation_key: 'test-consolidation-key',
      primary_wallet: '0x123'
    }
  }))
}));

// Mock useNftBalance hook
jest.mock('../../../../hooks/useNftBalance', () => ({
  useNftBalance: jest.fn(() => ({
    balance: 1,
    isLoading: false,
    error: null
  }))
}));

// Mock NFTImageBalance with realistic behavior
jest.mock('../../../../components/nft-image/NFTImageBalance', () => {
  return function MockNFTImageBalance({ contract, tokenId, showOwnedIfLoggedIn, showUnseizedIfLoggedIn, height }: any) {
    // Use the mocked hook values
    const { useNftBalance } = require('../../../../hooks/useNftBalance');
    const { useAuth } = require('../../../../components/auth/Auth');
    
    const { balance } = useNftBalance();
    const { connectedProfile } = useAuth();
    
    return (
      <div data-testid="nft-image-balance" data-contract={contract} data-token-id={tokenId} data-height={height}>
        {balance > 0 && (
          <span data-testid="seized-text">
            SEIZED{!showOwnedIfLoggedIn && connectedProfile ? ` x${balance}` : ""}
          </span>
        )}
        {showUnseizedIfLoggedIn && connectedProfile && balance === 0 && (
          <span data-testid="unseized-text">UNSEIZED</span>
        )}
        {showUnseizedIfLoggedIn && connectedProfile && balance === -1 && (
          <span data-testid="loading-text">...</span>
        )}
      </div>
    );
  };
});

// Mock NFTModel
jest.mock('../../../../components/nft-image/NFTModel', () => {
  return function MockNFTModel({ nft, id }: any) {
    return (
      <div data-testid="nft-model" data-id={id || `iframe-${nft.id}`}>
        <model-viewer
          id={id || `iframe-${nft.id}`}
          src={nft.metadata?.animation || nft.metadata?.animation_url}
          alt={nft.name}
          poster={nft.scaled}
        />
      </div>
    );
  };
});

const createMockNFT = (overrides: Partial<BaseNFT> = {}): BaseNFT => ({
  id: 1,
  contract: '0x123',
  token_id: '1',
  name: 'Test 3D NFT',
  image: 'https://example.com/image.png',
  thumbnail: 'https://example.com/thumb.png',
  scaled: 'https://example.com/scaled.png',
  animation: 'https://example.com/model.glb',
  metadata: {
    image: 'https://example.com/metadata-image.png',
    name: 'Test 3D NFT',
    description: 'Test 3D model description',
    attributes: [],
    animation: 'https://example.com/metadata-model.glb',
    animation_url: 'https://example.com/animation_url-model.glb',
  },
  ...overrides,
} as BaseNFT);

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

describe('NFTModelRenderer', () => {
  beforeEach(() => {
    // Reset mocks before each test
    const { useNftBalance } = require('../../../../hooks/useNftBalance');
    const { useAuth } = require('../../../../components/auth/Auth');
    
    // Set default mock return values
    useNftBalance.mockReturnValue({ balance: 1, isLoading: false, error: null });
    useAuth.mockReturnValue({
      connectedProfile: {
        consolidation_key: 'test-consolidation-key',
        primary_wallet: '0x123'
      }
    });
  });
  describe('Basic Rendering', () => {
    it('renders NFTModel component with correct structure', () => {
      const props = createDefaultProps();
      render(<NFTModelRenderer {...props} />);
      
      const modelElement = screen.getByTestId('nft-model');
      expect(modelElement).toBeInTheDocument();
    });

    it('applies correct CSS classes from props', () => {
      const props = createDefaultProps({
        heightStyle: 'custom-height', // Not applied to Col in NFTModelRenderer
        bgStyle: 'custom-bg',
        imageStyle: 'custom-image',
      });
      render(<NFTModelRenderer {...props} />);
      
      const wrapper = screen.getByTestId('nft-model').parentElement;
      // NFTModelRenderer does NOT apply heightStyle to the Col
      expect(wrapper).not.toHaveClass('custom-height');
      expect(wrapper).toHaveClass('custom-bg');
      expect(wrapper).toHaveClass('custom-image');
      expect(wrapper).toHaveClass('nftAnimation');
      expect(wrapper).toHaveClass('d-flex');
      expect(wrapper).toHaveClass('justify-content-center');
      expect(wrapper).toHaveClass('align-items-center');
    });

    it('renders NFTImageBalance component', () => {
      const props = createDefaultProps();
      render(<NFTModelRenderer {...props} />);
      
      const balance = screen.getByTestId('nft-image-balance');
      expect(balance).toBeInTheDocument();
    });

    it('uses Bootstrap Col component as container', () => {
      const props = createDefaultProps();
      const { container } = render(<NFTModelRenderer {...props} />);
      
      const colElement = container.querySelector('.d-flex.justify-content-center.align-items-center');
      expect(colElement).toBeInTheDocument();
    });
  });

  describe('NFTModel Integration', () => {
    it('passes correct props to NFTModel', () => {
      const props = createDefaultProps({ id: 'custom-model-id' });
      render(<NFTModelRenderer {...props} />);
      
      const modelElement = screen.getByTestId('nft-model');
      expect(modelElement).toHaveAttribute('data-id', 'custom-model-id');
    });

    it('passes NFT data to NFTModel correctly', () => {
      const nft = createMockNFT({ name: 'Special 3D Model' });
      const props = createDefaultProps({ nft });
      render(<NFTModelRenderer {...props} />);
      
      const modelViewer = screen.getByTestId('nft-model').querySelector('model-viewer');
      expect(modelViewer).toHaveAttribute('alt', 'Special 3D Model');
    });

    it('generates default id when not provided', () => {
      const props = createDefaultProps();
      render(<NFTModelRenderer {...props} />);
      
      const modelElement = screen.getByTestId('nft-model');
      expect(modelElement).toHaveAttribute('data-id', 'iframe-1');
    });

    it('handles different NFT types correctly', () => {
      const heights = [300, 650, 'full'] as const;
      
      heights.forEach(height => {
        const props = createDefaultProps({ height });
        const { unmount } = render(<NFTModelRenderer {...props} />);
        
        const modelElement = screen.getByTestId('nft-model');
        expect(modelElement).toBeInTheDocument();
        unmount();
      });
    });
  });

  describe('NFTImageBalance Integration', () => {
    it('passes correct props to NFTImageBalance', () => {
      const mockNft = createMockNFT({ contract: '0xabc123', id: 42 });
      const props = createDefaultProps({
        nft: mockNft,
        showOwnedIfLoggedIn: true,
        showUnseizedIfLoggedIn: true,
        height: 650,
      });
      render(<NFTModelRenderer {...props} />);
      
      const balance = screen.getByTestId('nft-image-balance');
      expect(balance).toBeInTheDocument();
      expect(balance).toHaveAttribute('data-contract', '0xabc123');
      expect(balance).toHaveAttribute('data-token-id', '42');
      expect(balance).toHaveAttribute('data-height', '650');
      expect(screen.getByTestId('seized-text')).toHaveTextContent('SEIZED');
    });

    it('shows balance with quantity when showOwnedIfLoggedIn is false', () => {
      // Mock the balance hook to return 3
      const { useNftBalance } = require('../../../../hooks/useNftBalance');
      useNftBalance.mockReturnValue({ balance: 3, isLoading: false, error: null });
      
      const props = createDefaultProps({
        showOwnedIfLoggedIn: false,
      });
      render(<NFTModelRenderer {...props} />);
      
      expect(screen.getByTestId('seized-text')).toHaveTextContent('SEIZED x3');
    });

    it('shows unseized state correctly', () => {
      // Mock the balance hook to return 0
      const { useNftBalance } = require('../../../../hooks/useNftBalance');
      useNftBalance.mockReturnValue({ balance: 0, isLoading: false, error: null });
      
      const props = createDefaultProps({
        showUnseizedIfLoggedIn: true,
      });
      render(<NFTModelRenderer {...props} />);
      
      expect(screen.getByTestId('unseized-text')).toHaveTextContent('UNSEIZED');
    });

    it('shows loading state for balance -1', () => {
      // Mock the balance hook to return -1 (loading state)
      const { useNftBalance } = require('../../../../hooks/useNftBalance');
      useNftBalance.mockReturnValue({ balance: -1, isLoading: true, error: null });
      
      const props = createDefaultProps({
        showUnseizedIfLoggedIn: true,
      });
      render(<NFTModelRenderer {...props} />);
      
      expect(screen.getByTestId('loading-text')).toHaveTextContent('...');
    });

    it('passes height prop to NFTImageBalance', () => {
      const props = createDefaultProps({ height: 300 });
      render(<NFTModelRenderer {...props} />);
      
      const balance = screen.getByTestId('nft-image-balance');
      expect(balance).toHaveAttribute('data-height', '300');
    });
  });

  describe('NFT Type Filtering', () => {
    it('renders BaseNFT with metadata correctly', () => {
      const baseNFT = createMockNFT({ 
        metadata: { animation: 'https://example.com/model.glb' } 
      });
      const props = createDefaultProps({ nft: baseNFT });
      
      render(<NFTModelRenderer {...props} />);
      
      const modelElement = screen.getByTestId('nft-model');
      expect(modelElement).toBeInTheDocument();
    });

    it('returns null for NFTLite (without metadata)', () => {
      const nftLite = {
        id: 1,
        contract: '0x123',
        name: 'NFTLite without metadata',
        icon: 'https://example.com/icon.png',
        thumbnail: 'https://example.com/thumb.png',
        scaled: 'https://example.com/scaled.png',
        image: 'https://example.com/image.png',
        animation: 'https://example.com/model.glb',
        // No metadata property - this makes it an NFTLite
      };
      
      const props = createDefaultProps({ nft: nftLite as any });
      const { container } = render(<NFTModelRenderer {...props} />);
      
      // Should render null (empty container)
      expect(container.firstChild).toBeNull();
      expect(screen.queryByTestId('nft-model')).not.toBeInTheDocument();
      expect(screen.queryByTestId('nft-image-balance')).not.toBeInTheDocument();
    });

    it('renders BaseNFT even with undefined metadata (key exists)', () => {
      // Note: BaseNFT always has metadata key, even if undefined
      // The component only checks for presence of metadata key, not its value
      const baseNFTWithUndefinedMetadata = createMockNFT({ metadata: undefined });
      const props = createDefaultProps({ nft: baseNFTWithUndefinedMetadata });
      
      render(<NFTModelRenderer {...props} />);
      
      // Should still render because 'metadata' key exists in BaseNFT
      const modelElement = screen.getByTestId('nft-model');
      expect(modelElement).toBeInTheDocument();
    });

    it('renders BaseNFT even with null metadata (key exists)', () => {
      // Note: BaseNFT always has metadata key, even if null
      // The component only checks for presence of metadata key, not its value
      const baseNFTWithNullMetadata = createMockNFT({ metadata: null });
      const props = createDefaultProps({ nft: baseNFTWithNullMetadata });
      
      render(<NFTModelRenderer {...props} />);
      
      // Should still render because 'metadata' key exists in BaseNFT
      const modelElement = screen.getByTestId('nft-model');
      expect(modelElement).toBeInTheDocument();
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('handles missing NFT properties gracefully', () => {
      const minimalNFT = {
        id: 1,
        name: 'Minimal 3D NFT',
        metadata: {
          animation: 'https://example.com/model.glb',
        },
      } as BaseNFT;
      
      const props = createDefaultProps({ nft: minimalNFT });
      
      expect(() => {
        render(<NFTModelRenderer {...props} />);
      }).not.toThrow();
      
      const modelElement = screen.getByTestId('nft-model');
      expect(modelElement).toBeInTheDocument();
    });

    it('handles zero balance correctly', () => {
      // Mock the balance hook to return 0
      const { useNftBalance } = require('../../../../hooks/useNftBalance');
      useNftBalance.mockReturnValue({ balance: 0, isLoading: false, error: null });
      
      const props = createDefaultProps();
      render(<NFTModelRenderer {...props} />);
      
      const balance = screen.getByTestId('nft-image-balance');
      expect(balance).toBeInTheDocument();
      // Should not show seized text for zero balance
      expect(screen.queryByTestId('seized-text')).not.toBeInTheDocument();
    });

    it('handles negative balance correctly', () => {
      // Mock the balance hook to return -1 (loading state)
      const { useNftBalance } = require('../../../../hooks/useNftBalance');
      useNftBalance.mockReturnValue({ balance: -1, isLoading: true, error: null });
      
      const props = createDefaultProps({ 
        showUnseizedIfLoggedIn: true,
      });
      render(<NFTModelRenderer {...props} />);
      
      const balance = screen.getByTestId('nft-image-balance');
      expect(balance).toBeInTheDocument();
      expect(screen.getByTestId('loading-text')).toHaveTextContent('...');
    });

    it('handles large balance numbers correctly', () => {
      // Mock the balance hook to return a large number
      const { useNftBalance } = require('../../../../hooks/useNftBalance');
      useNftBalance.mockReturnValue({ balance: 999999, isLoading: false, error: null });
      
      const props = createDefaultProps({
        showOwnedIfLoggedIn: false,
      });
      render(<NFTModelRenderer {...props} />);
      
      expect(screen.getByTestId('seized-text')).toHaveTextContent('SEIZED x999999');
    });
  });

  describe('Props Propagation', () => {
    it('propagates styling props correctly', () => {
      const props = createDefaultProps({
        heightStyle: 'test-height', // Not used by NFTModelRenderer
        imageStyle: 'test-image',
        bgStyle: 'test-bg',
      });
      render(<NFTModelRenderer {...props} />);
      
      const wrapper = screen.getByTestId('nft-model').parentElement;
      // NFTModelRenderer only applies imageStyle and bgStyle, not heightStyle
      expect(wrapper).not.toHaveClass('test-height');
      expect(wrapper).toHaveClass('test-image');
      expect(wrapper).toHaveClass('test-bg');
    });

    it('propagates balance-related props to NFTImageBalance', () => {
      // Mock the balance hook to return 7
      const { useNftBalance } = require('../../../../hooks/useNftBalance');
      useNftBalance.mockReturnValue({ balance: 7, isLoading: false, error: null });
      
      const props = createDefaultProps({
        showOwnedIfLoggedIn: true,
        showUnseizedIfLoggedIn: false,
        height: 650,
      });
      render(<NFTModelRenderer {...props} />);
      
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
        // id is optional and not provided
      };
      
      expect(() => {
        render(<NFTModelRenderer {...propsWithoutOptionals} />);
      }).not.toThrow();
      
      const modelElement = screen.getByTestId('nft-model');
      expect(modelElement).toBeInTheDocument();
      expect(modelElement).toHaveAttribute('data-id', 'iframe-1'); // Default id
    });
  });

  describe('Component Structure and Layout', () => {
    it('maintains proper component hierarchy', () => {
      const props = createDefaultProps();
      const { container } = render(<NFTModelRenderer {...props} />);
      
      // Should have Col as root element
      const colElement = container.firstChild;
      expect(colElement).toHaveClass('col');
      expect(colElement).toHaveClass('nftAnimation');
      expect(colElement).toHaveClass('d-flex');
      expect(colElement).toHaveClass('justify-content-center');
      expect(colElement).toHaveClass('align-items-center');
      
      // Should contain both NFTImageBalance and NFTModel
      const balance = screen.getByTestId('nft-image-balance');
      const model = screen.getByTestId('nft-model');
      expect(balance).toBeInTheDocument();
      expect(model).toBeInTheDocument();
    });

    it('does not include heightStyle in Col className (unlike other renderers)', () => {
      // NFTModelRenderer does not apply heightStyle to the Col, 
      // unlike NFTHTMLRenderer which does
      const props = createDefaultProps({ heightStyle: 'height-650' });
      const { container } = render(<NFTModelRenderer {...props} />);
      
      const colElement = container.firstChild;
      expect(colElement).not.toHaveClass('height-650');
      expect(colElement).toHaveClass('image-style'); // but imageStyle is still applied
      expect(colElement).toHaveClass('bg-style'); // and bgStyle is still applied
    });
  });

  describe('Accessibility', () => {
    it('provides proper structure for screen readers', () => {
      const props = createDefaultProps({
        nft: createMockNFT({ name: 'Accessible 3D Model NFT' }),
      });
      render(<NFTModelRenderer {...props} />);
      
      const modelViewer = screen.getByTestId('nft-model').querySelector('model-viewer');
      expect(modelViewer).toHaveAttribute('alt', 'Accessible 3D Model NFT');
    });

    it('handles missing name gracefully', () => {
      const nft = createMockNFT({ name: undefined as any });
      const props = createDefaultProps({ nft });
      
      expect(() => {
        render(<NFTModelRenderer {...props} />);
      }).not.toThrow();
      
      const modelElement = screen.getByTestId('nft-model');
      expect(modelElement).toBeInTheDocument();
    });
  });
});
