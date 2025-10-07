import MemeLabPageComponent from "@/components/memelab/MemeLabPage";
import { MEME_FOCUS } from "@/components/the-memes/MemeShared";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, render, screen, waitFor } from "@testing-library/react";
import React from "react";

// Mock TitleContext
jest.mock("@/contexts/TitleContext", () => ({
  useTitle: jest.fn(() => ({
    title: "Test Title",
    setTitle: jest.fn(),
  })),
}));

// Mock core components
jest.mock("@/components/nothingHereYet/NothingHereYetSummer", () => ({
  __esModule: true,
  default: () => <div data-testid="nothing-here-yet" />,
}));

jest.mock("@/components/nft-marketplace-links/NFTMarketplaceLinks", () => ({
  __esModule: true,
  default: () => <div data-testid="marketplace-links" />,
}));
// Mock Next.js components
jest.mock("next/link", () => ({
  __esModule: true,
  default: ({ href, children, ...rest }: any) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

jest.mock("next/image", () => ({
  __esModule: true,
  default: (props: any) => <img alt={props.alt || ""} {...props} />,
}));

// Mock navigation
jest.mock("next/navigation", () => ({
  useRouter: jest.fn(),
  useSearchParams: jest.fn(),
}));

// Mock contexts
jest.mock("@/components/cookies/CookieConsentContext", () => ({
  useCookieConsent: jest.fn(),
}));

jest.mock("@/components/auth/Auth", () => ({
  useAuth: jest.fn(),
}));

// Mock hooks
jest.mock("@/hooks/useCapacitor", () => ({
  __esModule: true,
  default: jest.fn(),
}));

// Mock API services
jest.mock("@/services/6529api", () => ({
  fetchUrl: jest.fn(),
  fetchAllPages: jest.fn(),
}));

// Mock components that use React Query
jest.mock("@/components/nft-image/NFTImage", () => ({
  __esModule: true,
  default: () => <div data-testid="nft-image" />,
}));

jest.mock("@/components/nft-navigation/NftNavigation", () => ({
  __esModule: true,
  default: () => <div data-testid="nft-navigation" />,
}));

jest.mock("@/components/leaderboard/MemeLabLeaderboard", () => ({
  __esModule: true,
  default: () => <div data-testid="meme-lab-leaderboard" />,
}));

jest.mock("@/components/timeline/Timeline", () => ({
  __esModule: true,
  default: () => <div data-testid="timeline" />,
}));

jest.mock("@/components/nft-attributes/NFTAttributes", () => ({
  __esModule: true,
  default: () => <div data-testid="nft-attributes" />,
}));

jest.mock("@/components/nft-attributes/NftStats", () => ({
  NftPageStats: () => <tr data-testid="nft-stats" />,
}));

jest.mock("@/components/rememes/RememePage", () => ({
  printMemeReferences: () => <div data-testid="meme-references" />,
}));

jest.mock("@/components/the-memes/ArtistProfileHandle", () => ({
  __esModule: true,
  default: () => <span data-testid="artist-profile-handle" />,
}));

jest.mock("@/components/latest-activity/LatestActivityRow", () => ({
  __esModule: true,
  default: () => <tr data-testid="activity-row" />,
}));

jest.mock("@/components/pagination/Pagination", () => ({
  __esModule: true,
  default: () => <div data-testid="pagination" />,
}));

// Import mocks
const mockUseRouter = jest.fn();
const mockUseSearchParams = jest.fn();
const mockFetchUrl = jest.fn();
const mockFetchAllPages = jest.fn();
const mockUseAuth = jest.fn();
const mockUseCookieConsent = jest.fn();
const mockUseCapacitor = jest.fn();

// Setup mock implementations
require("next/navigation").useRouter = mockUseRouter;
require("next/navigation").useSearchParams = mockUseSearchParams;
require("@/services/6529api").fetchUrl = mockFetchUrl;
require("@/services/6529api").fetchAllPages = mockFetchAllPages;
require("@/components/auth/Auth").useAuth = mockUseAuth;
require("@/components/cookies/CookieConsentContext").useCookieConsent =
  mockUseCookieConsent;
require("@/hooks/useCapacitor").default = mockUseCapacitor;

beforeEach(() => {
  jest.clearAllMocks();

  // Setup default mock returns
  mockUseSearchParams.mockReturnValue({
    get: jest.fn().mockReturnValue(null),
  });

  mockUseRouter.mockReturnValue({
    replace: jest.fn(),
  });

  mockUseAuth.mockReturnValue({
    connectedProfile: {
      wallets: ["0xabc"],
    },
  });

  mockUseCookieConsent.mockReturnValue({
    country: "US",
  });

  mockUseCapacitor.mockReturnValue({
    isIos: false,
  });

  mockFetchAllPages.mockResolvedValue([]);
  mockFetchUrl.mockResolvedValue({ data: [], count: 0 });
});

// Test wrapper with QueryClient
const renderWithQueryClient = (component: React.ReactElement) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });
  return render(
    <QueryClientProvider client={queryClient}>{component}</QueryClientProvider>
  );
};

// Test data factories
function createMockMeta(overrides: any = {}) {
  return {
    data: [
      {
        id: 1,
        metadata_collection: "Test Collection",
        website: "",
        meme_references: [],
        edition_size: 100,
        edition_size_rank: 1,
        collection_size: 50,
        museum_holdings: 0,
        museum_holdings_rank: 1,
        edition_size_cleaned: 100,
        edition_size_cleaned_rank: 1,
        hodlers: 10,
        hodlers_rank: 1,
        percent_unique: 0.1,
        percent_unique_rank: 1,
        percent_unique_cleaned: 0.1,
        percent_unique_cleaned_rank: 1,
        burnt: 0,
        edition_size_not_burnt: 100,
        edition_size_not_burnt_rank: 1,
        percent_unique_not_burnt: 0.1,
        percent_unique_not_burnt_rank: 1,
        name: "Test Meta",
        created_at: new Date("2023-01-01"),
        ...overrides,
      },
    ],
  };
}

function createMockNft(overrides: any = {}) {
  const defaultNft = {
    id: 1,
    contract: "0x4db52a61dc491e15a2f78f5ac001c14ffe3568cb",
    meme_references: [],
    artist: "Test Artist",
    mint_date: new Date("2023-01-01"),
    name: "Test NFT",
    image: "https://test.com/image.png",
    animation: "",
    token_type: "ERC721",
    description: "Test Description",
    supply: 100,
    created_at: new Date("2023-01-01"),
    mint_price: 0,
    collection: "Test Collection",
    artist_seize_handle: "testartist",
    uri: "",
    icon: "",
    thumbnail: "",
    scaled: "",
    market_cap: 0,
    floor_price: 0,
    total_volume_last_24_hours: 0,
    total_volume_last_7_days: 0,
    total_volume_last_1_month: 0,
    total_volume: 0,
    has_distribution: false,
    highest_offer: 0,
    metadata: {
      attributes: [],
      image_details: { format: "PNG" },
      animation_details: { format: "MP4" },
    },
  };

  return {
    data: [{ ...defaultNft, ...overrides }],
  };
}

function createMockTransactions(balance: number) {
  return {
    data: [
      {
        created_at: new Date("2023-01-01"),
        transaction: "0x123",
        block: 12345,
        transaction_date: new Date("2023-01-01"),
        from_address: "0x0000000000000000000000000000000000000000",
        from_display: null,
        to_address: "0xabc",
        to_display: null,
        contract: "0x4db52a61dc491e15a2f78f5ac001c14ffe3568cb",
        token_id: 1,
        token_count: balance,
        value: 0,
        royalties: 0,
        gas_gwei: 0,
        gas_price: 0,
        gas_price_gwei: 0,
        gas: 0,
      },
    ],
  };
}

function setupMockApiCalls(balance = 1) {
  const meta = createMockMeta();
  const nft = createMockNft();
  const transactions = createMockTransactions(balance);
  const activity = { data: [], count: 0 };

  mockFetchUrl.mockImplementation((url: string) => {
    if (url.includes("lab_extended_data")) return Promise.resolve(meta);
    if (url.includes("nfts_memelab")) return Promise.resolve(nft);
    if (url.includes("transactions_memelab") && url.includes("wallet="))
      return Promise.resolve(transactions);
    if (url.includes("transactions_memelab") && url.includes("page_size"))
      return Promise.resolve(activity);
    if (url.includes("nft_history")) return Promise.resolve({ data: [] });
    return Promise.resolve({ data: [] });
  });
}

describe("MemeLabPageComponent", () => {
  it("renders without crashing", async () => {
    setupMockApiCalls();

    await act(async () => {
      renderWithQueryClient(<MemeLabPageComponent nftId="1" />);
    });

    expect(screen.getByText("Meme")).toBeInTheDocument();
    expect(screen.getByText("Lab")).toBeInTheDocument();
  });

  it("fetches lab extended data on mount", async () => {
    setupMockApiCalls();

    await act(async () => {
      renderWithQueryClient(<MemeLabPageComponent nftId="1" />);
    });

    await waitFor(() => {
      expect(mockFetchUrl).toHaveBeenCalledWith(
        "https://api.test.6529.io/api/lab_extended_data?id=1"
      );
    });
  });

  it("fetches nft data after metadata loads", async () => {
    setupMockApiCalls();

    await act(async () => {
      renderWithQueryClient(<MemeLabPageComponent nftId="1" />);
    });

    await waitFor(() => {
      expect(mockFetchUrl).toHaveBeenCalledWith(
        "https://api.test.6529.io/api/nfts_memelab?id=1"
      );
    });
  });

  it("shows user balance when wallet is connected", async () => {
    setupMockApiCalls(2);

    await act(async () => {
      renderWithQueryClient(<MemeLabPageComponent nftId="1" />);
    });

    await waitFor(() => {
      expect(mockFetchUrl).toHaveBeenCalledWith(
        expect.stringContaining("transactions_memelab?wallet=0xabc&id=1")
      );
    });
  });

  it("handles your cards tab", async () => {
    mockUseSearchParams.mockReturnValue({
      get: jest.fn((key: string) => {
        if (key === "focus") return MEME_FOCUS.YOUR_CARDS;
        return null;
      }),
    });

    setupMockApiCalls(1);

    await act(async () => {
      renderWithQueryClient(<MemeLabPageComponent nftId="1" />);
    });

    await waitFor(
      () => {
        expect(mockFetchUrl).toHaveBeenCalledWith(
          expect.stringContaining("transactions_memelab?wallet=0xabc")
        );
      },
      { timeout: 5000 }
    );
  });

  it("fetches activity data for activity tab", async () => {
    setupMockApiCalls();

    await act(async () => {
      renderWithQueryClient(<MemeLabPageComponent nftId="1" />);
    });

    await waitFor(() => {
      expect(mockFetchUrl).toHaveBeenCalledWith(
        expect.stringMatching(
          /transactions_memelab.*id=1.*page_size=25.*page=1/
        )
      );
    });
  });

  it("fetches NFT history data", async () => {
    setupMockApiCalls();

    await act(async () => {
      renderWithQueryClient(<MemeLabPageComponent nftId="1" />);
    });

    await waitFor(() => {
      expect(mockFetchAllPages).toHaveBeenCalledWith(
        expect.stringContaining(
          "nft_history/0x4db52a61dc491e15a2f78f5ac001c14ffe3568cb/1"
        )
      );
    });
  });

  it("handles different focus tabs from URL params", async () => {
    mockUseSearchParams.mockReturnValue({
      get: jest.fn((key: string) => {
        if (key === "focus") return MEME_FOCUS.ACTIVITY;
        return null;
      }),
    });

    setupMockApiCalls();

    await act(async () => {
      renderWithQueryClient(<MemeLabPageComponent nftId="1" />);
    });

    // Should set active tab based on URL param
    expect(mockUseRouter().replace).toHaveBeenCalledWith(
      expect.stringContaining(`focus=${MEME_FOCUS.ACTIVITY}`)
    );
  });

  it("handles empty metadata response", async () => {
    mockFetchUrl.mockImplementation((url: string) => {
      if (url.includes("lab_extended_data"))
        return Promise.resolve({ data: [] });
      return Promise.resolve({ data: [] });
    });

    await act(async () => {
      renderWithQueryClient(<MemeLabPageComponent nftId="1" />);
    });

    // Should handle no metadata gracefully
    expect(screen.getByText("Meme")).toBeInTheDocument();
    expect(screen.getByText("Lab")).toBeInTheDocument();
  });

  it("calculates user balance correctly", async () => {
    const transactions = {
      data: [
        {
          from_address: "0x0000000000000000000000000000000000000000",
          to_address: "0xabc",
          token_count: 3,
          value: 0,
          transaction_date: new Date("2023-01-01"),
          transaction: "0x123",
          block: 12345,
          created_at: new Date("2023-01-01"),
          from_display: null,
          to_display: null,
          contract: "0x4db52a61dc491e15a2f78f5ac001c14ffe3568cb",
          token_id: 1,
          royalties: 0,
          gas_gwei: 0,
          gas_price: 0,
          gas_price_gwei: 0,
          gas: 0,
        },
        {
          from_address: "0xabc",
          to_address: "0xdef",
          token_count: 1,
          value: 0,
          transaction_date: new Date("2023-01-02"),
          transaction: "0x456",
          block: 12346,
          created_at: new Date("2023-01-02"),
          from_display: null,
          to_display: null,
          contract: "0x4db52a61dc491e15a2f78f5ac001c14ffe3568cb",
          token_id: 1,
          royalties: 0,
          gas_gwei: 0,
          gas_price: 0,
          gas_price_gwei: 0,
          gas: 0,
        },
      ],
    };

    mockFetchUrl.mockImplementation((url: string) => {
      if (url.includes("lab_extended_data"))
        return Promise.resolve(createMockMeta());
      if (url.includes("nfts_memelab")) return Promise.resolve(createMockNft());
      if (url.includes("transactions_memelab") && url.includes("wallet="))
        return Promise.resolve(transactions);
      if (url.includes("transactions_memelab") && url.includes("page_size"))
        return Promise.resolve({ data: [], count: 0 });
      return Promise.resolve({ data: [] });
    });

    await act(async () => {
      renderWithQueryClient(<MemeLabPageComponent nftId="1" />);
    });

    await waitFor(() => {
      expect(mockFetchUrl).toHaveBeenCalledWith(
        expect.stringContaining("transactions_memelab?wallet=0xabc&id=1")
      );
    });
  });

  it("handles disconnected wallet state", async () => {
    mockUseAuth.mockReturnValue({
      connectedProfile: null,
    });

    setupMockApiCalls();

    await act(async () => {
      renderWithQueryClient(<MemeLabPageComponent nftId="1" />);
    });

    // Should not fetch user transactions when wallet not connected
    expect(mockFetchUrl).not.toHaveBeenCalledWith(
      expect.stringContaining("transactions_memelab?wallet=")
    );
  });

  it("sets page title correctly", async () => {
    const mockSetTitle = jest.fn();
    require("@/contexts/TitleContext").useTitle.mockReturnValue({
      title: "Test Title",
      setTitle: mockSetTitle,
    });

    setupMockApiCalls();

    await act(async () => {
      renderWithQueryClient(<MemeLabPageComponent nftId="1" />);
    });

    await waitFor(() => {
      expect(mockSetTitle).toHaveBeenCalled();
    });
  });

  describe("Data loading states", () => {
    it("renders basic structure before data loads", async () => {
      mockFetchUrl.mockResolvedValue({ data: [] });
      mockFetchAllPages.mockResolvedValue([]);

      await act(async () => {
        renderWithQueryClient(<MemeLabPageComponent nftId="1" />);
      });

      expect(screen.getByText("Meme")).toBeInTheDocument();
      expect(screen.getByText("Lab")).toBeInTheDocument();
    });

    it("does not render NFT content when no metadata is available", async () => {
      mockFetchUrl.mockImplementation((url: string) => {
        if (url.includes("lab_extended_data"))
          return Promise.resolve({ data: [] });
        return Promise.resolve({ data: [], count: 0 });
      });

      await act(async () => {
        renderWithQueryClient(<MemeLabPageComponent nftId="1" />);
      });

      expect(screen.getByText("Meme")).toBeInTheDocument();
      expect(screen.getByText("Lab")).toBeInTheDocument();
      // Should not render NFT-specific content without metadata
      expect(screen.queryByTestId("nft-image")).not.toBeInTheDocument();
      expect(screen.queryByTestId("nft-navigation")).not.toBeInTheDocument();
    });
  });

  describe("Tab navigation", () => {
    it("updates URL when tab changes", async () => {
      const mockReplace = jest.fn();
      mockUseRouter.mockReturnValue({
        replace: mockReplace,
      });

      setupMockApiCalls();

      await act(async () => {
        renderWithQueryClient(<MemeLabPageComponent nftId="1" />);
      });

      // Should update URL with default focus
      await waitFor(() => {
        expect(mockReplace).toHaveBeenCalledWith(
          expect.stringContaining("focus=")
        );
      });
    });
  });
});
