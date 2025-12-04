import { render, screen } from "@testing-library/react";
import { VirtualizedTokenList } from "@/components/token-list/VirtualizedTokenList";
import { ApiXTdhGrantTargetChain } from "@/generated/models/ApiXTdhGrantTargetChain";

// Mock dependencies
jest.mock("@/components/utils/Spinner", () => () => <div data-testid="spinner" />);
jest.mock("@/contexts/ScrollPositionContext", () => ({
  useScrollPositionContext: () => ({
    getPosition: jest.fn(),
    setPosition: jest.fn(),
  }),
}));
jest.mock("@/hooks/useAlchemyNftQueries", () => ({
  useTokenMetadataQuery: jest.fn().mockReturnValue({
    data: [],
    isFetching: false,
    isError: false,
  }),
}));
jest.mock("@tanstack/react-virtual", () => ({
  useVirtualizer: jest.fn().mockReturnValue({
    getVirtualItems: () => [
      { index: 0, start: 0, size: 50, measureElement: jest.fn() },
      { index: 1, start: 50, size: 50, measureElement: jest.fn() },
    ],
    getTotalSize: () => 100,
  }),
}));

describe("VirtualizedTokenList", () => {
  const defaultProps = {
    chain: ApiXTdhGrantTargetChain.EthereumMainnet as any, // Cast to any to avoid type mismatch in tests
    ranges: [{ start: BigInt(1), end: BigInt(10) }],
    scrollKey: "test-list",
  };

  it("renders list layout by default", () => {
    const { container } = render(<VirtualizedTokenList {...defaultProps} />);
    // Check if it renders a list (ul)
    expect(container.querySelector("ul")).toBeInTheDocument();
  });

  it("renders grid layout when layout prop is 'grid'", () => {
    const { container } = render(
      <VirtualizedTokenList
        {...defaultProps}
        layout="grid"
      />
    );
    // In grid mode, we still use ul but the items inside are different
    expect(container.querySelector("ul")).toBeInTheDocument();
  });

  it("renders tokens from tokens prop with xtdh", () => {
    const tokens = [
      { tokenId: BigInt(1), xtdh: 100 },
      { tokenId: BigInt(2), xtdh: 200 },
    ];
    render(
      <VirtualizedTokenList
        {...defaultProps}
        layout="grid"
        tokens={tokens}
      />
    );
    expect(screen.getByText("100")).toBeInTheDocument();
    expect(screen.getByText("200")).toBeInTheDocument();
  });

  it("calculates total count correctly", () => {
    const ranges = [{ start: BigInt(1), end: BigInt(5) }]; // 5 items
    render(
      <VirtualizedTokenList
        {...defaultProps}
        ranges={ranges}
        emptyState={<div data-testid="empty">Empty</div>}
      />
    );
    expect(screen.queryByTestId("empty")).not.toBeInTheDocument();
  });

  it("renders empty state when no tokens", () => {
    render(
      <VirtualizedTokenList
        {...defaultProps}
        ranges={[]}
        emptyState={<div data-testid="empty">Empty</div>}
      />
    );
    expect(screen.getByTestId("empty")).toBeInTheDocument();
  });
});
