import { render, screen } from "@testing-library/react";
import React from "react";
import MyStreamWaveSales from "@/components/brain/my-stream/MyStreamWaveSales";
import { useWaveDecisions } from "@/hooks/waves/useWaveDecisions";

const mockSalesViewStyle = { height: "240px", maxHeight: "240px" };
const mockMarketplacePreview = jest.fn(({ href }: { href: string }) => (
  <div data-testid="sale-preview">{href}</div>
));

jest.mock("@/hooks/waves/useWaveDecisions", () => ({
  useWaveDecisions: jest.fn(),
}));

jest.mock("@/components/waves/MarketplacePreview", () => ({
  __esModule: true,
  default: (props: any) => mockMarketplacePreview(props),
}));

jest.mock("@/components/brain/my-stream/layout/LayoutContext", () => ({
  useLayout: () => ({ salesViewStyle: mockSalesViewStyle }),
}));

const useWaveDecisionsMock = useWaveDecisions as jest.Mock;

const mockWaveDecisions = (overrides: Record<string, unknown> = {}) => {
  useWaveDecisionsMock.mockReturnValue({
    decisionPoints: [],
    isFetching: false,
    isError: false,
    error: null,
    refetch: jest.fn(),
    ...overrides,
  });
};

describe("MyStreamWaveSales", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("shows loading shell while decisions are fetching", () => {
    mockWaveDecisions({
      isFetching: true,
    });

    render(<MyStreamWaveSales waveId="wave-1" />);

    expect(screen.getByTestId("wave-sales-scroll-container")).toHaveStyle(
      mockSalesViewStyle
    );
    expect(screen.getByText("Loading sales...")).toBeInTheDocument();
    expect(mockMarketplacePreview).not.toHaveBeenCalled();
    expect(useWaveDecisionsMock).toHaveBeenCalledWith({
      waveId: "wave-1",
    });
  });

  it("shows empty shell when there are no decision winners", () => {
    mockWaveDecisions();

    render(<MyStreamWaveSales waveId="wave-1" />);

    expect(screen.getByTestId("wave-sales-scroll-container")).toHaveStyle(
      mockSalesViewStyle
    );
    expect(screen.getByText("No sales yet.")).toBeInTheDocument();
    expect(mockMarketplacePreview).not.toHaveBeenCalled();
  });

  it("shows empty shell when winner drops have no usable sale URLs", () => {
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

    render(<MyStreamWaveSales waveId="wave-1" />);

    expect(screen.getByTestId("wave-sales-scroll-container")).toHaveStyle(
      mockSalesViewStyle
    );
    expect(screen.getByText("No sales yet.")).toBeInTheDocument();
    expect(mockMarketplacePreview).not.toHaveBeenCalled();
  });

  it("renders a flat sales grid from all decision rounds with latest rounds first", () => {
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
    expect(
      screen.getAllByTestId("sale-preview").map((item) => item.textContent)
    ).toEqual([
      "https://market.example/new-1",
      "https://market.example/shared",
      "https://market.example/old-1",
      "https://market.example/shared",
    ]);

    expect(mockMarketplacePreview).toHaveBeenNthCalledWith(1, {
      href: "https://market.example/new-1",
      compact: true,
    });
    expect(mockMarketplacePreview).toHaveBeenNthCalledWith(2, {
      href: "https://market.example/shared",
      compact: true,
    });
    expect(mockMarketplacePreview).toHaveBeenNthCalledWith(3, {
      href: "https://market.example/old-1",
      compact: true,
    });
    expect(mockMarketplacePreview).toHaveBeenNthCalledWith(4, {
      href: "https://market.example/shared",
      compact: true,
    });
  });

  it("keeps the sales grid visible while decisions refetch", () => {
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
      isFetching: true,
    });

    render(<MyStreamWaveSales waveId="wave-1" />);

    expect(screen.getByTestId("wave-sales-grid")).toBeInTheDocument();
    expect(screen.queryByText("Loading sales...")).not.toBeInTheDocument();
  });
});
