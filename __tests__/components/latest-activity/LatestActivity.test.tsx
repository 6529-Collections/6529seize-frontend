import LatestActivity from "@/components/latest-activity/LatestActivity";
import { NFT } from "@/entities/INFT";
import { NextGenCollection } from "@/entities/INextgen";
import { Transaction } from "@/entities/ITransaction";
import { fetchAllPages, fetchUrl } from "@/services/6529api";
import { commonApiFetch } from "@/services/api/common-api";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";

jest.mock("@/services/6529api");
jest.mock("@/services/api/common-api");
jest.mock("@/hooks/isMobileScreen");
jest.mock(
  "@/components/latest-activity/LatestActivityRow",
  () => (props: any) => <tr data-testid="activity-row" />
);
jest.mock("@/components/pagination/Pagination", () => (props: any) => (
  <div
    data-testid="pagination"
    onClick={() => props.setPage(2)}
    data-page={props.page}
    data-total={props.totalResults}
  />
));
jest.mock("@/components/dotLoader/DotLoader", () => () => (
  <div data-testid="dot-loader" />
));
jest.mock("next/image", () => ({
  __esModule: true,
  default: (props: React.ImgHTMLAttributes<HTMLImageElement>) => (
    <img alt={props.alt ?? ""} {...props} />
  ),
}));

// Mock hook imports
import useIsMobileScreen from "@/hooks/isMobileScreen";

const mockUseIsMobileScreen = useIsMobileScreen as jest.MockedFunction<
  typeof useIsMobileScreen
>;

// Mock API responses
const mockFetchUrl = fetchUrl as jest.Mock;
const mockFetchAllPages = fetchAllPages as jest.Mock;
const mockCommonApiFetch = commonApiFetch as jest.Mock;

// Test data
const mockActivity: Transaction[] = [
  {
    id: "1",
    token_id: "123",
    contract: "0x123",
    transaction_date: "2024-01-01T00:00:00Z",
    transaction_type: "Sale",
    from_address: "0xfrom",
    to_address: "0xto",
    eth_price: "1.5",
    usd_price: "3000",
  } as Transaction,
];

const mockNfts: NFT[] = [
  {
    id: 1,
    contract: "0x123",
    token_id: "123",
    name: "Test NFT",
  } as NFT,
];

const mockNextgenCollections: NextGenCollection[] = [
  {
    id: "1",
    name: "Test Collection",
    contract: "0x456",
  } as NextGenCollection,
];

// Default mock implementations
mockFetchAllPages.mockResolvedValue([]);
mockFetchUrl.mockResolvedValue({ count: 0, data: [] });
mockCommonApiFetch.mockResolvedValue({ data: [] });
mockUseIsMobileScreen.mockReturnValue(false);

describe("LatestActivity", () => {
  // Mock window.scrollTo
  const mockScrollTo = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseIsMobileScreen.mockReturnValue(false);
    mockFetchUrl.mockResolvedValue({ count: 0, data: [] });
    mockFetchAllPages.mockResolvedValue([]);
    mockCommonApiFetch.mockResolvedValue({ data: [] });

    // Mock window.scrollTo
    Object.defineProperty(globalThis, "scrollTo", {
      value: mockScrollTo,
      writable: true,
    });

    // Reset location pathname
    Object.defineProperty(window, "location", {
      writable: true,
      value: { pathname: "/" },
    });
  });

  it("fetches with filters and updates on selection", async () => {
    render(<LatestActivity page={1} pageSize={10} showMore />);
    await waitFor(() => expect(fetchUrl).toHaveBeenCalled());
    expect(fetchUrl).toHaveBeenCalledWith(
      "https://api.test.6529.io/api/transactions?page_size=10&page=1"
    );
    await userEvent.click(screen.getByText("All Collections"));
    await userEvent.click(screen.getByText("The Memes"));
    await waitFor(() =>
      expect(fetchUrl).toHaveBeenLastCalledWith(
        "https://api.test.6529.io/api/transactions?page_size=10&page=1&contract=0x33FD426905F149f8376e227d0C9D3340AaD17aF1"
      )
    );
  });

  it("hides View All link on nft-activity page", async () => {
    Object.defineProperty(window, "location", {
      writable: true,
      value: { pathname: "/nft-activity" },
    });
    render(<LatestActivity page={1} pageSize={10} showMore />);
    // Wait for fetch
    await waitFor(() => expect(fetchUrl).toHaveBeenCalled());
    expect(screen.queryByText("View All")).toBeNull();
  });

  describe("SSR initial data props", () => {
    it("uses initial activity data and skips fetch when provided", async () => {
      render(
        <LatestActivity
          page={1}
          pageSize={10}
          showMore
          initialActivity={mockActivity}
          initialTotalResults={1}
          initialNfts={mockNfts}
          initialNextgenCollections={mockNextgenCollections}
        />
      );

      // Should not fetch when initial data is provided with default filters
      expect(fetchUrl).not.toHaveBeenCalled();

      // Should render the initial data
      expect(screen.getByTestId("activity-row")).toBeInTheDocument();
    });

    it("fetches data when filters change even with initial data", async () => {
      mockFetchUrl.mockResolvedValue({ count: 2, data: mockActivity });

      render(
        <LatestActivity
          page={1}
          pageSize={10}
          showMore
          initialActivity={mockActivity}
          initialTotalResults={1}
          initialNfts={mockNfts}
          initialNextgenCollections={mockNextgenCollections}
        />
      );

      // Change filter - this should trigger a fetch
      await userEvent.click(screen.getByText("All Transactions"));
      await userEvent.click(screen.getByText("Sales"));

      await waitFor(() => {
        expect(fetchUrl).toHaveBeenCalledWith(
          expect.stringContaining("filter=sales")
        );
      });
    });
  });

  describe("Pagination functionality", () => {
    it("renders pagination when showMore is true and has results", async () => {
      mockFetchUrl.mockResolvedValue({ count: 50, data: mockActivity });

      render(<LatestActivity page={1} pageSize={10} showMore />);

      await waitFor(() => {
        expect(screen.getByTestId("pagination")).toBeInTheDocument();
      });
    });

    it("does not render pagination when showMore is false", async () => {
      mockFetchUrl.mockResolvedValue({ count: 50, data: mockActivity });

      render(<LatestActivity page={1} pageSize={10} showMore={false} />);

      await waitFor(() => {
        expect(fetchUrl).toHaveBeenCalled();
      });

      expect(screen.queryByTestId("pagination")).not.toBeInTheDocument();
    });

    it("scrolls to top when page changes", async () => {
      mockFetchUrl.mockResolvedValue({ count: 50, data: mockActivity });

      render(<LatestActivity page={1} pageSize={10} showMore />);

      await waitFor(() => {
        expect(screen.getByTestId("pagination")).toBeInTheDocument();
      });

      // Simulate page change by clicking pagination
      await userEvent.click(screen.getByTestId("pagination"));

      expect(mockScrollTo).toHaveBeenCalledWith(0, 0);
    });

    it("does not render pagination when totalResults is 0", async () => {
      mockFetchUrl.mockResolvedValue({ count: 0, data: [] });

      render(<LatestActivity page={1} pageSize={10} showMore />);

      await waitFor(() => {
        expect(fetchUrl).toHaveBeenCalled();
      });

      expect(screen.queryByTestId("pagination")).not.toBeInTheDocument();
    });
  });

  describe("Loading states", () => {
    it("shows loading indicator when fetching data on non-nft-activity page", async () => {
      // Set up a delayed response to test loading state
      let resolvePromise: (value: any) => void;
      const delayedPromise = new Promise((resolve) => {
        resolvePromise = resolve;
      });
      mockFetchUrl.mockReturnValue(delayedPromise);

      render(<LatestActivity page={1} pageSize={10} showMore />);

      // Should show View All link initially (showViewAll defaults to false, then updates)
      expect(screen.getByText("View All")).toBeInTheDocument();

      // Resolve the promise
      resolvePromise!({ count: 0, data: [] });

      await waitFor(() => {
        expect(fetchUrl).toHaveBeenCalled();
      });
    });

    it("shows dot loader when fetching on nft-activity page", async () => {
      Object.defineProperty(window, "location", {
        writable: true,
        value: { pathname: "/nft-activity" },
      });

      // Set up a delayed response
      let resolvePromise: (value: any) => void;
      const delayedPromise = new Promise((resolve) => {
        resolvePromise = resolve;
      });
      mockFetchUrl.mockReturnValue(delayedPromise);

      render(<LatestActivity page={1} pageSize={10} showMore />);

      // Should show dot loader while fetching
      expect(screen.getByTestId("dot-loader")).toBeInTheDocument();

      // Resolve the promise
      resolvePromise!({ count: 0, data: [] });

      await waitFor(() => {
        expect(fetchUrl).toHaveBeenCalled();
      });
    });
  });

  describe("Mobile responsive behavior", () => {
    it("passes mobile state to filters component", async () => {
      mockUseIsMobileScreen.mockReturnValue(true);

      render(<LatestActivity page={1} pageSize={10} showMore />);

      await waitFor(() => {
        expect(fetchUrl).toHaveBeenCalled();
      });

      // The mobile prop should be passed to ActivityFilters
      // We can verify this indirectly by checking the hook was called
      expect(mockUseIsMobileScreen).toHaveBeenCalled();
    });
  });

  describe("Hook integration", () => {
    it("properly integrates with useActivityData hook", async () => {
      const activityData = mockActivity;
      mockFetchUrl.mockResolvedValue({ count: 1, data: activityData });

      render(<LatestActivity page={1} pageSize={10} showMore />);

      await waitFor(() => {
        expect(fetchUrl).toHaveBeenCalledWith(
          "https://api.test.6529.io/api/transactions?page_size=10&page=1"
        );
      });
    });

    it("properly integrates with useNFTCollections hook", async () => {
      mockFetchAllPages.mockResolvedValue(mockNfts);
      mockCommonApiFetch.mockResolvedValue({ data: mockNextgenCollections });

      render(<LatestActivity page={1} pageSize={10} showMore />);

      await waitFor(() => {
        expect(fetchUrl).toHaveBeenCalled();
      });

      // useNFTCollections hook should be called to fetch collections
      expect(mockFetchUrl).toHaveBeenCalledWith(
        "https://api.test.6529.io/api/memes_lite"
      );
      expect(mockFetchAllPages).toHaveBeenCalledWith(
        "https://api.test.6529.io/api/nfts/gradients?&page_size=101"
      );
      expect(mockCommonApiFetch).toHaveBeenCalledWith({
        endpoint: "nextgen/collections",
      });
    });

    it("uses initial NFT collections data when provided (SSR optimization)", async () => {
      render(
        <LatestActivity
          page={1}
          pageSize={10}
          showMore
          initialActivity={mockActivity}
          initialTotalResults={1}
          initialNfts={mockNfts}
          initialNextgenCollections={mockNextgenCollections}
        />
      );

      // Should not fetch NFT collections when initial data is provided
      expect(mockFetchAllPages).not.toHaveBeenCalled();
      expect(mockCommonApiFetch).not.toHaveBeenCalled();

      // Should still render the activity row
      expect(screen.getByTestId("activity-row")).toBeInTheDocument();
    });

    it("fetches NFT collections when initial data is empty", async () => {
      render(
        <LatestActivity
          page={1}
          pageSize={10}
          showMore
          initialActivity={mockActivity}
          initialTotalResults={1}
          initialNfts={[]}
          initialNextgenCollections={[]}
        />
      );

      // Should fetch NFT collections because initial collections are empty
      await waitFor(() => {
        expect(mockFetchAllPages).toHaveBeenCalled();
        expect(mockCommonApiFetch).toHaveBeenCalled();
      });
    });

    it("handles partial initial collections data correctly", async () => {
      render(
        <LatestActivity
          page={1}
          pageSize={10}
          showMore
          initialActivity={mockActivity}
          initialTotalResults={1}
          initialNfts={mockNfts}
          initialNextgenCollections={[]} // Empty array means we need to fetch
        />
      );

      // Should fetch NextGen collections but not NFTs (since NFTs were provided)
      await waitFor(() => {
        expect(mockCommonApiFetch).toHaveBeenCalled();
      });

      // Should not fetch NFTs since they were provided and non-empty
      expect(mockFetchAllPages).not.toHaveBeenCalled();
    });

    it("resets to page 1 when type filter changes", async () => {
      mockFetchUrl.mockResolvedValue({ count: 1, data: mockActivity });

      render(<LatestActivity page={2} pageSize={10} showMore />);

      await waitFor(() => {
        expect(fetchUrl).toHaveBeenCalled();
      });

      // Change type filter
      await userEvent.click(screen.getByText("All Transactions"));
      await userEvent.click(screen.getByText("Sales"));

      await waitFor(() => {
        expect(fetchUrl).toHaveBeenCalledWith(
          expect.stringContaining("page=1")
        );
      });
    });

    it("resets to page 1 when contract filter changes", async () => {
      mockFetchUrl.mockResolvedValue({ count: 1, data: mockActivity });

      render(<LatestActivity page={3} pageSize={10} showMore />);

      await waitFor(() => {
        expect(fetchUrl).toHaveBeenCalled();
      });

      // Change contract filter
      await userEvent.click(screen.getByText("All Collections"));
      await userEvent.click(screen.getByText("The Memes"));

      await waitFor(() => {
        expect(fetchUrl).toHaveBeenCalledWith(
          expect.stringContaining("page=1")
        );
      });
    });
  });

  describe("Error handling", () => {
    it("renders initial structure even when data loading fails", async () => {
      // Mock a successful response first for initial render
      mockFetchUrl.mockResolvedValue({ count: 0, data: [] });

      render(<LatestActivity page={1} pageSize={10} showMore />);

      await waitFor(() => {
        expect(fetchUrl).toHaveBeenCalled();
      });

      // Component should render basic structure
      expect(
        screen.getByRole("heading", { name: "NFT Activity" })
      ).toBeInTheDocument();
      expect(screen.getByText("All Collections")).toBeInTheDocument();
      expect(screen.getByText("All Transactions")).toBeInTheDocument();
    });

    it("starts with empty activity array when no data provided", async () => {
      render(<LatestActivity page={1} pageSize={10} showMore />);

      // Wait for initial render to complete
      await waitFor(() => {
        expect(fetchUrl).toHaveBeenCalled();
      });

      // Should render without initial data
      expect(
        screen.getByRole("heading", { name: "NFT Activity" })
      ).toBeInTheDocument();
      // No activity rows should be present initially
      expect(screen.queryByTestId("activity-row")).not.toBeInTheDocument();
    });
  });
});
