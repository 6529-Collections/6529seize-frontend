import DistributionPage from "@/components/distribution/Distribution";
import { MEMES_CONTRACT } from "@/constants";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";

jest.mock("@/components/not-found/NotFound", () => ({
  __esModule: true,
  default: ({ label }: { label?: string | undefined }) => (
    <div data-testid="not-found" data-label={label} />
  ),
}));

const mockSetTitle = jest.fn();
jest.mock("@/contexts/TitleContext", () => ({
  __esModule: true,
  useTitle: () => ({
    title: "Test Title",
    setTitle: mockSetTitle,
    notificationCount: 0,
    setNotificationCount: jest.fn(),
    setWaveData: jest.fn(),
    setStreamHasNewItems: jest.fn(),
  }),
}));

// Mock useParams to return different values for different tests
const mockUseParams = jest.fn(() => ({ id: "123" }));
jest.mock("next/navigation", () => ({
  useParams: () => mockUseParams(),
}));

// Mock API functions with proper return values
const mockFetchAllPages = jest.fn();
const mockFetchUrl = jest.fn();

jest.mock("@/services/6529api", () => ({
  fetchAllPages: (...args: any[]) => mockFetchAllPages(...args),
  fetchUrl: (...args: any[]) => mockFetchUrl(...args),
}));

// Mock Next.js Image component
jest.mock("next/image", () => ({
  __esModule: true,
  default: (props: React.ImgHTMLAttributes<HTMLImageElement>) => (
    <img alt={props.alt ?? ""} {...props} />
  ),
}));

// Mock child components
jest.mock("@/components/mint-countdown-box/MemePageMintCountdown", () => ({
  __esModule: true,
  default: ({ nft_id }: any) => (
    <div data-testid="mint-countdown" data-nft-id={nft_id} />
  ),
}));

jest.mock("@/components/address/Address", () => {
  const MockAddress = ({ wallets, display, hideCopy }: any) => (
    <div
      data-testid="address-component"
      data-wallet={wallets?.[0]}
      data-display={display}
      data-hide-copy={hideCopy}>
      {display || wallets?.[0]}
    </div>
  );

  MockAddress.displayName = "MockAddress";
  return MockAddress;
});

jest.mock("@/components/searchModal/SearchModal", () => ({
  SearchWalletsDisplay: ({
    searchWallets,
    setSearchWallets,
    setShowSearchModal,
  }: any) => (
    <div data-testid="search-wallets-display">
      <button
        onClick={() => setShowSearchModal(true)}
        data-testid="open-search-modal">
        Search ({searchWallets.length})
      </button>
      {searchWallets.length > 0 && (
        <button onClick={() => setSearchWallets([])} data-testid="clear-search">
          Clear
        </button>
      )}
    </div>
  ),
  SearchModalDisplay: ({
    show,
    setShow,
    searchWallets,
    setSearchWallets,
  }: any) =>
    show ? (
      <div data-testid="search-modal">
        <button onClick={() => setShow(false)} data-testid="close-modal">
          Close
        </button>
        <button
          onClick={() => setSearchWallets(["0x123", "0x456"])}
          data-testid="add-wallets">
          Add Test Wallets
        </button>
      </div>
    ) : null,
}));

jest.mock("@/components/pagination/Pagination", () => {
  const MockPagination = ({ page, pageSize, totalResults, setPage }: any) => (
    <div data-testid="pagination">
      <span>
        Page {page} of {Math.ceil(totalResults / pageSize)}
      </span>
      <button
        onClick={() => setPage(page + 1)}
        data-testid="next-page"
        disabled={page >= Math.ceil(totalResults / pageSize)}>
        Next
      </button>
    </div>
  );

  MockPagination.displayName = "MockPagination";
  return MockPagination;
});

jest.mock("@/components/dotLoader/DotLoader", () => {
  const MockDotLoader = () => <div data-testid="dot-loader">Loading...</div>;
  MockDotLoader.displayName = "MockDotLoader";
  return MockDotLoader;
});

jest.mock("@/components/scrollTo/ScrollToButton", () => {
  const MockScrollToButton = ({ threshold, to, offset }: any) => (
    <div
      data-testid="scroll-to-button"
      data-threshold={threshold}
      data-to={to}
      data-offset={offset}
    />
  );

  MockScrollToButton.displayName = "MockScrollToButton";
  return MockScrollToButton;
});

jest.mock("@/components/the-memes/UpcomingMemePage", () => ({
  __esModule: true,
  default: ({ id }: { id: string }) => (
    <div data-testid="upcoming-meme-page" data-id={id} />
  ),
}));

// Sample test data
const mockDistributionData = [
  {
    wallet: "0x1234567890123456789012345678901234567890",
    wallet_display: "TestUser1",
    phases: ["phase1", "airdrop"],
    airdrops: 5,
    allowlist: [{ phase: "phase1", spots: 10 }],
    minted: 3,
    total_count: 15,
  },
  {
    wallet: "0x0987654321098765432109876543210987654321",
    wallet_display: "TestUser2",
    phases: ["phase1"],
    airdrops: 0,
    allowlist: [{ phase: "phase1", spots: 5 }],
    minted: 0,
    total_count: 5,
  },
];

const mockDistributionPhotos = [
  { id: 1, link: "https://example.com/photo1.jpg" },
  { id: 2, link: "https://example.com/photo2.jpg" },
];

describe("DistributionPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseParams.mockReturnValue({ id: "123" });
    mockFetchAllPages.mockResolvedValue([]);
    mockFetchUrl.mockResolvedValue({ count: 0, data: [] });
  });

  describe("Initial Rendering and Props", () => {
    it("renders with correct header and nft id", async () => {
      mockFetchAllPages.mockResolvedValue([]);
      mockFetchUrl.mockResolvedValue({ count: 0, data: [] });

      render(
        <DistributionPage header="Test Collection" contract="0x123" link="" />
      );

      await waitFor(() => {
        expect(
          screen.getByRole("heading", {
            name: /Test Collection Card #123 Distribution/,
          })
        ).toBeInTheDocument();
      });
    });

    it("shows mint countdown for memes contract with correct props", async () => {
      mockUseParams.mockReturnValue({ id: "456" });
      mockFetchAllPages.mockResolvedValue([]);
      mockFetchUrl.mockResolvedValue({ count: 0, data: [] });

      render(
        <DistributionPage header="Memes" contract={MEMES_CONTRACT} link="" />
      );

      await waitFor(() => {
        const mintCountdown = screen.getByTestId("mint-countdown");
        expect(mintCountdown).toBeInTheDocument();
        expect(mintCountdown.dataset["nftId"]).toBe("456");
      });
    });

    it("does not show mint countdown for non-memes contract", async () => {
      mockFetchAllPages.mockResolvedValue([]);
      mockFetchUrl.mockResolvedValue({ count: 0, data: [] });

      render(<DistributionPage header="Other" contract="0x999" link="" />);

      await waitFor(() => {
        expect(screen.queryByTestId("mint-countdown")).not.toBeInTheDocument();
      });
    });
  });

  describe("Empty States", () => {
    it("shows empty message when no data and no search", async () => {
      mockFetchAllPages.mockResolvedValue([]);
      mockFetchUrl.mockResolvedValue({ count: 0, data: [] });

      render(<DistributionPage header="Test" contract="0x123" link="" />);

      await waitFor(() => {
        expect(
          screen.getByText(/Distribution Plan will be made available soon/)
        ).toBeInTheDocument();
        expect(screen.getByText(/check back later/)).toBeInTheDocument();
        expect(screen.getByAltText("SummerGlasses")).toBeInTheDocument();
      });
    });

    it("renders UpcomingMemePage component in empty state when nftId exists", async () => {
      mockFetchAllPages.mockResolvedValue([]);
      mockFetchUrl.mockResolvedValue({ count: 0, data: [] });

      render(<DistributionPage header="Test" contract="0x123" link="" />);

      await waitFor(() => {
        const upcomingMemePage = screen.getByTestId("upcoming-meme-page");
        expect(upcomingMemePage).toBeInTheDocument();
        expect(upcomingMemePage).toHaveAttribute("data-id", "123");
      });
    });

    it("shows no results message when search yields no results", async () => {
      const user = userEvent.setup();
      mockFetchAllPages.mockResolvedValue([]);
      mockFetchUrl
        .mockResolvedValueOnce({ count: 1, data: [mockDistributionData[0]] }) // Initial load with data
        .mockResolvedValueOnce({ count: 0, data: [] }); // After search

      render(<DistributionPage header="Test" contract="0x123" link="" />);

      await waitFor(() => {
        expect(screen.getByTestId("open-search-modal")).toBeInTheDocument();
      });

      // Open search modal and add wallets
      await user.click(screen.getByTestId("open-search-modal"));
      await user.click(screen.getByTestId("add-wallets"));
      await user.click(screen.getByTestId("close-modal"));

      await waitFor(() => {
        expect(
          screen.getByText(/No results found for the search criteria/)
        ).toBeInTheDocument();
      });
    });

    it("does not render UpcomingMemePage when search yields no results", async () => {
      const user = userEvent.setup();
      mockFetchAllPages.mockResolvedValue([]);
      mockFetchUrl
        .mockResolvedValueOnce({ count: 1, data: [mockDistributionData[0]] }) // Initial load with data
        .mockResolvedValueOnce({ count: 0, data: [] }); // After search

      render(<DistributionPage header="Test" contract="0x123" link="" />);

      await waitFor(() => {
        expect(screen.getByTestId("open-search-modal")).toBeInTheDocument();
      });

      // Open search modal and add wallets
      await user.click(screen.getByTestId("open-search-modal"));
      await user.click(screen.getByTestId("add-wallets"));
      await user.click(screen.getByTestId("close-modal"));

      await waitFor(() => {
        expect(
          screen.getByText(/No results found for the search criteria/)
        ).toBeInTheDocument();
        expect(
          screen.queryByTestId("upcoming-meme-page")
        ).not.toBeInTheDocument();
      });
    });
  });

  describe("Data Loading and Display", () => {
    it("displays distribution table with data", async () => {
      mockFetchAllPages.mockResolvedValue(mockDistributionPhotos);
      mockFetchUrl.mockResolvedValue({ count: 2, data: mockDistributionData });

      render(<DistributionPage header="Test" contract="0x123" link="" />);

      await waitFor(
        () => {
          // Check table headers
          expect(screen.getByText("ALLOWLIST SPOTS")).toBeInTheDocument();
          expect(screen.getByText("ACTUAL")).toBeInTheDocument();
          expect(screen.getByText("Phase1")).toBeInTheDocument();
          expect(screen.getByText("Airdrop")).toBeInTheDocument();
          expect(screen.getByText("Minted")).toBeInTheDocument();
          expect(screen.getByText("Total")).toBeInTheDocument();

          // Check wallet data
          expect(screen.getByText("TestUser1")).toBeInTheDocument();
          expect(screen.getByText("TestUser2")).toBeInTheDocument();

          // Check counts
          expect(screen.getByText("x2")).toBeInTheDocument(); // Total results
        },
        { timeout: 5000 }
      );
    });

    it("shows loading state during data fetch", async () => {
      let resolvePromise: (value: any) => void;
      const fetchPromise = new Promise((resolve) => {
        resolvePromise = resolve;
      });

      mockFetchAllPages.mockResolvedValue([]);
      mockFetchUrl.mockReturnValue(fetchPromise);

      render(<DistributionPage header="Test" contract="0x123" link="" />);

      // Wait for component to mount and try to fetch
      await waitFor(() => {
        expect(mockFetchAllPages).toHaveBeenCalled();
      });

      // Resolve the promise
      resolvePromise!({ count: 1, data: [mockDistributionData[0]] });

      await waitFor(() => {
        expect(screen.getByText("TestUser1")).toBeInTheDocument();
      });
    });

    it("displays distribution photos in carousel", async () => {
      mockFetchAllPages.mockResolvedValue(mockDistributionPhotos);
      mockFetchUrl.mockResolvedValue({
        count: 1,
        data: mockDistributionData.slice(0, 1),
      });

      render(<DistributionPage header="Test" contract="0x123" link="" />);

      await waitFor(() => {
        const images = screen.getAllByRole("img");
        const distributionImages = images.filter((img) => {
          const src = img.getAttribute("src");
          try {
            if (!src) return false;
            const allowedDomains = ["example.com"];
            const hostname = new URL(src).hostname;
            return (
              allowedDomains.includes(hostname) ||
              allowedDomains.some(
                (domain) =>
                  hostname === domain || hostname.endsWith(`.${domain}`)
              )
            );
          } catch {
            return false;
          }
        });
        expect(distributionImages).toHaveLength(2);
        expect(distributionImages[0]).toHaveAttribute(
          "src",
          "https://example.com/photo1.jpg"
        );
        expect(distributionImages[1]).toHaveAttribute(
          "src",
          "https://example.com/photo2.jpg"
        );
      });
    });
  });

  describe("Phase Calculations", () => {
    it("correctly calculates and displays phase counts", async () => {
      mockFetchAllPages.mockResolvedValue([]);
      mockFetchUrl.mockResolvedValue({
        count: 1,
        data: [mockDistributionData[0]],
      });

      render(<DistributionPage header="Test" contract="0x123" link="" />);

      await waitFor(() => {
        // Should show allowlist spots for phase1
        expect(screen.getByText("10")).toBeInTheDocument();
        // Should show airdrop count
        expect(screen.getByText("5")).toBeInTheDocument();
        // Should show minted count
        expect(screen.getByText("3")).toBeInTheDocument();
        // Should show total count
        expect(screen.getByText("15")).toBeInTheDocument();
      });
    });

    it("shows dash for zero counts", async () => {
      const dataWithZeros = {
        wallet: "0x123",
        wallet_display: "TestUser",
        phases: ["phase1"],
        airdrops: 0,
        allowlist: [],
        minted: 0,
        total_count: 0,
      };

      mockFetchAllPages.mockResolvedValue([]);
      mockFetchUrl.mockResolvedValue({ count: 1, data: [dataWithZeros] });

      render(<DistributionPage header="Test" contract="0x123" link="" />);

      await waitFor(() => {
        const dashElements = screen.getAllByText("-");
        expect(dashElements.length).toBeGreaterThan(0);
      });
    });
  });

  describe("Search Functionality", () => {
    it("handles search wallet functionality", async () => {
      const user = userEvent.setup();
      mockFetchAllPages.mockResolvedValue([]);
      mockFetchUrl
        .mockResolvedValueOnce({ count: 1, data: [mockDistributionData[0]] }) // Initial load with data
        .mockResolvedValueOnce({ count: 1, data: [mockDistributionData[0]] }); // After search

      render(<DistributionPage header="Test" contract="0x123" link="" />);

      // Wait for initial load with data so search component renders
      await waitFor(() => {
        expect(
          screen.getByTestId("search-wallets-display")
        ).toBeInTheDocument();
      });

      // Open search modal
      await user.click(screen.getByTestId("open-search-modal"));
      expect(screen.getByTestId("search-modal")).toBeInTheDocument();

      // Add wallets
      await user.click(screen.getByTestId("add-wallets"));
      await user.click(screen.getByTestId("close-modal"));

      // Should trigger new API call with search params
      await waitFor(() => {
        expect(mockFetchUrl).toHaveBeenCalledWith(
          expect.stringContaining("&search=0x123,0x456")
        );
      });
    });

    it("clears search results", async () => {
      const user = userEvent.setup();
      mockFetchAllPages.mockResolvedValue([]);
      mockFetchUrl.mockResolvedValue({
        count: 1,
        data: [mockDistributionData[0]],
      });

      render(<DistributionPage header="Test" contract="0x123" link="" />);

      // Wait for component to load with data
      await waitFor(() => {
        expect(
          screen.getByTestId("search-wallets-display")
        ).toBeInTheDocument();
      });

      // Add search wallets first
      await user.click(screen.getByTestId("open-search-modal"));
      await user.click(screen.getByTestId("add-wallets"));
      await user.click(screen.getByTestId("close-modal"));

      // Clear search
      await user.click(screen.getByTestId("clear-search"));

      await waitFor(() => {
        expect(screen.getByText("Search (0)")).toBeInTheDocument();
      });
    });
  });

  describe("Pagination", () => {
    it("shows pagination when total results exceed page size", async () => {
      mockFetchAllPages.mockResolvedValue([]);
      mockFetchUrl.mockResolvedValue({
        count: 200,
        data: mockDistributionData,
      });

      render(<DistributionPage header="Test" contract="0x123" link="" />);

      await waitFor(() => {
        expect(screen.getByTestId("pagination")).toBeInTheDocument();
        expect(screen.getByText(/Page 1 of 2/)).toBeInTheDocument();
      });
    });

    it("handles page navigation", async () => {
      const user = userEvent.setup();
      mockFetchAllPages.mockResolvedValue([]);
      mockFetchUrl
        .mockResolvedValueOnce({ count: 200, data: mockDistributionData })
        .mockResolvedValueOnce({ count: 200, data: [mockDistributionData[1]] });

      render(<DistributionPage header="Test" contract="0x123" link="" />);

      await waitFor(() => {
        expect(screen.getByTestId("next-page")).toBeInTheDocument();
      });

      await user.click(screen.getByTestId("next-page"));

      await waitFor(() => {
        expect(mockFetchUrl).toHaveBeenCalledWith(
          expect.stringContaining("&page=2")
        );
      });
    });

    it("does not show pagination when results fit on one page", async () => {
      mockFetchAllPages.mockResolvedValue([]);
      mockFetchUrl.mockResolvedValue({ count: 50, data: mockDistributionData });

      render(<DistributionPage header="Test" contract="0x123" link="" />);

      await waitFor(() => {
        expect(screen.queryByTestId("pagination")).not.toBeInTheDocument();
      });
    });
  });

  describe("API Integration", () => {
    it("makes correct API calls with proper parameters", async () => {
      mockUseParams.mockReturnValue({ id: "789" });
      mockFetchAllPages.mockResolvedValue([]);
      mockFetchUrl.mockResolvedValue({ count: 0, data: [] });

      render(<DistributionPage header="Test" contract="0xABC" link="" />);

      await waitFor(() => {
        expect(mockFetchAllPages).toHaveBeenCalledWith(
          "https://api.test.6529.io/api/distribution_photos/0xABC/789"
        );
        expect(mockFetchUrl).toHaveBeenCalledWith(
          "https://api.test.6529.io/api/distributions?card_id=789&contract=0xABC&page=1"
        );
      });
    });

    it("includes search parameters in API calls when present", async () => {
      const user = userEvent.setup();
      mockFetchAllPages.mockResolvedValue([]);
      mockFetchUrl
        .mockResolvedValueOnce({ count: 1, data: [mockDistributionData[0]] })
        .mockResolvedValueOnce({ count: 0, data: [] });

      render(<DistributionPage header="Test" contract="0x123" link="" />);

      // Wait for initial load with data
      await waitFor(() => {
        expect(
          screen.getByTestId("search-wallets-display")
        ).toBeInTheDocument();
      });

      // Add search wallets
      await user.click(screen.getByTestId("open-search-modal"));
      await user.click(screen.getByTestId("add-wallets"));
      await user.click(screen.getByTestId("close-modal"));

      await waitFor(() => {
        expect(mockFetchUrl).toHaveBeenLastCalledWith(
          expect.stringContaining("&search=0x123,0x456")
        );
      });
    });
  });

  describe("Component Integration", () => {
    it("renders address component with correct props", async () => {
      mockFetchAllPages.mockResolvedValue([]);
      mockFetchUrl.mockResolvedValue({
        count: 1,
        data: [mockDistributionData[0]],
      });

      render(<DistributionPage header="Test" contract="0x123" link="" />);

      await waitFor(
        () => {
          const addressComponent = screen.getByTestId("address-component");
          expect(addressComponent).toBeInTheDocument();
          expect(addressComponent.dataset["wallet"]).toBe(
            "0x1234567890123456789012345678901234567890"
          );
          expect(addressComponent.dataset["display"]).toBe("TestUser1");
          expect(addressComponent.dataset["hideCopy"]).toBe("true");
        },
        { timeout: 5000 }
      );
    });

    it("renders scroll to button with correct props", async () => {
      mockFetchAllPages.mockResolvedValue([]);
      mockFetchUrl.mockResolvedValue({
        count: 1,
        data: [mockDistributionData[0]],
      });

      render(<DistributionPage header="Test" contract="0x123" link="" />);

      await waitFor(() => {
        const scrollButton = screen.getByTestId("scroll-to-button");
        expect(scrollButton).toBeInTheDocument();
        expect(scrollButton.dataset["threshold"]).toBe("500");
        expect(scrollButton.dataset["to"]).toBe("distribution-table");
        expect(scrollButton.dataset["offset"]).toBe("0");
      });
    });
  });

  describe("Error Handling", () => {
    it("handles missing nft id parameter", () => {
      mockUseParams.mockReturnValue({ id: "" });
      mockFetchAllPages.mockResolvedValue([]);
      mockFetchUrl.mockResolvedValue({ count: 0, data: [] });

      render(<DistributionPage header="Test" contract="0x123" link="" />);

      // Should not make API calls without nft id
      expect(mockFetchAllPages).not.toHaveBeenCalled();
      expect(mockFetchUrl).not.toHaveBeenCalled();
    });

    it("renders NotFound component when nft id is invalid", () => {
      mockUseParams.mockReturnValue({ id: "invalid" });
      mockFetchAllPages.mockResolvedValue([]);
      mockFetchUrl.mockResolvedValue({ count: 0, data: [] });

      render(<DistributionPage header="Test" contract="0x123" link="" />);

      const notFound = screen.getByTestId("not-found");
      expect(notFound).toBeInTheDocument();
      expect(notFound).toHaveAttribute("data-label", "DISTRIBUTION");
    });

    it("handles invalid nft id for mint countdown", async () => {
      mockUseParams.mockReturnValue({ id: "invalid" });
      mockFetchAllPages.mockResolvedValue([]);
      mockFetchUrl.mockResolvedValue({ count: 0, data: [] });

      render(
        <DistributionPage header="Test" contract={MEMES_CONTRACT} link="" />
      );

      await waitFor(() => {
        expect(screen.queryByTestId("mint-countdown")).not.toBeInTheDocument();
      });
    });
  });

  describe("State Management", () => {
    it("resets to page 1 when search changes", async () => {
      const user = userEvent.setup();
      mockFetchAllPages.mockResolvedValue([]);
      mockFetchUrl.mockResolvedValue({
        count: 1,
        data: [mockDistributionData[0]],
      });

      render(<DistributionPage header="Test" contract="0x123" link="" />);

      // Wait for initial load with data
      await waitFor(() => {
        expect(
          screen.getByTestId("search-wallets-display")
        ).toBeInTheDocument();
      });

      // Add search wallets
      await user.click(screen.getByTestId("open-search-modal"));
      await user.click(screen.getByTestId("add-wallets"));
      await user.click(screen.getByTestId("close-modal"));

      // Should make API call with page 1
      await waitFor(() => {
        expect(mockFetchUrl).toHaveBeenCalledWith(
          expect.stringContaining("&page=1")
        );
      });
    });

    it("maintains search state across page changes", async () => {
      const user = userEvent.setup();
      mockFetchAllPages.mockResolvedValue([]);
      mockFetchUrl
        .mockResolvedValueOnce({ count: 200, data: mockDistributionData })
        .mockResolvedValueOnce({ count: 200, data: mockDistributionData })
        .mockResolvedValueOnce({ count: 200, data: [mockDistributionData[1]] });

      render(<DistributionPage header="Test" contract="0x123" link="" />);

      // Wait for initial load with data
      await waitFor(() => {
        expect(
          screen.getByTestId("search-wallets-display")
        ).toBeInTheDocument();
      });

      // Add search wallets
      await user.click(screen.getByTestId("open-search-modal"));
      await user.click(screen.getByTestId("add-wallets"));
      await user.click(screen.getByTestId("close-modal"));

      // Navigate to next page
      await waitFor(() => {
        expect(screen.getByTestId("next-page")).toBeInTheDocument();
      });

      await user.click(screen.getByTestId("next-page"));

      // Should maintain search parameters
      await waitFor(() => {
        const lastCall = mockFetchUrl.mock.calls.at(-1)?.[0];
        expect(lastCall).toContain("&search=0x123,0x456");
        expect(lastCall).toContain("&page=2");
      });
    });
  });

  describe("Title Management", () => {
    it("sets title when valid nft id is present", async () => {
      mockUseParams.mockReturnValue({ id: "123" });
      mockFetchAllPages.mockResolvedValue([]);
      mockFetchUrl.mockResolvedValue({ count: 0, data: [] });

      render(
        <DistributionPage header="Test Collection" contract="0x123" link="" />
      );

      await waitFor(() => {
        expect(mockSetTitle).toHaveBeenCalledWith(
          "Test Collection #123 | DISTRIBUTION"
        );
      });
    });

    it("does not set title when nft id is invalid", () => {
      mockUseParams.mockReturnValue({ id: "invalid" });
      mockFetchAllPages.mockResolvedValue([]);
      mockFetchUrl.mockResolvedValue({ count: 0, data: [] });

      render(<DistributionPage header="Test" contract="0x123" link="" />);

      expect(mockSetTitle).not.toHaveBeenCalled();
    });

    it("does not set title when nft id is missing", () => {
      mockUseParams.mockReturnValue({ id: "" });
      mockFetchAllPages.mockResolvedValue([]);
      mockFetchUrl.mockResolvedValue({ count: 0, data: [] });

      render(<DistributionPage header="Test" contract="0x123" link="" />);

      expect(mockSetTitle).not.toHaveBeenCalled();
    });
  });
});
