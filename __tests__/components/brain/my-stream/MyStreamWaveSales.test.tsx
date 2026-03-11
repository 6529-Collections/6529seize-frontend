import { act, render, screen } from "@testing-library/react";
import React from "react";
import MyStreamWaveSales from "@/components/brain/my-stream/MyStreamWaveSales";
import { ApiDropType } from "@/generated/models/ApiDropType";
import { useWaveDrops } from "@/hooks/useWaveDrops";

const mockSalesViewStyle = { height: "240px", maxHeight: "240px" };
const mockMarketplacePreview = jest.fn(({ href }: { href: string }) => (
  <div data-testid="sale-preview">{href}</div>
));
let intersectionCb: (() => void) | undefined;

jest.mock("@/hooks/useWaveDrops", () => ({
  useWaveDrops: jest.fn(),
}));

jest.mock("@/hooks/useIntersectionObserver", () => ({
  useIntersectionObserver: (cb: () => void) => {
    intersectionCb = cb;
    return { current: null };
  },
}));

jest.mock("@/components/waves/MarketplacePreview", () => ({
  __esModule: true,
  default: (props: any) => mockMarketplacePreview(props),
}));
jest.mock(
  "@/components/waves/leaderboard/drops/WaveLeaderboardLoadingBar",
  () => ({
    WaveLeaderboardLoadingBar: () => (
      <div data-testid="wave-sales-loading-bar" />
    ),
  })
);
jest.mock("@/components/brain/my-stream/layout/LayoutContext", () => ({
  useLayout: () => ({ salesViewStyle: mockSalesViewStyle }),
}));

const useWaveDropsMock = useWaveDrops as jest.Mock;
const fetchNextPage = jest.fn();

const mockWaveDrops = (overrides: Record<string, unknown> = {}) => {
  useWaveDropsMock.mockReturnValue({
    drops: [],
    fetchNextPage,
    hasNextPage: false,
    isFetching: false,
    isFetchingNextPage: false,
    ...overrides,
  });
};

describe("MyStreamWaveSales", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    intersectionCb = undefined;
  });

  it("shows loading shell while participatory drops are fetching", () => {
    mockWaveDrops({
      isFetching: true,
    });

    render(<MyStreamWaveSales waveId="wave-1" />);

    expect(screen.getByTestId("wave-sales-scroll-container")).toHaveStyle(
      mockSalesViewStyle
    );
    expect(screen.getByText("Loading sales...")).toBeInTheDocument();
    expect(mockMarketplacePreview).not.toHaveBeenCalled();
    expect(useWaveDropsMock).toHaveBeenCalledWith({
      waveId: "wave-1",
      dropType: ApiDropType.Participatory,
    });
  });

  it("shows empty shell when there are no participatory drops", () => {
    mockWaveDrops();

    render(<MyStreamWaveSales waveId="wave-1" />);

    expect(screen.getByTestId("wave-sales-scroll-container")).toHaveStyle(
      mockSalesViewStyle
    );
    expect(screen.getByText("No sales yet.")).toBeInTheDocument();
    expect(mockMarketplacePreview).not.toHaveBeenCalled();
  });

  it("shows empty shell when participatory drops have no usable sale URLs", () => {
    mockWaveDrops({
      drops: [
        {
          nft_links: [],
        },
        {
          nft_links: [{ url_in_text: "   " }, { url_in_text: null }],
        },
      ],
    });

    render(<MyStreamWaveSales waveId="wave-1" />);

    expect(screen.getByTestId("wave-sales-scroll-container")).toHaveStyle(
      mockSalesViewStyle
    );
    expect(screen.getByText("No sales yet.")).toBeInTheDocument();
    expect(mockMarketplacePreview).not.toHaveBeenCalled();
  });

  it("renders sales previews in a responsive grid using the first usable nft link URL", () => {
    mockWaveDrops({
      drops: [
        {
          nft_links: [
            { url_in_text: "   " },
            { url_in_text: "https://market.example/old-1" },
          ],
        },
        {
          nft_links: [{ url_in_text: "https://market.example/old-2" }],
        },
        {
          nft_links: [{ url_in_text: "https://market.example/new-1" }],
        },
        {
          nft_links: [],
        },
      ],
    });

    render(<MyStreamWaveSales waveId="wave-1" />);

    expect(screen.getByTestId("wave-sales-scroll-container")).toHaveClass(
      "tw-overflow-y-auto"
    );
    expect(screen.getByTestId("wave-sales-scroll-container")).toHaveStyle(
      mockSalesViewStyle
    );
    expect(screen.getByTestId("wave-sales-grid")).toHaveClass(
      "tw-grid",
      "tw-gap-4",
      "@lg:tw-grid-cols-2",
      "@3xl:tw-grid-cols-3"
    );
    expect(screen.getByTestId("wave-sales-scroll-container")).toContainElement(
      screen.getByTestId("wave-sales-grid")
    );
    expect(screen.getByTestId("wave-sales-grid")).not.toHaveClass(
      "tw-overflow-y-auto"
    );
    expect(
      screen.getAllByTestId("sale-preview").map((item) => item.textContent)
    ).toEqual([
      "https://market.example/old-1",
      "https://market.example/old-2",
      "https://market.example/new-1",
    ]);

    expect(mockMarketplacePreview).toHaveBeenNthCalledWith(1, {
      href: "https://market.example/old-1",
      compact: true,
    });
    expect(mockMarketplacePreview).toHaveBeenNthCalledWith(2, {
      href: "https://market.example/old-2",
      compact: true,
    });
    expect(mockMarketplacePreview).toHaveBeenNthCalledWith(3, {
      href: "https://market.example/new-1",
      compact: true,
    });
  });

  it("fetches the next page when the pagination sentinel intersects", () => {
    mockWaveDrops({
      drops: [{ nft_links: [{ url_in_text: "https://market.example/old-1" }] }],
      hasNextPage: true,
    });

    render(<MyStreamWaveSales waveId="wave-1" />);

    act(() => {
      intersectionCb?.();
    });

    expect(fetchNextPage).toHaveBeenCalledTimes(1);
  });

  it("does not fetch the next page when pagination is unavailable", () => {
    mockWaveDrops({
      drops: [{ nft_links: [{ url_in_text: "https://market.example/old-1" }] }],
      hasNextPage: false,
    });

    render(<MyStreamWaveSales waveId="wave-1" />);

    act(() => {
      intersectionCb?.();
    });

    expect(fetchNextPage).not.toHaveBeenCalled();
  });

  it("does not fetch the next page while a page fetch is already in flight", () => {
    mockWaveDrops({
      drops: [{ nft_links: [{ url_in_text: "https://market.example/old-1" }] }],
      hasNextPage: true,
      isFetching: true,
      isFetchingNextPage: true,
    });

    render(<MyStreamWaveSales waveId="wave-1" />);

    act(() => {
      intersectionCb?.();
    });

    expect(fetchNextPage).not.toHaveBeenCalled();
  });

  it("keeps the sales grid visible while fetching the next page", () => {
    mockWaveDrops({
      drops: [{ nft_links: [{ url_in_text: "https://market.example/old-1" }] }],
      hasNextPage: true,
      isFetching: true,
      isFetchingNextPage: true,
    });

    render(<MyStreamWaveSales waveId="wave-1" />);

    expect(screen.getByTestId("wave-sales-grid")).toBeInTheDocument();
    expect(screen.getByTestId("wave-sales-loading-bar")).toBeInTheDocument();
    expect(screen.queryByText("Loading sales...")).not.toBeInTheDocument();
  });
});
