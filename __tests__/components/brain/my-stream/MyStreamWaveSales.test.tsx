import { act, screen } from "@testing-library/react";
import React from "react";
import MyStreamWaveSales from "@/components/brain/my-stream/MyStreamWaveSales";
import { QueryKey } from "@/components/react-query-wrapper/ReactQueryWrapper";
import type { MarketplacePreviewData } from "@/components/waves/marketplace/common";
import { useWaveSalesDecisions } from "@/hooks/waves/useWaveSalesDecisions";
import { renderWithQueryClient } from "../../../utils/reactQuery";

const mockSalesViewStyle = { height: "240px", maxHeight: "240px" };
const mockMarketplacePreview = jest.fn(({ href }: { href: string }) => (
  <div data-testid="sale-preview">{href}</div>
));
let intersectionCb: ((isIntersecting: boolean) => void) | undefined;

jest.mock("@/hooks/waves/useWaveSalesDecisions", () => ({
  useWaveSalesDecisions: jest.fn(),
}));

jest.mock("@/hooks/useIntersectionObserver", () => ({
  useIntersectionObserver: (cb: (isIntersecting: boolean) => void) => {
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

const useWaveSalesDecisionsMock = useWaveSalesDecisions as jest.Mock;
const fetchNextPage = jest.fn();

const mockWaveDecisions = (overrides: Record<string, unknown> = {}) => {
  useWaveSalesDecisionsMock.mockReturnValue({
    decisionPoints: [],
    fetchNextPage,
    hasNextPage: false,
    isFetching: false,
    isFetchingNextPage: false,
    isError: false,
    error: null,
    refetch: jest.fn(),
    ...overrides,
  });
};

const expectMockSalesViewStyle = () => {
  const scrollContainer = screen.getByTestId("wave-sales-scroll-container");
  expect(scrollContainer.style.height).toBe(mockSalesViewStyle.height);
  expect(scrollContainer.style.maxHeight).toBe(mockSalesViewStyle.maxHeight);
  return scrollContainer;
};

const renderSales = () =>
  renderWithQueryClient(<MyStreamWaveSales waveId="wave-1" />);

describe("MyStreamWaveSales", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    intersectionCb = undefined;
  });

  it("shows loading shell while decisions are fetching", () => {
    mockWaveDecisions({
      isFetching: true,
    });

    renderSales();

    expectMockSalesViewStyle();
    expect(screen.getByText("Loading sales...")).toBeInTheDocument();
    expect(mockMarketplacePreview).not.toHaveBeenCalled();
    expect(useWaveSalesDecisionsMock).toHaveBeenCalledWith({
      waveId: "wave-1",
    });
  });

  it.each([
    ["an Error instance", new Error("boom"), "Failed to load sales: boom"],
    ["a string error", "boom", "Failed to load sales: boom"],
    ["an unknown error", null, "Failed to load sales."],
  ])("shows the error state for %s", (_label, error, expectedText) => {
    mockWaveDecisions({
      isError: true,
      error,
    });

    renderSales();

    expect(screen.getByText(expectedText)).toBeInTheDocument();
    expect(mockMarketplacePreview).not.toHaveBeenCalled();
  });

  it("shows empty shell when there are no decision winners and no further pages", () => {
    mockWaveDecisions();

    renderSales();

    expectMockSalesViewStyle();
    expect(screen.getByText("No sales yet.")).toBeInTheDocument();
    expect(mockMarketplacePreview).not.toHaveBeenCalled();
  });

  it("shows empty shell when winner drops have no usable sale URLs and pagination is exhausted", () => {
    mockWaveDecisions({
      decisionPoints: [
        {
          decision_time: 1,
          winners: [
            {
              place: 1,
              drop: { nft_links: [] },
            },
            {
              place: 2,
              drop: {
                nft_links: [{ url_in_text: "   " }, { url_in_text: null }],
              },
            },
          ],
        },
      ],
    });

    renderSales();

    expectMockSalesViewStyle();
    expect(screen.getByText("No sales yet.")).toBeInTheDocument();
    expect(mockMarketplacePreview).not.toHaveBeenCalled();
  });

  it("renders a flat sales grid from loaded decision pages with latest rounds first", () => {
    mockWaveDecisions({
      decisionPoints: [
        {
          decision_time: 1,
          winners: [
            {
              place: 1,
              drop: {
                nft_links: [{ url_in_text: "https://market.example/old-1" }],
              },
            },
            {
              place: 2,
              drop: {
                nft_links: [{ url_in_text: "https://market.example/shared" }],
              },
            },
          ],
        },
        {
          decision_time: 2,
          winners: [
            {
              place: 1,
              drop: {
                nft_links: [
                  { url_in_text: "   " },
                  { url_in_text: "https://market.example/new-1" },
                ],
              },
            },
            {
              place: 2,
              drop: {
                nft_links: [],
              },
            },
            {
              place: 3,
              drop: {
                nft_links: [{ url_in_text: "https://market.example/shared" }],
              },
            },
          ],
        },
      ],
    });

    renderSales();

    const scrollContainer = expectMockSalesViewStyle();
    expect(scrollContainer).toHaveClass("tw-overflow-y-auto");
    expect(screen.getByTestId("wave-sales-grid")).toHaveClass(
      "tw-grid",
      "tw-gap-4",
      "@lg:tw-grid-cols-2",
      "@3xl:tw-grid-cols-3"
    );
    expect(
      screen.getAllByTestId("sale-preview").map((item) => item.textContent)
    ).toEqual([
      "https://market.example/new-1",
      "https://market.example/shared",
      "https://market.example/old-1",
      "https://market.example/shared",
    ]);
  });

  it("seeds marketplace preview cache from loaded winner nft-links", () => {
    const href =
      "https://superrare.com/artwork/eth/0x0CbE7Cda5a256FD5f5C6d8f1aA36aFCF32DCd711/1";
    mockWaveDecisions({
      decisionPoints: [
        {
          decision_time: 1,
          winners: [
            {
              place: 1,
              drop: {
                nft_links: [
                  {
                    url_in_text: `  ${href}  `,
                    data: {
                      canonical_id:
                        "superrare:0x0cbe7cda5a256fd5f5c6d8f1aa36afcf32dcd711:1",
                      platform: "superrare",
                      chain: "ethereum",
                      contract: "0x0CbE7Cda5a256FD5f5C6d8f1aA36aFCF32DCd711",
                      token: "1",
                      name: "Seeded SuperRare Sale",
                      description: "Seeded from sales decisions",
                      media_uri: "https://cdn.example.com/superrare-sale.png",
                      last_error_message: null,
                      price: "1.5 ETH",
                      price_currency: "ETH",
                      last_successfully_updated: 1735689600,
                      failed_since: null,
                      media_preview: null,
                    },
                  },
                ],
              },
            },
          ],
        },
      ],
    });

    const { queryClient } = renderSales();

    const seeded = queryClient.getQueryData<MarketplacePreviewData>([
      QueryKey.MARKETPLACE_PREVIEW,
      { href, mode: "default" },
    ]);

    expect(seeded).toEqual(
      expect.objectContaining({
        href,
        canonicalId:
          "superrare:0x0cbe7cda5a256fd5f5c6d8f1aa36afcf32dcd711:1",
        platform: "superrare",
        title: "Seeded SuperRare Sale",
        price: "1.5 ETH",
        priceCurrency: "ETH",
        media: {
          url: "https://cdn.example.com/superrare-sale.png",
          mimeType: "image/png",
        },
      })
    );
  });

  it("fetches the next page when the pagination sentinel intersects", () => {
    mockWaveDecisions({
      decisionPoints: [
        {
          decision_time: 2,
          winners: [
            {
              place: 1,
              drop: {
                nft_links: [{ url_in_text: "https://market.example/new-1" }],
              },
            },
          ],
        },
      ],
      hasNextPage: true,
    });

    renderSales();

    act(() => {
      intersectionCb?.(true);
    });

    expect(fetchNextPage).toHaveBeenCalledTimes(1);
  });

  it("continues paging when loaded decisions have no renderable sales yet", () => {
    mockWaveDecisions({
      decisionPoints: [
        {
          decision_time: 2,
          winners: [
            {
              place: 1,
              drop: {
                nft_links: [],
              },
            },
          ],
        },
      ],
      hasNextPage: true,
    });

    renderSales();

    expect(screen.getByText("No sales yet.")).toBeInTheDocument();

    act(() => {
      intersectionCb?.(true);
    });

    expect(fetchNextPage).toHaveBeenCalledTimes(1);
  });

  it("does not fetch the next page when pagination is unavailable", () => {
    mockWaveDecisions({
      hasNextPage: false,
    });

    renderSales();

    act(() => {
      intersectionCb?.(true);
    });

    expect(fetchNextPage).not.toHaveBeenCalled();
  });

  it("does not fetch the next page while a page fetch is already in flight", () => {
    mockWaveDecisions({
      decisionPoints: [
        {
          decision_time: 2,
          winners: [
            {
              place: 1,
              drop: {
                nft_links: [{ url_in_text: "https://market.example/new-1" }],
              },
            },
          ],
        },
      ],
      hasNextPage: true,
      isFetching: true,
      isFetchingNextPage: true,
    });

    renderSales();

    act(() => {
      intersectionCb?.(true);
    });

    expect(fetchNextPage).not.toHaveBeenCalled();
  });

  it("keeps the sales content visible while fetching the next page", () => {
    mockWaveDecisions({
      decisionPoints: [
        {
          decision_time: 2,
          winners: [
            {
              place: 1,
              drop: {
                nft_links: [{ url_in_text: "https://market.example/new-1" }],
              },
            },
          ],
        },
      ],
      hasNextPage: true,
      isFetching: true,
      isFetchingNextPage: true,
    });

    renderSales();

    expect(screen.getByTestId("wave-sales-grid")).toBeInTheDocument();
    expect(screen.getByTestId("wave-sales-loading-bar")).toBeInTheDocument();
    expect(screen.queryByText("Loading sales...")).not.toBeInTheDocument();
  });
});
