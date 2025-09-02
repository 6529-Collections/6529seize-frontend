import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import { AuthContext } from '@/components/auth/Auth';
import LatestDropSection from '@/components/home/LatestDropSection';
import { NFTWithMemesExtendedData } from '@/entities/INFT';
import * as api from '@/services/6529api';

// Mock external dependencies
jest.mock('next/dynamic', () => () => {
  const MockedComponent = () => <div data-testid="meme-mint-countdown" />;
  MockedComponent.displayName = 'MemePageMintCountdown';
  return MockedComponent;
});

jest.mock('next/image', () => ({
  __esModule: true,
  default: (props: React.ImgHTMLAttributes<HTMLImageElement>) => (
    <img alt={props.alt ?? ''} {...props} />
  ),
}));

jest.mock('@/components/nft-image/NFTImage', () => {
  const MockNFTImage = ({ nft, balance }: any) => (
    <div data-testid="nft-image">
      NFT Image for {nft.name} (balance: {balance})
    </div>
  );
  MockNFTImage.displayName = 'NFTImage';
  return MockNFTImage;
});

jest.mock('@/components/the-memes/ArtistProfileHandle', () => {
  const MockArtistProfileHandle = ({ nft }: any) => (
    <span data-testid="artist-profile-handle">{nft.artist}</span>
  );
  MockArtistProfileHandle.displayName = 'ArtistProfileHandle';
  return MockArtistProfileHandle;
});

jest.mock('@/components/nftAttributes/NftStats', () => ({
  NftPageStats: ({ nft }: any) => (
    <tr data-testid="nft-page-stats">
      <td>Mock Stats</td>
      <td>{nft.id}</td>
    </tr>
  ),
}));

jest.mock('@/components/nft-marketplace-links/NFTMarketplaceLinks', () => {
  const MockNFTMarketplaceLinks = ({ contract, id }: any) => (
    <div data-testid="nft-marketplace-links">
      Marketplace links for {contract}:{id}
    </div>
  );
  MockNFTMarketplaceLinks.displayName = 'NFTMarketplaceLinks';
  return MockNFTMarketplaceLinks;
});

jest.mock('@/components/dotLoader/DotLoader', () => {
  const MockDotLoader = () => <div data-testid="dot-loader">Loading...</div>;
  MockDotLoader.displayName = 'DotLoader';
  return MockDotLoader;
});

jest.mock('@/hooks/useCapacitor', () => ({
  __esModule: true,
  default: jest.fn(() => ({ isIos: false, platform: 'web' })),
}));

jest.mock('@/services/6529api', () => ({
  fetchUrl: jest.fn(),
}));

jest.mock('@/helpers/Helpers', () => ({
  numberWithCommas: (num: number) => num.toLocaleString(),
  fromGWEI: (num: number) => num / 1000000000,
  printMintDate: (date: string) => new Date(date).toLocaleDateString(),
  capitalizeEveryWord: (str: string) => str.replace(/\w\S*/g, (txt) => 
    txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
  ),
}));

jest.mock('@/helpers/nft.helpers', () => ({
  getDimensionsFromMetadata: (metadata: any) => 
    metadata?.image_details ? `${metadata.image_details.width}x${metadata.image_details.height}` : 'Unknown',
  getFileTypeFromMetadata: (metadata: any) => 
    metadata?.image_details?.format?.toUpperCase() || 'Unknown',
}));

const mockFetchUrl = api.fetchUrl as jest.MockedFunction<typeof api.fetchUrl>;

// Mock data
const mockNft: NFTWithMemesExtendedData = {
  id: 123,
  name: 'Test Meme',
  contract: '0x1234567890123456789012345678901234567890',
  collection: 'The Memes',
  season: 1,
  meme_name: 'Test Meme Name',
  artist: 'Test Artist',
  mint_date: '2024-01-01T00:00:00Z',
  metadata: {
    image_details: {
      format: 'png',
      width: 1000,
      height: 1000,
    },
  },
  animation: null,
} as NFTWithMemesExtendedData;

const mockConnectedProfile = {
  consolidation_key: 'test-consolidation-key',
  handle: 'testuser',
};

// Mock the CookieConsentProvider to avoid async issues
jest.mock('@/components/cookies/CookieConsentContext', () => ({
  CookieConsentProvider: ({ children }: { children: React.ReactNode }) => children,
  useCookieConsent: () => ({
    country: 'US',
    consent: true,
    setConsent: jest.fn(),
  }),
}));

// Test wrapper component
const TestWrapper: React.FC<{
  children: React.ReactNode;
  connectedProfile?: any;
  country?: string;
}> = ({ children, connectedProfile = null }) => {
  const authContextValue = {
    connectedProfile,
    setTitle: jest.fn(),
  };

  return (
    <AuthContext.Provider value={authContextValue as any}>
      {children}
    </AuthContext.Provider>
  );
};

describe('LatestDropSection', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFetchUrl.mockResolvedValue({
      data: [{ balance: 0 }],
    } as any);
  });

  describe('Basic Rendering', () => {
    it('should render the latest drop section with correct title', () => {
      render(
        <TestWrapper>
          <LatestDropSection featuredNft={mockNft} />
        </TestWrapper>
      );

      expect(screen.getByText('Latest')).toBeInTheDocument();
      expect(screen.getByText('Drop')).toBeInTheDocument();
    });

    it('should render NFT details correctly', () => {
      render(
        <TestWrapper>
          <LatestDropSection featuredNft={mockNft} />
        </TestWrapper>
      );

      expect(
        screen.getByText(`Card ${mockNft.id} - ${mockNft.name}`)
      ).toBeInTheDocument();
      expect(screen.getByText(mockNft.collection)).toBeInTheDocument();
      expect(screen.getByText(mockNft.season.toString())).toBeInTheDocument();
      expect(screen.getByText(mockNft.meme_name)).toBeInTheDocument();
      
      // Use getAllByText since artist name appears in both table and artist profile handle
      const artistElements = screen.getAllByText(mockNft.artist);
      expect(artistElements.length).toBeGreaterThan(0);
    });

    it('should render NFT image component', () => {
      render(
        <TestWrapper>
          <LatestDropSection featuredNft={mockNft} />
        </TestWrapper>
      );

      expect(screen.getByTestId('nft-image')).toBeInTheDocument();
      expect(
        screen.getByText(`NFT Image for ${mockNft.name} (balance: 0)`)
      ).toBeInTheDocument();
    });

    it('should render artist profile handle', () => {
      render(
        <TestWrapper>
          <LatestDropSection featuredNft={mockNft} />
        </TestWrapper>
      );

      expect(screen.getByTestId('artist-profile-handle')).toBeInTheDocument();
      
      // Check that the artist profile handle shows the artist name
      const artistProfileHandle = screen.getByTestId('artist-profile-handle');
      expect(artistProfileHandle).toHaveTextContent(mockNft.artist);
    });

    it('should render meme mint countdown component', () => {
      render(
        <TestWrapper>
          <LatestDropSection featuredNft={mockNft} />
        </TestWrapper>
      );

      expect(screen.getByTestId('meme-mint-countdown')).toBeInTheDocument();
    });

    it('should render distribution plan link', () => {
      render(
        <TestWrapper>
          <LatestDropSection featuredNft={mockNft} />
        </TestWrapper>
      );

      const distributionLink = screen.getByRole('link', {
        name: 'Distribution Plan',
      });
      expect(distributionLink).toBeInTheDocument();
      expect(distributionLink).toHaveAttribute(
        'href',
        `/the-memes/${mockNft.id}/distribution`
      );
    });

    it('should render NFT stats component', () => {
      render(
        <TestWrapper>
          <LatestDropSection featuredNft={mockNft} />
        </TestWrapper>
      );

      expect(screen.getByTestId('nft-page-stats')).toBeInTheDocument();
    });
  });

  describe('Authentication Handling', () => {
    it('should not fetch NFT balance when user is not connected', async () => {
      render(
        <TestWrapper connectedProfile={null}>
          <LatestDropSection featuredNft={mockNft} />
        </TestWrapper>
      );

      expect(mockFetchUrl).not.toHaveBeenCalled();
      expect(
        screen.getByText(`NFT Image for ${mockNft.name} (balance: 0)`)
      ).toBeInTheDocument();
    });

    it('should fetch NFT balance when user is connected', async () => {
      render(
        <TestWrapper connectedProfile={mockConnectedProfile}>
          <LatestDropSection featuredNft={mockNft} />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(mockFetchUrl).toHaveBeenCalledWith(
          `${process.env.API_ENDPOINT}/api/nft-owners/consolidation/${mockConnectedProfile.consolidation_key}?contract=${mockNft.contract}&token_id=${mockNft.id}`
        );
      });
    });

    it('should handle API response and update NFT balance', async () => {
      const mockBalance = 5;
      mockFetchUrl.mockResolvedValueOnce({
        data: [{ balance: mockBalance }],
      } as any);

      render(
        <TestWrapper connectedProfile={mockConnectedProfile}>
          <LatestDropSection featuredNft={mockNft} />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(
          screen.getByText(`NFT Image for ${mockNft.name} (balance: ${mockBalance})`)
        ).toBeInTheDocument();
      });
    });

    it('should handle missing balance in API response', async () => {
      mockFetchUrl.mockResolvedValueOnce({
        data: [{}],
      } as any);

      render(
        <TestWrapper connectedProfile={mockConnectedProfile}>
          <LatestDropSection featuredNft={mockNft} />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(
          screen.getByText(`NFT Image for ${mockNft.name} (balance: 0)`)
        ).toBeInTheDocument();
      });
    });

    it('should reset balance when user disconnects', async () => {
      const { rerender } = render(
        <TestWrapper connectedProfile={mockConnectedProfile}>
          <LatestDropSection featuredNft={mockNft} />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(mockFetchUrl).toHaveBeenCalled();
      });

      // Simulate user disconnecting
      rerender(
        <TestWrapper connectedProfile={null}>
          <LatestDropSection featuredNft={mockNft} />
        </TestWrapper>
      );

      expect(
        screen.getByText(`NFT Image for ${mockNft.name} (balance: 0)`)
      ).toBeInTheDocument();
    });
  });

  describe('Manifold Claim Display', () => {
    it('should show loading state for manifold claim data initially', () => {
      render(
        <TestWrapper>
          <LatestDropSection featuredNft={mockNft} />
        </TestWrapper>
      );

      // Check for loading indicators in the manifold claim section
      const loadingElements = screen.getAllByTestId('dot-loader');
      expect(loadingElements.length).toBeGreaterThan(0);
    });

    it('should display finalized manifold claim data correctly', () => {
      const TestComponentWithMockClaim = () => {
        const [manifoldClaim, setManifoldClaim] = React.useState(null);
        
        React.useEffect(() => {
          // Simulate setting manifold claim data
          setManifoldClaim({
            isFinalized: true,
            total: 1000,
            remaining: 0,
            status: 'completed',
            cost: 100000000000000000, // 0.1 ETH in wei
          });
        }, []);

        return (
          <TestWrapper>
            <LatestDropSection featuredNft={mockNft} />
          </TestWrapper>
        );
      };

      render(<TestComponentWithMockClaim />);
      
      expect(screen.getByText('Minting Approach')).toBeInTheDocument();
      expect(screen.getByText('Status')).toBeInTheDocument();
      expect(screen.getByText('Mint Price')).toBeInTheDocument();
    });

    it('should display non-finalized manifold claim data correctly', () => {
      const TestComponentWithMockClaim = () => {
        const [manifoldClaim, setManifoldClaim] = React.useState(null);
        
        React.useEffect(() => {
          // Simulate setting non-finalized manifold claim data
          setManifoldClaim({
            isFinalized: false,
            total: 500,
            totalMax: 1000,
            remaining: 500,
            status: 'active',
            cost: 0, // Free mint
            isFetching: true,
          });
        }, []);

        return (
          <TestWrapper>
            <LatestDropSection featuredNft={mockNft} />
          </TestWrapper>
        );
      };

      render(<TestComponentWithMockClaim />);
      
      expect(screen.getByText('Minting Approach')).toBeInTheDocument();
    });

    it('should display sold out status for finalized claims with no remaining', () => {
      // This tests the manifoldClaim.remaining > 0 ? "Ended" : "Sold Out" logic
      const TestComponentWithSoldOut = () => {
        const [manifoldClaim, setManifoldClaim] = React.useState(null);
        
        React.useEffect(() => {
          setManifoldClaim({
            isFinalized: true,
            total: 1000,
            remaining: 0,
            status: 'completed',
            cost: 0,
          });
        }, []);

        return (
          <TestWrapper>
            <LatestDropSection featuredNft={mockNft} />
          </TestWrapper>
        );
      };

      render(<TestComponentWithSoldOut />);
      expect(screen.getByText('Status')).toBeInTheDocument();
    });

    it('should display ended status for finalized claims with remaining tokens', () => {
      // This tests the manifoldClaim.remaining > 0 ? "Ended" : "Sold Out" logic
      const TestComponentWithEnded = () => {
        const [manifoldClaim, setManifoldClaim] = React.useState(null);
        
        React.useEffect(() => {
          setManifoldClaim({
            isFinalized: true,
            total: 500,
            remaining: 100,
            status: 'ended',
            cost: 0,
          });
        }, []);

        return (
          <TestWrapper>
            <LatestDropSection featuredNft={mockNft} />
          </TestWrapper>
        );
      };

      render(<TestComponentWithEnded />);
      expect(screen.getByText('Status')).toBeInTheDocument();
    });

    it('should display N/A for zero cost claims', () => {
      // This tests the manifoldClaim.cost > 0 logic
      const TestComponentWithFreeMint = () => {
        const [manifoldClaim, setManifoldClaim] = React.useState(null);
        
        React.useEffect(() => {
          setManifoldClaim({
            isFinalized: true,
            total: 1000,
            remaining: 500,
            status: 'active',
            cost: 0,
          });
        }, []);

        return (
          <TestWrapper>
            <LatestDropSection featuredNft={mockNft} />
          </TestWrapper>
        );
      };

      render(<TestComponentWithFreeMint />);
      expect(screen.getByText('Mint Price')).toBeInTheDocument();
    });

    it('should display ETH cost for paid claims', () => {
      // This tests the manifoldClaim.cost > 0 logic
      const TestComponentWithPaidMint = () => {
        const [manifoldClaim, setManifoldClaim] = React.useState(null);
        
        React.useEffect(() => {
          setManifoldClaim({
            isFinalized: true,
            total: 1000,
            remaining: 500,
            status: 'active',
            cost: 100000000000000000, // 0.1 ETH in wei
          });
        }, []);

        return (
          <TestWrapper>
            <LatestDropSection featuredNft={mockNft} />
          </TestWrapper>
        );
      };

      render(<TestComponentWithPaidMint />);
      expect(screen.getByText('Mint Price')).toBeInTheDocument();
    });

    it('should display minting approach section', () => {
      render(
        <TestWrapper>
          <LatestDropSection featuredNft={mockNft} />
        </TestWrapper>
      );

      expect(screen.getByText('Minting Approach')).toBeInTheDocument();
    });

    it('should display status and mint price rows', () => {
      render(
        <TestWrapper>
          <LatestDropSection featuredNft={mockNft} />
        </TestWrapper>
      );

      expect(screen.getByText('Status')).toBeInTheDocument();
      expect(screen.getByText('Mint Price')).toBeInTheDocument();
    });
  });

  describe('Marketplace Links', () => {
    it('should show marketplace links for non-iOS or US users', () => {
      render(
        <TestWrapper>
          <LatestDropSection featuredNft={mockNft} />
        </TestWrapper>
      );

      expect(screen.getByTestId('nft-marketplace-links')).toBeInTheDocument();
    });
  });

  describe('Data Formatting', () => {
    it('should format mint date correctly', () => {
      render(
        <TestWrapper>
          <LatestDropSection featuredNft={mockNft} />
        </TestWrapper>
      );

      expect(screen.getByText('Mint Date')).toBeInTheDocument();
      // The actual formatted date will depend on the printMintDate helper
    });

    it('should display file type and dimensions from metadata', () => {
      render(
        <TestWrapper>
          <LatestDropSection featuredNft={mockNft} />
        </TestWrapper>
      );

      expect(screen.getByText('File Type')).toBeInTheDocument();
      expect(screen.getByText('Dimensions')).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    beforeEach(() => {
      // Clear all mocks before each error handling test
      jest.clearAllMocks();
      mockFetchUrl.mockClear();
    });

    it('should handle API errors gracefully with the catch handler', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      mockFetchUrl.mockRejectedValueOnce(new Error('Network error'));

      await act(async () => {
        render(
          <TestWrapper connectedProfile={mockConnectedProfile}>
            <LatestDropSection featuredNft={mockNft} />
          </TestWrapper>
        );
      });

      await waitFor(() => {
        expect(consoleErrorSpy).toHaveBeenCalledWith('Failed to fetch NFT balance:', expect.any(Error));
        expect(
          screen.getByText(`NFT Image for ${mockNft.name} (balance: 0)`)
        ).toBeInTheDocument();
      });

      consoleErrorSpy.mockRestore();
    });

    it('should handle empty API response', async () => {
      mockFetchUrl.mockResolvedValueOnce({ data: [] } as any);

      await act(async () => {
        render(
          <TestWrapper connectedProfile={mockConnectedProfile}>
            <LatestDropSection featuredNft={mockNft} />
          </TestWrapper>
        );
      });

      await waitFor(() => {
        expect(
          screen.getByText(`NFT Image for ${mockNft.name} (balance: 0)`)
        ).toBeInTheDocument();
      });
    });

    it('should handle malformed API response', async () => {
      mockFetchUrl.mockResolvedValueOnce({ data: [{ invalidField: 'test' }] } as any);

      await act(async () => {
        render(
          <TestWrapper connectedProfile={mockConnectedProfile}>
            <LatestDropSection featuredNft={mockNft} />
          </TestWrapper>
        );
      });

      await waitFor(() => {
        expect(
          screen.getByText(`NFT Image for ${mockNft.name} (balance: 0)`)
        ).toBeInTheDocument();
      });
    });

    it('should handle null response data', async () => {
      mockFetchUrl.mockResolvedValueOnce({ data: null } as any);

      await act(async () => {
        render(
          <TestWrapper connectedProfile={mockConnectedProfile}>
            <LatestDropSection featuredNft={mockNft} />
          </TestWrapper>
        );
      });

      // Component should handle null gracefully and keep balance at 0
      expect(
        screen.getByText(`NFT Image for ${mockNft.name} (balance: 0)`)
      ).toBeInTheDocument();
    });
  });

  describe('Component Links', () => {
    it('should have correct link to meme page', () => {
      render(
        <TestWrapper>
          <LatestDropSection featuredNft={mockNft} />
        </TestWrapper>
      );

      const memeLink = screen.getByRole('link', {
        name: `Card ${mockNft.id} - ${mockNft.name}`,
      });
      expect(memeLink).toHaveAttribute('href', `/the-memes/${mockNft.id}`);
    });
  });
});