import LatestDropAllowlistStatus from "@/components/home/now-minting/LatestDropAllowlistStatus";
import { QueryKey } from "@/components/react-query-wrapper/ReactQueryWrapper";
import { MEMES_CONTRACT } from "@/constants/constants";
import { ApiWalletDistributionAllocationPhaseEnum } from "@/generated/models/ApiWalletDistributionAllocation";
import type { ApiWalletDistributionAllocations } from "@/generated/models/ApiWalletDistributionAllocations";
import { commonApiFetch } from "@/services/api/common-api";
import { useQuery } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";

const TEST_ADDRESS = "0x1111111111111111111111111111111111111111";
const mockUseSeizeConnectContext = jest.fn();

jest.mock("@/components/auth/SeizeConnectContext", () => ({
  useSeizeConnectContext: () => mockUseSeizeConnectContext(),
}));
jest.mock("@/hooks/useBrowserLocale", () => ({
  useBrowserLocale: () => "en-US",
}));
jest.mock("@tanstack/react-query", () => ({ useQuery: jest.fn() }));
jest.mock("@/services/api/common-api", () => ({ commonApiFetch: jest.fn() }));

const useQueryMock = useQuery as jest.Mock;
const commonApiFetchMock = commonApiFetch as jest.MockedFunction<
  typeof commonApiFetch
>;

function result(
  overrides: Partial<ApiWalletDistributionAllocations> = {}
): ApiWalletDistributionAllocations {
  return { has_distribution: true, allocations: [], ...overrides };
}

describe("LatestDropAllowlistStatus", () => {
  beforeEach(() => {
    mockUseSeizeConnectContext.mockReturnValue({
      address: TEST_ADDRESS,
      connectionState: "connected",
    });
    useQueryMock.mockReturnValue({
      data: result({
        allocations: [
          {
            phase: ApiWalletDistributionAllocationPhaseEnum.Phase1,
            spots_airdrop: 0,
            spots_allowlist: 1,
          },
        ],
      }),
      isError: false,
      isPending: false,
    });
  });

  afterEach(() => jest.clearAllMocks());

  it("shows compact nonzero allocation details without redundant wallet text", () => {
    useQueryMock.mockReturnValue({
      data: result({
        allocations: [
          {
            phase: ApiWalletDistributionAllocationPhaseEnum.Public,
            spots_airdrop: 2,
            spots_allowlist: 50,
          },
          {
            phase: ApiWalletDistributionAllocationPhaseEnum.Phase2,
            spots_airdrop: 3,
            spots_allowlist: 1,
          },
          {
            phase: ApiWalletDistributionAllocationPhaseEnum.Phase0,
            spots_airdrop: 11,
            spots_allowlist: 0,
          },
        ],
      }),
      isError: false,
      isPending: false,
    });

    render(<LatestDropAllowlistStatus tokenId={532} />);

    expect(
      screen.getByRole("heading", { name: "Your allocation" })
    ).toBeInTheDocument();
    expect(screen.queryByText("Connected wallet")).not.toBeInTheDocument();
    expect(
      screen.getAllByRole("listitem").map((item) => item.textContent)
    ).toEqual([
      "Phase 0 · 11× Airdrop",
      "Phase 2 · 3× Airdrop · 1× Allowlist",
      "Public · 2× Airdrop",
    ]);
    expect(screen.getAllByRole("listitem")[0]).toHaveClass(
      "tw-whitespace-nowrap"
    );
  });

  it("hides the entire allocation section while disconnected", () => {
    mockUseSeizeConnectContext.mockReturnValue({
      address: undefined,
      connectionState: "disconnected",
    });
    const { container } = render(<LatestDropAllowlistStatus tokenId={532} />);

    expect(container).toBeEmptyDOMElement();
    expect(useQueryMock).toHaveBeenCalledWith(
      expect.objectContaining({ enabled: false })
    );
  });

  it.each([
    [
      "loading",
      { data: undefined, isError: false, isPending: true },
      "Checking your allocation…",
    ],
    [
      "unpublished",
      {
        data: result({ has_distribution: false }),
        isError: false,
        isPending: false,
      },
      "Allocation will be available once distribution is published.",
    ],
    [
      "published empty",
      { data: result(), isError: false, isPending: false },
      "No allocation found for this wallet.",
    ],
    [
      "unavailable",
      { data: undefined, isError: true, isPending: false },
      "Allocation information is temporarily unavailable.",
    ],
  ])("shows the %s state", (_name, queryResult, expected) => {
    useQueryMock.mockReturnValue(queryResult);
    render(<LatestDropAllowlistStatus tokenId={532} />);
    expect(screen.getByRole("status")).toHaveTextContent(expected);
  });

  it("uses one public wallet-allocation request and forwards cancellation", async () => {
    render(<LatestDropAllowlistStatus tokenId={532} />);
    const queryOptions = useQueryMock.mock.calls[0]?.[0] as {
      queryKey: readonly unknown[];
      queryFn: (context: { signal: AbortSignal }) => Promise<unknown>;
    };
    const signal = new AbortController().signal;
    commonApiFetchMock.mockResolvedValueOnce(result());

    await queryOptions.queryFn({ signal });

    expect(queryOptions.queryKey).toEqual([
      QueryKey.MEMES_WALLET_ALLOCATIONS,
      532,
      TEST_ADDRESS,
    ]);
    expect(commonApiFetchMock).toHaveBeenCalledWith({
      endpoint: `distributions/${MEMES_CONTRACT}/532/wallet-allocations`,
      params: { wallet: TEST_ADDRESS },
      signal,
      includeWalletAuth: false,
    });
  });
});
