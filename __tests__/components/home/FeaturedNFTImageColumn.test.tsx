import { render, screen } from '@testing-library/react';
import FeaturedNFTImageColumn from '@/components/home/FeaturedNFTImageColumn';
import { useAuth } from '@/components/auth/Auth';
import { NFTWithMemesExtendedData } from '@/entities/INFT';

// Mock dependencies
jest.mock('@/components/auth/Auth');
jest.mock('@/components/nft-image/NFTImage', () => {
  return function MockNFTImage(props: any) {
    return (
      <div data-testid="nft-image">
        <span data-testid="nft-id">{props.nft.id}</span>
        <span data-testid="nft-animation">{props.animation.toString()}</span>
        <span data-testid="nft-height">{props.height}</span>
        <span data-testid="nft-balance">{props.balance}</span>
        <span data-testid="nft-show-unseized">{props.showUnseized.toString()}</span>
      </div>
    );
  };
});

jest.mock('next/link', () => {
  return function MockLink({ children, href, className }: any) {
    return (
      <a href={href} className={className} data-testid="mock-link">
        {children}
      </a>
    );
  };
});

const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;

// Mock NFT data
const mockNFT: NFTWithMemesExtendedData = {
  id: 1,
  name: 'Test NFT',
  contract: '0x123',
  collection: 'The Memes',
  season: 1,
  meme_name: 'Test Meme',
  artist: 'Test Artist',
  mint_date: '2024-01-01',
  metadata: {
    name: 'Test NFT',
    description: 'Test Description',
    image: 'https://example.com/image.jpg',
    animation_url: 'https://example.com/animation.mp4'
  },
  animation: null,
  image: 'https://example.com/image.jpg'
} as NFTWithMemesExtendedData;

describe('FeaturedNFTImageColumn', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Component Rendering', () => {
    it('should render without crashing with required props', () => {
      mockUseAuth.mockReturnValue({
        connectedProfile: null
      } as any);

      render(
        <FeaturedNFTImageColumn
          featuredNft={mockNFT}
          nftBalance={0}
        />
      );

      expect(screen.getByTestId('nft-image')).toBeInTheDocument();
    });

    it('should render with proper Bootstrap Col structure and responsive props', () => {
      mockUseAuth.mockReturnValue({
        connectedProfile: null
      } as any);

      const { container } = render(
        <FeaturedNFTImageColumn
          featuredNft={mockNFT}
          nftBalance={5}
        />
      );

      const col = container.querySelector('[class*="col"]');
      expect(col).toBeInTheDocument();
      expect(col).toHaveClass('pt-3', 'pb-3', 'd-flex', 'align-items-center', 'justify-content-center');
    });

    it('should render Container with no-padding class', () => {
      mockUseAuth.mockReturnValue({
        connectedProfile: null
      } as any);

      const { container } = render(
        <FeaturedNFTImageColumn
          featuredNft={mockNFT}
          nftBalance={0}
        />
      );

      const containerEl = container.querySelector('.container.no-padding');
      expect(containerEl).toBeInTheDocument();
    });
  });

  describe('NFT Animation Conditional Rendering', () => {
    it('should render span wrapper when NFT has animation property', () => {
      mockUseAuth.mockReturnValue({
        connectedProfile: { id: 'test-profile' }
      } as any);

      const nftWithAnimation = {
        ...mockNFT,
        animation: 'https://example.com/animation.mp4'
      };

      const { container } = render(
        <FeaturedNFTImageColumn
          featuredNft={nftWithAnimation}
          nftBalance={3}
        />
      );

      const span = container.querySelector('span[class*="tw-pb-"]');
      expect(span).toBeInTheDocument();
      expect(screen.queryByTestId('mock-link')).not.toBeInTheDocument();
    });

    it('should render span wrapper when NFT has metadata animation', () => {
      mockUseAuth.mockReturnValue({
        connectedProfile: { id: 'test-profile' }
      } as any);

      const nftWithMetadataAnimation = {
        ...mockNFT,
        animation: null,
        metadata: {
          ...mockNFT.metadata,
          animation: 'https://example.com/animation.gif'
        }
      };

      const { container } = render(
        <FeaturedNFTImageColumn
          featuredNft={nftWithMetadataAnimation}
          nftBalance={2}
        />
      );

      const span = container.querySelector('span[class*="tw-pb-"]');
      expect(span).toBeInTheDocument();
      expect(screen.queryByTestId('mock-link')).not.toBeInTheDocument();
    });

    it('should render Link wrapper when NFT has no animation', () => {
      mockUseAuth.mockReturnValue({
        connectedProfile: { id: 'test-profile' }
      } as any);

      const nftWithoutAnimation = {
        ...mockNFT,
        animation: null,
        metadata: {
          ...mockNFT.metadata,
          animation: null,
          animation_url: null
        }
      };

      render(
        <FeaturedNFTImageColumn
          featuredNft={nftWithoutAnimation}
          nftBalance={1}
        />
      );

      const link = screen.getByTestId('mock-link');
      expect(link).toBeInTheDocument();
      expect(link).toHaveAttribute('href', '/the-memes/1');
      expect(link).toHaveClass('tw-pb-[35px]');
    });

    it('should render Link without padding class when no connected profile', () => {
      mockUseAuth.mockReturnValue({
        connectedProfile: null
      } as any);

      const nftWithoutAnimation = {
        ...mockNFT,
        animation: null,
        metadata: {
          ...mockNFT.metadata,
          animation: null,
          animation_url: null
        }
      };

      render(
        <FeaturedNFTImageColumn
          featuredNft={nftWithoutAnimation}
          nftBalance={1}
        />
      );

      const link = screen.getByTestId('mock-link');
      expect(link).toBeInTheDocument();
      expect(link).not.toHaveClass('tw-pb-[35px]');
    });
  });

  describe('Connected Profile State Management', () => {
    it('should apply bottom padding class when user is connected and has animation', () => {
      mockUseAuth.mockReturnValue({
        connectedProfile: { id: 'test-user', handle: 'testuser' }
      } as any);

      const nftWithAnimation = {
        ...mockNFT,
        animation: 'https://example.com/animation.mp4'
      };

      const { container } = render(
        <FeaturedNFTImageColumn
          featuredNft={nftWithAnimation}
          nftBalance={10}
        />
      );

      const span = container.querySelector('span[class*="tw-pb-"]');
      expect(span).toBeInTheDocument();
    });

    it('should not apply bottom padding class when user is not connected', () => {
      mockUseAuth.mockReturnValue({
        connectedProfile: null
      } as any);

      const nftWithAnimation = {
        ...mockNFT,
        animation: 'https://example.com/animation.mp4'
      };

      const { container } = render(
        <FeaturedNFTImageColumn
          featuredNft={nftWithAnimation}
          nftBalance={0}
        />
      );

      const spanWithPadding = container.querySelector('span[class*="tw-pb-"]');
      expect(spanWithPadding).not.toBeInTheDocument();
      
      const spanWithoutPadding = container.querySelector('span:not([class*="tw-pb-"])');
      expect(spanWithoutPadding).toBeInTheDocument();
    });
  });

  describe('NFTImage Component Integration', () => {
    it('should pass correct props to NFTImage component', () => {
      mockUseAuth.mockReturnValue({
        connectedProfile: { id: 'test-profile' }
      } as any);

      render(
        <FeaturedNFTImageColumn
          featuredNft={mockNFT}
          nftBalance={7}
        />
      );

      expect(screen.getByTestId('nft-id')).toHaveTextContent('1');
      expect(screen.getByTestId('nft-animation')).toHaveTextContent('true');
      expect(screen.getByTestId('nft-height')).toHaveTextContent('650');
      expect(screen.getByTestId('nft-balance')).toHaveTextContent('7');
      expect(screen.getByTestId('nft-show-unseized')).toHaveTextContent('true');
    });

    it('should show unseized as false when no connected profile', () => {
      mockUseAuth.mockReturnValue({
        connectedProfile: null
      } as any);

      render(
        <FeaturedNFTImageColumn
          featuredNft={mockNFT}
          nftBalance={0}
        />
      );

      expect(screen.getByTestId('nft-show-unseized')).toHaveTextContent('false');
    });

    it('should always pass animation as true to NFTImage', () => {
      mockUseAuth.mockReturnValue({
        connectedProfile: null
      } as any);

      render(
        <FeaturedNFTImageColumn
          featuredNft={mockNFT}
          nftBalance={0}
        />
      );

      expect(screen.getByTestId('nft-animation')).toHaveTextContent('true');
    });

    it('should always pass height as 650 to NFTImage', () => {
      mockUseAuth.mockReturnValue({
        connectedProfile: null
      } as any);

      render(
        <FeaturedNFTImageColumn
          featuredNft={mockNFT}
          nftBalance={15}
        />
      );

      expect(screen.getByTestId('nft-height')).toHaveTextContent('650');
    });
  });

  describe('Link Generation', () => {
    it('should generate correct link URL when NFT has no animation', () => {
      mockUseAuth.mockReturnValue({
        connectedProfile: { id: 'test' }
      } as any);

      const nftWithId = {
        ...mockNFT,
        id: 42,
        animation: null,
        metadata: {
          ...mockNFT.metadata,
          animation: null
        }
      };

      render(
        <FeaturedNFTImageColumn
          featuredNft={nftWithId}
          nftBalance={3}
        />
      );

      const link = screen.getByTestId('mock-link');
      expect(link).toHaveAttribute('href', '/the-memes/42');
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle undefined animation gracefully', () => {
      mockUseAuth.mockReturnValue({
        connectedProfile: null
      } as any);

      const nftWithUndefinedAnimation = {
        ...mockNFT,
        animation: undefined,
        metadata: {
          ...mockNFT.metadata,
          animation: undefined
        }
      } as any;

      expect(() => {
        render(
          <FeaturedNFTImageColumn
            featuredNft={nftWithUndefinedAnimation}
            nftBalance={0}
          />
        );
      }).not.toThrow();

      expect(screen.getByTestId('mock-link')).toBeInTheDocument();
    });

    it('should handle zero balance correctly', () => {
      mockUseAuth.mockReturnValue({
        connectedProfile: { id: 'test' }
      } as any);

      render(
        <FeaturedNFTImageColumn
          featuredNft={mockNFT}
          nftBalance={0}
        />
      );

      expect(screen.getByTestId('nft-balance')).toHaveTextContent('0');
    });

    it('should handle large balance numbers', () => {
      mockUseAuth.mockReturnValue({
        connectedProfile: { id: 'test' }
      } as any);

      render(
        <FeaturedNFTImageColumn
          featuredNft={mockNFT}
          nftBalance={999999}
        />
      );

      expect(screen.getByTestId('nft-balance')).toHaveTextContent('999999');
    });

    it('should handle NFT with missing metadata gracefully', () => {
      mockUseAuth.mockReturnValue({
        connectedProfile: null
      } as any);

      const nftWithMinimalMetadata = {
        ...mockNFT,
        metadata: {} as any
      };

      expect(() => {
        render(
          <FeaturedNFTImageColumn
            featuredNft={nftWithMinimalMetadata}
            nftBalance={1}
          />
        );
      }).not.toThrow();

      expect(screen.getByTestId('nft-image')).toBeInTheDocument();
    });
  });
});
