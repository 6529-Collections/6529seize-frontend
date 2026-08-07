import LatestDropAllowlistStatus, {
  getConnectedWalletAllowlistPhases,
} from "@/components/home/now-minting/LatestDropAllowlistStatus";
import { QueryKey } from "@/components/react-query-wrapper/ReactQueryWrapper";
import { MEMES_CONTRACT } from "@/constants/constants";
import type { DistributionNormalizedPage } from "@/generated/models/DistributionNormalizedPage";
import { commonApiFetch } from "@/services/api/common-api";
import { useQuery } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";

const TEST_ADDRESS = "0x1111111111111111111111111111111111111111";
const OTHER_ADDRESS = "0x2222222222222222222222222222222222222222";

const mockUseSeizeConnectContext = jest.fn();

jest.mock("@/components/auth/SeizeConnectContext", () => ({
  useSeizeConnectContext: () => mockUseSeizeConnectContext(),
}));

jest.mock("@/hooks/useBrowserLocale", () => ({
  useBrowserLocale: () => "en-US",
}));

jest.mock("@tanstack/react-query", () => ({
  useQuery: jest.fn(),
}));

jest.mock("@/services/api/common-api", () => ({
  commonApiFetch: jest.fn(),
}));

const useQueryMock = useQuery as jest.Mock;
const commonApiFetchMock = commonApiFetch as jest.MockedFunction<
  typeof commonApiFetch
>;

function createPage(
  allowlist: Array<{
    phase: string;
    spots: number;
    spots_airdrop: number;
    spots_allowlist: number;
  }>,
  overrides: Readonly<{
    cardId?: number;
    contract?: string;
    wallet?: string;
  }> = {}
): DistributionNormalizedPage {
  return {
    data: [
      {
        card_id: overrides.cardId ?? 532,
        contract: overrides.contract ?? MEMES_CONTRACT,
        wallet: overrides.wallet ?? TEST_ADDRESS,
        wallet_display: "test-wallet",
        airdrops: 0,
        total_spots: 1,
        total_count: 1,
        minted: 0,
        allowlist,
        phases: allowlist.map((entry) => entry.phase),
      },
    ],
    count: 1,
    page: 1,
    next: null,
  };
}

describe("getConnectedWalletAllowlistPhases", () => {
  it("returns every manual allowlist phase in mint order", () => {
    const data = createPage([
      {
        phase: "phase 2",
        spots: 1,
        spots_airdrop: 0,
        spots_allowlist: 1,
      },
      {
        phase: "Phase   0",
        spots: 2,
        spots_airdrop: 0,
        spots_allowlist: 2,
      },
    ]);

    expect(
      getConnectedWalletAllowlistPhases({
        address: TEST_ADDRESS.toUpperCase(),
        data,
        tokenId: 532,
      })
    ).toEqual(["Phase 0", "Phase 2"]);
  });

  it("ignores airdrop-only entries and unrelated distribution rows", () => {
    const airdropOnly = createPage([
      {
        phase: "Phase 0",
        spots: 11,
        spots_airdrop: 11,
        spots_allowlist: 0,
      },
    ]);
    const wrongWallet = createPage(
      [
        {
          phase: "Phase 1",
          spots: 1,
          spots_airdrop: 0,
          spots_allowlist: 1,
        },
      ],
      { wallet: OTHER_ADDRESS }
    );

    expect(
      getConnectedWalletAllowlistPhases({
        address: TEST_ADDRESS,
        data: airdropOnly,
        tokenId: 532,
      })
    ).toEqual([]);
    expect(
      getConnectedWalletAllowlistPhases({
        address: TEST_ADDRESS,
        data: wrongWallet,
        tokenId: 532,
      })
    ).toEqual([]);
  });
});

describe("LatestDropAllowlistStatus", () => {
  beforeEach(() => {
    mockUseSeizeConnectContext.mockReturnValue({
      address: TEST_ADDRESS,
      connectionState: "connected",
    });
    useQueryMock.mockReturnValue({
      data: createPage([
        {
          phase: "Phase 1",
          spots: 1,
          spots_airdrop: 0,
          spots_allowlist: 1,
        },
      ]),
      isError: false,
      isPending: false,
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("shows the connected wallet's manual allowlist phases", () => {
    useQueryMock.mockReturnValue({
      data: createPage([
        {
          phase: "Phase 1",
          spots: 1,
          spots_airdrop: 0,
          spots_allowlist: 1,
        },
        {
          phase: "Phase 2",
          spots: 1,
          spots_airdrop: 0,
          spots_allowlist: 1,
        },
      ]),
      isError: false,
      isPending: false,
    });

    render(<LatestDropAllowlistStatus tokenId={532} />);

    expect(
      screen.getByRole("heading", { name: "Your allowlist" })
    ).toBeInTheDocument();
    expect(screen.getByText("Connected wallet")).toBeInTheDocument();
    expect(
      screen.getByRole("list", {
        name: "Allowlist phases for the connected wallet",
      })
    ).toBeInTheDocument();
    expect(screen.getByText("Phase 1")).toBeInTheDocument();
    expect(screen.getByText("Phase 2")).toBeInTheDocument();
  });

  it("asks disconnected users to connect without starting a request", () => {
    mockUseSeizeConnectContext.mockReturnValue({
      address: undefined,
      connectionState: "disconnected",
    });

    render(<LatestDropAllowlistStatus tokenId={532} />);

    expect(
      screen.getByText("Connect a wallet to check your allowlist phase.")
    ).toBeInTheDocument();
    expect(useQueryMock).toHaveBeenCalledWith(
      expect.objectContaining({ enabled: false })
    );
  });

  it("keeps the checking state while the wallet connection initializes", () => {
    mockUseSeizeConnectContext.mockReturnValue({
      address: TEST_ADDRESS,
      connectionState: "initializing",
    });

    render(<LatestDropAllowlistStatus tokenId={532} />);

    expect(screen.getByRole("status")).toHaveTextContent(
      "Checking your connected wallet…"
    );
    expect(screen.queryByText("Phase 1")).not.toBeInTheDocument();
  });

  it.each([
    [
      "loading",
      { data: undefined, isError: false, isPending: true },
      "Checking your connected wallet…",
    ],
    [
      "not found",
      {
        data: createPage([
          {
            phase: "Phase 0",
            spots: 1,
            spots_airdrop: 1,
            spots_allowlist: 0,
          },
        ]),
        isError: false,
        isPending: false,
      },
      "No allowlist phase found for this wallet.",
    ],
    [
      "unavailable",
      { data: undefined, isError: true, isPending: false },
      "Allowlist status is temporarily unavailable.",
    ],
  ])("shows the %s state", (_name, queryResult, expected) => {
    useQueryMock.mockReturnValue(queryResult);

    render(<LatestDropAllowlistStatus tokenId={532} />);

    expect(screen.getByRole("status")).toHaveTextContent(expected);
  });

  it("uses an exact public wallet query and forwards the abort signal", async () => {
    render(<LatestDropAllowlistStatus tokenId={532} />);

    const queryOptions = useQueryMock.mock.calls[0]?.[0] as {
      queryKey: readonly unknown[];
      queryFn: (context: { signal: AbortSignal }) => Promise<unknown>;
    };
    const signal = new AbortController().signal;
    commonApiFetchMock.mockResolvedValueOnce(createPage([]));

    await queryOptions.queryFn({ signal });

    expect(queryOptions.queryKey).toEqual([
      QueryKey.MEMES_ALLOWLIST_STATUS,
      532,
      TEST_ADDRESS,
    ]);
    expect(commonApiFetchMock).toHaveBeenCalledWith({
      endpoint: "distributions",
      params: {
        card_id: "532",
        contract: MEMES_CONTRACT,
        wallet: TEST_ADDRESS,
        page: "1",
        page_size: "10",
      },
      signal,
      includeWalletAuth: false,
    });
  });
});
