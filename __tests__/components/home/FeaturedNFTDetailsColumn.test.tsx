import { render, screen } from "@testing-library/react";
import FeaturedNFTDetailsColumn from "../../../components/home/FeaturedNFTDetailsColumn";
import { NFTWithMemesExtendedData } from "../../../entities/INFT";
import useCapacitor from "../../../hooks/useCapacitor";
import { useCookieConsent } from "../../../components/cookies/CookieConsentContext";
import { useManifoldClaimDisplays } from "../../../hooks/useManifoldClaimDisplays";

// Mock all dependencies
jest.mock("../../../hooks/useCapacitor");
jest.mock("../../../components/cookies/CookieConsentContext");
jest.mock("../../../hooks/useManifoldClaimDisplays");

// Mock child components
jest.mock("next/link", () => ({
  __esModule: true,
  default: ({ href, children, ...rest }: any) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

jest.mock("../../../components/nft-marketplace-links/NFTMarketplaceLinks", () => ({
  __esModule: true,
  default: ({ contract, id }: { contract: string; id: number }) => (
    <div data-testid="nft-marketplace-links">
      Marketplace Links - Contract: {contract}, ID: {id}
    </div>
  ),
}));

jest.mock("../../../components/home/ManifoldClaimTable", () => ({
  __esModule: true,
  default: ({
    statusDisplay,
    costDisplay,
    nft,
  }: {
    statusDisplay: any;
    costDisplay: any;
    nft: NFTWithMemesExtendedData;
  }) => (
    <div data-testid="manifold-claim-table">
      <div>Status: {statusDisplay}</div>
      <div>Cost: {costDisplay}</div>
      <div>NFT ID: {nft.id}</div>
    </div>
  ),
}));

jest.mock("../../../components/home/FeaturedNFTDetailsTable", () => ({
  __esModule: true,
  default: ({
    nft,
    editionSizeDisplay,
  }: {
    nft: NFTWithMemesExtendedData;
    editionSizeDisplay: any;
  }) => (
    <div data-testid="featured-nft-details-table">
      <div>NFT: {nft.name}</div>
      <div>Edition Size: {editionSizeDisplay}</div>
    </div>
  ),
}));

jest.mock("../../../components/home/MintingApproachSection", () => ({
  __esModule: true,
  default: ({ nftId }: { nftId: number }) => (
    <div data-testid="minting-approach-section">
      Minting Approach for NFT {nftId}
    </div>
  ),
}));

jest.mock("../../../components/the-memes/MemePageMintCountdown", () => ({
  __esModule: true,
  default: ({
    nft_id,
    setClaim,
    is_full_width,
  }: {
    nft_id: number;
    setClaim: (claim: any) => void;
    is_full_width: boolean;
  }) => (
    <div data-testid="meme-page-mint-countdown">
      <div>NFT ID: {nft_id}</div>
      <div>Full Width: {is_full_width.toString()}</div>
      <button onClick={() => setClaim({ id: 1, status: "active" })}>
        Set Claim
      </button>
    </div>
  ),
}));

// Type-safe mock functions
const mockUseCapacitor = useCapacitor as jest.MockedFunction<typeof useCapacitor>;
const mockUseCookieConsent = useCookieConsent as jest.MockedFunction<
  typeof useCookieConsent
>;
const mockUseManifoldClaimDisplays = useManifoldClaimDisplays as jest.MockedFunction<
  typeof useManifoldClaimDisplays
>;

// Test data factory
function createNFTWithMemesExtendedData(
  overrides: Partial<NFTWithMemesExtendedData> = {}
): NFTWithMemesExtendedData {
  return {
    id: 123,
    contract: "0x1234567890abcdef",
    name: "Test Meme NFT",
    created_at: new Date("2023-01-01"),
    mint_date: new Date("2023-01-01"),
    mint_price: 0.1,
    supply: 1000,
    collection: "The Memes",
    token_type: "ERC721",
    description: "Test meme NFT description",
    artist: "Test Artist",
    artist_seize_handle: "testartist",
    uri: "https://test.com/metadata",
    icon: "https://test.com/icon.png",
    thumbnail: "https://test.com/thumb.png",
    scaled: "https://test.com/scaled.png",
    image: "https://test.com/image.png",
    animation: "",
    market_cap: 1000,
    floor_price: 0.05,
    total_volume_last_24_hours: 50,
    total_volume_last_7_days: 200,
    total_volume_last_1_month: 500,
    total_volume: 1000,
    has_distribution: true,
    highest_offer: 0.08,
    boosted_tdh: 100,
    tdh: 90,
    tdh__raw: 85,
    tdh_rank: 1,
    hodl_rate: 0.8,
    // MemesExtendedData properties
    collection_size: 1000,
    edition_size: 1000,
    edition_size_rank: 1,
    museum_holdings: 50,
    museum_holdings_rank: 1,
    edition_size_cleaned: 980,
    edition_size_cleaned_rank: 1,
    hodlers: 800,
    hodlers_rank: 1,
    percent_unique: 80,
    percent_unique_rank: 1,
    percent_unique_cleaned: 82,
    percent_unique_cleaned_rank: 1,
    burnt: 20,
    edition_size_not_burnt: 980,
    edition_size_not_burnt_rank: 1,
    percent_unique_not_burnt: 82,
    percent_unique_not_burnt_rank: 1,
    season: 1,
    meme: 23,
    meme_name: "Test Meme",
    ...overrides,
  } as NFTWithMemesExtendedData;
}

describe("FeaturedNFTDetailsColumn", () => {
  const defaultManifoldDisplays = {
    editionSizeDisplay: <span>1000</span>,
    statusDisplay: <span>Active</span>,
    costDisplay: <span>Free</span>,
  };

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();

    // Default mock returns
    mockUseCapacitor.mockReturnValue({
      isCapacitor: false,
      isIos: false,
      isAndroid: false,
      platform: "web",
      isActive: true,
      keyboardVisible: false,
    });

    mockUseCookieConsent.mockReturnValue({
      showCookieConsent: false,
      country: "US",
      consent: jest.fn(),
      reject: jest.fn(),
    });

    mockUseManifoldClaimDisplays.mockReturnValue(defaultManifoldDisplays);
  });

  describe("Basic rendering", () => {
    it("renders without crashing", () => {
      const nft = createNFTWithMemesExtendedData();
      render(<FeaturedNFTDetailsColumn featuredNft={nft} />);
      
      expect(screen.getByText(`Card ${nft.id} - ${nft.name}`)).toBeInTheDocument();
    });

    it("renders the NFT title as a link to the meme page", () => {
      const nft = createNFTWithMemesExtendedData({ id: 456, name: "Amazing Meme" });
      render(<FeaturedNFTDetailsColumn featuredNft={nft} />);
      
      const link = screen.getByRole("link", { name: /Card 456 - Amazing Meme/i });
      expect(link).toHaveAttribute("href", "/the-memes/456");
    });

    it("renders all child components with correct props", () => {
      const nft = createNFTWithMemesExtendedData();
      render(<FeaturedNFTDetailsColumn featuredNft={nft} />);
      
      // Check all child components are rendered
      expect(screen.getByTestId("featured-nft-details-table")).toBeInTheDocument();
      expect(screen.getByTestId("meme-page-mint-countdown")).toBeInTheDocument();
      expect(screen.getByTestId("minting-approach-section")).toBeInTheDocument();
      expect(screen.getByTestId("manifold-claim-table")).toBeInTheDocument();
    });
  });

  describe("Hook integrations", () => {
    it("calls useCapacitor hook", () => {
      const nft = createNFTWithMemesExtendedData();
      render(<FeaturedNFTDetailsColumn featuredNft={nft} />);
      
      expect(mockUseCapacitor).toHaveBeenCalledTimes(1);
    });

    it("calls useCookieConsent hook", () => {
      const nft = createNFTWithMemesExtendedData();
      render(<FeaturedNFTDetailsColumn featuredNft={nft} />);
      
      expect(mockUseCookieConsent).toHaveBeenCalledTimes(1);
    });

    it("calls useManifoldClaimDisplays with undefined initially", () => {
      const nft = createNFTWithMemesExtendedData();
      render(<FeaturedNFTDetailsColumn featuredNft={nft} />);
      
      expect(mockUseManifoldClaimDisplays).toHaveBeenCalledWith({
        manifoldClaim: undefined,
      });
    });

    it("passes manifoldClaim displays to child components", () => {
      const nft = createNFTWithMemesExtendedData();
      render(<FeaturedNFTDetailsColumn featuredNft={nft} />);
      
      // Check that displays are passed to child components
      const detailsTable = screen.getByTestId("featured-nft-details-table");
      expect(detailsTable).toHaveTextContent("Edition Size:");
      
      const claimTable = screen.getByTestId("manifold-claim-table");
      expect(claimTable).toHaveTextContent("Status:");
      expect(claimTable).toHaveTextContent("Cost:");
    });
  });

  describe("Conditional marketplace links rendering", () => {
    it("shows NFT marketplace links when not iOS or country is US", () => {
      const nft = createNFTWithMemesExtendedData();
      mockUseCapacitor.mockReturnValue({
        isCapacitor: false,
        isIos: false,
        isAndroid: false,
        platform: "web",
        isActive: true,
        keyboardVisible: false,
      });
      mockUseCookieConsent.mockReturnValue({
        showCookieConsent: false,
        country: "US",
        consent: jest.fn(),
        reject: jest.fn(),
      });

      render(<FeaturedNFTDetailsColumn featuredNft={nft} />);
      
      expect(screen.getByTestId("nft-marketplace-links")).toBeInTheDocument();
      expect(screen.getByText(`Marketplace Links - Contract: ${nft.contract}, ID: ${nft.id}`)).toBeInTheDocument();
    });

    it("shows NFT marketplace links when iOS and country is US", () => {
      const nft = createNFTWithMemesExtendedData();
      mockUseCapacitor.mockReturnValue({
        isCapacitor: true,
        isIos: true,
        isAndroid: false,
        platform: "ios",
        isActive: true,
        keyboardVisible: false,
      });
      mockUseCookieConsent.mockReturnValue({
        showCookieConsent: false,
        country: "US",
        consent: jest.fn(),
        reject: jest.fn(),
      });

      render(<FeaturedNFTDetailsColumn featuredNft={nft} />);
      
      expect(screen.getByTestId("nft-marketplace-links")).toBeInTheDocument();
    });

    it("hides NFT marketplace links when iOS and country is not US", () => {
      const nft = createNFTWithMemesExtendedData();
      mockUseCapacitor.mockReturnValue({
        isCapacitor: true,
        isIos: true,
        isAndroid: false,
        platform: "ios",
        isActive: true,
        keyboardVisible: false,
      });
      mockUseCookieConsent.mockReturnValue({
        showCookieConsent: false,
        country: "FR",
        consent: jest.fn(),
        reject: jest.fn(),
      });

      render(<FeaturedNFTDetailsColumn featuredNft={nft} />);
      
      expect(screen.queryByTestId("nft-marketplace-links")).not.toBeInTheDocument();
    });

    it("shows NFT marketplace links when not iOS regardless of country", () => {
      const nft = createNFTWithMemesExtendedData();
      mockUseCapacitor.mockReturnValue({
        isCapacitor: false,
        isIos: false,
        isAndroid: false,
        platform: "web",
        isActive: true,
        keyboardVisible: false,
      });
      mockUseCookieConsent.mockReturnValue({
        showCookieConsent: false,
        country: "DE",
        consent: jest.fn(),
        reject: jest.fn(),
      });

      render(<FeaturedNFTDetailsColumn featuredNft={nft} />);
      
      expect(screen.getByTestId("nft-marketplace-links")).toBeInTheDocument();
    });
  });

  describe("Component state management", () => {
    it("manages manifoldClaim state correctly", () => {
      const nft = createNFTWithMemesExtendedData();
      render(<FeaturedNFTDetailsColumn featuredNft={nft} />);
      
      // Initially manifoldClaim should be undefined
      expect(mockUseManifoldClaimDisplays).toHaveBeenCalledWith({
        manifoldClaim: undefined,
      });
      
      // Check that setClaim prop is passed to MemePageMintCountdown
      expect(screen.getByTestId("meme-page-mint-countdown")).toBeInTheDocument();
    });

    it("passes correct props to child components", () => {
      const nft = createNFTWithMemesExtendedData({ id: 789, name: "Test NFT" });
      render(<FeaturedNFTDetailsColumn featuredNft={nft} />);
      
      // Check FeaturedNFTDetailsTable props
      const detailsTable = screen.getByTestId("featured-nft-details-table");
      expect(detailsTable).toHaveTextContent("NFT: Test NFT");
      
      // Check MemePageMintCountdown props
      const mintCountdown = screen.getByTestId("meme-page-mint-countdown");
      expect(mintCountdown).toHaveTextContent("NFT ID: 789");
      expect(mintCountdown).toHaveTextContent("Full Width: true");
      
      // Check MintingApproachSection props
      const mintingApproach = screen.getByTestId("minting-approach-section");
      expect(mintingApproach).toHaveTextContent("Minting Approach for NFT 789");
      
      // Check ManifoldClaimTable props
      const claimTable = screen.getByTestId("manifold-claim-table");
      expect(claimTable).toHaveTextContent("NFT ID: 789");
    });
  });

  describe("Error scenarios and edge cases", () => {
    it("handles hook errors gracefully", () => {
      // Mock hook to throw error
      mockUseCapacitor.mockImplementation(() => {
        throw new Error("Hook error");
      });
      
      const nft = createNFTWithMemesExtendedData();
      
      expect(() => {
        render(<FeaturedNFTDetailsColumn featuredNft={nft} />);
      }).toThrow("Hook error");
    });

    it("handles missing NFT data gracefully", () => {
      const incompleteNFT = createNFTWithMemesExtendedData({
        name: "",
        contract: "",
      });
      
      expect(() => {
        render(<FeaturedNFTDetailsColumn featuredNft={incompleteNFT} />);
      }).not.toThrow();
    });

    it("handles undefined manifold displays", () => {
      mockUseManifoldClaimDisplays.mockReturnValue({
        editionSizeDisplay: null,
        statusDisplay: null,
        costDisplay: null,
      });
      
      const nft = createNFTWithMemesExtendedData();
      
      expect(() => {
        render(<FeaturedNFTDetailsColumn featuredNft={nft} />);
      }).not.toThrow();
    });

    it("handles different country codes", () => {
      const countryCodes = ["US", "CA", "UK", "DE", "FR", "JP", "", undefined];
      const nft = createNFTWithMemesExtendedData();
      
      countryCodes.forEach((country) => {
        mockUseCookieConsent.mockReturnValue({
          showCookieConsent: false,
          country: country || "",
          consent: jest.fn(),
          reject: jest.fn(),
        });
        
        const { unmount } = render(<FeaturedNFTDetailsColumn featuredNft={nft} />);
        expect(screen.getByText(`Card ${nft.id} - ${nft.name}`)).toBeInTheDocument();
        unmount();
      });
    });

    it("handles different capacitor platforms", () => {
      const platforms = [
        { isIos: true, isAndroid: false, platform: "ios" },
        { isIos: false, isAndroid: true, platform: "android" },
        { isIos: false, isAndroid: false, platform: "web" },
      ];
      const nft = createNFTWithMemesExtendedData();
      
      platforms.forEach(({ isIos, isAndroid, platform }) => {
        mockUseCapacitor.mockReturnValue({
          isCapacitor: isIos || isAndroid,
          isIos,
          isAndroid,
          platform,
          isActive: true,
          keyboardVisible: false,
        });
        
        const { unmount } = render(<FeaturedNFTDetailsColumn featuredNft={nft} />);
        expect(screen.getByText(`Card ${nft.id} - ${nft.name}`)).toBeInTheDocument();
        unmount();
      });
    });
  });

  describe("Bootstrap layout and responsive behavior", () => {
    it("renders with correct Bootstrap column classes", () => {
      const nft = createNFTWithMemesExtendedData();
      const { container } = render(<FeaturedNFTDetailsColumn featuredNft={nft} />);
      
      const columnElement = container.querySelector(".pt-3.pb-3");
      expect(columnElement).toBeInTheDocument();
      expect(columnElement).toHaveClass("pt-3", "pb-3");
    });

    it("renders Bootstrap Container and Row components", () => {
      const nft = createNFTWithMemesExtendedData();
      const { container } = render(<FeaturedNFTDetailsColumn featuredNft={nft} />);
      
      const containers = container.querySelectorAll(".container, .container-fluid");
      const rows = container.querySelectorAll(".row");
      
      expect(containers.length).toBeGreaterThan(0);
      expect(rows.length).toBeGreaterThan(0);
    });
  });
});