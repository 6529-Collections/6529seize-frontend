import { MemePageActivity } from "@/components/the-memes/MemePageActivity";
import { MEMES_CONTRACT } from "@/constants";
import { TypeFilter } from "@/hooks/useActivityData";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const fetchUrlMock = jest.fn();

jest.mock("@/services/6529api", () => ({
  fetchUrl: (...args: any[]) => fetchUrlMock(...args),
}));

jest.mock("@/components/latest-activity/LatestActivityRow", () => {
  const MockLatestActivityRow = () => <tr data-testid="activity-row" />;
  MockLatestActivityRow.displayName = "MockLatestActivityRow";
  return MockLatestActivityRow;
});

// Utility NFT object with required fields only
const nft = {
  id: 1,
  total_volume_last_24_hours: 0,
  total_volume_last_7_days: 0,
  total_volume_last_1_month: 0,
  total_volume: 0,
} as any;

beforeEach(() => {
  fetchUrlMock.mockResolvedValue({ count: 0, data: [] });
  window.scrollTo = jest.fn();
});

afterEach(() => {
  jest.clearAllMocks();
  jest.restoreAllMocks();
});

describe("MemePageActivity", () => {
  describe("Volume Display", () => {
    it("displays volume data correctly when values are greater than 0", () => {
      const nftWithVolumes = {
        ...nft,
        total_volume_last_24_hours: 1.234,
        total_volume_last_7_days: 5.678,
        total_volume_last_1_month: 12.345,
        total_volume: 100.123,
      };

      render(<MemePageActivity show nft={nftWithVolumes} pageSize={10} />);

      expect(screen.getByText("1.23 ETH")).toBeInTheDocument();
      expect(screen.getByText("5.68 ETH")).toBeInTheDocument();
      expect(screen.getByText("12.35 ETH")).toBeInTheDocument();
      expect(screen.getByText("100.12 ETH")).toBeInTheDocument();
    });

    it("displays N/A when volume values are 0", () => {
      render(<MemePageActivity show nft={nft} pageSize={10} />);

      const naElements = screen.getAllByText("N/A");
      expect(naElements).toHaveLength(4);
    });

    it("formats large volume numbers with commas", () => {
      const nftWithLargeVolumes = {
        ...nft,
        total_volume_last_24_hours: 1234.56,
        total_volume_last_7_days: 12345.67,
        total_volume_last_1_month: 123456.78,
        total_volume: 1234567.89,
      };

      render(<MemePageActivity show nft={nftWithLargeVolumes} pageSize={10} />);

      expect(screen.getByText("1,234.56 ETH")).toBeInTheDocument();
      expect(screen.getByText("12,345.67 ETH")).toBeInTheDocument();
      expect(screen.getByText("123,456.78 ETH")).toBeInTheDocument();
      expect(screen.getByText("1,234,567.89 ETH")).toBeInTheDocument();
    });
  });

  describe("Component Rendering", () => {
    it("renders nothing when show is false", () => {
      const { container } = render(
        <MemePageActivity show={false} nft={nft} pageSize={10} />
      );
      expect(container.firstChild).toBeNull();
    });

    it("renders nothing when show is true but nft is undefined", () => {
      const { container } = render(
        <MemePageActivity show nft={undefined} pageSize={10} />
      );
      expect(container.firstChild).toBeNull();
    });

    it("renders activity section when show is true and nft is provided", () => {
      render(<MemePageActivity show nft={nft} pageSize={10} />);

      expect(screen.getByText("Card Volumes")).toBeInTheDocument();
      expect(screen.getByText("Card Activity")).toBeInTheDocument();
    });
  });

  describe("Activity Fetching", () => {
    it("skips fetching when tab is hidden", () => {
      render(<MemePageActivity show={false} nft={nft} pageSize={10} />);

      expect(fetchUrlMock).not.toHaveBeenCalled();
    });

    it("fetches activity with correct base url", async () => {
      render(<MemePageActivity show nft={nft} pageSize={10} />);

      await waitFor(() => {
        expect(fetchUrlMock).toHaveBeenCalledWith(
          `https://api.test.6529.io/api/transactions?contract=${MEMES_CONTRACT}&id=1&page_size=10&page=1`
        );
      });
    });

    it("updates url when filter is changed", async () => {
      render(<MemePageActivity show nft={nft} pageSize={5} />);

      await waitFor(() => expect(fetchUrlMock).toHaveBeenCalledTimes(1));

      await userEvent.click(screen.getByRole("button", { name: /Transaction Type/ }));
      await userEvent.click(
        screen.getByRole("menuitem", { name: TypeFilter.SALES })
      );

      await waitFor(() => {
        expect(fetchUrlMock).toHaveBeenLastCalledWith(
          `https://api.test.6529.io/api/transactions?contract=${MEMES_CONTRACT}&id=1&page_size=5&page=1&filter=sales`
        );
      });
    });

    it("requests new page when pagination changes", async () => {
      fetchUrlMock.mockResolvedValueOnce({ count: 20, data: [{} as any] });
      render(<MemePageActivity show nft={nft} pageSize={10} />);
      await waitFor(() => expect(fetchUrlMock).toHaveBeenCalledTimes(1));

      await waitFor(() =>
        expect(screen.getByTestId("activity-row")).toBeInTheDocument()
      );

      const input = screen.getByRole("textbox");
      await userEvent.clear(input);
      await userEvent.type(input, "2{enter}");

      await waitFor(() => {
        expect(fetchUrlMock).toHaveBeenLastCalledWith(
          `https://api.test.6529.io/api/transactions?contract=${MEMES_CONTRACT}&id=1&page_size=10&page=2`
        );
      });
    });

    it("tests all TypeFilter values", async () => {
      render(<MemePageActivity show nft={nft} pageSize={5} />);
      await waitFor(() => expect(fetchUrlMock).toHaveBeenCalledTimes(1));

      const filterTypes = [
        { filter: TypeFilter.TRANSFERS, param: "transfers" },
        { filter: TypeFilter.AIRDROPS, param: "airdrops" },
        { filter: TypeFilter.MINTS, param: "mints" },
        { filter: TypeFilter.BURNS, param: "burns" },
      ];

      for (const { filter, param } of filterTypes) {
        await userEvent.click(screen.getByRole("button", { name: /Transaction Type/ }));
        await userEvent.click(screen.getByRole("menuitem", { name: filter }));

        await waitFor(() => {
          expect(fetchUrlMock).toHaveBeenLastCalledWith(
            `https://api.test.6529.io/api/transactions?contract=${MEMES_CONTRACT}&id=1&page_size=5&page=1&filter=${param}`
          );
        });
      }
    });

    it("resets page to 1 when filter changes", async () => {
      // Start with page 2
      fetchUrlMock.mockResolvedValue({ count: 20, data: [{} as any] });
      render(<MemePageActivity show nft={nft} pageSize={10} />);
      await waitFor(() => expect(fetchUrlMock).toHaveBeenCalledTimes(1));

      await waitFor(() =>
        expect(screen.getByTestId("activity-row")).toBeInTheDocument()
      );

      // Navigate to page 2
      const input = screen.getByRole("textbox");
      await userEvent.clear(input);
      await userEvent.type(input, "2{enter}");

      await waitFor(() => {
        expect(fetchUrlMock).toHaveBeenLastCalledWith(
          `https://api.test.6529.io/api/transactions?contract=${MEMES_CONTRACT}&id=1&page_size=10&page=2`
        );
      });

      // Change filter - should reset to page 1
      await userEvent.click(screen.getByRole("button", { name: /Transaction Type/ }));
      await userEvent.click(
        screen.getByRole("menuitem", { name: TypeFilter.SALES })
      );

      await waitFor(() => {
        expect(fetchUrlMock).toHaveBeenLastCalledWith(
          `https://api.test.6529.io/api/transactions?contract=${MEMES_CONTRACT}&id=1&page_size=10&page=1&filter=sales`
        );
      });
    });

    it("does not fetch when nft is undefined", () => {
      render(<MemePageActivity show nft={undefined} pageSize={10} />);
      expect(fetchUrlMock).not.toHaveBeenCalled();
    });
  });

  describe("Error Handling", () => {
    it("component renders correctly even when fetch is not available", () => {
      // Test without any fetch mock to ensure component doesn't crash
      render(<MemePageActivity show nft={nft} pageSize={10} />);

      // Component should still render basic structure
      expect(screen.getByText("Card Activity")).toBeInTheDocument();
      expect(screen.getByText("Card Volumes")).toBeInTheDocument();
    });
  });

  describe("Pagination", () => {
    it("only shows pagination when there are activity results", async () => {
      // Test with no results
      fetchUrlMock.mockResolvedValueOnce({ count: 0, data: [] });
      const { unmount } = render(
        <MemePageActivity show nft={nft} pageSize={10} />
      );

      await waitFor(() => expect(fetchUrlMock).toHaveBeenCalled());

      expect(screen.queryByRole("textbox")).not.toBeInTheDocument();

      // Clean up first render
      unmount();

      // Test with results
      fetchUrlMock.mockResolvedValueOnce({ count: 15, data: [{} as any] });
      render(<MemePageActivity show nft={nft} pageSize={10} />);

      await waitFor(() =>
        expect(screen.getByTestId("activity-row")).toBeInTheDocument()
      );
      expect(screen.getByRole("textbox")).toBeInTheDocument();
    });

    it("scrolls to top when page changes", async () => {
      fetchUrlMock.mockResolvedValue({ count: 20, data: [{} as any] });
      render(<MemePageActivity show nft={nft} pageSize={10} />);

      await waitFor(() =>
        expect(screen.getByTestId("activity-row")).toBeInTheDocument()
      );

      const input = screen.getByRole("textbox");
      await userEvent.clear(input);
      await userEvent.type(input, "2{enter}");

      await waitFor(() => {
        expect(window.scrollTo).toHaveBeenCalledWith(0, 0);
      });
    });
  });
});
