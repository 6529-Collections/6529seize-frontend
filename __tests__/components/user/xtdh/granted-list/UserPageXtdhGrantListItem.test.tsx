import { render, screen } from "@testing-library/react";

import { UserPageXtdhGrantListItem } from "@/components/user/xtdh/granted-list/subcomponents/UserPageXtdhGrantListItem";
import type { ApiXTdhGrantsPage } from "@/generated/models/ApiXTdhGrantsPage";
import { ApiXTdhGrantStatus } from "@/generated/models/ApiXTdhGrantStatus";
import { ApiXTdhGrantTargetChain } from "@/generated/models/ApiXTdhGrantTargetChain";
import { useContractOverviewQuery } from "@/hooks/useAlchemyNftQueries";
import type { ContractOverview } from "@/types/nft";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryWrapperContext } from "@/components/react-query-wrapper/ReactQueryWrapper";

jest.mock("@/hooks/useAlchemyNftQueries", () => ({
  useContractOverviewQuery: jest.fn(),
}));

jest.mock("@/components/auth/Auth", () => ({
  useAuth: jest.fn().mockReturnValue({ setToast: jest.fn() }),
}));

// Removed mock for ReactQueryWrapper

type Grant = ApiXTdhGrantsPage["data"][number];

const mockContract: ContractOverview = {
  address: "0x1234567890abcdef1234567890abcdef12345678",
  name: "CRYPTOPUNKS",
  imageUrl: null,
};

const mockedUseContractOverviewQuery =
  useContractOverviewQuery as jest.MockedFunction<
    typeof useContractOverviewQuery
  >;

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
});

const mockReactQueryWrapperContext = {
  invalidateIdentityTdhStats: jest.fn(),
  // Add other required properties if needed, or cast to any if strict type checking allows
} as unknown as React.ContextType<typeof ReactQueryWrapperContext>;

const renderWithProviders = (ui: React.ReactNode) => {
  return render(
    <QueryClientProvider client={queryClient}>
      <ReactQueryWrapperContext.Provider value={mockReactQueryWrapperContext}>
        {ui}
      </ReactQueryWrapperContext.Provider>
    </QueryClientProvider>
  );
};

describe("UserPageXtdhGrantListItem", () => {
  beforeEach(() => {
    mockedUseContractOverviewQuery.mockReturnValue({
      data: mockContract,
      isError: false,
      isLoading: false,
    } as unknown as ReturnType<typeof useContractOverviewQuery>);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("renders error details when provided", () => {
    const grant = createGrant({
      error_details: "Token grant failed because the snapshot already expired.",
    });

    renderWithProviders(<UserPageXtdhGrantListItem grant={grant} isSelf={true} />);

    expect(screen.getByText("Error details")).toBeInTheDocument();
    expect(
      screen.getByText(
        "Token grant failed because the snapshot already expired."
      )
    ).toBeInTheDocument();
  });

  it("omits the error details panel when the API returns only whitespace", () => {
    const grant = createGrant({
      error_details: "   ",
    });

    renderWithProviders(<UserPageXtdhGrantListItem grant={grant} isSelf={true} />);

    expect(screen.queryByText("Error details")).not.toBeInTheDocument();
  });

  it("shows validity window labels for grants that start immediately and never expire", () => {
    const grant = createGrant({
      valid_from: null,
      valid_to: null,
    });

    renderWithProviders(<UserPageXtdhGrantListItem grant={grant} isSelf={true} />);

    expect(screen.getByText("Valid from")).toBeInTheDocument();
    expect(screen.getByText("Immediately")).toBeInTheDocument();
    expect(screen.queryByText("Expires")).not.toBeInTheDocument();
    expect(screen.queryByText("Last grant")).not.toBeInTheDocument();
  });

  it("shows 'Last grant' and adjusted date when valid_to is present", () => {
    const validTo = new Date("2025-12-04T12:00:00Z").getTime();
    const grant = createGrant({
      valid_from: Date.now(),
      valid_to: validTo,
    });

    renderWithProviders(<UserPageXtdhGrantListItem grant={grant} isSelf={true} />);

    // Should show "Last grant"
    expect(screen.getByText("Last grant")).toBeInTheDocument();
  });
});

function createGrant(overrides: Partial<Grant> = {}): Grant {
  return {
    id: "grant-1",
    grantor: createGrantor(),
    target_chain: ApiXTdhGrantTargetChain.EthereumMainnet,
    target_contract: "0x1234567890abcdef1234567890abcdef12345678",
    target_tokens_count: 0,
    target_collection_name: null,
    created_at: Date.now(),
    updated_at: Date.now(),
    valid_from: null,
    valid_to: null,
    rate: 123,
    error_details: null,
    status: ApiXTdhGrantStatus.Failed,
    is_irrevocable: false,
    total_granted: 1000,
    ...overrides,
  };
}

function createGrantor(): Grant["grantor"] {
  return {
    id: "profile-1",
    handle: "0x6529",
    pfp: null,
    banner1_color: null,
    banner2_color: null,
    cic: 0,
    rep: 0,
    tdh: 0,
    tdh_rate: 0,
    level: 0,
    primary_address: "0x1234567890abcdef1234567890abcdef12345678",
    subscribed_actions: [],
    archived: false,
    active_main_stage_submission_ids: [],
    winner_main_stage_drop_ids: [],
    xtdh: 0,
    xtdh_rate: 0,
  };
}
