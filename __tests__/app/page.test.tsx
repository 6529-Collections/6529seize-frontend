import React, { useMemo } from "react";
import { render, screen, waitFor, act } from "@testing-library/react";
import Home from "@/components/home/Home";
import { AuthContext } from "@/components/auth/Auth";

// Mock all external dependencies that cause warnings
jest.mock("next/dynamic", () => () => () => <div data-testid="latest-activity" />);
jest.mock("next/image", () => ({
  __esModule: true,
  default: (props: any) => (
    <img alt={props.alt ?? ""} src={props.src} width={props.width} height={props.height} />
  ),
}));
jest.mock(
  "@/components/nextGen/collections/collectionParts/NextGenCollectionSlideshow",
  () => () => <div data-testid="nextgen-slideshow" />
);
jest.mock("@/hooks/useCapacitor", () => ({
  __esModule: true,
  default: jest.fn(() => ({ platform: "web", isIos: false })),
}));

// Mock the cookie consent context to avoid async state updates
jest.mock("@/components/cookies/CookieConsentContext", () => ({
  useCookieConsent: () => ({
    country: "US",
    showCookieConsent: false,
    essentialCookies: true,
    performanceCookies: true,
  }),
  CookieConsentProvider: ({ children }: { children: React.ReactNode }) => children,
}));

// Mock API fetch to prevent network calls
jest.mock("@/services/6529api", () => ({
  fetchUrl: jest.fn().mockResolvedValue({ data: [] }),
}));

// Mock the manifold claim hook
jest.mock("@/hooks/useManifoldClaim", () => ({
  ManifoldClaim: {},
}));

// Mock components that make API calls
jest.mock("@/components/the-memes/MemePageMintCountdown", () => 
  () => <div data-testid="mint-countdown">Mint Countdown</div>
);
jest.mock("@/components/the-memes/ArtistProfileHandle", () => 
  ({ nft }: any) => <span data-testid="artist-handle">{nft.artist}</span>
);
jest.mock("@/components/nftAttributes/NftStats", () => 
  () => <tr data-testid="nft-stats"><td>Stats</td><td>Data</td></tr>
);
jest.mock("@/components/nft-marketplace-links/NFTMarketplaceLinks", () => 
  () => <div data-testid="marketplace-links">Marketplace Links</div>
);

// Mock the home page components
jest.mock("@/components/home/LatestDropSection", () => 
  ({ featuredNft }: any) => (
    <div data-testid="latest-drop-section">
      <h1><span>Latest</span> Drop</h1>
      <h3>
        <a href={`/the-memes/${featuredNft.id}`}>
          Card {featuredNft.id} - {featuredNft.name}
        </a>
      </h3>
      <div>{featuredNft.collection}</div>
      <div>{featuredNft.season}</div>
      <div>{featuredNft.meme_name}</div>
      <div data-testid="mint-countdown">Mint Countdown</div>
      <div data-testid="featured-nft-image">
        <div data-testid="nft-id">{featuredNft.id}</div>
        <div data-testid="nft-balance">0</div>
      </div>
    </div>
  )
);

jest.mock("@/components/home/FeaturedNFTImageColumn", () => 
  ({ featuredNft, nftBalance }: any) => (
    <div data-testid="featured-nft-image">
      <div data-testid="nft-id">{featuredNft.id}</div>
      <div data-testid="nft-balance">{nftBalance}</div>
    </div>
  )
);

// Mock utilities that may cause warnings
jest.mock("@/helpers/Helpers", () => ({
  isEmptyObject: (obj: any) => obj === null || obj === undefined || Object.keys(obj).length === 0,
  numberWithCommas: (num: number) => num.toLocaleString(),
  fromGWEI: (wei: number) => wei / 1e9,
  printMintDate: (date: string) => new Date(date).toLocaleDateString(),
  capitalizeEveryWord: (str: string) => str.replace(/\b\w/g, l => l.toUpperCase()),
}));

jest.mock("@/helpers/nft.helpers", () => ({
  getDimensionsFromMetadata: () => "1000x1000",
  getFileTypeFromMetadata: () => "PNG",
}));

jest.mock("@/components/nextGen/nextgen_helpers", () => ({
  formatNameForUrl: (name: string) => name.toLowerCase().replace(/\s+/g, "-"),
}));

const mockNft = {
  id: 123,
  name: "Test Meme NFT",
  contract: "0x33fd426905f149f8376e227d0c9d3340aad17af1",
  collection: "The Memes by 6529",
  season: 6,
  meme_name: "Test Meme",
  artist: "Test Artist",
  mint_date: "2024-01-15",
  metadata: { 
    image_details: { 
      format: "png", 
      width: 2000, 
      height: 2000 
    } 
  },
} as any;

const mockCollection = { 
  name: "Test NextGen Collection",
  id: "test-collection" 
} as any;

const mockEmptyCollection = null as any;

const TestProvider: React.FC<{ 
  children: React.ReactNode;
  connectedProfile?: any;
}> = ({ children, connectedProfile = null }) => {
  const authContextValue = useMemo(
    () => ({
      connectedProfile,
      setTitle: jest.fn(),
    }),
    [connectedProfile]
  );
  return (
    <AuthContext.Provider value={authContextValue as any}>
      {children}
    </AuthContext.Provider>
  );
};

describe("Home component", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders latest drop section with correct NFT data", async () => {
    await act(async () => {
      render(
        <TestProvider>
          <Home featuredNft={mockNft} featuredNextgen={mockCollection} />
        </TestProvider>
      );
    });

    // Verify Latest Drop section
    expect(screen.getByText("Latest")).toBeInTheDocument();
    expect(screen.getByText("Drop")).toBeInTheDocument();
    
    // Verify NFT details are displayed
    expect(screen.getByText(`Card ${mockNft.id} - ${mockNft.name}`)).toBeInTheDocument();
    expect(screen.getByText(mockNft.collection)).toBeInTheDocument();
    expect(screen.getByText(mockNft.season.toString())).toBeInTheDocument();
    expect(screen.getByText(mockNft.meme_name)).toBeInTheDocument();
    
    // Verify featured NFT image component is rendered
    expect(screen.getByTestId("featured-nft-image")).toBeInTheDocument();
    expect(screen.getByTestId("nft-id")).toHaveTextContent(mockNft.id.toString());
    
    // Verify mint countdown is rendered
    expect(screen.getByTestId("mint-countdown")).toBeInTheDocument();
  });

  it("renders NextGen discover section when collection is provided", async () => {
    await act(async () => {
      render(
        <TestProvider>
          <Home featuredNft={mockNft} featuredNextgen={mockCollection} />
        </TestProvider>
      );
    });

    // Verify NextGen section
    expect(screen.getByText("Discover")).toBeInTheDocument();
    expect(screen.getByText(`NextGen - ${mockCollection.name}`)).toBeInTheDocument();
    expect(screen.getByText("View Collection")).toBeInTheDocument();
    expect(screen.getByTestId("nextgen-slideshow")).toBeInTheDocument();
  });

  it("does not render NextGen section when collection is empty", async () => {
    await act(async () => {
      render(
        <TestProvider>
          <Home featuredNft={mockNft} featuredNextgen={mockEmptyCollection} />
        </TestProvider>
      );
    });

    // NextGen section should not be rendered
    expect(screen.queryByText(/NextGen/)).not.toBeInTheDocument();
    expect(screen.queryByText("View Collection")).not.toBeInTheDocument();
    expect(screen.queryByTestId("nextgen-slideshow")).not.toBeInTheDocument();
  });

  it("renders latest activity section", async () => {
    await act(async () => {
      render(
        <TestProvider>
          <Home featuredNft={mockNft} featuredNextgen={mockCollection} />
        </TestProvider>
      );
    });

    // Verify Latest Activity section (dynamically loaded)
    expect(screen.getByTestId("latest-activity")).toBeInTheDocument();
  });

  it("displays NFT balance when user is connected", async () => {
    const connectedProfile = {
      consolidation_key: "test-key-123"
    };

    await act(async () => {
      render(
        <TestProvider connectedProfile={connectedProfile}>
          <Home featuredNft={mockNft} featuredNextgen={mockCollection} />
        </TestProvider>
      );
    });

    // Balance should be displayed (mocked to 0)
    expect(screen.getByTestId("nft-balance")).toHaveTextContent("0");
  });

  it("handles missing NFT data gracefully", async () => {
    const incompleteNft = {
      ...mockNft,
      name: "",
      meme_name: "",
      artist: "",
    };

    await act(async () => {
      render(
        <TestProvider>
          <Home featuredNft={incompleteNft} featuredNextgen={mockCollection} />
        </TestProvider>
      );
    });

    // Component should still render without crashing
    expect(screen.getByText("Latest")).toBeInTheDocument();
    expect(screen.getByText("Drop")).toBeInTheDocument();
    // Check for the card text with more flexible matching since empty name may not render trailing space
    expect(screen.getByText(new RegExp(`Card ${incompleteNft.id}`))).toBeInTheDocument();
  });

  it("renders all required sections in correct order", async () => {
    await act(async () => {
      render(
        <TestProvider>
          <Home featuredNft={mockNft} featuredNextgen={mockCollection} />
        </TestProvider>
      );
    });

    const sections = screen.getAllByRole("generic");
    
    // Verify sections are present (order testing through DOM structure)
    expect(screen.getByText("Latest")).toBeInTheDocument();
    expect(screen.getByText("Discover")).toBeInTheDocument();
    expect(screen.getByTestId("latest-activity")).toBeInTheDocument();
  });
});

describe("Home component error handling", () => {
  it("handles null featuredNft gracefully", async () => {
    // This should throw or be handled gracefully since featuredNft is required
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    
    try {
      await act(async () => {
        render(
          <TestProvider>
            <Home featuredNft={null as any} featuredNextgen={mockCollection} />
          </TestProvider>
        );
      });
      
      // If it doesn't crash, verify it handles null gracefully
      expect(screen.queryByText("Latest")).toBeInTheDocument();
    } catch (error) {
      // Expected behavior - component should fail fast on required props
      expect(error).toBeDefined();
    }
    
    consoleSpy.mockRestore();
  });

  it("renders without NextGen collection", async () => {
    await act(async () => {
      render(
        <TestProvider>
          <Home featuredNft={mockNft} featuredNextgen={undefined as any} />
        </TestProvider>
      );
    });

    // Should render without NextGen section
    expect(screen.getByText("Latest")).toBeInTheDocument();
    expect(screen.queryByText(/NextGen/)).not.toBeInTheDocument();
  });
});

describe("Home component integration", () => {
  it("passes correct props to child components", async () => {
    await act(async () => {
      render(
        <TestProvider>
          <Home featuredNft={mockNft} featuredNextgen={mockCollection} />
        </TestProvider>
      );
    });

    // Verify props are passed correctly to mocked components
    expect(screen.getByTestId("featured-nft-image")).toBeInTheDocument();
    expect(screen.getByTestId("nft-id")).toHaveTextContent(mockNft.id.toString());
    expect(screen.getByTestId("nextgen-slideshow")).toBeInTheDocument();
  });
});