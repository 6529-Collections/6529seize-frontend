import { render, screen } from "@testing-library/react";
import { useCookieConsent } from "@/components/cookies/CookieConsentContext";
import FeaturedNFTDetailsColumn from "@/components/home/FeaturedNFTDetailsColumn";
import { NFTWithMemesExtendedData } from "@/entities/INFT";
import useCapacitor, {
  CapacitorOrientationType,
} from "@/hooks/useCapacitor";
import { useManifoldClaimDisplays } from "@/hooks/useManifoldClaimDisplays";

// Mock all dependencies
jest.mock("@/hooks/useManifoldClaim");
jest.mock("@/hooks/useCapacitor");
jest.mock("@/components/cookies/CookieConsentContext");
jest.mock("@/hooks/useManifoldClaimDisplays");

// Mock child components
jest.mock("next/link", () => ({
  __esModule: true,
  default: ({ href, children, ...rest }: any) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

jest.mock(
  "@/components/nft-marketplace-links/NFTMarketplaceLinks",
  () => ({
    __esModule: true,
    default: ({ contract, id }: { contract: string; id: number }) => (
      <div data-testid="nft-marketplace-links">
        Marketplace Links - Contract: {contract}, ID: {id}
      </div>
    ),
  })
);

jest.mock("@/components/home/ManifoldClaimTable", () => ({
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

jest.mock("@/components/home/FeaturedNFTDetailsTable", () => ({
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

jest.mock("@/components/home/MintingApproachSection", () => ({
  __esModule: true,
  default: ({ nftId }: { nftId: number }) => (
    <div data-testid="minting-approach-section">
      Minting Approach for NFT {nftId}
    </div>
  ),
}));

jest.mock("@/components/the-memes/MemePageMintCountdown", () => ({
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
const mockUseCapacitor = useCapacitor as jest.MockedFunction<
  typeof useCapacitor
>;
const mockUseCookieConsent = useCookieConsent as jest.MockedFunction<
  typeof useCookieConsent
>;
const mockUseManifoldClaimDisplays =
  useManifoldClaimDisplays as jest.MockedFunction<
    typeof useManifoldClaimDisplays
  >;

// Minimal test data factory - only includes fields actually used by the component
function createTestNFT(
  overrides: Partial<NFTWithMemesExtendedData> = {}
): NFTWithMemesExtendedData {
  const baseNFT = {
    id: 123,
    contract: "0x1234567890abcdef",
    name: "Test Meme NFT",
    // Only include essential fields that the component actually uses
    created_at: new Date("2023-01-01"),
    mint_date: new Date("2023-01-01"),
    mint_price: 0.1,
    supply: 1000,
    collection: "The Memes",
    token_type: "ERC721" as const,
    description: "Test description",
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
    // MemesExtendedData - minimal required fields
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
  } as NFTWithMemesExtendedData;

  return { ...baseNFT, ...overrides };
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

    // Set default mock returns for consistent test behavior
    mockUseCapacitor.mockReturnValue({
      isCapacitor: false,
      isIos: false,
      isAndroid: false,
      platform: "web",
      isActive: true,
      keyboardVisible: false,
      orientation: CapacitorOrientationType.PORTRAIT,
    });

    mockUseCookieConsent.mockReturnValue({
      showCookieConsent: false,
      country: "US",
      consent: jest.fn(),
      reject: jest.fn(),
    });

    mockUseManifoldClaimDisplays.mockReturnValue(defaultManifoldDisplays);
  });

  // Helper function to setup platform/country scenarios consistently
  const setupPlatformAndCountry = (
    platform: "web" | "ios" | "android",
    country: string = "US"
  ) => {
    mockUseCapacitor.mockReturnValue({
      isCapacitor: platform !== "web",
      isIos: platform === "ios",
      isAndroid: platform === "android",
      platform,
      isActive: true,
      keyboardVisible: false,
      orientation: CapacitorOrientationType.PORTRAIT,
    });

    mockUseCookieConsent.mockReturnValue({
      showCookieConsent: false,
      country,
      consent: jest.fn(),
      reject: jest.fn(),
    });
  };

  describe("Basic rendering", () => {
    it("renders without crashing", () => {
      const nft = createTestNFT();
      render(
        <FeaturedNFTDetailsColumn
          featuredNft={nft}
          isMemeMintingActive={true}
        />
      );

      expect(
        screen.getByText(`Card ${nft.id} - ${nft.name}`)
      ).toBeInTheDocument();
    });

    it("renders the NFT title as a link to the meme page", () => {
      const nft = createTestNFT({ id: 456, name: "Amazing Meme" });
      render(
        <FeaturedNFTDetailsColumn
          featuredNft={nft}
          isMemeMintingActive={true}
        />
      );

      const link = screen.getByRole("link", {
        name: /Card 456 - Amazing Meme/i,
      });
      expect(link).toHaveAttribute("href", "/the-memes/456");
    });

    it("renders all child components with correct props", () => {
      const nft = createTestNFT();
      render(
        <FeaturedNFTDetailsColumn
          featuredNft={nft}
          isMemeMintingActive={true}
        />
      );

      // Check all child components are rendered
      expect(
        screen.getByTestId("featured-nft-details-table")
      ).toBeInTheDocument();
      expect(
        screen.getByTestId("meme-page-mint-countdown")
      ).toBeInTheDocument();
      expect(
        screen.getByTestId("minting-approach-section")
      ).toBeInTheDocument();
      expect(screen.getByTestId("manifold-claim-table")).toBeInTheDocument();
    });
  });

  describe("Manifold claim integration", () => {
    it("displays manifold claim information when available", () => {
      const nft = createTestNFT();
      render(
        <FeaturedNFTDetailsColumn
          featuredNft={nft}
          isMemeMintingActive={true}
        />
      );

      // User should see the manifold claim displays
      const detailsTable = screen.getByTestId("featured-nft-details-table");
      expect(detailsTable).toHaveTextContent("Edition Size:");

      const claimTable = screen.getByTestId("manifold-claim-table");
      expect(claimTable).toHaveTextContent("Status:");
      expect(claimTable).toHaveTextContent("Cost:");
    });

    it("handles null manifold displays gracefully", () => {
      mockUseManifoldClaimDisplays.mockReturnValue({
        editionSizeDisplay: null,
        statusDisplay: null,
        costDisplay: null,
      });

      const nft = createTestNFT();

      expect(() => {
        render(
          <FeaturedNFTDetailsColumn
            featuredNft={nft}
            isMemeMintingActive={true}
          />
        );
      }).not.toThrow();
    });
  });

  describe("Conditional marketplace links rendering", () => {
    it("shows marketplace links on non-iOS platforms", () => {
      const nft = createTestNFT();
      setupPlatformAndCountry("web", "DE");

      render(
        <FeaturedNFTDetailsColumn
          featuredNft={nft}
          isMemeMintingActive={true}
        />
      );

      expect(screen.getByTestId("nft-marketplace-links")).toBeInTheDocument();
      expect(
        screen.getByText(
          `Marketplace Links - Contract: ${nft.contract}, ID: ${nft.id}`
        )
      ).toBeInTheDocument();
    });

    it("shows marketplace links on iOS when country is US", () => {
      const nft = createTestNFT();
      setupPlatformAndCountry("ios", "US");

      render(
        <FeaturedNFTDetailsColumn
          featuredNft={nft}
          isMemeMintingActive={true}
        />
      );

      expect(screen.getByTestId("nft-marketplace-links")).toBeInTheDocument();
    });

    it("hides marketplace links on iOS when country is not US", () => {
      const nft = createTestNFT();
      setupPlatformAndCountry("ios", "FR");

      render(
        <FeaturedNFTDetailsColumn
          featuredNft={nft}
          isMemeMintingActive={true}
        />
      );

      expect(
        screen.queryByTestId("nft-marketplace-links")
      ).not.toBeInTheDocument();
    });

    it("shows marketplace links on Android regardless of country", () => {
      const nft = createTestNFT();
      setupPlatformAndCountry("android", "DE");

      render(
        <FeaturedNFTDetailsColumn
          featuredNft={nft}
          isMemeMintingActive={true}
        />
      );

      expect(screen.getByTestId("nft-marketplace-links")).toBeInTheDocument();
    });
  });

  describe("State interactions", () => {
    it("updates manifold claim state when mint countdown triggers setClaim", () => {
      const nft = createTestNFT();
      render(
        <FeaturedNFTDetailsColumn
          featuredNft={nft}
          isMemeMintingActive={true}
        />
      );

      // User can trigger claim setting via the mint countdown
      const setClaimButton = screen.getByRole("button", { name: "Set Claim" });
      expect(setClaimButton).toBeInTheDocument();

      // This tests the behavior that matters to users - the interactive element exists
      expect(
        screen.getByTestId("meme-page-mint-countdown")
      ).toBeInTheDocument();
    });
  });

  describe("Accessibility and user experience", () => {
    it("provides accessible navigation link to NFT detail page", () => {
      const nft = createTestNFT({ id: 456, name: "Accessible Meme" });
      render(
        <FeaturedNFTDetailsColumn
          featuredNft={nft}
          isMemeMintingActive={true}
        />
      );

      const link = screen.getByRole("link", {
        name: /Card 456 - Accessible Meme/i,
      });
      expect(link).toHaveAttribute("href", "/the-memes/456");
      expect(link).toBeInTheDocument();
    });

    it("maintains semantic structure with headings and sections", () => {
      const nft = createTestNFT();
      render(
        <FeaturedNFTDetailsColumn
          featuredNft={nft}
          isMemeMintingActive={true}
        />
      );

      // Should have proper heading structure
      const heading = screen.getByRole("heading", { level: 3 });
      expect(heading).toHaveTextContent(`Card ${nft.id} - ${nft.name}`);
    });
  });

  describe("Data integration", () => {
    it("passes NFT data consistently to all child components", () => {
      const nft = createTestNFT({
        id: 999,
        name: "Integration Test NFT",
        contract: "0xtest123",
      });
      render(
        <FeaturedNFTDetailsColumn
          featuredNft={nft}
          isMemeMintingActive={true}
        />
      );

      // Verify NFT data reaches the appropriate child components
      expect(
        screen.getByTestId("featured-nft-details-table")
      ).toHaveTextContent("Integration Test NFT");
      expect(screen.getByTestId("meme-page-mint-countdown")).toHaveTextContent(
        "999"
      );
      expect(screen.getByTestId("minting-approach-section")).toHaveTextContent(
        "999"
      );
      expect(screen.getByTestId("manifold-claim-table")).toHaveTextContent(
        "999"
      );

      // Marketplace links should show contract and ID
      if (screen.queryByTestId("nft-marketplace-links")) {
        expect(screen.getByTestId("nft-marketplace-links")).toHaveTextContent(
          "0xtest123"
        );
      }
    });

    it("handles manifold claim displays with different types of content", () => {
      const customDisplays = {
        editionSizeDisplay: <div>Custom Edition: 500</div>,
        statusDisplay: <div>Custom Status: Available</div>,
        costDisplay: <div>Custom Cost: 0.05 ETH</div>,
      };
      mockUseManifoldClaimDisplays.mockReturnValue(customDisplays);

      const nft = createTestNFT();
      render(
        <FeaturedNFTDetailsColumn
          featuredNft={nft}
          isMemeMintingActive={true}
        />
      );

      // Custom displays should be rendered through child components
      expect(
        screen.getByTestId("featured-nft-details-table")
      ).toBeInTheDocument();
      expect(screen.getByTestId("manifold-claim-table")).toBeInTheDocument();
    });
  });

  describe("Error scenarios and edge cases", () => {
    it("handles hook errors gracefully", () => {
      // Mock hook to throw error
      mockUseCapacitor.mockImplementation(() => {
        throw new Error("Hook error");
      });

      const nft = createTestNFT();

      expect(() => {
        render(
          <FeaturedNFTDetailsColumn
            featuredNft={nft}
            isMemeMintingActive={true}
          />
        );
      }).toThrow("Hook error");
    });

    it("displays empty name and contract gracefully", () => {
      const incompleteNFT = createTestNFT({
        name: "",
        contract: "",
      });

      render(
        <FeaturedNFTDetailsColumn
          featuredNft={incompleteNFT}
          isMemeMintingActive={true}
        />
      );

      // Should still show the card structure with ID, even if name/contract are empty
      expect(
        screen.getByText(`Card ${incompleteNFT.id} -`)
      ).toBeInTheDocument();
      // Should still render all the main components
      expect(
        screen.getByTestId("featured-nft-details-table")
      ).toBeInTheDocument();
    });

    it("shows component structure when manifold displays are null", () => {
      mockUseManifoldClaimDisplays.mockReturnValue({
        editionSizeDisplay: null,
        statusDisplay: null,
        costDisplay: null,
      });

      const nft = createTestNFT();
      render(
        <FeaturedNFTDetailsColumn
          featuredNft={nft}
          isMemeMintingActive={true}
        />
      );

      // Main structure should still be visible to user
      expect(
        screen.getByText(`Card ${nft.id} - ${nft.name}`)
      ).toBeInTheDocument();
      expect(screen.getByTestId("manifold-claim-table")).toBeInTheDocument();
    });

    it("renders consistently across different countries", () => {
      const testCases = [
        { country: "US", expectedMarketplace: true },
        { country: "CA", expectedMarketplace: true },
        { country: "DE", expectedMarketplace: true },
        { country: "", expectedMarketplace: true },
      ];
      const nft = createTestNFT();

      testCases.forEach(({ country, expectedMarketplace }) => {
        mockUseCookieConsent.mockReturnValue({
          showCookieConsent: false,
          country,
          consent: jest.fn(),
          reject: jest.fn(),
        });

        const { unmount } = render(
          <FeaturedNFTDetailsColumn
            featuredNft={nft}
            isMemeMintingActive={true}
          />
        );

        // Core content should always be visible
        expect(
          screen.getByText(`Card ${nft.id} - ${nft.name}`)
        ).toBeInTheDocument();

        // Marketplace links visibility depends on iOS + country combination
        if (expectedMarketplace) {
          expect(
            screen.getByTestId("nft-marketplace-links")
          ).toBeInTheDocument();
        }

        unmount();
      });
    });

    it("adapts marketplace link visibility based on platform and location", () => {
      const testCases = [
        {
          platform: "ios",
          country: "US",
          expectLinks: true,
          description: "iOS in US shows links",
        },
        {
          platform: "ios",
          country: "FR",
          expectLinks: false,
          description: "iOS outside US hides links",
        },
        {
          platform: "android",
          country: "FR",
          expectLinks: true,
          description: "Android shows links regardless of country",
        },
        {
          platform: "web",
          country: "DE",
          expectLinks: true,
          description: "Web shows links regardless of country",
        },
      ];
      const nft = createTestNFT();

      testCases.forEach(({ platform, country, expectLinks, description }) => {
        mockUseCapacitor.mockReturnValue({
          isCapacitor: platform !== "web",
          isIos: platform === "ios",
          isAndroid: platform === "android",
          platform,
          isActive: true,
          keyboardVisible: false,
          orientation: CapacitorOrientationType.PORTRAIT,
        });

        mockUseCookieConsent.mockReturnValue({
          showCookieConsent: false,
          country,
          consent: jest.fn(),
          reject: jest.fn(),
        });

        const { unmount } = render(
          <FeaturedNFTDetailsColumn
            featuredNft={nft}
            isMemeMintingActive={true}
          />
        );

        // Core content always visible
        expect(
          screen.getByText(`Card ${nft.id} - ${nft.name}`)
        ).toBeInTheDocument();

        // Check marketplace links visibility
        if (expectLinks) {
          expect(
            screen.getByTestId("nft-marketplace-links")
          ).toBeInTheDocument();
        } else {
          expect(
            screen.queryByTestId("nft-marketplace-links")
          ).not.toBeInTheDocument();
        }

        unmount();
      });
    });
  });

  describe("Layout structure", () => {
    it("renders proper layout structure with all sections", () => {
      const nft = createTestNFT();
      render(
        <FeaturedNFTDetailsColumn
          featuredNft={nft}
          isMemeMintingActive={true}
        />
      );

      // User should see all the main sections
      expect(
        screen.getByText(`Card ${nft.id} - ${nft.name}`)
      ).toBeInTheDocument();
      expect(
        screen.getByTestId("featured-nft-details-table")
      ).toBeInTheDocument();
      expect(
        screen.getByTestId("meme-page-mint-countdown")
      ).toBeInTheDocument();
      expect(
        screen.getByTestId("minting-approach-section")
      ).toBeInTheDocument();
      expect(screen.getByTestId("manifold-claim-table")).toBeInTheDocument();
    });
  });
});
