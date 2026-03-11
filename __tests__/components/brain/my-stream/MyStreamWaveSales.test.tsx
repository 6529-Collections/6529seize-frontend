import { render, screen } from "@testing-library/react";
import React from "react";
import MyStreamWaveSales from "@/components/brain/my-stream/MyStreamWaveSales";
import { ApiDropType } from "@/generated/models/ApiDropType";
import { useWaveDrops } from "@/hooks/useWaveDrops";

const mockSalesViewStyle = { height: "240px", maxHeight: "240px" };
const mockMarketplacePreview = jest.fn(({ href }: { href: string }) => (
  <div data-testid="sale-preview">{href}</div>
));

jest.mock("@/hooks/useWaveDrops", () => ({
  useWaveDrops: jest.fn(),
}));

jest.mock("@/components/waves/MarketplacePreview", () => ({
  __esModule: true,
  default: (props: any) => mockMarketplacePreview(props),
}));
jest.mock("@/components/brain/my-stream/layout/LayoutContext", () => ({
  useLayout: () => ({ salesViewStyle: mockSalesViewStyle }),
}));

const useWaveDropsMock = useWaveDrops as jest.Mock;

describe("MyStreamWaveSales", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("shows loading shell while participatory drops are fetching", () => {
    useWaveDropsMock.mockReturnValue({
      drops: [],
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
    useWaveDropsMock.mockReturnValue({
      drops: [],
      isFetching: false,
    });

    render(<MyStreamWaveSales waveId="wave-1" />);

    expect(screen.getByTestId("wave-sales-scroll-container")).toHaveStyle(
      mockSalesViewStyle
    );
    expect(screen.getByText("No sales yet.")).toBeInTheDocument();
    expect(mockMarketplacePreview).not.toHaveBeenCalled();
  });

  it("shows empty shell when participatory drops have no usable sale URLs", () => {
    useWaveDropsMock.mockReturnValue({
      drops: [
        {
          nft_links: [],
        },
        {
          nft_links: [{ url_in_text: "   " }, { url_in_text: null }],
        },
      ],
      isFetching: false,
    });

    render(<MyStreamWaveSales waveId="wave-1" />);

    expect(screen.getByTestId("wave-sales-scroll-container")).toHaveStyle(
      mockSalesViewStyle
    );
    expect(screen.getByText("No sales yet.")).toBeInTheDocument();
    expect(mockMarketplacePreview).not.toHaveBeenCalled();
  });

  it("renders sales previews in a responsive grid using the first usable nft link URL", () => {
    useWaveDropsMock.mockReturnValue({
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
      isFetching: false,
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
});
